# 🎰 CoinKrazy-4EgyptPots Integration Setup

Quick start guide to integrate the Egyptian slot game into your PlayCoinKrazy.com platform.

---

## 📋 QUICK SETUP (5 minutes)

### 1. Copy Game Files
```bash
# Copy the main game file
cp public/games/coinkrazy-4egyptpots.html public/games/

# Create assets folder structure
mkdir -p public/games/assets/coinkrazy-4egyptpots/{symbols,backgrounds,ui,effects,sounds}

# Copy/generate all asset images into these folders
```

### 2. Add Global Wallet Functions

In your main app layout or wallet context (e.g., `client/App.tsx` or `client/lib/auth-context.ts`):

```typescript
import { useAuth } from '@/lib/auth-context'; // or your wallet provider

export function setupGameWalletBridge() {
  // Make wallet functions available to embedded games
  window.getPlayerSCBalance = () => {
    // Get from your auth context or localStorage
    const balance = localStorage.getItem('player_sc_balance');
    return parseFloat(balance || '0.00');
  };

  window.recordGameTransaction = async (transaction: {
    game: string;
    type: 'bet' | 'win';
    amount: number;
    color: 'red' | 'green';
    timestamp: string;
  }) => {
    try {
      // Save to wallet history via API
      await fetch('/api/wallet/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
    } catch (error) {
      console.error('Failed to record transaction:', error);
    }
  };

  window.getPlayerReferralLink = () => {
    // Get player's referral link
    return localStorage.getItem('referral_link') || 'https://playcoinkrazy.com?ref=default';
  };

  // Optional: Setup balance update listener
  window.updateGameBalance = (newBalance: number) => {
    localStorage.setItem('player_sc_balance', newBalance.toString());
  };
}

// Call this on app initialization
useEffect(() => {
  setupGameWalletBridge();
}, []);
```

### 3. Create Game Route

**File**: `client/pages/PlayGame.tsx`

```typescript
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export default function PlayGame() {
  const { gameId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Please log in to play games</p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      background: '#000'
    }}>
      <iframe
        src={`/games/${gameId}.html`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title={`Play ${gameId}`}
        allow="autoplay"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  );
}
```

**Add Route**: In `client/App.tsx`

```typescript
import PlayGame from '@/pages/PlayGame';

// Add to routes
<Route path="/play/:gameId" element={<PlayGame />} />
```

### 4. Add to Featured Games

**File**: `client/components/FeaturedGamesCarousel.tsx` (or create if doesn't exist)

```typescript
export const FEATURED_GAMES = [
  {
    id: 'coinkrazy-4egyptpots',
    title: 'CoinKrazy-4EgyptPots',
    subtitle: '4 Pots of Egypt - Hold & Win',
    image: '/games/assets/coinkrazy-4egyptpots/thumbnail.png',
    description: 'Ancient riches await! 4 glowing pots, Hold & Win bonus, and massive jackpots.',
    link: '/play/coinkrazy-4egyptpots',
    badge: '🔥 NEW',
    rtp: '96.2%',
    volatility: 'HIGH',
  },
  // ... other featured games
];
```

### 5. Add to Games Lobby

**File**: `client/pages/GamesLobby.tsx` or `client/components/SlotsCategory.tsx`

```typescript
export const SLOTS_GAMES = [
  {
    id: 'coinkrazy-4egyptpots',
    name: 'CoinKrazy-4EgyptPots',
    category: 'slots',
    thumbnail: '/games/assets/coinkrazy-4egyptpots/thumbnail.png',
    link: '/play/coinkrazy-4egyptpots',
    rtp: 96.2,
    volatility: 'High',
    paylines: 20,
    reels: '5×3',
    minBet: 0.01,
    maxBet: 5.00,
    provider: 'CoinKrazy Studios',
    new: true,
    featured: true,
    description: 'Ancient Egyptian slot with progressive pots and Hold & Win bonus'
  },
  // ... other slots
];
```

### 6. Add to Live Casino Mixed Page

**File**: `client/pages/LiveCasino.tsx`

```typescript
// In your live casino games array
const ALL_GAMES = [
  // ... existing live games
  {
    id: 'coinkrazy-4egyptpots',
    type: 'slot',
    name: 'CoinKrazy-4EgyptPots',
    thumbnail: '/games/assets/coinkrazy-4egyptpots/thumbnail.png',
    link: '/play/coinkrazy-4egyptpots',
    provider: 'CoinKrazy Studios',
    badge: '🏆 NEW',
    playersOnline: 234,
    rtp: '96.2%'
  }
];
```

---

## 🎨 ASSET GENERATION QUICK START

### Using Midjourney (Recommended)

Create a single Midjourney project and generate all assets at once:

**Main prompt structure**:
```
Create a complete slot game asset pack for "CoinKrazy-4EgyptPots" 
Egyptian theme, ancient desert with pyramids, 5×3 reel slots, 
luxury gold aesthetic, PlayCoinKrazy.com branding. 

Include:
- Golden pharaoh mask (wild symbol)
- Egyptian queen (premium symbol)
- Eye of Horus (premium symbol)
- Golden scarab (premium symbol)
- Ankh cross (premium symbol)
- Letter cards A,K,Q,J
- Golden coins
- Progress symbols (obelisk, scarab, ankh, pharaoh)
- Mystery symbol (question mark)

All symbols: 150×150 px, transparent PNG, professional game quality

Also create:
- Desert background: 1600×900 px, Egyptian landscape with pyramids
- Game thumbnail: 600×600 px, eye-catching, PlayCoinKrazy.com header, 
  "CoinKrazy-4EgyptPots" centered, "CoinKrazy Studios" footer
- Golden pots (4 variations): 80×150 px each
- Win particle effects: sprite sheet

All artwork: professional casino game quality, bright and vibrant colors,
suitable for production online casino
```

### Free Alternative: itch.io Asset Packs

Many Egyptian-themed game asset packs available:
- "Ancient Egypt Slot Game Assets"
- "Golden Pharaoh Symbols"
- "Egyptian Casino Graphics"

Or commission artist on Fiverr/Upwork for ~$200-500 for full asset pack.

---

## 🔌 WALLET INTEGRATION DETAILS

### Balance Sync (Critical)

The game needs real-time balance updates. Implement one of these:

**Option A: localStorage Sync** (Simplest)
```typescript
// In wallet update handler
localStorage.setItem('player_sc_balance', newBalance.toString());

// Game reads this on init and after wins
const balance = localStorage.getItem('player_sc_balance');
```

**Option B: API Bridge** (More robust)
```typescript
// Pass balance through query parameter
iframe.src = `/games/coinkrazy-4egyptpots.html?playerId=${userId}&token=${token}`;

// Game calls API to verify balance
fetch(`/api/player/${playerId}/balance`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Option C: PostMessage** (Best for security)
```typescript
// Parent page sends balance updates to iframe
iframe.contentWindow.postMessage({
  type: 'balanceUpdate',
  balance: 150.75
}, '*');

// Game listens
window.addEventListener('message', (e) => {
  if (e.data.type === 'balanceUpdate') {
    gameState.balance = e.data.balance;
  }
});
```

### Transaction Logging

Ensure transactions are logged for:
- Betting/spin cost
- Win payouts
- Bonus features activated
- Referral share clicks

Log to: `/api/wallet/transaction` or `/api/game-transactions`

Example transaction schema:
```typescript
{
  id: string;
  player_id: number;
  game_id: string; // "coinkrazy-4egyptpots"
  type: 'bet' | 'win' | 'bonus' | 'share';
  amount: number;
  balance_before: number;
  balance_after: number;
  metadata: {
    spin_id?: string;
    win_lines?: number;
    feature?: string;
  };
  created_at: string;
}
```

---

## 🧪 TESTING CHECKLIST

### Pre-Deployment

- [ ] Game loads without console errors
- [ ] Balance reads correctly from `getPlayerSCBalance()`
- [ ] Spin deducts bet from balance display
- [ ] Win popups show correct amounts
- [ ] Share button opens Facebook with correct referral URL
- [ ] Transactions logged to database
- [ ] Responsive on mobile (portrait/landscape)
- [ ] 60 FPS smooth gameplay
- [ ] Hard cap of 10 SC enforced
- [ ] All UI text displays correctly
- [ ] PlayCoinKrazy.com branding visible
- [ ] CoinKrazy Studios provider tag visible

### Post-Deployment

- [ ] Monitor game error logs
- [ ] Check for balance sync issues
- [ ] Verify transaction logging
- [ ] Test referral share tracking
- [ ] Monitor player retention/engagement
- [ ] Track win rate statistics

---

## 📈 ANALYTICS & MONITORING

Add game tracking to your analytics:

```typescript
// Track game metrics
trackEvent('game_started', {
  game_id: 'coinkrazy-4egyptpots',
  bet_amount: 1.00,
  player_id: user.id,
  timestamp: new Date().toISOString()
});

trackEvent('game_win', {
  game_id: 'coinkrazy-4egyptpots',
  win_amount: 5.50,
  player_id: user.id,
  feature: 'bonus' // or 'base_game'
});

trackEvent('game_share', {
  game_id: 'coinkrazy-4egyptpots',
  platform: 'facebook',
  player_id: user.id
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Day Before Launch
- [ ] All assets created and optimized
- [ ] Game HTML file copied to `/public/games/`
- [ ] Assets in `/public/games/assets/coinkrazy-4egyptpots/`
- [ ] Game route added
- [ ] Featured carousel updated
- [ ] Games lobby updated
- [ ] Wallet bridge functions set up
- [ ] All integration code reviewed

### Launch Day
- [ ] Full end-to-end test on staging
- [ ] Test on mobile (iOS and Android)
- [ ] Test in all major browsers
- [ ] Monitor error logs first hour
- [ ] Check balance sync first 10 transactions
- [ ] Verify analytics tracking
- [ ] Monitor player feedback

### Post-Launch (Week 1)
- [ ] Monitor win/loss ratios
- [ ] Track share button engagement
- [ ] Check for any bugs reported
- [ ] Optimize asset loading if needed
- [ ] Gather player feedback for future improvements

---

## 🎯 SUCCESS METRICS

Track these after launch:

| Metric | Target |
|--------|--------|
| Average Session Time | 8-12 minutes |
| Return Player Rate (DAU) | 35%+ |
| Share Button Click Rate | 5-10% |
| Average Win Rate | 96.2% (RTP) |
| Game Crash Rate | <0.1% |
| Load Time | <2 seconds |
| FPS Stability | 55+ FPS (average) |

---

## 💬 SUPPORT & TROUBLESHOOTING

### Game Won't Load
- [ ] Check `/public/games/coinkrazy-4egyptpots.html` exists
- [ ] Check browser console for CORS errors
- [ ] Ensure iframe sandbox allows scripts

### Balance Not Syncing
- [ ] Verify `getPlayerSCBalance()` is defined globally
- [ ] Check localStorage has 'player_sc_balance' key
- [ ] Test wallet API endpoint manually

### Slow Performance
- [ ] Check asset file sizes (should be <5MB total)
- [ ] Monitor canvas rendering (DevTools > Performance)
- [ ] Reduce particle effect complexity if needed
- [ ] Test on target devices

### Share Button Not Working
- [ ] Verify `getPlayerReferralLink()` returns valid URL
- [ ] Check Facebook share policy for your domain
- [ ] Test Facebook Share Dialog manually

---

## 📞 NEXT STEPS

1. **Generate Assets**: Use Midjourney prompts provided in ASSETS.md
2. **Setup Wallet Bridge**: Add window functions to your app
3. **Add Routes & Pages**: Integrate game into your navigation
4. **Test Thoroughly**: Run full QA checklist
5. **Deploy**: Push to production
6. **Monitor**: Track metrics and player feedback
7. **Iterate**: Make improvements based on data

**Estimated total setup time: 2-4 hours** (excluding asset generation)

