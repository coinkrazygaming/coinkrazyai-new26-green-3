import { query } from './connection';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { createMigrationsHistoryTable, runMigrationsFromDirectory } from './migrations';

// PostgreSQL error codes that are safe to ignore in idempotent operations
const IGNORABLE_SCHEMA_ERRORS: { [key: string]: string } = {
  '42703': 'column does not exist',
  '42701': 'duplicate column',
  '42P07': 'table already exists',
  '42710': 'duplicate type',
  '23503': 'foreign key constraint violation',
  '42P01': 'relation does not exist',
};

/**
 * Execute SQL statements from content string, safely ignoring known errors
 * @param sqlContent SQL file content as string
 * @param fileName Name of the file for logging
 * @param ignorableErrors Error codes to safely ignore
 */
async function executeSqlStatements(
  sqlContent: string,
  fileName: string,
  ignorableErrors: { [key: string]: string } = IGNORABLE_SCHEMA_ERRORS
): Promise<{ executed: number; skipped: number }> {
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  let executedCount = 0;
  let skippedCount = 0;

  for (const statement of statements) {
    try {
      await query(statement);
      executedCount++;
    } catch (err: any) {
      if (ignorableErrors[err.code]) {
        console.log(`[DB] Skipping ${fileName} statement (${ignorableErrors[err.code]})`);
        skippedCount++;
      } else {
        console.error(`[DB] Critical error in ${fileName}:`, {
          code: err.code,
          message: err.message?.substring(0, 100),
          statement: statement.substring(0, 80),
        });
        throw err;
      }
    }
  }

  console.log(`[DB] ${fileName}: ${executedCount} executed, ${skippedCount} skipped`);
  return { executed: executedCount, skipped: skippedCount };
}

/**
 * Execute a SQL file if it exists
 * @param fileName SQL file to execute
 * @param baseDir Base directory for the file
 * @param optional If true, don't throw error if file doesn't exist
 */
async function executeSqlFile(
  fileName: string,
  baseDir: string,
  optional: boolean = false
): Promise<boolean> {
  const filePath = path.join(baseDir, fileName);

  if (!fs.existsSync(filePath)) {
    if (optional) {
      console.log(`[DB] Optional file not found: ${fileName}`);
      return false;
    } else {
      throw new Error(`[DB] Critical: ${fileName} not found at ${filePath}`);
    }
  }

  console.log(`[DB] Executing ${fileName}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = await executeSqlStatements(content, fileName);
    console.log(`[DB] ${fileName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`[DB] Failed to execute ${fileName}:`, error);
    throw error;
  }
}

export const initializeDatabase = async () => {
  try {
    console.log('[DB] Initializing database...');
    const __dirname = import.meta.dirname;

    // Create migrations tracking table first
    await createMigrationsHistoryTable();

    // Execute core schema (REQUIRED)
    await executeSqlFile('schema.sql', __dirname, false);

    // Execute migrations using the migration tracking system
    console.log('[DB] Running versioned migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const appliedCount = await runMigrationsFromDirectory(migrationsDir);
    console.log(`[DB] Applied ${appliedCount} new migrations`);

    // Execute optional schema files (for legacy support)
    const optionalFiles = [
      'missing_tables.sql',
      'game_system_schema.sql',
      'challenges_schema.sql',
    ];

    for (const file of optionalFiles) {
      try {
        const executed = await executeSqlFile(file, __dirname, true);
        if (executed) {
          console.log(`[DB] Applied optional schema: ${file}`);
        }
      } catch (err) {
        console.warn(`[DB] Warning with optional file ${file}:`, err.message?.substring(0, 100));
      }
    }

    // Add missing columns to games table (idempotent)
    console.log('[DB] Verifying games table columns...');
    const gameColumns = [
      { name: 'description', type: 'TEXT' },
      { name: 'image_url', type: 'VARCHAR(500)' },
      { name: 'thumbnail', type: 'VARCHAR(500)' },
      { name: 'embed_url', type: 'VARCHAR(500)' },
      { name: 'launch_url', type: 'VARCHAR(500)' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'is_branded_popup', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'branding_config', type: 'JSONB DEFAULT \'{}\''},
    ];

    for (const col of gameColumns) {
      try {
        await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        console.log(`[DB] Verified games.${col.name} column`);
      } catch (err: any) {
        if (err.code !== '42701' && err.code !== '42P07') {
          console.log(`[DB] Note on games.${col.name}:`, err.message?.substring(0, 80));
        }
      }
    }

    // Verify api_keys table columns
    console.log('[DB] Verifying api_keys table columns...');
    const apiKeyColumns = [
      { name: 'key_name', type: 'VARCHAR(255)' },
      { name: 'key_hash', type: 'VARCHAR(255) UNIQUE' },
      { name: 'permissions', type: 'JSONB' },
      { name: 'rate_limit', type: 'INTEGER DEFAULT 100' },
      { name: 'status', type: 'VARCHAR(50) DEFAULT \'active\'' },
      { name: 'last_used_at', type: 'TIMESTAMP' },
      { name: 'expires_at', type: 'TIMESTAMP' },
    ];

    for (const col of apiKeyColumns) {
      try {
        await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        console.log(`[DB] Verified api_keys.${col.name} column`);
      } catch (err: any) {
        if (err.code !== '42701' && err.code !== '42P07') {
          console.log(`[DB] Note on api_keys.${col.name}:`, err.message?.substring(0, 80));
        }
      }
    }

    // Verify game_compliance table columns and constraints
    console.log('[DB] Verifying game_compliance table...');
    try {
      const complianceColumns = [
        { name: 'is_external', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'is_sweepstake', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'is_social_casino', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'currency', type: 'VARCHAR(10) DEFAULT \'SC\'' },
        { name: 'max_win_amount', type: 'DECIMAL(15, 2) DEFAULT 10.00' },
        { name: 'min_bet', type: 'DECIMAL(15, 2) DEFAULT 0.01' },
        { name: 'max_bet', type: 'DECIMAL(15, 2) DEFAULT 5.00' },
      ];

      for (const col of complianceColumns) {
        await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      }

      console.log('[DB] Verified game_compliance table schema');

      // Enforce 10 SC max win for social casino compliance
      await query(`UPDATE game_compliance SET max_win_amount = 10.00 WHERE max_win_amount > 10.00`);
      await query(`INSERT INTO game_compliance (game_id, max_win_amount, is_external, is_sweepstake, is_social_casino, currency)
                   SELECT id, 10.00, true, true, true, 'SC' FROM games
                   WHERE id NOT IN (SELECT game_id FROM game_compliance)
                   ON CONFLICT DO NOTHING`);
      console.log('[DB] Enforced 10 SC max win compliance for all games');
    } catch (err: any) {
      console.log('[DB] game_compliance schema note:', err.message?.substring(0, 100));
    }

    // Verify store_packs columns
    console.log('[DB] Verifying store_packs table...');
    try {
      await query(`ALTER TABLE store_packs ADD COLUMN IF NOT EXISTS bonus_sc DECIMAL(15, 2) DEFAULT 0`);
      console.log('[DB] Verified store_packs.bonus_sc column');
    } catch (err: any) {
      console.log('[DB] Note on store_packs.bonus_sc:', err.message?.substring(0, 80));
    }

    // Verify security_alerts table
    console.log('[DB] Verifying security_alerts table...');
    try {
      const alertColumns = [
        { name: 'player_id', type: 'INTEGER REFERENCES players(id) ON DELETE CASCADE' },
        { name: 'severity', type: 'VARCHAR(50) DEFAULT \'info\'' },
        { name: 'title', type: 'VARCHAR(255)' },
        { name: 'message', type: 'TEXT' },
        { name: 'timestamp', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      ];

      for (const col of alertColumns) {
        await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      }
      console.log('[DB] Verified security_alerts table schema');
    } catch (err: any) {
      console.log('[DB] security_alerts schema note:', err.message?.substring(0, 100));
    }

    // Seed data if tables are empty
    await seedDatabase();
  } catch (error) {
    console.error('[DB] Initialization failed:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    // Add password_hash column to players table if it doesn't exist
    console.log('[DB] Checking players table schema...');
    try {
      await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT ''`);
      console.log('[DB] Verified password_hash column in players');
    } catch (err: any) {
      console.log('[DB] Schema check for password_hash:', err.message?.substring(0, 100));
    }

    // Add username column to players table if it doesn't exist
    try {
      await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE`);
      console.log('[DB] Verified username column in players');
    } catch (err: any) {
      console.log('[DB] Schema check for username:', err.message?.substring(0, 100));
    }

    // Update existing players to have usernames if they don't
    console.log('[DB] Ensuring players have usernames...');
    try {
      const playersWithoutUsername = await query(
        `SELECT id, name FROM players WHERE username IS NULL LIMIT 100`
      );

      for (const player of playersWithoutUsername.rows) {
        const username = player.name.toLowerCase().replace(/\s+/g, '') + player.id;
        await query(
          `UPDATE players SET username = $1 WHERE id = $2`,
          [username, player.id]
        );
      }

      if (playersWithoutUsername.rows.length > 0) {
        console.log(`[DB] Updated ${playersWithoutUsername.rows.length} players with usernames`);
      }
    } catch (err: any) {
      console.log('[DB] Username update:', err.message?.substring(0, 100));
    }

    // Apply welcome bonus to all players
    console.log('[DB] Applying welcome bonus to all players...');
    try {
      const bonusResult = await query(
        `UPDATE players SET gc_balance = GREATEST(gc_balance, 10000), sc_balance = GREATEST(sc_balance, 5) WHERE status = 'Active'`
      );
      console.log('[DB] Welcome bonus applied to players');
    } catch (err: any) {
      console.log('[DB] Welcome bonus update:', err.message?.substring(0, 100));
    }

    // Add notification_settings column to players table if it doesn't exist
    try {
      await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false, "promotions": true, "security": true}'`);
      console.log('[DB] Verified notification_settings column in players');
    } catch (err: any) {
      console.log('[DB] Schema check for players.notification_settings:', err.message?.substring(0, 100));
    }

    // Always ensure admin user exists
    console.log('[DB] Ensuring admin user exists...');
    const adminEmail = process.env.ADMIN_EMAIL || 'coinkrazy26@gmail.com';
    const adminRawPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPassword = await bcrypt.hash(adminRawPassword, 10);

    try {
      await query(
        `INSERT INTO admin_users (email, password_hash, name, role, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
        [adminEmail, adminPassword, 'CoinKrazy Admin', 'admin', 'Active']
      );
      console.log(`[DB] Admin user ${adminEmail} ensured`);
    } catch (err: any) {
      console.log('[DB] Admin user setup:', err.message?.substring(0, 100));
    }

    // Check if players table has data
    const result = await query('SELECT COUNT(*) as count FROM players');

    if (result.rows[0].count === 0) {
      console.log('[DB] Seeding database with sample data...');

      // Seed players with proper bcrypt hashes (password: testpass123)
      const playerPassword = await bcrypt.hash('testpass123', 10);
      const players = [
        ['johndoe', 'John Doe', 'john@example.com', playerPassword, 5250, 125, 'Active', 'Full', true],
        ['janesmith', 'Jane Smith', 'jane@example.com', playerPassword, 12000, 340, 'Active', 'Full', true],
        ['mikejohnson', 'Mike Johnson', 'mike@example.com', playerPassword, 2100, 89, 'Active', 'Intermediate', true],
        ['sarahwilson', 'Sarah Wilson', 'sarah@example.com', playerPassword, 8500, 215, 'Active', 'Full', true],
        ['tombrown', 'Tom Brown', 'tom@example.com', playerPassword, 3200, 95, 'Suspended', 'Basic', false],
      ];

      for (const player of players) {
        try {
          await query(
            `INSERT INTO players (username, name, email, password_hash, gc_balance, sc_balance, status, kyc_level, kyc_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            player
          );
        } catch (err: any) {
          // Player might already exist, that's okay
          if (err.code !== '23505') {
            throw err;
          }
        }
      }

      // Seed games
      const games = [
        ['Mega Spin Slots', 'Slots', 'Internal', 96.5, 'Medium', 'Classic 5-reel slot game with high payouts.', true],
        ['Diamond Poker Pro', 'Poker', 'Internal', 98.2, 'Low', 'Professional poker experience with high stakes.', true],
        ['Bingo Bonanza', 'Bingo', 'Internal', 94.8, 'High', 'Fast-paced bingo action with multiple rooms.', true],
        ['Fruit Frenzy', 'Slots', 'Internal', 95.0, 'Medium', 'Colorful fruit-themed slot machine.', false],
      ];

      for (const game of games) {
        await query(
          `INSERT INTO games (name, category, provider, rtp, volatility, description, enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          game
        );
      }

      // Add CoinKrazy-CoinUp as a featured game
      try {
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, is_branded_popup, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, thumbnail = EXCLUDED.thumbnail, updated_at = CURRENT_TIMESTAMP`,
          [
            'CoinKrazy-CoinUp: Lightning Edition',
            'coinkrazy-coinup-lightning',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            96.5,
            'High',
            'Lightning fast slots action with CoinUp bonus rounds. Strike it rich with the CoinKrazy-CoinUp: Lightning Edition! 🎰⚡ PlayCoinKrazy.com',
            'https://images.pexels.com/photos/16946492/pexels-photo-16946492.jpeg?w=400&h=300&fit=crop',
            'https://images.pexels.com/photos/16946492/pexels-photo-16946492.jpeg?w=200&h=150&fit=crop',
            '/coin-krazy-coin-up',
            '/coin-krazy-coin-up',
            true,
            true
          ]
        );
        console.log('[DB] Added CoinKrazy-CoinUp game');
      } catch (err: any) {
        console.log('[DB] CoinKrazy-CoinUp game already exists or error:', err.message?.substring(0, 100));
      }

      // Add CoinKrazy-CoinHot as a featured game
      try {
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, is_branded_popup, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, thumbnail = EXCLUDED.thumbnail, updated_at = CURRENT_TIMESTAMP`,
          [
            'CoinKrazy-Hot',
            'coinkrazy-hot-inferno',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            96.8,
            'High',
            'Blaze through reels with CoinKrazy-Hot! Inferno-themed slots with massive multipliers and epic bonus features! 🔥💰 PlayCoinKrazy.com',
            'https://images.pexels.com/photos/672636/pexels-photo-672636.jpeg?w=400&h=300&fit=crop',
            'https://images.pexels.com/photos/672636/pexels-photo-672636.jpeg?w=200&h=150&fit=crop',
            '/coin-krazy-hot',
            '/coin-krazy-hot',
            true,
            true
          ]
        );
        console.log('[DB] Added CoinKrazy-Hot game');
      } catch (err: any) {
        console.log('[DB] CoinKrazy-Hot game already exists or error:', err.message?.substring(0, 100));
      }

      // Add CoinKrazy-Thunder as a featured game
      try {
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, is_branded_popup, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, thumbnail = EXCLUDED.thumbnail, updated_at = CURRENT_TIMESTAMP`,
          [
            'CoinKrazy-Thunder',
            'coinkrazy-thunder-elite',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            97.0,
            'High',
            'Strike it big with CoinKrazy-Thunder! Experience electrifying spins with thunderbolt wilds and powerful jackpot features! ⚡🎰 PlayCoinKrazy.com',
            'https://images.pexels.com/photos/8236062/pexels-photo-8236062.jpeg?w=400&h=300&fit=crop',
            'https://images.pexels.com/photos/8236062/pexels-photo-8236062.jpeg?w=200&h=150&fit=crop',
            '/coin-krazy-thunder',
            '/coin-krazy-thunder',
            true,
            true
          ]
        );
        console.log('[DB] Added CoinKrazy-Thunder game');
      } catch (err: any) {
        console.log('[DB] CoinKrazy-Thunder game already exists or error:', err.message?.substring(0, 100));
      }

      // Add CoinKrazy-4Wolfs as a featured game
      try {
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, is_branded_popup, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, thumbnail = EXCLUDED.thumbnail, updated_at = CURRENT_TIMESTAMP`,
          [
            'CoinKrazy-4Wolfs',
            'coinkrazy-4wolfs-wild',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            96.5,
            'High',
            'Hunt for riches with CoinKrazy-4Wolfs! Pack your paylines with wild beasts and unleash massive winning combinations! 🐺💰 PlayCoinKrazy.com',
            'https://images.pexels.com/photos/9877295/pexels-photo-9877295.jpeg?w=400&h=300&fit=crop',
            'https://images.pexels.com/photos/9877295/pexels-photo-9877295.jpeg?w=200&h=150&fit=crop',
            '/coin-krazy-4wolfs',
            '/coin-krazy-4wolfs',
            true,
            true
          ]
        );
        console.log('[DB] Added CoinKrazy-4Wolfs game');
      } catch (err: any) {
        console.log('[DB] CoinKrazy-4Wolfs game already exists or error:', err.message?.substring(0, 100));
      }

      // Add CoinKrazy-4EgyptPots as a featured game
      try {
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, is_branded_popup, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, thumbnail = EXCLUDED.thumbnail, updated_at = CURRENT_TIMESTAMP`,
          [
            'CoinKrazy-4EgyptPots',
            'coinkrazy-4egypt-pots',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            96.3,
            'Medium-High',
            'Discover the treasures of ancient Egypt! Spin the 5×3 reels and unlock four mystical pot features. With Hold & Win bonus, progressive pot meters, and massive multipliers, your fortune awaits in the land of the pharaohs! 🏛️💰 PlayCoinKrazy.com',
            'https://images.pexels.com/photos/3652087/pexels-photo-3652087.jpeg?w=400&h=300&fit=crop',
            'https://images.pexels.com/photos/3652087/pexels-photo-3652087.jpeg?w=200&h=150&fit=crop',
            '/coinkrazy-4egypt-pots',
            '/coinkrazy-4egypt-pots',
            true,
            true
          ]
        );
        console.log('[DB] Added CoinKrazy-4EgyptPots game');
      } catch (err: any) {
        console.log('[DB] CoinKrazy-4EgyptPots game already exists or error:', err.message?.substring(0, 100));
      }

      // Seed bonuses
      const bonuses = [
        ['Welcome Bonus 100%', 'Deposit', '$100', 100, 10, 1200],
        ['VIP Reload Bonus', 'Reload', '$50', 50, 50, 500],
        ['Free Spins 50', 'Free Spins', '50 Spins', null, 0, 2000],
      ];

      for (const bonus of bonuses) {
        await query(
          `INSERT INTO bonuses (name, type, amount, percentage, min_deposit, max_claims) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          bonus
        );
      }

      // Seed poker tables
      const pokerTables = [
        ['Diamond Table 1', '$1/$2', 8, 6, 20, 200],
        ['Ruby Table 2', '$5/$10', 8, 5, 100, 1000],
        ['Gold Table 1', '$10/$20', 6, 0, 200, 2000],
        ['Platinum VIP', '$50/$100', 6, 4, 1000, 10000],
        ['Silver Stake 1', '$0.50/$1', 9, 3, 10, 100],
        ['Bronze Beginner', '$0.10/$0.20', 9, 8, 2, 20],
        ['High Roller Suite', '$100/$200', 6, 2, 2000, 20000],
        ['Fast Fold 1', '$1/$2', 6, 45, 20, 200],
        ['Omaha High 1', '$2/$4', 8, 5, 40, 400],
        ['Deep Stack Pro', '$5/$10', 9, 7, 500, 2000],
      ];

      for (const table of pokerTables) {
        await query(
          `INSERT INTO poker_tables (name, stakes, max_players, current_players, buy_in_min, buy_in_max) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          table
        );
      }

      // Seed bingo games
      const bingoGames = [
        ['Morning Bonanza', '5-line', 42, 1, 500],
        ['Afternoon Special', 'Full Card', 28, 2, 1200],
        ['Evening Rush', '5-line', 0, 1.5, 750],
        ['Night Party', 'Corner', 0, 3, 2000],
        ['Penny Bingo', 'Any line', 156, 0.01, 100],
        ['Speed Bingo', 'Center square', 34, 0.50, 300],
        ['High Stakes Bingo', 'Full Card', 12, 10, 5000],
        ['Community Pot', '4 Corners', 89, 0.25, 400],
        ['Jackpot Jubilee', 'Coverall', 210, 5, 10000],
        ['Lunchtime Quickie', 'Single Line', 45, 0.10, 50],
      ];

      for (const game of bingoGames) {
        await query(
          `INSERT INTO bingo_games (name, pattern, players, ticket_price, jackpot) 
           VALUES ($1, $2, $3, $4, $5)`,
          game
        );
      }

      // Seed sports events
      const sportsEvents = [
        ['NFL', 'Chiefs vs 49ers', 'Live', 124500, '+2.5'],
        ['NBA', 'Lakers vs Celtics', 'Live', 89200, '-1.5'],
        ['Soccer', 'Manchester United vs Liverpool', 'Upcoming', 234100, '+0.5'],
        ['Tennis', 'Australian Open Final', 'Upcoming', 56800, null],
        ['MLB', 'Yankees vs Red Sox', 'Upcoming', 45000, '-110'],
        ['NHL', 'Leafs vs Canadiens', 'Live', 32000, 'O 6.5'],
        ['Boxing', 'Fury vs Usyk', 'Upcoming', 1500000, 'Pickem'],
        ['UFC', 'McGregor vs Chandler', 'Upcoming', 2000000, '-150'],
        ['Golf', 'The Masters - Round 1', 'Upcoming', 75000, 'Scheffler +300'],
        ['Cricket', 'India vs Pakistan', 'Live', 5000000, 'India -140'],
      ];

      for (const event of sportsEvents) {
        await query(
          `INSERT INTO sports_events (sport, event_name, status, total_bets, line_movement)
           VALUES ($1, $2, $3, $4, $5)`,
          event
        );
      }

      // Seed store packs
      const storePacks = [
        ['Starter Pack', 'Perfect for new players', 9.99, 1000, 0, 0, false, false, true, 1],
        ['Gold Bundle', 'Popular choice', 24.99, 3000, 500, 10, true, false, true, 2],
        ['Platinum Pack', 'Best value offer', 49.99, 7000, 2000, 20, false, true, true, 3],
        ['VIP Elite', 'Premium experience', 99.99, 15000, 5000, 30, false, false, true, 4],
        ['Mega Bonus', 'Limited time offer', 14.99, 2000, 200, 15, false, false, true, 5],
      ];

      for (const pack of storePacks) {
        await query(
          `INSERT INTO store_packs (title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value, enabled, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          pack
        );
      }

      // Seed achievements
      const achievements = [
        ['First Win', 'Win your first game', 'trophy', 'first_win', 'wins', 1, true],
        ['Big Winner', 'Win 100 times', 'crown', 'big_winner', 'wins', 100, true],
        ['High Roller', 'Wager 10,000 gold coins', 'gem', 'high_roller', 'wagered', 10000, true],
        ['Streaker', 'Get a 10 game winning streak', 'fire', 'streaker', 'streak', 10, true],
        ['Rich Player', 'Accumulate 50,000 gold coins', 'diamond', 'rich_player', 'balance', 50000, true],
        ['Slots Master', 'Play slots 500 times', 'star', 'slots_master', 'games_played', 500, true],
        ['Poker Pro', 'Play 100 poker hands', 'spade', 'poker_pro', 'games_played', 100, true],
      ];

      for (const achievement of achievements) {
        await query(
          `INSERT INTO achievements (name, description, icon_url, badge_name, requirement_type, requirement_value, enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          achievement
        );
      }

      // Seed player stats (for seeded players)
      const playerIds = [1, 2, 3, 4];
      for (const playerId of playerIds) {
        await query(
          `INSERT INTO player_stats (player_id, total_wagered, total_won, games_played, favorite_game)
           VALUES ($1, $2, $3, $4, $5)`,
          [playerId, Math.random() * 50000, Math.random() * 25000, Math.floor(Math.random() * 500), 'Slots']
        );
      }

      // Seed scratch ticket designs
      const scratchDesigns = [
        ['Gold Rush', 'Scratch to find hidden gold!', 5, 6, 16.67, 1, 10, null, '#FFD700'],
        ['Lucky Clover', 'Find the 4-leaf clover and win big!', 2, 4, 20, 1, 5, null, '#4CAF50'],
        ['Diamond Dazzle', 'Diamonds are a player\'s best friend!', 10, 9, 15, 5, 10, null, '#00BCD4'],
      ];

      for (const design of scratchDesigns) {
        await query(
          `INSERT INTO scratch_ticket_designs (name, description, cost_sc, slot_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }

      // Seed pull tab designs
      const pullTabDesigns = [
        ['Orange Heat', 'Traditional pull tabs with big wins!', 5, 3, 20, 1, 10, null, '#FF6B35'],
        ['Midnight Stars', 'Pull the stars and reach for the moon!', 1, 3, 25, 1, 5, null, '#3F51B5'],
        ['Royal Jackpot', 'Only for the elite - massive prizes await!', 25, 5, 15, 5, 10, null, '#9C27B0'],
      ];

      for (const design of pullTabDesigns) {
        await query(
          `INSERT INTO pull_tab_designs (name, description, cost_sc, tab_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }

      console.log('[DB] Sample data seeded successfully');
    } else {
      console.log('[DB] Database already contains data, skipping main seed');
    }

    // Always ensure some designs exist for testing if table is empty
    const scratchCount = await query('SELECT COUNT(*) as count FROM scratch_ticket_designs');
    if (parseInt(scratchCount.rows[0].count) === 0) {
      console.log('[DB] Seeding scratch ticket designs...');
      const scratchDesigns = [
        ['Gold Rush', 'Scratch to find hidden gold!', 5, 6, 16.67, 1, 10, null, '#FFD700'],
        ['Lucky Clover', 'Find the 4-leaf clover and win big!', 2, 4, 20, 1, 5, null, '#4CAF50'],
        ['Diamond Dazzle', 'Diamonds are a player\'s best friend!', 10, 9, 15, 5, 10, null, '#00BCD4'],
      ];
      for (const design of scratchDesigns) {
        await query(
          `INSERT INTO scratch_ticket_designs (name, description, cost_sc, slot_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }
    }

    const pullTabCount = await query('SELECT COUNT(*) as count FROM pull_tab_designs');
    if (parseInt(pullTabCount.rows[0].count) === 0) {
      console.log('[DB] Seeding pull tab designs...');
      const pullTabDesigns = [
        ['Orange Heat', 'Traditional pull tabs with big wins!', 5, 3, 20, 1, 10, null, '#FF6B35'],
        ['Midnight Stars', 'Pull the stars and reach for the moon!', 1, 3, 25, 1, 5, null, '#3F51B5'],
        ['Royal Jackpot', 'Only for the elite - massive prizes await!', 25, 5, 15, 5, 10, null, '#9C27B0'],
      ];
      for (const design of pullTabDesigns) {
        await query(
          `INSERT INTO pull_tab_designs (name, description, cost_sc, tab_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }
    }

    const storePacksCount = await query('SELECT COUNT(*) as count FROM store_packs');
    if (parseInt(storePacksCount.rows[0].count) === 0) {
      console.log('[DB] Seeding store packs...');
      const storePacks = [
        ['Starter Pack', 'Perfect for new players', 9.99, 1000, 0, 0, false, false, true, 1],
        ['Gold Bundle', 'Popular choice', 24.99, 3000, 500, 10, true, false, true, 2],
        ['Platinum Pack', 'Best value offer', 49.99, 7000, 2000, 20, false, true, true, 3],
        ['VIP Elite', 'Premium experience', 99.99, 15000, 5000, 30, false, false, true, 4],
        ['Mega Bonus', 'Limited time offer', 14.99, 2000, 200, 15, false, false, true, 5],
      ];

      for (const pack of storePacks) {
        await query(
          `INSERT INTO store_packs (title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value, enabled, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          pack
        );
      }
    }

    // Game seeding - CoinKrazy Studios games only
    const gameCount = await query('SELECT COUNT(*) as count FROM games WHERE provider = \'CoinKrazy Studios\'');
    if (parseInt(gameCount.rows[0].count) === 0) {
      console.log('[DB] Seeding CoinKrazy Studios games...');
      // Only seed CoinKrazy Studios games, no external games
      console.log('[DB] CoinKrazy Studios games will be added below');
    }

    // Ensure CoinKrazy-Thunder game exists
    try {
      // Check if it already exists
      const existing = await query(
        `SELECT id FROM games WHERE name = 'CoinKrazy-Thunder'`,
        []
      );

      if (!existing.rows.length) {
        // Only insert if it doesn't exist
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            'CoinKrazy-Thunder',
            'coinkrazy-thunder',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            96.5,
            'High',
            'Experience the power of the Thunder God in this electrifying 5x3 slot game with Hold & Win bonuses, Collect symbols, and massive jackpots up to 1000x! ⚡',
            'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&h=150&fit=crop',
            '/coinkrazy-thunder',
            '/coinkrazy-thunder',
            true
          ]
        );
        console.log('[DB] CoinKrazy-Thunder game created');
      } else {
        console.log('[DB] CoinKrazy-Thunder game already exists');
      }
    } catch (err: any) {
      console.log('[DB] CoinKrazy-Thunder game error:', err.message?.substring(0, 100));
    }

    // Ensure CoinKrazy ChiliCoins game exists
    try {
      const existing = await query(
        `SELECT id FROM games WHERE name = 'CoinKrazy ChiliCoins'`,
        []
      );

      if (!existing.rows.length) {
        await query(
          `INSERT INTO games (name, slug, category, type, provider, rtp, volatility, description, image_url, thumbnail, embed_url, launch_url, enabled, is_branded_popup, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            'CoinKrazy ChiliCoins',
            'coinkrazy-chilicoins',
            'Slots',
            'slots',
            'CoinKrazy Studios',
            96.5,
            'High',
            '🌶️ Hold & Win fiery action! Land the Collect symbol to unlock up to 3 respins and accumulate bonus coins! Chili-themed mayhem with Max 10 SC wins! 🔥💰',
            'https://images.unsplash.com/photo-1585518419759-3a6f5af4b1f5?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1585518419759-3a6f5af4b1f5?w=200&h=150&fit=crop',
            '/coinkrazy-chilicoins',
            '/coinkrazy-chilicoins',
            true,
            true
          ]
        );
        console.log('[DB] CoinKrazy ChiliCoins game created');
      } else {
        console.log('[DB] CoinKrazy ChiliCoins game already exists');
      }
    } catch (err: any) {
      console.log('[DB] CoinKrazy ChiliCoins game error:', err.message?.substring(0, 100));
    }

    // Seed AI employees if table is empty
    const aiCount = await query('SELECT COUNT(*) as count FROM ai_employees');
    if (parseInt(aiCount.rows[0].count) === 0) {
      console.log('[DB] Seeding AI employees...');
      const aiEmployees = [
        ['ai-1', 'LuckyAI', 'Game Optimizer', 'active', ['Adjust RTP', 'Game Balance']],
        ['ai-2', 'SecurityAI', 'Security Monitor', 'active', ['Fraud Detection', 'Account Security']],
        ['ai-3', 'SlotsAI', 'Slots Specialist', 'active', ['Slots Management', 'Payout Optimization']],
        ['ai-4', 'JoseyAI', 'Poker Engine', 'idle', []],
        ['ai-5', 'SocialAI', 'Community Manager', 'active', ['Chat Moderation', 'Event Hosting']],
        ['ai-6', 'PromotionsAI', 'Marketing', 'active', ['Promotions', 'Bonuses']]
      ];

      for (const ai of aiEmployees) {
        await query(
          `INSERT INTO ai_employees (id, name, role, status, duties)
           VALUES ($1, $2, $3, $4, $5)`,
          ai
        );
      }
      console.log('[DB] AI employees seeded');
    }

    // Seed default casino settings
    const settingsCount = await query('SELECT COUNT(*) as count FROM casino_settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      console.log('[DB] Seeding default casino settings...');
      const settings = [
        ['maintenance_mode', 'false', 'boolean', 'Whether the platform is in maintenance mode'],
        ['system_health', 'Optimal', 'string', 'Current system health status'],
        ['slots_config', JSON.stringify({ rtp: 95, minBet: 0.01, maxBet: 100 }), 'json', 'Global configuration for slots'],
        ['poker_config', JSON.stringify({ rtp: 95, minBuyIn: 10, maxBuyIn: 1000, houseCommission: 5 }), 'json', 'Global configuration for poker'],
        ['bingo_config', JSON.stringify({ rtp: 85, minTicketPrice: 0.5, maxTicketPrice: 50, houseCommission: 15 }), 'json', 'Global configuration for bingo'],
        ['sportsbook_config', JSON.stringify({ rtp: 92, minBet: 1, maxBet: 1000, minParlay: 3, maxParlay: 10, houseCommission: 8 }), 'json', 'Global configuration for sportsbook']
      ];

      for (const s of settings) {
        await query(
          `INSERT INTO casino_settings (setting_key, setting_value, data_type, description)
           VALUES ($1, $2, $3, $4)`,
          s
        );
      }
      console.log('[DB] Casino settings seeded');
    }

    // Always ensure payment methods exist
    const pmCount = await query('SELECT COUNT(*) as count FROM payment_methods');
    if (parseInt(pmCount.rows[0].count) === 0) {
      console.log('[DB] Seeding default payment methods...');
      const paymentMethods = [
        ['Credit Card', 'stripe', true, JSON.stringify({
          api_key: process.env.STRIPE_PUBLIC_KEY || 'REPLACE_ENV.STRIPE_PUBLIC_KEY',
          secret_key: process.env.STRIPE_SECRET_KEY || 'REPLACE_ENV.STRIPE_SECRET_KEY',
          mode: 'live'
        })],
        ['Google Pay', 'google_pay', true, JSON.stringify({
          merchant_id: 'BCR2DN6T7X7X7X7X',
          merchant_name: 'CoinKrazy',
          gateway: 'stripe',
          mode: 'live'
        })]
      ];

      for (const method of paymentMethods) {
        await query(
          `INSERT INTO payment_methods (name, provider, is_active, config)
           VALUES ($1, $2, $3, $4)`,
          method
        );
      }
    }

    // Clean up all external games - keep ONLY CoinKrazy Studios games
    try {
      // Get list of games to delete (everything except CoinKrazy Studios)
      const gamesToDelete = await query(
        `SELECT id FROM games WHERE provider != 'CoinKrazy Studios' OR provider IS NULL`
      );

      if (gamesToDelete.rows.length > 0) {
        const gameIds = gamesToDelete.rows.map((row: any) => row.id);

        // Delete associated records
        console.log(`[DB] Cleaning up ${gameIds.length} non-CoinKrazy games...`);

        // Delete from slots_results (has foreign key to games)
        try {
          const slotsResult = await query(
            `DELETE FROM slots_results WHERE game_id = ANY($1::integer[])`,
            [gameIds]
          );
          console.log(`[DB] Deleted ${slotsResult.rowCount} slots results records`);
        } catch (err) {
          console.log('[DB] slots_results cleanup note:', err.message?.substring(0, 80));
        }

        // Delete from spin_results (has foreign key to games)
        try {
          const spinResult = await query(
            `DELETE FROM spin_results WHERE game_id = ANY($1::integer[])`,
            [gameIds]
          );
          console.log(`[DB] Deleted ${spinResult.rowCount} spin records`);
        } catch (err) {
          console.log('[DB] spin_results cleanup note:', err.message?.substring(0, 80));
        }

        // Delete from game_config
        try {
          const configResult = await query(
            `DELETE FROM game_config WHERE game_id = ANY($1::integer[])`,
            [gameIds]
          );
          console.log(`[DB] Deleted ${configResult.rowCount} game config records`);
        } catch (err) {
          console.log('[DB] game_config cleanup note:', err.message?.substring(0, 80));
        }

        // Delete from game_compliance
        try {
          const complianceResult = await query(
            `DELETE FROM game_compliance WHERE game_id = ANY($1::integer[])`,
            [gameIds]
          );
          console.log(`[DB] Deleted ${complianceResult.rowCount} game compliance records`);
        } catch (err) {
          console.log('[DB] game_compliance cleanup note:', err.message?.substring(0, 80));
        }

        // Finally delete the games
        const result = await query(
          `DELETE FROM games WHERE provider != 'CoinKrazy Studios' OR provider IS NULL`
        );
        console.log(`[DB] Removed ${result.rowCount} external games - now only CoinKrazy Studios games remain`);
      }
    } catch (err: any) {
      console.log('[DB] Error during game cleanup:', err.message?.substring(0, 100));
    }
  } catch (error) {
    console.error('[DB] Seeding failed:', error);
    throw error;
  }
};

// Export initialization for manual run if needed
export default initializeDatabase;
