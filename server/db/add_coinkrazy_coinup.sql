-- Add CoinKrazy-CoinUp game if it doesn't exist
INSERT INTO games (
  name,
  slug,
  category,
  type,
  provider,
  rtp,
  volatility,
  description,
  image_url,
  thumbnail,
  embed_url,
  launch_url,
  enabled,
  is_branded_popup,
  created_at,
  updated_at
) VALUES (
  'CoinKrazy-CoinUp: Lightning Edition',
  'coinkrazy-coinup-lightning',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  96.5,
  'High',
  'Lightning fast slots action with CoinUp bonus rounds. Strike it rich with the CoinKrazy-CoinUp: Lightning Edition!',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=150&fit=crop',
  '/coin-krazy-coin-up',
  '/coin-krazy-coin-up',
  TRUE,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO UPDATE SET
  updated_at = CURRENT_TIMESTAMP;

-- Delete all old imported games (keeping only CoinKrazy-CoinUp and internal games)
DELETE FROM games 
WHERE provider NOT IN ('CoinKrazy Studios') 
  AND slug NOT LIKE 'coinkrazy-%'
  AND enabled = TRUE
  AND provider IS NOT NULL
  AND provider NOT IN ('Internal', '');
