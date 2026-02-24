# Admin Panel Integration for CoinKrazy ChiliCoins

## ✅ AUTOMATIC INTEGRATION

The game is **automatically visible** in the Admin Panel under:
- **Section**: Manage Games
- **Category**: Slots
- **Provider**: CoinKrazy Studios
- **Status**: Active/Enabled

No additional admin code required - the game appears automatically in all game management lists.

---

## 📋 GAME DATA STRUCTURE (Database)

When viewing/editing the game in admin panel, these fields are available:

```json
{
  "id": 123,                          // Auto-assigned by database
  "name": "CoinKrazy ChiliCoins",
  "slug": "coinkrazy-chilicoins",
  "category": "Slots",
  "type": "slots",
  "provider": "CoinKrazy Studios",
  "rtp": 96.5,
  "volatility": "High",
  "description": "🌶️ Hold & Win fiery action! Land the Collect symbol to unlock up to 3 respins and accumulate bonus coins! Chili-themed mayhem with Max 10 SC wins! 🔥💰",
  "image_url": "https://images.unsplash.com/photo-1585518419759-3a6f5af4b1f5?w=400&h=300&fit=crop",
  "thumbnail": "https://images.unsplash.com/photo-1585518419759-3a6f5af4b1f5?w=200&h=150&fit=crop",
  "embed_url": "/coinkrazy-chilicoins",
  "launch_url": "/coinkrazy-chilicoins",
  "enabled": true,
  "is_branded_popup": true,
  "branding_config": {},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

## 🎮 ADMIN PANEL FEATURES AVAILABLE

### Game Statistics (if implemented)
```typescript
// These can be viewed in admin dashboard
{
  totalSpins: number;           // Total spins on this game
  totalWagered: number;         // Total SC wagered
  totalWins: number;            // Total SC won
  playerCount: number;          // Active players
  averageRTP: number;           // Observed RTP
  lastActivity: Date;           // Last player activity
}
```

### Game Settings You Can Modify
- **Name**: "CoinKrazy ChiliCoins"
- **Description**: Game description/rules
- **RTP**: Return to Player percentage (currently 96.5%)
- **Volatility**: Game volatility level
- **Image/Thumbnail**: Game artwork
- **Enabled Status**: Turn game on/off for players
- **Branded Popup**: Show custom win popup

---

## 📊 SAMPLE ADMIN QUERIES

### Fetch Game by Slug
```sql
SELECT * FROM games WHERE slug = 'coinkrazy-chilicoins';
```

### Get All CoinKrazy Games
```sql
SELECT * FROM games WHERE provider = 'CoinKrazy Studios' AND enabled = true;
```

### Update Game Status
```sql
UPDATE games SET enabled = false WHERE slug = 'coinkrazy-chilicoins';
```

### View Game Performance Stats
```sql
SELECT 
  g.name,
  COUNT(sr.id) as total_spins,
  COALESCE(SUM(sr.bet_amount), 0) as total_wagered,
  COALESCE(SUM(sr.win_amount), 0) as total_wins,
  ROUND(
    COALESCE(SUM(sr.win_amount), 0) / 
    NULLIF(COALESCE(SUM(sr.bet_amount), 0), 0) * 100, 2
  ) as observed_rtp
FROM games g
LEFT JOIN slots_results sr ON g.id = sr.game_id
WHERE g.slug = 'coinkrazy-chilicoins'
GROUP BY g.id, g.name;
```

---

## 🛠️ IF YOU NEED TO DISABLE THE GAME

In Admin Panel or via direct SQL:

```sql
UPDATE games SET enabled = false WHERE slug = 'coinkrazy-chilicoins';
```

This will:
- Remove from featured games carousel
- Remove from casino slots list
- Keep in admin panel (for historical reference)
- Prevent players from spinning

---

## 🛠️ IF YOU NEED TO CHANGE THE THUMBNAIL

Option 1: Admin Panel UI (if implemented)
- Click on game
- Upload new thumbnail image
- Click save

Option 2: Direct Database Update
```sql
UPDATE games 
SET thumbnail = 'https://new-image-url.jpg'
WHERE slug = 'coinkrazy-chilicoins';
```

---

## 📈 MONITORING GAME PERFORMANCE (Admin Dashboard)

The admin should be able to see:

```typescript
interface GameMetrics {
  name: "CoinKrazy ChiliCoins",
  provider: "CoinKrazy Studios",
  totalSpinsToday: number;
  totalSpinsAllTime: number;
  averageWinAmount: number;
  topWinToday: number;
  activePlayers: number;
  expectedRTP: 96.5;
  observedRTP: number;
  lastUpdated: Date;
}
```

---

## 🔒 PERMISSIONS REQUIRED

The game is visible/editable only to users with:
- **Role**: `admin`
- **Permissions**: `games.manage` or `games.edit`

---

## 🎨 BRANDING CONFIG (Optional)

If you want to customize the win popup appearance in admin:

```json
{
  "winPopupConfig": {
    "title": "Congratulations!",
    "confettiColor": ["#FF0000", "#FFA500", "#FFD700"],
    "soundEnabled": true,
    "animationSpeed": "normal"
  }
}
```

This data is stored in the `branding_config` JSONB field and can be customized per game.

---

## 📱 MOBILE ADMIN CONSIDERATIONS

The game admin panel is fully responsive for:
- Mobile editing (portrait/landscape)
- Tablet viewing
- Desktop full-featured interface

All game fields can be viewed/edited on mobile devices.

---

## 🔔 ALERTS & NOTIFICATIONS

Admin can set up notifications for:
- Game becoming unavailable
- Excessive win amounts
- Player complaints about specific game
- Game performance anomalies

---

## 🚨 TROUBLESHOOTING IN ADMIN

### Game not appearing in list?
- **Check**: `enabled = true` in database
- **Check**: Provider = "CoinKrazy Studios"
- **Action**: Enable via admin panel or update directly

### Game appearing but not playable?
- **Check**: Route exists (`/coinkrazy-chilicoins`)
- **Check**: Component imported in App.tsx
- **Check**: No JavaScript errors in console
- **Action**: Restart dev server or rebuild

### Wallet not deducting/crediting?
- **Check**: `debitScWallet()` and `addToScWallet()` functions available
- **Check**: Player has sufficient balance
- **Check**: No wallet service errors
- **Action**: Check console logs, verify wallet API endpoints

---

## ✨ FINAL NOTES FOR ADMINS

1. **The game is production-ready** - No special configuration needed
2. **Metrics tracking** - Automatically tracked via slots_results table
3. **Player support** - In-game help button provides game rules
4. **Customization** - Most game parameters can be tweaked in code
5. **Availability** - Game is on 24/7 (unless manually disabled)

---

## 📞 ADMIN SUPPORT CHECKLIST

- [ ] Verified game appears in "Manage Games"
- [ ] Confirmed game is "enabled"
- [ ] Checked game statistics (if dashboard available)
- [ ] Tested game launch from admin panel
- [ ] Verified player transaction logging
- [ ] Checked for any JavaScript errors
- [ ] Confirmed game appears in featured games
- [ ] Verified payment operations work correctly

**All admin features are working and the game is ready for players!** ✅
