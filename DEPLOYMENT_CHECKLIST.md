# 🚀 CoinKrazy Games Cleanup - Deployment Checklist

## Pre-Deployment

### Install Dependencies
- [ ] Resolve `pnpm install` timeout (see FIX_INSTALL_TIMEOUT.md)
- [ ] Dependencies installed: `ls node_modules | wc -l` > 500
- [ ] No peer dependency warnings
- [ ] Lock file updated (pnpm-lock.yaml)

```bash
# If install times out:
pnpm install --timeout 120000 --registry https://registry.npmjs.org
```

---

## Database Migration

### Pre-Migration Checks
- [ ] Database backup created
- [ ] PostgreSQL connection verified
- [ ] Current user has admin permissions
- [ ] Enough disk space available

### Run Migration
- [ ] Execute: `psql -U $DB_USER -d $DB_NAME -f server/db/migrations/cleanup-external-games.sql`
- [ ] No SQL errors in output
- [ ] Migration completed successfully

### Post-Migration Verification
```bash
# Run these queries to verify migration success:

# Check 1: Count CoinKrazy games (should be 5)
SELECT COUNT(*) FROM games 
WHERE provider = 'CoinKrazy Studios' AND enabled = TRUE;

# Check 2: Verify external games disabled
SELECT COUNT(*) FROM games WHERE enabled = FALSE;

# Check 3: Verify game_compliance settings
SELECT g.name, gc.is_external 
FROM games g 
LEFT JOIN game_compliance gc ON g.id = gc.game_id 
WHERE g.provider = 'CoinKrazy Studios';
```

- [ ] Query 1 returns: 5
- [ ] Query 2 returns count of disabled games
- [ ] Query 3 shows all games with is_external = FALSE

---

## Code Deployment

### File Changes Review
- [ ] `client/pages/Games.tsx` - Updated featured games list (4 → 5)
- [ ] `client/pages/ExternalGames.tsx` - Rewritten with consolidation message
- [ ] `server/routes/external-games.ts` - SQL query updated (line 297)
- [ ] `server/db/migrations/cleanup-external-games.sql` - NEW migration file
- [ ] `SETUP_COINKRAZY_GAMES.md` - NEW setup guide
- [ ] `COINKRAZY_CLEANUP_SUMMARY.md` - NEW summary doc
- [ ] `FIX_INSTALL_TIMEOUT.md` - NEW troubleshooting guide

### Git Operations
```bash
# Stage all changes
git add -A

# Verify changes
git status

# Commit with descriptive message
git commit -m "feat: consolidate games and add 5 CoinKrazy titles to admin

- Remove all external games from system
- Add CoinKrazy-3CoinsVolcanoes as 5th game
- Update featured games list to show all 5 CoinKrazy games
- Rewrite ExternalGames page with consolidation message
- Add database migration to clean up external games
- All games now manageable in admin panel"

# Push to remote
git push origin main
```

- [ ] All changes staged
- [ ] Commit message is descriptive
- [ ] Push successful (check GitHub/GitLab)
- [ ] CI/CD pipeline triggered (if configured)

### Build & Test Locally
```bash
# Build project
npm run build

# Check for build errors
echo $?  # Should be 0

# Run type checks
npm run typecheck

# Start dev server
npm run dev
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Dev server starts successfully
- [ ] No console errors on startup

---

## Pre-Production Testing

### Test Games Lobby (`/games`)
- [ ] Page loads without errors
- [ ] 5 CoinKrazy games visible in featured section
- [ ] Games are in correct order:
  1. CoinKrazy-CoinUp: Lightning Edition
  2. CoinKrazy-Hot
  3. CoinKrazy-Thunder
  4. CoinKrazy-4Wolfs
  5. CoinKrazy-3CoinsVolcanoes
- [ ] Can filter by "CoinKrazy Studios" provider
- [ ] Can search for each game individually

### Test External Games Page (`/external-games`)
- [ ] Page loads without errors
- [ ] Shows consolidation message (NOT old game list)
- [ ] Shows redirect button to `/games`
- [ ] Shows admin note about consolidation
- [ ] No 404 errors

### Test Admin Panel (`/admin/games-management`)
- [ ] Page loads successfully
- [ ] Can see all 5 CoinKrazy games
- [ ] Games are marked as "enabled"
- [ ] Provider shows "CoinKrazy Studios"
- [ ] Can edit each game
- [ ] Can disable/enable games
- [ ] Can delete games (if needed)

### Test API Endpoints
```bash
# In browser dev console or curl:

# GET /api/games - should include 5 CoinKrazy games
fetch('/api/games').then(r => r.json()).then(d => 
  console.log(d.filter(g => g.provider === 'CoinKrazy Studios'))
)

# GET /api/external-games - should be empty
fetch('/api/external-games').then(r => r.json()).then(d => console.log(d))

# GET /api/admin/v2/games - should show 5 CoinKrazy games
fetch('/api/admin/v2/games').then(r => r.json())
```

- [ ] `/api/games` returns 5 CoinKrazy games
- [ ] `/api/external-games` returns empty array
- [ ] `/api/admin/v2/games` shows all 5 games

### Browser Compatibility
- [ ] Chrome/Chromium - no errors
- [ ] Firefox - no errors
- [ ] Safari - no errors
- [ ] Mobile view - responsive and correct
- [ ] Mobile touch - buttons work

### No Broken Links
- [ ] `/games` links work
- [ ] `/external-games` redirect works
- [ ] Navigation menu works
- [ ] Admin links work
- [ ] No 404s in console

---

## Production Deployment

### Pre-Deployment Steps
- [ ] All tests passed ✅
- [ ] Database migrated ✅
- [ ] Code committed and pushed ✅
- [ ] CI/CD pipeline passed (if applicable)
- [ ] Staging environment tested ✅

### Deploy to Production
```bash
# Option 1: Via Git (if auto-deploy configured)
git push origin main
# Monitor deployment in your deployment platform

# Option 2: Manual deployment
# 1. SSH into production server
# 2. Pull latest code
git pull origin main

# 3. Install dependencies
pnpm install --timeout 120000

# 4. Build
npm run build

# 5. Start server
npm start
```

- [ ] Code deployed to production
- [ ] Server restarted successfully
- [ ] No errors in production logs
- [ ] Monitor uptime/errors

### Post-Deployment Verification

#### API Health Check
```bash
# Test the endpoints in production:
curl https://yoursite.com/api/games | grep -i coinkrazy | wc -l
# Should show: 5

curl https://yoursite.com/api/external-games
# Should show: empty array

curl https://yoursite.com/api/admin/v2/games | grep coinkrazy | wc -l
# Should show: 5
```

- [ ] API endpoints responding correctly
- [ ] Games showing correctly
- [ ] External games empty

#### User-Facing Tests
- [ ] Visit `/games` - see 5 CoinKrazy games
- [ ] Visit `/external-games` - see redirect message
- [ ] Visit `/admin` - see all 5 games in management
- [ ] Can play CoinKrazy games
- [ ] No 404 errors in browser

#### Admin Panel Tests
- [ ] Login to admin
- [ ] Navigate to Games Management
- [ ] Search for "CoinKrazy" - 5 results
- [ ] Can edit a game
- [ ] Can toggle enable/disable
- [ ] Changes save correctly

---

## Post-Deployment

### Monitor for Issues (24 hours)
- [ ] Check error logs: `tail -f /var/log/app.log`
- [ ] Monitor performance: Check load times, CPU, memory
- [ ] Monitor user reports: Check support tickets
- [ ] Monitor API response times: < 500ms target
- [ ] Check for database errors: No connection failures

### Verify Database Health
```bash
# Run on production database:
SELECT COUNT(*) FROM games WHERE provider = 'CoinKrazy Studios' AND enabled = TRUE;
# Should be: 5

SELECT COUNT(*) FROM games WHERE enabled = FALSE;
# Should be: count of old external games

ANALYZE games;  # Update statistics
```

- [ ] Database healthy
- [ ] Tables optimized
- [ ] No slow queries

### Cleanup & Optimization
```bash
# (Optional) Delete old external game data after confirmation
-- DO NOT RUN unless you're sure external games won't be needed
-- DELETE FROM games WHERE enabled = FALSE AND provider NOT IN ('CoinKrazy Studios');

# Update database statistics
ANALYZE;
```

- [ ] Database backups scheduled
- [ ] Index optimization complete
- [ ] Query performance good

---

## Rollback Plan (If Needed)

### Quick Rollback (if issues arise)
```bash
# 1. Revert code changes
git revert HEAD --no-edit
git push origin main

# 2. Restart server
npm start

# 3. If database rollback needed, restore from backup:
# Contact DBA or run:
# pg_restore -d your_db your_backup_file.dump
```

### Full Rollback SQL (If Absolutely Necessary)
```sql
-- WARNING: Only run if you need to completely revert

-- Re-enable external games
UPDATE games SET enabled = TRUE 
WHERE enabled = FALSE AND id IN (
  SELECT game_id FROM game_compliance WHERE is_external = FALSE
);

-- Restore external game flags
UPDATE game_compliance SET is_external = TRUE, is_sweepstake = TRUE 
WHERE is_external = FALSE;

-- Remove 5th game if it was newly added
DELETE FROM games WHERE name = 'CoinKrazy-3CoinsVolcanoes';

-- Restore external games endpoint function
-- (code revert handles this)
```

- [ ] Rollback successful (if needed)
- [ ] Services restored
- [ ] Users notified

---

## Documentation & Handoff

### Create Internal Docs
- [ ] Share SETUP_COINKRAZY_GAMES.md with team
- [ ] Share COINKRAZY_CLEANUP_SUMMARY.md with stakeholders
- [ ] Document in wiki/confluence if applicable
- [ ] Create runbook for future admin operations

### Train Team
- [ ] Show admin how to manage games
- [ ] Show admin how to add new CoinKrazy games
- [ ] Show how to filter/search games
- [ ] Show how to enable/disable games
- [ ] Document common tasks

### Update Runbooks
- [ ] Add to deployment playbook
- [ ] Add to rollback procedures
- [ ] Add database migration docs
- [ ] Add troubleshooting guide

---

## Success Criteria

✅ All of the following must be true for successful deployment:

1. **Database** ✅
   - 5 CoinKrazy games in database with `is_external = FALSE`
   - External games marked as `enabled = FALSE`
   - No database errors in logs

2. **Frontend** ✅
   - `/games` shows 5 CoinKrazy games featured
   - `/external-games` shows consolidation message
   - `/admin` shows all 5 games in management panel
   - No 404 or console errors

3. **API** ✅
   - `/api/games` returns 5 CoinKrazy games
   - `/api/external-games` returns empty
   - `/api/admin/v2/games` shows all 5 games
   - All endpoints respond < 500ms

4. **Admin Functionality** ✅
   - Can view all 5 games
   - Can edit games
   - Can enable/disable games
   - Changes persist

5. **No Regressions** ✅
   - No broken navigation
   - No broken game links
   - No broken admin features
   - Performance not degraded

---

## Final Sign-Off

### Review Checklist Items
- [ ] All pre-deployment checks completed ✅
- [ ] All migration checks passed ✅
- [ ] All code deployment checks passed ✅
- [ ] All pre-production tests passed ✅
- [ ] All post-deployment tests passed ✅
- [ ] No critical issues reported ✅

### Approval & Sign-Off
- [ ] QA Approval: _______________
- [ ] Tech Lead Approval: _______________
- [ ] Product Manager Approval: _______________
- [ ] Date: _______________

### Deployment Status
**Date Deployed:** _________________  
**Deployed By:** _________________  
**Status:** ✅ **PRODUCTION LIVE**

---

## Monitoring & Support

### 24-Hour Monitoring
Keep these dashboards open for 24 hours post-deployment:
- Error rates
- API response times
- User complaints
- Server resources (CPU, memory, disk)
- Database connection pool
- Payment/transaction logs (if applicable)

### Escalation Contacts
- DBA: _________________
- DevOps: _________________
- Frontend Lead: _________________
- Backend Lead: _________________

### Issues Found & Resolution
(Document any issues encountered post-deployment)

| Issue | Severity | Status | Resolution |
|-------|----------|--------|-----------|
|       |          |        |           |

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** 2025-02-25  
**Status:** ✅ Ready for deployment
