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

-- ===== AI GAME BUILDER TABLES =====
CREATE TABLE IF NOT EXISTS ai_game_builder_projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'in_progress',
    created_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_game_versions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES ai_game_builder_projects(id) ON DELETE CASCADE,
    version_number INTEGER DEFAULT 1,
    game_data JSONB,
    step_completed VARCHAR(100),
    preview_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ADMIN NOTIFICATIONS QUEUE =====
CREATE TABLE IF NOT EXISTS admin_notifications_queue (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    related_game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
    related_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    related_document_id INTEGER,
    related_withdrawal_id INTEGER,
    ai_employee_name VARCHAR(100),
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications_queue(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications_queue(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications_queue(created_at DESC);

-- ===== AI TASKS TRACKING =====
CREATE TABLE IF NOT EXISTS ai_tasks (
    id SERIAL PRIMARY KEY,
    ai_employee_name VARCHAR(100),
    task_type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_ai_employee ON ai_tasks(ai_employee_name);

-- ===== SOCIAL CAMPAIGNS =====
CREATE TABLE IF NOT EXISTS social_campaigns (
    id SERIAL PRIMARY KEY,
    campaign_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    content JSONB,
    targeting_options JSONB,
    status VARCHAR(50) DEFAULT 'pending_approval',
    created_by INTEGER REFERENCES admin_users(id),
    ai_generated BOOLEAN DEFAULT TRUE,
    scheduled_for TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_type ON social_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_status ON social_campaigns(status);
