-- Add CoinKrazy-Hot game if it doesn't exist
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
  'CoinKrazy-Hot',
  'coinkrazy-hot-inferno',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  96.8,
  'High',
  'Blaze through reels with CoinKrazy-Hot! Inferno-themed slots with massive multipliers and epic bonus features!',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=150&fit=crop',
  '/coin-krazy-hot',
  '/coin-krazy-hot',
  TRUE,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO UPDATE SET
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;
