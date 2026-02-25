-- Initial migrations to ensure all columns exist
-- These are also handled in init.ts code, but good to have here for idempotency

ALTER TABLE games ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE games ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500);
ALTER TABLE games ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500);
ALTER TABLE store_packs ADD COLUMN IF NOT EXISTS bonus_sc DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '';

-- Add any new tables or adjustments below
CREATE TABLE IF NOT EXISTS challenge_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES challenge_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(100) NOT NULL,
    requirement_value DECIMAL(15, 2) NOT NULL,
    reward_sc DECIMAL(15, 2) DEFAULT 0,
    reward_gc DECIMAL(15, 2) DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    is_daily BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_challenges (
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    current_progress DECIMAL(15, 2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, challenge_id)
);

-- Remove all external games - keep only CoinKrazy Studios games
DELETE FROM slots_results WHERE game_id NOT IN (SELECT id FROM games WHERE provider = 'CoinKrazy Studios');
DELETE FROM spin_results WHERE game_id NOT IN (SELECT id FROM games WHERE provider = 'CoinKrazy Studios');
DELETE FROM game_compliance WHERE game_id NOT IN (SELECT id FROM games WHERE provider = 'CoinKrazy Studios');
DELETE FROM game_config WHERE game_id NOT IN (SELECT id FROM games WHERE provider = 'CoinKrazy Studios');
DELETE FROM games WHERE provider != 'CoinKrazy Studios' OR provider IS NULL;
