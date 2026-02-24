-- ===== GAME SYSTEM EXTENSIONS =====
-- Extend games table to support custom game configurations

-- Add game_config column to store game-specific settings (JSON)
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_config JSONB DEFAULT '{
  "type": "slots",
  "engine": "coin-up",
  "features": [],
  "rules": {},
  "assets": {}
}'::jsonb;

-- Create game_templates table for reusable game templates
CREATE TABLE IF NOT EXISTS game_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  game_type VARCHAR(50) NOT NULL, -- 'slots', 'cards', 'dice', 'coin-up', 'bingo', 'poker', 'sports', 'roulette', 'keno'
  base_engine VARCHAR(100), -- reference to base engine (coin-up-engine, card-engine, etc.)
  category VARCHAR(100),
  min_bet DECIMAL(15, 2) DEFAULT 0.01,
  max_bet DECIMAL(15, 2) DEFAULT 5.00,
  default_rtp DECIMAL(5, 2) DEFAULT 96.5,
  config JSONB DEFAULT '{}'::jsonb, -- template configuration
  asset_schema JSONB DEFAULT '{}'::jsonb, -- expected assets structure
  enabled BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(100), -- admin or AI employee who created it
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_assets table for storing game visual/audio assets
CREATE TABLE IF NOT EXISTS game_assets (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  asset_type VARCHAR(100), -- 'reel', 'symbol', 'animation', 'background', 'audio', 'thumbnail', 'hero_image'
  asset_name VARCHAR(255),
  asset_url VARCHAR(500),
  asset_data JSONB, -- metadata about the asset
  width INTEGER,
  height INTEGER,
  file_type VARCHAR(50), -- 'image/png', 'image/webp', 'audio/mp3', etc.
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_mechanics table for defining game rules and behavior
CREATE TABLE IF NOT EXISTS game_mechanics (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  mechanic_name VARCHAR(255), -- 'multiplier', 'bonus_round', 'free_spins', 'scatter', 'wild'
  description TEXT,
  config JSONB, -- mechanic-specific configuration
  probability DECIMAL(5, 2), -- 0-100 percentage chance
  reward_config JSONB, -- how this mechanic rewards players
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_results table to track game play results
CREATE TABLE IF NOT EXISTS game_results (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  bet_amount DECIMAL(15, 2),
  win_amount DECIMAL(15, 2),
  multiplier DECIMAL(5, 2) DEFAULT 1,
  result_data JSONB, -- full game state/result
  status VARCHAR(50), -- 'win', 'loss', 'push'
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_versions table to track game updates and versions
CREATE TABLE IF NOT EXISTS game_versions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  version_number VARCHAR(50),
  changes TEXT,
  release_notes TEXT,
  config JSONB, -- config snapshot for this version
  rtp DECIMAL(5, 2),
  enabled BOOLEAN DEFAULT FALSE,
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_generated_games table to track AI-generated games
CREATE TABLE IF NOT EXISTS ai_generated_games (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  ai_employee_id VARCHAR(100) REFERENCES ai_employees(id),
  template_id INTEGER REFERENCES game_templates(id),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_review', 'approved', 'rejected', 'published'
  generation_config JSONB, -- parameters used for generation
  ai_notes TEXT,
  admin_notes TEXT,
  approved_by VARCHAR(100), -- admin user email
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_analytics table for tracking game performance
CREATE TABLE IF NOT EXISTS game_analytics (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  date DATE,
  total_plays INTEGER DEFAULT 0,
  total_wagered DECIMAL(15, 2) DEFAULT 0,
  total_wins DECIMAL(15, 2) DEFAULT 0,
  avg_win_per_play DECIMAL(15, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  player_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_template_id ON games(game_config->>'template_id');
CREATE INDEX IF NOT EXISTS idx_game_assets_game_id ON game_assets(game_id);
CREATE INDEX IF NOT EXISTS idx_game_mechanics_game_id ON game_mechanics(game_id);
CREATE INDEX IF NOT EXISTS idx_game_results_player_id ON game_results(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_games_status ON ai_generated_games(status);
CREATE INDEX IF NOT EXISTS idx_game_analytics_date ON game_analytics(date);
