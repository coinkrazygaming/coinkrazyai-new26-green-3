-- Add CoinKrazy-4Wolfs game if it doesn't exist
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
  'CoinKrazy-4Wolfs',
  'coinkrazy-4wolfs-wild',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  96.5,
  'High',
  'Hunt for riches with CoinKrazy-4Wolfs! Pack your paylines with wild beasts and unleash massive winning combinations!',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=150&fit=crop',
  '/coin-krazy-4wolfs',
  '/coin-krazy-4wolfs',
  TRUE,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO UPDATE SET
  enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP;
