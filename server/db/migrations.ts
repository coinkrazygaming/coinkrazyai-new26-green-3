import { query } from './connection';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Migration tracking system for PostgreSQL database
 * Ensures each migration is applied exactly once and tracks execution history
 */

interface Migration {
  name: string;
  version: string;
  checksum: string;
  timestamp: Date;
}

/**
 * Ensure migrations_history table exists
 */
async function createMigrationsHistoryTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations_history (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        version VARCHAR(50) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      )
    `);
    console.log('[DB Migration] migrations_history table ensured');
  } catch (error) {
    console.error('[DB Migration] Failed to create migrations_history table:', error);
    throw error;
  }
}

/**
 * Calculate checksum of SQL content for idempotency detection
 */
function calculateChecksum(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Get list of already applied migrations
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  try {
    const result = await query('SELECT name FROM migrations_history WHERE success = TRUE');
    return new Set(result.rows.map((row: any) => row.name));
  } catch (error) {
    console.error('[DB Migration] Error reading migrations history:', error);
    throw error;
  }
}

/**
 * Record migration execution in history
 */
async function recordMigration(
  name: string,
  version: string,
  checksum: string,
  executionTimeMs: number,
  success: boolean,
  errorMessage?: string
) {
  try {
    await query(
      `INSERT INTO migrations_history (name, version, checksum, execution_time_ms, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (name) DO UPDATE SET
         version = EXCLUDED.version,
         checksum = EXCLUDED.checksum,
         applied_at = CURRENT_TIMESTAMP,
         execution_time_ms = EXCLUDED.execution_time_ms,
         success = EXCLUDED.success,
         error_message = EXCLUDED.error_message`,
      [name, version, checksum, executionTimeMs, success, errorMessage || null]
    );
  } catch (error) {
    console.error('[DB Migration] Failed to record migration:', error);
    throw error;
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(
  name: string,
  version: string,
  content: string
): Promise<boolean> {
  const checksum = calculateChecksum(content);
  const startTime = Date.now();

  try {
    // Split and execute statements
    const statements = content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let executedCount = 0;
    for (const statement of statements) {
      try {
        await query(statement);
        executedCount++;
      } catch (err: any) {
        // Ignore common idempotent errors
        const ignorableErrors: { [key: string]: boolean } = {
          '42703': true, // column does not exist
          '42701': true, // duplicate column
          '42P07': true, // table already exists
          '42710': true, // duplicate type
        };

        if (!ignorableErrors[err.code]) {
          throw err;
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;
    await recordMigration(name, version, checksum, executionTimeMs, true);
    console.log(`[DB Migration] ✓ ${name} (${executedCount} statements, ${executionTimeMs}ms)`);
    return true;
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error.message?.substring(0, 200) || 'Unknown error';
    await recordMigration(name, version, checksum, executionTimeMs, false, errorMessage);
    console.error(`[DB Migration] ✗ ${name} failed:`, errorMessage);
    throw error;
  }
}

/**
 * Run all pending migrations from a directory
 */
async function runMigrationsFromDirectory(
  directoryPath: string,
  pattern: RegExp = /^(\d+)_(.+)\.sql$/
): Promise<number> {
  if (!fs.existsSync(directoryPath)) {
    console.log(`[DB Migration] Directory not found: ${directoryPath}, skipping`);
    return 0;
  }

  const files = fs.readdirSync(directoryPath)
    .filter(f => pattern.test(f))
    .sort();

  let appliedCount = 0;
  const appliedMigrations = await getAppliedMigrations();

  for (const file of files) {
    const matches = file.match(pattern);
    if (!matches) continue;

    const [, version, name] = matches;
    const migrationName = `${version}_${name}`;

    if (appliedMigrations.has(migrationName)) {
      console.log(`[DB Migration] ⊘ ${migrationName} (already applied)`);
      continue;
    }

    const filePath = path.join(directoryPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      await executeMigration(migrationName, version, content);
      appliedCount++;
    } catch (error) {
      console.error(`[DB Migration] Stopping at first failure: ${migrationName}`);
      throw error;
    }
  }

  return appliedCount;
}

/**
 * Get migration status/history
 */
async function getMigrationStatus(): Promise<Migration[]> {
  try {
    const result = await query(
      `SELECT name, version, checksum, applied_at as timestamp
       FROM migrations_history
       ORDER BY applied_at DESC
       LIMIT 50`
    );
    return result.rows;
  } catch (error) {
    console.log('[DB Migration] Could not fetch migration status:', error);
    return [];
  }
}

export {
  createMigrationsHistoryTable,
  executeMigration,
  runMigrationsFromDirectory,
  getMigrationStatus,
  getAppliedMigrations,
};
