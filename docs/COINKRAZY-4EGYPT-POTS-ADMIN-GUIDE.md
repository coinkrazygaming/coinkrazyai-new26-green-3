# CoinKrazy-4EgyptPots - Admin Integration Guide

## Game Overview

- **Internal Name**: CoinKrazy-4EgyptPots
- **Display Name**: CoinKrazy-4EgyptPots
- **Provider**: CoinKrazy Studios
- **Type**: Slots
- **RTP**: 96.3%
- **Volatility**: Medium-High
- **Paylines**: 20 Fixed
- **Features**: Hold & Win Bonus, 4 Pot Meters, Progressive Multipliers

## Site-Wide Integration

### 1. Featured Games Carousel (Homepage)

The game is **automatically featured** on the homepage because:
- Provider: `CoinKrazy Studios`
- Featured games are auto-selected by provider in `/client/pages/Index.tsx`
- No additional configuration needed

**Status**: ✅ Automatically displayed

### 2. Games Library Page

The game appears automatically in:
- `/games` - All Games view
- `/games/slots` - Slots category
- Searchable by name, provider, or features

**Location**: `client/pages/Games.tsx`
**Status**: ✅ Automatically included

### 3. Game Page Route

Direct link to the game:
```
/coinkrazy-4egypt-pots
```

**Component**: `client/pages/CoinKrazy4EgyptPots.tsx`
**Status**: ✅ Route configured

## Database Integration

### Game Registration

The game is automatically registered on app initialization:

```sql
-- Location: server/db/init.ts (lines ~535-559)
INSERT INTO games (
  name, slug, category, type, provider, rtp, volatility, 
  description, image_url, thumbnail, embed_url, launch_url, 
  enabled, is_branded_popup
) VALUES (
  'CoinKrazy-4EgyptPots',
  'coinkrazy-4egypt-pots',
  'Slots',
  'slots',
  'CoinKrazy Studios',
  96.3,
  'Medium-High',
  'Description...',
  'image_url',
  'thumbnail_url',
  '/coinkrazy-4egypt-pots',
  '/coinkrazy-4egypt-pots',
  true,
  true
);
```

**Status**: ✅ Auto-initialized

## Backend API Endpoints

### Spin Endpoint

**POST** `/api/coinkrazy-4egypt-pots/spin`

**Requires**: `verifyPlayer` middleware

**Request**:
```json
{
  "userId": 123,
  "bet": 1.50,
  "lines": 20
}
```

**Response**:
```json
{
  "success": true,
  "win": 5.50,
  "balance": 98.50,
  "reels": [
    ["W", "Q", "H"],
    ["Q", "S", "A"],
    ["H", "K", "J"],
    ["S", "10", "B"],
    ["A", "K", "M"]
  ],
  "message": "You won 5.50 SC!"
}
```

**Handler**: `server/routes/coinkrazy-4egypt-pots.ts`

## Frontend Integration

### Embedded Game File

**Location**: `public/games/coinkrazy-4egypt-pots.html`

**Features**:
- Self-contained HTML5 Canvas game
- No external dependencies
- Responsive design
- Mobile-friendly controls
- Automatic balance integration
- Social sharing integration

### React Page Component

**Location**: `client/pages/CoinKrazy4EgyptPots.tsx`

**Features**:
- Embeds game via iframe
- Exposes wallet functions to game
- Handles balance updates
- Info modal with game rules
- Real-time balance display

## Admin Panel Management

### Viewing Game Stats

Access via admin dashboard:
```
/admin/games?search=CoinKrazy-4EgyptPots
```

Or direct database query:
```sql
SELECT * FROM games WHERE name = 'CoinKrazy-4EgyptPots';
```

### Managing Game Availability

**Enable/Disable Game**:
```sql
UPDATE games 
SET enabled = false 
WHERE name = 'CoinKrazy-4EgyptPots';
```

**Update Game Details**:
```sql
UPDATE games 
SET 
  description = 'New description',
  rtp = 96.5,
  volatility = 'High',
  thumbnail = 'new_thumbnail_url'
WHERE name = 'CoinKrazy-4EgyptPots';
```

## File Structure

```
Root/
├── public/games/
│   └── coinkrazy-4egypt-pots.html        # Game executable
├── client/pages/
│   └── CoinKrazy4EgyptPots.tsx           # React wrapper page
├── server/routes/
│   └── coinkrazy-4egypt-pots.ts         # Backend handler
├── server/db/
│   ├── init.ts                           # Auto-registration
│   └── add_coinkrazy_4egypt_pots.sql    # Optional migration
└── docs/
    └── COINKRAZY-4EGYPT-POTS-ADMIN-GUIDE.md  # This file
```

## Features Breakdown

### Base Game
- 5×3 reel grid
- 20 fixed paylines
- Left-to-right wins
- Real-time payout calculation

### Hold & Win Bonus
- Triggered by 6+ Bonus Coin symbols
- 3 respins with sticky symbols
- Symbol values carry over
- New symbols reset counter

### Pot Features (Fill meters to unlock)
1. **Boost**: Multiplies all visible symbol values
2. **Collect**: Instantly collects all current values
3. **Multi**: Applies random 2×–10× multiplier
4. **Jackpot**: Injects preset values onto up to 3 symbols

### Symbol Payouts
- **Wild (W)**: 0.5× / 2.5× / 10×
- **Queen (Q)**: 7.5×
- **Eye of Horus (H)**: 5×
- **Scarab (S)**: 5×
- **Ankh (A)**: 5×
- **K, Q, J, 10**: 2.5×
- **Bonus (B)**: 1×
- **Mystery (M)**: 0.5×

## Wallet Integration

### Balance Sync
The game automatically:
1. Reads player balance on load from `getPlayerSCBalance()`
2. Deducts bet amount before spin
3. Records transactions in wallet history
4. Adds win amount after spin
5. Updates balance display in real-time

### Transaction Recording
- Type: `bet` or `win`
- Amount: Positive (win) or Negative (bet)
- Game: `CoinKrazy-4EgyptPots`
- Timestamp: ISO 8601 format

## Social Sharing

### Integration Points
- Share win modal on significant wins (>1 SC)
- Facebook sharing with referral link
- Automatic formatting with win amount
- Custom referral link support

**Facebook Share URL Format**:
```
https://www.facebook.com/sharer/sharer.php?
  u=[PLAYER_REFERRAL_LINK]&
  quote=[SHARE_TEXT]
```

## Customization Options

### Update Game Metadata
```sql
INSERT INTO game_metadata (game_id, theme, feature, feature_description)
SELECT id, 'Egyptian', 'Feature Name', 'Description'
FROM games WHERE name = 'CoinKrazy-4EgyptPots';
```

### Update RTP
```sql
UPDATE games 
SET rtp = 96.5 
WHERE name = 'CoinKrazy-4EgyptPots';
```

### Update Bet Limits
(Edit in game HTML file):
```javascript
const BET_AMOUNTS = [0.01, 0.10, 0.25, 0.50, 1.00, 2.00, 5.00, 10.00];
```

## Troubleshooting

### Game Not Showing on Homepage
- Check: `provider = 'CoinKrazy Studios'`
- Check: `enabled = true` in games table
- Clear browser cache
- Verify Index.tsx featured games logic

### Balance Not Updating
- Verify `getPlayerSCBalance()` is exposed globally
- Check network requests in DevTools
- Confirm `recordGameTransaction()` is implemented
- Check player exists in database

### Spins Not Processing
- Verify `/api/coinkrazy-4egypt-pots/spin` endpoint exists
- Check `verifyPlayer` middleware is working
- Confirm database connection
- Check player balance is sufficient

## Support

For questions or issues, contact:
- **Development**: CoinKrazy Development Team
- **Documentation**: See inline code comments
- **Database**: Check `game_results` table for spin history

## Version History

- **v1.0.0** (2025-02): Initial release
  - Base game mechanics
  - Hold & Win feature
  - Pot meter system
  - Full wallet integration
  - Social sharing

## License & Attribution

Game developed by CoinKrazy Studios for PlayCoinKrazy.com.
All assets and mechanics are proprietary.
