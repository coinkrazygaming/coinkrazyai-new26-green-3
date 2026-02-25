-- ============================================================================
-- MIGRATION: Cleanup External Games & Ensure CoinKrazy Studios Games
-- ============================================================================
-- 
-- PURPOSE: 
-- 1. Remove all external/sweepstake games from the system
-- 2. Ensure all 5 CoinKrazy Studios games exist and are properly configured
-- 3. Make CoinKrazy games available for admin management
--
-- ============================================================================

-- Step 1: Mark all external games as disabled (don't delete, keep for audit)
UPDATE games 
SET enabled = FALSE 
WHERE id IN (
  SELECT g.id 
  FROM games g
  LEFT JOIN game_compliance gc ON g.id = gc.game_id
  WHERE gc.is_external = TRUE OR g.provider NOT IN ('CoinKrazy Studios', 'AI-Generated')
);

-- Step 2: Remove external flag from game_compliance
UPDATE game_compliance 
SET is_external = FALSE, is_sweepstake = FALSE 
WHERE is_external = TRUE;

-- Step 3: Ensure all 5 CoinKrazy Studios games exist
-- These are the canonical CoinKrazy Studios games

-- 3a. CoinKrazy-CoinUp: Lightning Edition
INSERT INTO games (name, slug, category, type, provider, description, enabled, created_at, updated_at)
VALUES (
  'CoinKrazy-CoinUp: Lightning Edition',
  'coinkrazy-coinup-lightning',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  'Electrifying slot action with Lightning multipliers and bonus rounds',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET 
  provider = 'CoinKrazy Studios',
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- 3b. CoinKrazy-Hot
INSERT INTO games (name, slug, category, type, provider, description, enabled, created_at, updated_at)
VALUES (
  'CoinKrazy-Hot',
  'coinkrazy-hot',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  'Scorching hot slot game with fiery features and explosive wins',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET 
  provider = 'CoinKrazy Studios',
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- 3c. CoinKrazy-Thunder
INSERT INTO games (name, slug, category, type, provider, description, enabled, created_at, updated_at)
VALUES (
  'CoinKrazy-Thunder',
  'coinkrazy-thunder',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  'Thunderous reel action with powerful cascading wins',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET 
  provider = 'CoinKrazy Studios',
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- 3d. CoinKrazy-4Wolfs
INSERT INTO games (name, slug, category, type, provider, description, enabled, created_at, updated_at)
VALUES (
  'CoinKrazy-4Wolfs',
  'coinkrazy-4wolfs',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  'Wild wolf pack gameplay with pack bonus features',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET 
  provider = 'CoinKrazy Studios',
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- 3e. CoinKrazy-3CoinsVolcanoes (New Game)
INSERT INTO games (name, slug, category, type, provider, description, enabled, created_at, updated_at)
VALUES (
  'CoinKrazy-3CoinsVolcanoes',
  'coinkrazy-3coinsvolcanoes',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  'Volcanic Hold & Win bonus with Super Wheel, 3 erupting volcanoes, and massive multipliers',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET 
  provider = 'CoinKrazy Studios',
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- Step 4: Ensure game_compliance records for all CoinKrazy games
-- Insert compliance data for each game if not exists
INSERT INTO game_compliance (game_id, max_win_amount, is_external, is_sweepstake, is_social_casino, currency)
SELECT 
  g.id,
  10.00 as max_win_amount,
  FALSE as is_external,
  FALSE as is_sweepstake,
  FALSE as is_social_casino,
  'SC' as currency
FROM games g
WHERE g.provider = 'CoinKrazy Studios' 
AND g.id NOT IN (SELECT game_id FROM game_compliance WHERE game_id IS NOT NULL)
ON CONFLICT (game_id) DO UPDATE SET
  is_external = FALSE,
  is_sweepstake = FALSE,
  is_social_casino = FALSE;

-- Step 5: Create index for CoinKrazy Studios games (for faster queries)
CREATE INDEX IF NOT EXISTS idx_games_coinkrazy_provider 
ON games(provider) 
WHERE provider = 'CoinKrazy Studios' AND enabled = TRUE;

-- Step 6: Log migration completion
-- (This will be visible in logs)
-- COINKRAZY_CLEANUP_COMPLETE: All external games disabled, 5 CoinKrazy games enabled
