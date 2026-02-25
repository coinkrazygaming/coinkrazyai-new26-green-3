# CoinKrazy-3CoinsVolcanoes
## Asset Generation & Integration Guide

---

## 🎨 AI IMAGE GENERATION PROMPTS

Use these prompts with **Midjourney, Grok Imagine, or DALL-E 3** to generate professional assets.

### 1. MAIN GAME THUMBNAIL (Featured Games Hero)
**Resolution**: 400×300 PNG + Animated GIF version  
**Use Case**: Featured Games carousel, hero section, game lobby

```
Ultra high-contrast volcanic night scene with 3 massive erupting volcanoes 
(left: glowing red lava, center: brilliant gold coin burst, right: emerald green glow) 
in background. Foreground shows HUGE glowing gold coin exploding with fire and lava. 
Text "CoinKrazy-3CoinsVolcanoes" in bold fiery gold/orange gradient font with glow effect, 
top center. Bottom right: "PlayCoinKrazy.com" logo in sleek white/gold, 
"CoinKrazy Studios" badge. Deep purple volcanic sky, neon glow effects, 
fire particles and embers floating. 8K, cinematic lighting, high contrast, 
professional casino game art style. --ar 4:3 --v 6 --q 2
```

### 2. SQUARE MOBILE ICON (200×200)
**Use Case**: Mobile app launcher, mobile lobby thumbnail

```
Centered explosive gold coin surrounded by 3 mini volcanoes in circular composition. 
Vibrant neon glow, deep purple background, fierce red lava flows, "CoinKrazy" text 
in tiny gold arc above. High contrast, bold, minimalist yet detailed. 
Square format, perfect for 200x200px icon. --ar 1:1 --v 6 --q 2
```

### 3. VOLCANO ASSET PACK (High-Res Sprites)
**Resolution**: 512×512 PNG per volcano (transparent background)  
**Variants**: Red, Green, Blue with eruption effects

```
Single majestic volcano mountain at night, erupting with massive lava and fire. 
For red variant: Bright crimson lava flow, orange flames, scarlet glow. 
For green variant: Emerald lava, lime green glow, neon accents. 
For blue variant: Electric blue lava, cyan glow, plasma effects. 
All: rocky volcanic slopes with molten texture, particle effects around peak, 
dramatic lighting, 3D rendered style. Transparent background. 512x512. 
Fantasy game art quality. --niji 6 --v 6
```

### 4. GOLD COIN SYMBOLS (Reel Assets)
**Resolution**: 256×256 PNG per symbol (transparent)

```
Gleaming magical golden coin rotating at 45-degree angle. 
Ornate circular patterns on face, ancient symbols, glowing golden aura around edges. 
Rich yellow (#FFD700) to orange (#FFA500) gradient. Bright highlight spots creating 
shine effect. Small fire/spark particles around coin suggesting power/value. 
3D rendered, casino-quality artwork, transparent background. 256x256. --v 6 --q 2
```

### 5. RED/CRIMSON COIN (Alternative Coin Symbol)
**Resolution**: 256×256 PNG (transparent)

```
Precious red gemstone coin with deep ruby color (#CC0000 to #FF4444). 
Faceted diamond-like surface reflecting light. Ornate gold trim around edges. 
Glowing crimson aura. Slightly smaller than gold coin to indicate lower value. 
Casino slot game quality, 3D rendered, transparent background. 256x256. --v 6
```

### 6. BONUS CROWN SYMBOL
**Resolution**: 256×256 PNG (transparent)

```
Royal crown symbol with 5 glowing jewels (red, blue, green, gold, purple). 
Solid gold base with intricate crown details. Brilliant shine and glow. 
Radiating light beams from center. Mystical magical effect. 
3D rendered, transparent background, 256x256px. Casino game asset quality. --v 6
```

### 7. MYSTERY ORB SYMBOL
**Resolution**: 256×256 PNG (transparent)

```
Swirling magical mystery orb with ethereal smoke/mist inside. 
Starlight sparkles, pastel rainbow colors swirling (purple, blue, pink, white). 
Glowing surface with animated-style energy. Circular aura around sphere. 
Mysterious and inviting look. 3D rendered, transparent, 256x256. --v 6
```

### 8. COLLECT/GIFT SYMBOL
**Resolution**: 256×256 PNG (transparent)

```
Ornate golden treasure chest overflowing with coins and gems. 
Chest lid open with light radiating from inside. Gold coins spilling out. 
Red ribbon bow on top. Glowing magical effect. Rich golden yellows. 
Casino game asset, 3D rendered, transparent background, 256x256. --v 6
```

### 9. SUPER WHEEL GRAPHIC
**Resolution**: 512×512 PNG (transparent)

```
Ornate spinning fortune wheel divided into 8 segments in alternating gold (#FFD700) 
and orange (#FFA500). Each segment contains: small mystical symbols (volcano, coin, 
lightning, gem, fire, shield). Ornate center hub with jewels and gold details. 
Fiery glow around entire wheel. Rope/chain attachment at top. Ornamental border. 
Casino game quality, transparent background, 512x512. --v 6 --q 2
```

### 10. LAVA/LAVA FLOW BACKGROUND TEXTURE
**Resolution**: 1024×1024 PNG (seamless/tileable)

```
Molten lava texture with swirling dark red and bright orange patterns. 
Glossy wet surface appearance with highlights suggesting heat. 
Subtle flow patterns and cracks. Volcanic rock texture mixed with glowing magma. 
Seamless tileable pattern. Dark overall tone for background use. 
High detail, photorealistic quality. --v 6
```

### 11. HEADER BANNER/LOGO BACKGROUND
**Resolution**: 600×150 PNG

```
Sleek dark purple to black gradient background with volcanic elements. 
Subtle diagonal lava flow lines in orange/red glowing neon. 
3 small volcano silhouettes at bottom. Gold dust/particle effect. 
Text-ready clean design. Premium casino aesthetic. 600x150. --v 6
```

---

## 🎮 INTEGRATION CODE

### Game Registry JSON (Add to your games database/config)

```json
{
  "id": "coinkrazy-3coinsvolcanoes",
  "name": "CoinKrazy-3CoinsVolcanoes",
  "provider": "CoinKrazy Studios",
  "status": "active",
  "category": ["slots", "reels", "featured", "volcanic"],
  "thumbnail": "/assets/games/thumbnails/coinkrazy-3coinsvolcanoes.jpg",
  "thumbnail_mobile": "/assets/games/thumbnails/coinkrazy-3coinsvolcanoes-mobile.jpg",
  "banner": "/assets/games/banners/coinkrazy-3coinsvolcanoes-banner.jpg",
  "icon": "/assets/games/icons/coinkrazy-3coinsvolcanoes-icon.png",
  "url": "/games/coinkrazy-3coinsvolcanoes",
  "iframe_url": "/games/coinkrazy-3coinsvolcanoes/embed",
  "rtp": "96.2",
  "volatility": "high",
  "minBet": 0.01,
  "maxBet": 5.00,
  "description": "Experience volcanic chaos with the Hold & Win bonus! 3 erupting volcanoes, Super Wheel, and massive multipliers. Trigger bonus symbols to unlock LIFE, MULTI, and GROW features for epic wins!",
  "features": [
    "Hold & Win Bonus",
    "Super Wheel Feature",
    "Volcano Multipliers (up to 6x)",
    "GROW Feature (Grid Expansion)",
    "Free Respins",
    "Mobile Optimized"
  ],
  "releaseDate": "2025-02-25",
  "tags": ["hot", "new", "volcanic", "bonus", "multipliers", "social-share"]
}
```

### Featured Games Carousel Component (React/Vue)

```javascript
// React example - add game to featured carousel
const featuredGames = [
  {
    id: "coinkrazy-3coinsvolcanoes",
    name: "CoinKrazy-3CoinsVolcanoes",
    thumbnail: "/assets/games/thumbnails/coinkrazy-3coinsvolcanoes.jpg",
    category: "slots",
    badge: "HOT",
    url: "/games/coinkrazy-3coinsvolcanoes"
  },
  // ... other games
];

export function FeaturedGamesCarousel() {
  return (
    <div className="carousel">
      {featuredGames.map(game => (
        <div key={game.id} className="carousel-item">
          <img src={game.thumbnail} alt={game.name} />
          <span className="badge">{game.badge}</span>
          <h3>{game.name}</h3>
          <Link to={game.url}>Play Now</Link>
        </div>
      ))}
    </div>
  );
}
```

### Games Lobby Page Integration

```javascript
// Add to your games categorization system
const gameCategories = {
  slots: [
    {
      id: "coinkrazy-3coinsvolcanoes",
      name: "CoinKrazy-3CoinsVolcanoes",
      provider: "CoinKrazy Studios",
      thumbnail: "/assets/games/thumbnails/coinkrazy-3coinsvolcanoes.jpg",
      category: "slots",
      featured: true,
      hot: true
    }
    // ... more slots
  ],
  reels: [
    // Include here too
  ]
};

export function SlotsLobby() {
  const slotGames = gameCategories.slots;
  
  return (
    <div className="games-grid">
      {slotGames.map(game => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
```

### Dedicated Game Page (Next.js/React Router)

```javascript
// pages/games/coinkrazy-3coinsvolcanoes.jsx or routes/GamePage.tsx
import React, { useEffect } from 'react';

export default function CoinKrazyGame() {
  return (
    <div className="game-page">
      <div className="game-header">
        <h1>CoinKrazy-3CoinsVolcanoes</h1>
        <p>By CoinKrazy Studios</p>
        <div className="game-info">
          <span>RTP: 96.2%</span>
          <span>Volatility: High</span>
          <span>Bet Range: 0.01 - 5.00 SC</span>
        </div>
      </div>
      
      <div className="game-container">
        <iframe 
          src="/assets/games/coinkrazy-3coinsvolcanoes.html"
          title="CoinKrazy-3CoinsVolcanoes"
          width="100%"
          height="900"
          frameBorder="0"
          allowFullScreen
        />
      </div>

      <div className="game-details">
        <h2>Game Features</h2>
        <ul>
          <li>Hold & Win Bonus with 4x3 Grid</li>
          <li>Super Wheel Spins with Multiplier Awards</li>
          <li>3 Erupting Volcanoes with Special Effects</li>
          <li>LIFE Feature - Extra Respins</li>
          <li>MULTI Feature - Multiplier Stacking (up to 6x)</li>
          <li>GROW Feature - Grid Expansion</li>
          <li>Up to 10x Maximum Win Cap</li>
          <li>Mobile Responsive Design</li>
        </ul>
      </div>

      <div className="game-rules">
        <h2>How to Play</h2>
        <ol>
          <li>Select 1, 2, or 3 active paylines</li>
          <li>Choose your bet amount (0.01 - 5.00 SC)</li>
          <li>Click SPIN to play</li>
          <li>Land 4 bonus symbols to trigger Hold & Win bonus</li>
          <li>Spin the Super Wheel for extra features</li>
          <li>Collect and multiply with volcano features</li>
          <li>Claim your win!</li>
        </ol>
      </div>
    </div>
  );
}
```

### Live Casino Page Integration

```javascript
// Add to Live Casino page as "Featured Game"
// Note: This is a slots game but can be featured in Live Casino promotions

export function LiveCasinoPage() {
  const featuredGame = {
    id: "coinkrazy-3coinsvolcanoes",
    name: "CoinKrazy-3CoinsVolcanoes",
    category: "Featured Slot Game",
    description: "Volcanic Hold & Win action with stunning effects",
    thumbnail: "/assets/games/thumbnails/coinkrazy-3coinsvolcanoes.jpg",
    url: "/games/coinkrazy-3coinsvolcanoes"
  };

  return (
    <div className="live-casino-page">
      {/* Existing live casino content */}
      
      <section className="featured-games">
        <h2>Also Try Our Featured Games</h2>
        <GameCard game={featuredGame} />
      </section>
    </div>
  );
}
```

### Wallet API Hook (React)

```javascript
// hooks/useWalletAPI.ts
export function useWalletAPI() {
  const getBalance = async () => {
    if (typeof window.getCurrentSCBalance === 'function') {
      return await window.getCurrentSCBalance();
    }
    throw new Error('Wallet API not available');
  };

  const deduct = async (amount, gameId = 'CoinKrazy-3CoinsVolcanoes') => {
    if (typeof window.deductFromWallet === 'function') {
      return await window.deductFromWallet(amount, gameId);
    }
    throw new Error('Wallet API not available');
  };

  const add = async (amount, gameId = 'CoinKrazy-3CoinsVolcanoes') => {
    if (typeof window.addToWallet === 'function') {
      return await window.addToWallet(amount, gameId);
    }
    throw new Error('Wallet API not available');
  };

  const logTransaction = async (type, amount, gameId = 'CoinKrazy-3CoinsVolcanoes') => {
    if (typeof window.logTransaction === 'function') {
      return await window.logTransaction(type, amount, gameId);
    }
  };

  const getPlayerId = () => {
    if (typeof window.getPlayerId === 'function') {
      return window.getPlayerId();
    }
    return 'unknown';
  };

  return { getBalance, deduct, add, logTransaction, getPlayerId };
}
```

### HTML Embed Code (for external websites)

```html
<!-- Simple iframe embed for any website -->
<div style="max-width: 600px; margin: 0 auto;">
  <iframe 
    src="https://playcoincrazy.com/games/coinkrazy-3coinsvolcanoes/embed"
    title="CoinKrazy-3CoinsVolcanoes"
    width="100%"
    height="900"
    frameborder="0"
    allowfullscreen
    style="border: 3px solid #FFD700; border-radius: 15px;"
  ></iframe>
</div>
```

---

## 📂 FILE STRUCTURE SETUP

```
your-playcoincrazy-project/
├── public/
│   └── assets/
│       ├── games/
│       │   ├── coinkrazy-3coinsvolcanoes/
│       │   │   └── coinkrazy-3coinsvolcanoes.html  (Main game file)
│       │   ├── thumbnails/
│       │   │   ├── coinkrazy-3coinsvolcanoes.jpg      (400x300)
│       │   │   ├── coinkrazy-3coinsvolcanoes.gif      (Animated)
│       │   │   └── coinkrazy-3coinsvolcanoes-mobile.jpg (200x200)
│       │   ├── banners/
│       │   │   └── coinkrazy-3coinsvolcanoes-banner.jpg
│       │   ├── icons/
│       │   │   └── coinkrazy-3coinsvolcanoes-icon.png
│       │   └── symbols/
│       │       ├── gold-coin.png
│       │       ├── red-coin.png
│       │       ├── bonus-crown.png
│       │       ├── mystery-orb.png
│       │       ├── collect-gift.png
│       │       ├── volcano-red.png
│       │       ├── volcano-green.png
│       │       ├── volcano-blue.png
│       │       └── wheel.png
├── src/
│   ├── pages/
│   │   └── games/
│   │       └── coinkrazy-3coinsvolcanoes.tsx (or .jsx)
│   ├── components/
│   │   └── games/
│   │       └── FeaturedGamesCarousel.tsx
│   ├── config/
│   │   └── games.json (Game registry)
│   └── hooks/
│       └── useWalletAPI.ts
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Download all AI-generated assets using prompts above
- [ ] Place game HTML file in `/public/assets/games/coinkrazy-3coinsvolcanoes/`
- [ ] Place all image assets in appropriate subdirectories
- [ ] Add game to game registry JSON
- [ ] Create dedicated game page component
- [ ] Add game to Featured Games carousel
- [ ] Add game to Slots category in Games Lobby
- [ ] Add game to Live Casino page (Featured section)
- [ ] Test wallet integration (deduct, add, log transactions)
- [ ] Test all features: Bonus trigger, Super Wheel, volcano effects
- [ ] Test responsive design on mobile (300-600px width)
- [ ] Test sound toggle functionality
- [ ] Test win popup and social share buttons
- [ ] Test hard cap enforcement (max 10.00 SC per spin)
- [ ] Deploy to staging and test end-to-end
- [ ] Deploy to production

---

## 💰 WALLET API REQUIREMENTS

Your wallet system must implement these functions (globally accessible):

```javascript
// Balance retrieval
window.getCurrentSCBalance() // Returns: Promise<number>

// Wallet operations
window.deductFromWallet(amount, gameId) // Returns: Promise<boolean>
window.addToWallet(amount, gameId)      // Returns: Promise<boolean>

// Transaction logging
window.logTransaction(type, amount, gameId)  // type: 'spin' | 'win'

// Player info
window.getPlayerId() // Returns: string (for referral links)
```

---

## 📊 GAME SPECIFICATIONS SUMMARY

| Property | Value |
|----------|-------|
| **Game Type** | 4×3 Hold & Win Slot |
| **Provider** | CoinKrazy Studios |
| **RTP** | 96.2% |
| **Volatility** | High |
| **Min Bet** | 0.01 SC |
| **Max Bet** | 5.00 SC |
| **Max Win** | 10.00 SC (hard-capped) |
| **Paylines** | 1, 2, or 3 (selectable) |
| **Bonus Trigger** | 4 Bonus symbols on active payline |
| **Initial Respins** | 3 |
| **Max Multiplier** | 6x |
| **Features** | LIFE, MULTI, GROW, Super Wheel |
| **Wheel Segments** | 8 |
| **Mobile Support** | Full responsive design |

---

## 🎯 QUICK START

1. **Generate Assets**: Use the prompts above with Midjourney or Grok Imagine
2. **Deploy HTML**: Place `coinkrazy-3coinsvolcanoes.html` in your public folder
3. **Add to Registry**: Add the JSON game object to your games database
4. **Create Pages**: Use integration code to add to all required pages
5. **Test Wallet**: Ensure wallet API functions are working
6. **Launch**: Deploy and monitor gameplay metrics

---

## 📞 SUPPORT & CUSTOMIZATION

The game code is fully commented and organized into logical sections:
- Game State & Config
- Wallet API Integration
- UI Initialization
- Event Listeners
- Reel Mechanics
- Main Spin Logic
- Hold & Win Bonus
- Super Wheel
- Win Calculation & Popups
- Error Handling
- Balance Display
- Sound Effects

Modify bet options, RTP settings, or feature values in the `gameConfig` object as needed.
