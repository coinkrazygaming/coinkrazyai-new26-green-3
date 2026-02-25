import { query } from './connection';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

export const initializeDatabase = async () => {
  try {
    console.log('[DB] Initializing database...');

    // Read and execute schema
    const __dirname = import.meta.dirname;
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (err: any) {
          // Log but don't fail on schema errors - the table might already exist with different schema
          // 42703 = column does not exist, 42701 = duplicate column, 42P07 = table exists, 42710 = type exists
          if (err.code === '42703' || err.code === '42701' || err.code === '42P07' || err.code === '42710') {
            console.log('[DB] Skipping schema statement (already exists):', err.message?.substring(0, 80));
          } else {
            throw err;
          }
        }
      }
    }

    console.log('[DB] Schema initialized successfully');

    // Read and execute migrations
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    const migrations = fs.readFileSync(migrationsPath, 'utf-8');

    // Split and execute each statement
    const migrationStatements = migrations.split(';').filter(stmt => stmt.trim());

    for (const statement of migrationStatements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (err: any) {
          // Log but don't fail on migration errors - tables might already exist
          // 42703 = column does not exist, 42701 = duplicate column, 42P07 = table exists, 42710 = type exists
          // 23503 = foreign key constraint violation, 42P01 = relation does not exist
          if (err.code === '42703' || err.code === '42701' || err.code === '42P07' || err.code === '42710' || err.code === '23503' || err.code === '42P01') {
            console.log('[DB] Skipping migration statement (conflict):', err.message?.substring(0, 80));
          } else {
            throw err;
          }
        }
      }
    }

    console.log('[DB] Migrations applied successfully');

    // Read and execute missing tables migration
    const missingTablesPath = path.join(__dirname, 'missing_tables.sql');
    if (fs.existsSync(missingTablesPath)) {
      const missingTables = fs.readFileSync(missingTablesPath, 'utf-8');
      const missingTablesStatements = missingTables.split(';').filter(stmt => stmt.trim());
      for (const statement of missingTablesStatements) {
        if (statement.trim()) {
          try {
            await query(statement);
          } catch (err: any) {
            if (err.code === '42703' || err.code === '42701' || err.code === '42P07' || err.code === '42710' || err.code === '23503' || err.code === '42P01') {
              console.log('[DB] Skipping missing table statement (conflict):', err.message?.substring(0, 80));
            } else {
              console.log('[DB] Error in missing table statement:', err.message);
            }
          }
        }
      }
      console.log('[DB] Missing tables migration applied');
    }

    // Read and execute game system schema
    const gameSystemPath = path.join(__dirname, 'game_system_schema.sql');
    if (fs.existsSync(gameSystemPath)) {
      const gameSystemSchema = fs.readFileSync(gameSystemPath, 'utf-8');
      const gameSystemStatements = gameSystemSchema.split(';').filter(stmt => stmt.trim());
      for (const statement of gameSystemStatements) {
        if (statement.trim()) {
          try {
            await query(statement);
          } catch (err: any) {
            if (err.code === '42703' || err.code === '42701' || err.code === '42P07' || err.code === '42710' || err.code === '23503' || err.code === '42P01') {
              console.log('[DB] Skipping game system schema statement (already exists):', err.message?.substring(0, 80));
            } else {
              console.log('[DB] Error in game system schema:', err.message);
            }
          }
        }
      }
      console.log('[DB] Game system schema applied');
    }

    // Read and execute challenges schema
    try {
      const challengesPath = path.join(__dirname, 'challenges_schema.sql');
      if (fs.existsSync(challengesPath)) {
        const challengesSchema = fs.readFileSync(challengesPath, 'utf-8');
        const challengesStatements = challengesSchema.split(';').filter(stmt => stmt.trim());
        for (const statement of challengesStatements) {
          if (statement.trim()) {
            try {
              await query(statement);
            } catch (err: any) {
              if (err.code !== '42P07' && err.code !== '42710') {
                console.log('[DB] Challenges schema warning:', err.message?.substring(0, 80));
              }
            }
          }
        }
        console.log('[DB] Challenges schema initialized');
      }
    } catch (err) {
      console.error('[DB] Failed to initialize challenges schema:', err);
    }

    // Add description column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS description TEXT`);
      console.log('[DB] Verified description column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.description:', err.message?.substring(0, 100));
    }

    // Add image_url column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`);
      console.log('[DB] Verified image_url column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.image_url:', err.message?.substring(0, 100));
    }

    // Add thumbnail column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500)`);
      console.log('[DB] Verified thumbnail column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.thumbnail:', err.message?.substring(0, 100));
    }

    // Add embed_url column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500)`);
      console.log('[DB] Verified embed_url column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.embed_url:', err.message?.substring(0, 100));
    }

    // Ensure api_keys table has all required columns
    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_name VARCHAR(255)`);
      console.log('[DB] Verified key_name column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.key_name:', err.message?.substring(0, 100));
    }

    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash VARCHAR(255) UNIQUE`);
      console.log('[DB] Verified key_hash column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.key_hash:', err.message?.substring(0, 100));
    }

    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS permissions JSONB`);
      console.log('[DB] Verified permissions column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.permissions:', err.message?.substring(0, 100));
    }

    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 100`);
      console.log('[DB] Verified rate_limit column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.rate_limit:', err.message?.substring(0, 100));
    }

    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
      console.log('[DB] Verified status column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.status:', err.message?.substring(0, 100));
    }

    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP`);
      console.log('[DB] Verified last_used_at column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.last_used_at:', err.message?.substring(0, 100));
    }

    try {
      await query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`);
      console.log('[DB] Verified expires_at column in api_keys');
    } catch (err: any) {
      console.log('[DB] Schema check for api_keys.expires_at:', err.message?.substring(0, 100));
    }

    // Add launch_url column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS launch_url VARCHAR(500)`);
      console.log('[DB] Verified launch_url column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.launch_url:', err.message?.substring(0, 100));
    }

    // Add updated_at column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('[DB] Verified updated_at column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.updated_at:', err.message?.substring(0, 100));
    }

    // Add is_branded_popup column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS is_branded_popup BOOLEAN DEFAULT FALSE`);
      console.log('[DB] Verified is_branded_popup column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.is_branded_popup:', err.message?.substring(0, 100));
    }

    // Add branding_config column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'`);
      console.log('[DB] Verified branding_config column in games');
    } catch (err: any) {
      console.log('[DB] Schema check for games.branding_config:', err.message?.substring(0, 100));
    }

    // Ensure game_compliance has required columns for crawler
    try {
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT TRUE`);
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS is_sweepstake BOOLEAN DEFAULT TRUE`);
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS is_social_casino BOOLEAN DEFAULT TRUE`);
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'SC'`);
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS max_win_amount DECIMAL(15, 2) DEFAULT 10.00`);
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS min_bet DECIMAL(15, 2) DEFAULT 0.01`);
      await query(`ALTER TABLE game_compliance ADD COLUMN IF NOT EXISTS max_bet DECIMAL(15, 2) DEFAULT 5.00`);

      console.log('[DB] Verified game_compliance table schema for crawler');

      // Enforce 10 SC max win for all games (User request: Social Casino compliance)
      await query(`UPDATE game_compliance SET max_win_amount = 10.00 WHERE max_win_amount > 10.00`);
      await query(`INSERT INTO game_compliance (game_id, max_win_amount, is_external, is_sweepstake, is_social_casino, currency)
                   SELECT id, 10.00, true, true, true, 'SC' FROM games
                   WHERE id NOT IN (SELECT game_id FROM game_compliance)
                   ON CONFLICT DO NOTHING`);
      console.log('[DB] Enforced 10 SC max win compliance for all games');
    } catch (err: any) {
      console.log('[DB] game_compliance schema update:', err.message?.substring(0, 100));
    }


    // Add bonus_sc column to store_packs table if it doesn't exist
    try {
      await query(`ALTER TABLE store_packs ADD COLUMN IF NOT EXISTS bonus_sc DECIMAL(15, 2) DEFAULT 0`);
      console.log('[DB] Verified bonus_sc column in store_packs');
    } catch (err: any) {
      console.log('[DB] Schema check for store_packs.bonus_sc:', err.message?.substring(0, 100));
    }

    // Note: store_packs table uses 'display_order' column for sorting
    // No column rename needed - column names are consistent

    // Ensure security_alerts has player_id and other expected columns
    try {
      await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS player_id INTEGER REFERENCES players(id) ON DELETE CASCADE`);
      await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'info'`);
      await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS title VARCHAR(255)`);
      await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS message TEXT`);
      await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      await query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('[DB] Verified security_alerts table schema');
    } catch (err: any) {
      console.log('[DB] security_alerts schema update:', err.message?.substring(0, 100));
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
