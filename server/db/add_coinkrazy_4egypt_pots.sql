-- Add CoinKrazy-4EgyptPots game if it doesn't exist
INSERT INTO games (
  name,
  category,
  provider,
  rtp,
  volatility,
  description,
  image_url,
  thumbnail,
  enabled,
  slug,
  type
) VALUES (
  'CoinKrazy-4EgyptPots',
  'Slots',
  'CoinKrazy Studios',
  96.3,
  'Medium-High',
  'Discover the treasures of ancient Egypt! Spin the 5×3 reels and unlock four mystical pot features. With Hold & Win bonus, progressive pot meters, and massive multipliers, your fortune awaits in the land of the pharaohs!',
  '/games/coinkrazy-4egypt-pots.html',
  '/games/coinkrazy-4egypt-pots-thumbnail.png',
  true,
  'coinkrazy-4egypt-pots',
  'slots'
)
ON CONFLICT (name) DO NOTHING;

-- Optional: Add game metadata if you have a game_metadata table
INSERT INTO game_metadata (
  game_id,
  theme,
  feature,
  feature_description,
  available
) 
SELECT id, 'Egyptian', 'Hold & Win Bonus', 'Collect 6+ bonus coins to trigger 3 respins with sticky symbols', true
FROM games WHERE name = 'CoinKrazy-4EgyptPots'
ON CONFLICT DO NOTHING;

INSERT INTO game_metadata (
  game_id,
  theme,
  feature,
  feature_description,
  available
)
SELECT id, 'Egyptian', 'Pot Features', 'Fill pot meters to unlock Boost, Collect, Multi, and Jackpot features', true
FROM games WHERE name = 'CoinKrazy-4EgyptPots'
ON CONFLICT DO NOTHING;
