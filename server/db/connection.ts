import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Validate DATABASE_URL is set
    let connectionString = process.env.DATABASE_URL || '';
    if (!connectionString) {
      throw new Error('[DB] DATABASE_URL environment variable is not set. Cannot initialize database connection.');
    }

    // Clean DATABASE_URL if it includes the psql command wrapper
    // This handles cases where DATABASE_URL is copied from `psql '...'`
    if (connectionString.startsWith('psql ')) {
      console.log('[DB] Detected psql wrapper in DATABASE_URL, cleaning...');
      connectionString = connectionString.replace(/^psql\s+'/, '').replace(/'$/, '');
    }

    console.log('[DB] Creating connection pool');

    // For production with Neon, SSL is typically required and configured via sslmode=require in the connection string
    // We use ssl: true to enable SSL with default certificate verification
    // Neon's certificates are properly issued, so rejectUnauthorized defaults to true (secure)
    const poolConfig: any = {
      connectionString: connectionString,
      // Enable SSL for secure connections (required for Neon production)
      ssl: process.env.NODE_ENV === 'production'
        ? true  // Strict SSL validation in production
        : { rejectUnauthorized: false }, // Allow self-signed certs in development
      // Connection pool settings for production reliability
      max: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE) : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    try {
      pool = new Pool(poolConfig);

      pool.on('error', (err) => {
        console.error('[DB] Unexpected pool error:', err);
      });

      pool.on('connect', () => {
        console.log('[DB] New client connected to pool');
      });
    } catch (error) {
      console.error('[DB] Failed to create connection pool:', error);
      throw error;
    }
  }

  return pool;
}

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[DB] Slow query (${duration}ms): ${text.substring(0, 80)}...`);
    } else if (process.env.DEBUG_DB) {
      console.log(`[DB] ${text.substring(0, 80)}... (${duration}ms)`);
    }
    return res;
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error('[DB ERROR] Query failed:', {
      message: error.message,
      code: error.code,
      query: text.substring(0, 100),
      duration: `${duration}ms`,
    });
    throw error;
  }
};

export const getClient = async () => {
  return getPool().connect();
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
  }
};

export default { query, getClient, closePool };
