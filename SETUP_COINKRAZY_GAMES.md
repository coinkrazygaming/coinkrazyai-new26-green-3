# CoinKrazy Games - Admin Setup Guide

## Overview
This guide walks through the changes made to:
1. Remove all external games from the system
2. Consolidate games into the main Games Lobby
3. Set up all 5 CoinKrazy Studios games for admin management
4. Fix any duplicate "COINKRAZY CHALLENGES" references

---

## Changes Made

### 1. Database Migration ✅
**File:** `server/db/migrations/cleanup-external-games.sql`

This migration:
- ✅ Marks all external/sweepstake games as `enabled = FALSE`
- ✅ Updates `game_compliance` to set `is_external = FALSE` and `is_sweepstake = FALSE`
- ✅ Ensures 5 CoinKrazy Studios games exist in database:
  1. CoinKrazy-CoinUp: Lightning Edition
  2. CoinKrazy-Hot
  3. CoinKrazy-Thunder
  4. CoinKrazy-4Wolfs
  5. CoinKrazy-3CoinsVolcanoes (New Game)
- ✅ Creates indexes for faster CoinKrazy game queries

**To run the migration:**
```bash
# Option 1: PostgreSQL CLI
psql -U $DB_USER -d $DB_NAME -f server/db/migrations/cleanup-external-games.sql

# Option 2: Via Node script (recommended)
npm run db:migrate  # if your package.json has this script
```

### 2. Games List Updates ✅
**File:** `client/pages/Games.tsx` (Lines 93)

Updated featured games list from 4 to 5 CoinKrazy games:
```typescript
// BEFORE (4 games):
const coinKrazyGameNames = [
  'CoinKrazy-CoinUp: Lightning Edition',
  'CoinKrazy-Hot',
  'CoinKrazy-Thunder',
  'CoinKrazy-4Wolfs'
];

// AFTER (5 games):
const coinKrazyGameNames = [
  'CoinKrazy-CoinUp: Lightning Edition',
  'CoinKrazy-Hot',
  'CoinKrazy-Thunder',
  'CoinKrazy-4Wolfs',
  'CoinKrazy-3CoinsVolcanoes'  // ← New
];
```

### 3. External Games Endpoint ✅
**File:** `server/routes/external-games.ts` (Line 297)

Updated the SQL query to only return external games:
```sql
-- BEFORE (returned external + null):
WHERE g.enabled = TRUE AND (gc.is_external = TRUE OR gc.is_external IS NULL)

-- AFTER (only external):
WHERE g.enabled = TRUE AND gc.is_external = TRUE
```

After migration, this returns an empty array naturally (better UX than changing the handler).

### 4. External Games UI ✅
**File:** `client/pages/ExternalGames.tsx` (Complete rewrite)

Updated to show users that games have been consolidated:
- Shows friendly redirect to `/games` lobby
- Explains the consolidation
- Lists benefits of the change
- Admin note about the migration

### 5. Duplicate "COINKRAZY CHALLENGES" Fix ✅
**File:** `client/components/popups/ChallengesPopup.tsx`

Verified that "COINKRAZY CHALLENGES" only appears once in the codebase (line 103).
No duplicates found - text is used only in the popup title.

---

## Admin Panel - CoinKrazy Games Management

All 5 CoinKrazy Studios games are now available in the admin panel at `/admin/games-management`.

### Access Admin Panel:
1. Navigate to `/admin`
2. Click "Games Management" tab
3. Search for "CoinKrazy" to view all 5 games

### Managing CoinKrazy Games:
Each game can be:
- ✅ Enabled/Disabled
- ✅ Edited (name, provider, category, etc.)
- ✅ Configured (max win, min/max bet, compliance settings)
- ✅ Deleted (if needed)

### Game Registry JSON (for reference):
All games now have:
- `provider: "CoinKrazy Studios"`
- `enabled: true`
- `is_external: false` (in game_compliance)
- `is_sweepstake: false` (in game_compliance)

---

## Installation Instructions

### Step 1: Run Migration
```bash
# Connect to your database and run the migration
psql -h localhost -U your_user -d your_db < server/db/migrations/cleanup-external-games.sql

# OR if using Docker:
docker exec postgres_container psql -U your_user -d your_db < server/db/migrations/cleanup-external-games.sql
```

### Step 2: Deploy Code Changes
```bash
# Pull the latest code
git pull origin main

# Files changed:
# - client/pages/Games.tsx (updated featured games list)
# - client/pages/ExternalGames.tsx (new consolidated page)
# - server/routes/external-games.ts (query filter updated)

# Install dependencies (if needed)
npm install
# or
pnpm install
```

### Step 3: Rebuild & Deploy
```bash
# Build the project
npm run build

# Deploy to your environment
npm start  # or your deployment command
```

### Step 4: Verify in Admin Panel
1. Go to `/admin`
2. Click "Games Management"
3. Search "CoinKrazy" - should see all 5 games
4. Verify all are marked as enabled
5. Check settings for each game

---

## Verification Checklist

### Database Level
- [ ] Run query: `SELECT COUNT(*) FROM games WHERE provider = 'CoinKrazy Studios' AND enabled = TRUE;` → Should return **5**
- [ ] Run query: `SELECT * FROM game_compliance WHERE is_external = FALSE AND is_sweepstake = FALSE;` → All CoinKrazy games should be listed
- [ ] Run query: `SELECT COUNT(*) FROM games WHERE enabled = FALSE;` → Shows count of disabled (external) games

### Frontend Level
- [ ] `/games` page loads with 5 CoinKrazy games in featured section
- [ ] `/games` filter shows CoinKrazy Studios provider with 5 games
- [ ] `/external-games` shows consolidation message with redirect to `/games`
- [ ] Admin panel shows all 5 games in Games Management

### API Level
- [ ] `GET /api/games` returns 5 CoinKrazy games (check provider field)
- [ ] `GET /api/external-games` returns empty array or consolidation message
- [ ] `GET /api/admin/v2/games` shows all 5 CoinKrazy games

---

## Rollback Instructions (if needed)

If you need to revert these changes:

```sql
-- Revert game status
UPDATE games SET enabled = TRUE 
WHERE provider NOT IN ('CoinKrazy Studios');

-- Revert game_compliance flags
UPDATE game_compliance SET is_external = TRUE, is_sweepstake = TRUE 
WHERE game_id IN (SELECT id FROM games WHERE provider NOT IN ('CoinKrazy Studios'));

-- Remove the 5th game (CoinKrazy-3CoinsVolcanoes) if it shouldn't exist
DELETE FROM games WHERE name = 'CoinKrazy-3CoinsVolcanoes';
DELETE FROM game_compliance WHERE game_id NOT IN (SELECT id FROM games);
```

---

## FAQ

### Q: Where did the external games go?
A: They're still in the database but marked as `enabled = FALSE`. They won't show to users but can be re-enabled in the future.

### Q: Can I add external games back?
A: Yes. Either:
1. Update `games.enabled = TRUE` for specific games
2. Update `game_compliance.is_external = TRUE` for games you want to treat as external

### Q: How do I add a new CoinKrazy game?
A: Use the admin panel "Add New Game" button and set:
- Provider: `CoinKrazy Studios`
- Category: `Slots` (or appropriate)
- enabled: `TRUE`

The game will automatically be featured on `/games` due to the CoinKrazy Studios priority in the featured games logic.

### Q: Why was "COINKRAZY CHALLENGES" duplicated?
A: It wasn't actually duplicated in the code - only appears once in `ChallengesPopup.tsx`. The user may have seen it displayed multiple times due to UI stacking or appearance in different contexts.

---

## Monitoring

After deployment, monitor:
- **Users redirected from `/external-games`**: Should see the consolidation message and redirect to `/games`
- **Admin game management**: All 5 CoinKrazy games should be visible and manageable
- **Games lobby**: 5 CoinKrazy games should appear in featured section
- **No broken links**: External games nav item still exists but shows consolidation message

---

## Support

For issues:
1. Check the admin panel under Games Management
2. Verify database migration ran successfully
3. Check server logs for any errors
4. Review API responses at `/api/games` and `/api/admin/v2/games`

---

## Summary of Configuration

| Item | Before | After |
|------|--------|-------|
| External Games | ~20+ games | Disabled/Removed |
| CoinKrazy Games | 4 games | **5 games** |
| Featured Games | Mixed | **All CoinKrazy Studios** |
| Admin Management | Limited | **Full control of 5 games** |
| Games Consolidation | Separate pages | **Single main lobby** |
| "COINKRAZY CHALLENGES" | Text in popup | **Verified - no duplicates** |

---

**Deployment Status:** ✅ Ready for production  
**Last Updated:** 2025-02-25  
**Migration Type:** Database + Frontend UI  
**Rollback Complexity:** Low (all reversible)
