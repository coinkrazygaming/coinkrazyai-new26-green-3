# CoinKrazy-4EgyptPots
## Complete Asset Specifications & Integration Guide

---

## 📁 ASSET FOLDER STRUCTURE

```
public/games/assets/coinkrazy-4egyptpots/
├── symbols/
│   ├── wild.png (Golden Pharaoh Mask)
│   ├── queen.png (Golden Queen)
│   ├── horus.png (Eye of Horus)
│   ├── scarab.png (Scarab Beetle)
│   ├── ankh.png (Ankh Cross)
│   ├── a.png (Card A)
│   ├── k.png (Card K)
│   ├── q.png (Card Q)
│   ├── j.png (Card J)
│   ├── coin.png (Glowing Gold Coin)
│   ├── progress1.png (Progress Symbol A - Obelisk)
│   ├── progress2.png (Progress Symbol B - Scarab)
│   ├── progress3.png (Progress Symbol C - Ankh)
│   ├── progress4.png (Progress Symbol D - Pharaoh Head)
│   └── mystery.png (Mystery Symbol)
├── backgrounds/
│   ├── desert-bg.jpg (Ancient Egyptian desert with pyramids)
│   ├── sky.png (Golden sunset sky overlay)
│   └── sand-particles.png (Sand particle texture)
├── ui/
│   ├── pot-empty.png (Empty golden pot)
│   ├── pot-filled.png (Golden pot with liquid)
│   ├── pot-glow.png (Glowing pot effect)
│   └── logo.png (PlayCoinKrazy.com logo with hieroglyphs)
├── effects/
│   ├── coin-burst.png (Particle sheet - gold coin burst)
│   ├── light-beam.png (Golden light beam effect)
│   ├── sand-dust.png (Sand particle effect)
│   └── win-explosion.png (Win animation sprite sheet)
├── sounds/ (Optional - placeholder for future)
│   ├── spin-start.mp3
│   ├── reel-stop.mp3
│   ├── win.mp3
│   ├── bonus.mp3
│   └── jackpot.mp3
└── thumbnail.png (600×600 px game thumbnail)
```

---

## 🎨 DETAILED ASSET CREATION PROMPTS

### 1. **SYMBOLS** (150×150 px PNG, transparent background)

#### Wild Symbol - Golden Pharaoh Mask
```
Midjourney Prompt:
"Ultra-detailed golden pharaoh mask, Egyptian style, glowing with divine light, 
highly detailed gold artwork, transparent background, 3D glossy surface, 
ornate hieroglyphic patterns, professional game art style, 
dramatic lighting with golden glow, ready for game sprites"

Specifications:
- Size: 150×150 px
- Format: PNG with transparency
- Style: Luxurious gold with subtle shadows
- Glow effect: +2px outer glow with #FFD700
```

#### Premium Symbols (5× symbols - 150×150 px each)
```
Golden Queen:
"Egyptian queen with golden crown, delicate features, royal gold jewelry, 
transparent background, game sprite quality, 3D rendered, glowing golden aura"

Eye of Horus:
"Ancient Egyptian Eye of Horus symbol, mystical glowing appearance, 
gold and turquoise colors, transparent background, spiritual energy aura, 
perfect for game sprite"

Scarab Beetle:
"Golden scarab beetle, Egyptian artifact style, iridescent gold, 
detailed shell texture, precious gem-like appearance, transparent background, 
game sprite quality"

Ankh Cross:
"Golden ankh Egyptian cross symbol, ornate design, glowing mystical aura, 
precious metal appearance, transparent background, spiritual vibe"
```

#### Low Cards (A, K, Q, J - 150×150 px each)
```
"Egyptian-styled playing cards, A K Q J in gold with hieroglyphic 
background patterns, luxurious gold material, glowing edges, 
transparent background, game sprite quality"
```

#### Coin Symbol - 150×150 px
```
"Glowing golden coin with Egyptian pharaoh profile, ultra-detailed, 
3D rendered, bright golden light, sparkle effects, transparent background, 
game sprite quality, money-like appearance with value indicators"
```

#### Progress Symbols (4× unique - 150×150 px)
```
Progress 1 - Obelisk:
"Egyptian obelisk in gold, sharp point reaching up, mystical glow, 
precious artifact, transparent background"

Progress 2 - Scarab:
"Golden scarab symbol with progress bar underneath, mystical energy, 
transparent background"

Progress 3 - Ankh:
"Golden ankh with spiritual energy surrounding it, progress indicator style, 
transparent background"

Progress 4 - Pharaoh Head:
"Golden pharaoh head in profile, ornate crown, precious artifact style, 
transparent background"
```

#### Mystery Symbol - 150×150 px
```
"Shimmering purple and gold question mark artifact, Egyptian style, 
magical aura, glowing effects, mysterious appearance, transparent background, 
game sprite quality"
```

---

### 2. **BACKGROUND ASSETS**

#### Main Desert Background (1600×900 px)
```
Midjourney Prompt:
"Majestic ancient Egyptian desert landscape, pyramid complex in distance, 
golden sand dunes, perfect blue sky, palm trees, mystical atmosphere, 
photorealistic quality, cinematic lighting, divine golden hour glow, 
professional game background, 16:9 aspect ratio"

Specifications:
- Resolution: 1600×900 px
- Format: JPG (optimized for web)
- Style: Photorealistic but slightly painterly
- Lighting: Golden hour/sunset
- Elements: Pyramids, sand, sky, subtle wind effects
```

#### Sky Overlay (1600×900 px, transparent PNG)
```
Prompt: "Golden sunset sky gradient with mystical clouds, Egypt landscape, 
semi-transparent overlay, stars beginning to appear, divine light rays"

Use for: Layering over desert to add depth
```

#### Sand Particle Texture (512×512 px)
```
Prompt: "Fine sand particles, Egyptian desert sand texture, seamless tileable, 
subtle shadows, photorealistic, subtle movement potential"

Use for: Particle effects during spins and wins
```

---

### 3. **UI ASSETS**

#### Pot Containers (4× images, 80×150 px each)
```
Golden Pot Empty:
"Ancient Egyptian golden pot/jar, empty, ornate design, precious metal, 
transparent background, game UI quality"

Golden Pot Filled:
"Same ancient Egyptian pot but with liquid filling (gold), overflow effect, 
precious appearance"

Pot with Glow:
"Golden pot with mystical energy glow, particles surrounding it, 
magical completion effect"
```

#### PlayCoinKrazy Logo (400×150 px)
```
Prompt: "Elegant 'PlayCoinKrazy.com' text in sophisticated gold serif font, 
Egyptian hieroglyph decorative elements on sides, subtle glow effect, 
luxury brand appearance, transparent background"

Specifications:
- Font: Serif, elegant (like Times New Roman or Garamond)
- Color: Gold (#D4AF37)
- Style: Luxury casino branding
- Include: Subtle Egyptian hieroglyphs as border
```

---

### 4. **EFFECT ASSETS**

#### Win Particle Explosion (512×512 px sprite sheet)
```
Prompt: "10-frame animation of gold coins and sparkles exploding outward, 
Egyptian style, bright golden light burst, particle effects, 
sprite sheet format (10 frames in 1 row)"

Frame count: 10 frames
Layout: Horizontal sprite sheet
Dimensions: 512×512 total (51.2×512 per frame)
```

#### Light Beam Effect (200×600 px)
```
Prompt: "Golden light beam, Egyptian temple beam, radiant rays, 
heavenly appearance, transparent background, ready for overlay"

Use for: Special win moments
```

#### Sand Dust Animation (400×400 px sprite sheet)
```
Prompt: "Sand swirling animation, 8 frames, Egyptian desert dust effect, 
golden tinted, sprite sheet format"

Frames: 8
```

---

### 5. **THUMBNAIL IMAGE** (600×600 px)

```
Midjourney Prompt:
"Eye-catching game thumbnail for online slot game, 
600x600 square format, centered text 'CoinKrazy-4EgyptPots', 
Egyptian ancient theme with pyramids and golden desert, 
four glowing golden pots spilling gold coins and jackpot prizes, 
'PlayCoinKrazy.com' at top in elegant gold serif, 
'CoinKrazy Studios' at bottom, vibrant bright colors, 
dramatic lighting with light rays, game lobby thumbnail quality, 
professional casino game art style, must be eye-catching and bright"

Specifications:
- Size: 600×600 px
- Format: PNG or JPG
- Text: 
  • Top: "PlayCoinKrazy.com" (elegant serif)
  • Center: "CoinKrazy-4EgyptPots" (bold, large)
  • Bottom: "CoinKrazy Studios"
- Style: Bright, vibrant, eye-catching
- Elements: Pots, pyramids, gold coins, desert
```

---

## 💻 IMPLEMENTATION INSTRUCTIONS

### Step 1: Create Game Record in Database

```typescript
// In your database or admin panel, create a game entry:
{
  id: "coinkrazy-4egyptpots",
  name: "CoinKrazy-4EgyptPots",
  display_name: "4 Pots of Egypt",
  category: "slots",
  provider: "CoinKrazy Studios",
  rtp: 0.962,
  volatility: "high",
  min_bet: 0.01,
  max_bet: 5.00,
  paylines: 20,
  reels: 5,
  rows: 3,
  thumbnail_url: "/games/assets/coinkrazy-4egyptpots/thumbnail.png",
  game_url: "/games/coinkrazy-4egyptpots.html",
  description: "Ancient Egyptian treasure with 4 progressive pots and Hold & Win bonus",
  release_date: "2025-12",
  enabled: true,
  featured: true
}
```

### Step 2: Add to Featured Games Carousel

**Location**: `client/components/FeaturedGamesCarousel.tsx` (or similar)

```typescript
const featuredGames = [
  {
    id: 'coinkrazy-4egyptpots',
    title: 'CoinKrazy-4EgyptPots',
    subtitle: '4 Pots of Egypt - Hold & Win Bonus',
    image: '/games/assets/coinkrazy-4egyptpots/thumbnail.png',
    href: '/play/coinkrazy-4egyptpots',
    badge: '🔥 NEW',
    description: 'Ancient riches await! 4 mystical pots, jackpot features, and thrilling Hold & Win bonus.'
  },
  // ... other games
];
```

### Step 3: Create Game Route/Page

**Create**: `client/pages/PlayGame.tsx`

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';

export default function PlayGame() {
  const { gameId } = useParams();
  
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe 
        src={`/games/${gameId}.html`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`Play ${gameId}`}
      />
    </div>
  );
}
```

**Add Route**: In `client/App.tsx`

```typescript
<Route path="/play/:gameId" element={<PlayGame />} />
```

### Step 4: Integrate Wallet Functions

The game expects these global functions to be available. Add to your main app HTML or wallet context:

```javascript
// In your wallet/balance management system
window.getPlayerSCBalance = function() {
  // Return current player SC balance from your wallet system
  return parseFloat(localStorage.getItem('player_sc_balance') || '10.00');
};

window.recordGameTransaction = function(transaction) {
  // Record transaction in wallet history
  // transaction = { game, type, amount, color, timestamp }
  console.log('Game transaction:', transaction);
  // Make API call to save transaction
  fetch('/api/wallet/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
};

window.getPlayerReferralLink = function() {
  // Return player's referral link for share functionality
  return localStorage.getItem('referral_link') || 'https://playcoinkrazy.com?ref=player123';
};
```

### Step 5: Add to Games Lobby

**Location**: `client/pages/GamesLobby.tsx` or `client/components/SlotsCategory.tsx`

```typescript
const slotsGames = [
  {
    id: 'coinkrazy-4egyptpots',
    name: '4 Pots of Egypt',
    icon: '/games/assets/coinkrazy-4egyptpots/thumbnail.png',
    rtp: '96.2%',
    volatility: 'High',
    link: '/play/coinkrazy-4egyptpots',
    new: true,
    featured: true
  },
  // ... other slots
];
```

### Step 6: Add to Live Casino Page (Mixed)

```typescript
// In your casino/live games section
const casinoGames = [
  // ... existing live games
  {
    id: 'coinkrazy-4egyptpots',
    category: 'slots',
    name: 'CoinKrazy-4EgyptPots',
    thumbnail: '/games/assets/coinkrazy-4egyptpots/thumbnail.png',
    link: '/play/coinkrazy-4egyptpots',
    badge: '🏆 NEW',
    playersOnline: Math.floor(Math.random() * 500) + 100
  }
];
```

### Step 7: Add Metadata for SEO

```html
<!-- Add to head of your main page for SEO -->
<meta property="og:title" content="Play CoinKrazy-4EgyptPots on PlayCoinKrazy.com">
<meta property="og:description" content="Ancient Egyptian slot game with 4 mystical pots, Hold & Win bonus, and massive jackpots!">
<meta property="og:image" content="/games/assets/coinkrazy-4egyptpots/thumbnail.png">
<meta property="og:type" content="website">
```

---

## 🔗 WALLET INTEGRATION REFERENCE

The game communicates with your wallet system via these window functions:

### `getPlayerSCBalance()` - Read Balance
```javascript
// Returns: number (current SC balance)
// Called: Game initialization + after win
const balance = window.getPlayerSCBalance();
```

### `recordGameTransaction(data)` - Record Bet/Win
```javascript
// Parameters: {
//   game: "CoinKrazy-4EgyptPots",
//   type: "bet" | "win",
//   amount: number,
//   color: "red" | "green",
//   timestamp: ISO string
// }
window.recordGameTransaction({
  game: 'CoinKrazy-4EgyptPots',
  type: 'bet',
  amount: -1.00,
  color: 'red',
  timestamp: new Date().toISOString()
});
```

### `getPlayerReferralLink()` - Share Feature
```javascript
// Returns: string (player's referral URL)
const refLink = window.getPlayerReferralLink();
// Used in share dialog: "Come play with my link: [refLink]"
```

---

## 📊 GAME STATISTICS

**Game ID**: `coinkrazy-4egyptpots`  
**Display Name**: 4 Pots of Egypt  
**Provider**: CoinKrazy Studios  
**RTP**: 96.2%  
**Volatility**: High  
**Paylines**: 20 fixed  
**Reels**: 5×3  
**Min Bet**: 0.01 SC  
**Max Bet**: 5.00 SC  
**Max Win Per Spin**: 10 SC (hard cap)  
**Release Date**: December 2025  

---

## 🎯 PROMOTION COPY

**Short Description** (140 chars):
"Win ancient treasures! 4 mystical pots, Hold & Win bonus, and massive Egyptian jackpots await!"

**Long Description** (500+ chars):
"Discover the riches of ancient Egypt in CoinKrazy-4EgyptPots! This thrilling 5×3 slot features 4 glowing golden pots that fill as you play. Trigger the Hold & Win bonus with coins or progress symbols, and unlock four incredible pot features: Boost, Collect, Multi, and Jackpot. Mystery symbols transform into random features, building tension with every spin. With 20 paylines, premium Egyptian symbols, and a 5,000× Royal Jackpot, fortune favors the bold. Play now on PlayCoinKrazy.com!"

---

## ✅ TESTING CHECKLIST

- [ ] Game loads without errors in browser console
- [ ] Balance displays correctly from `getPlayerSCBalance()`
- [ ] Bet buttons work (0.01 - 5.00)
- [ ] Spin button deducts bet from balance
- [ ] Reels spin and stop properly
- [ ] Win amounts calculated correctly
- [ ] Win popup displays with correct amount
- [ ] "Claim & Continue" closes popup and continues game
- [ ] "Share on Social" opens Facebook share dialog
- [ ] Transactions recorded via `recordGameTransaction()`
- [ ] Hard cap of 10 SC enforced
- [ ] Pot meters fill and activate features
- [ ] Responsive on mobile (portrait and landscape)
- [ ] Smooth 60 FPS gameplay
- [ ] No lag or animation stuttering
- [ ] All branding displays (PlayCoinKrazy.com, CoinKrazy Studios)

---

## 🚀 DEPLOYMENT

1. Place HTML file in `public/games/coinkrazy-4egyptpots.html`
2. Create asset folder: `public/games/assets/coinkrazy-4egyptpots/`
3. Add all PNG/JPG assets to respective subfolders
4. Add game route to app
5. Add to games database
6. Add to featured carousel, lobby, and casino pages
7. Test thoroughly with real SC balance
8. Deploy and monitor for errors

**Done! Game is ready for production.**

