# Complete Platform Recreation Prompt

**Use this prompt with any AI development assistant to recreate the entire CoinKrazy AI platform.**

---

## System Prompt

You are building CoinKrazy AI, a comprehensive social gaming and entertainment platform. Your goal is to create a production-ready, scalable application combining games, social features, AI integration, and admin management.

---

## Complete Specification

### Core Vision
Create a social gaming platform where users can:
1. Play multiple game types (slots, poker, bingo, dice, scratch tickets, pull tabs, sportsbook)
2. Use a dual currency system (free Gold Coins + real-value Sweeps Coins)
3. Compete on leaderboards, unlock achievements, complete daily challenges
4. Interact with AI-powered features for game recommendations, support, and platform management
5. Purchase Gold Coins through Stripe/Square integration
6. Manage profiles, earn referral bonuses, participate in VIP clubs

Admin can:
1. View comprehensive analytics and dashboards
2. Manage players (balance adjustments, KYC review, suspension)
3. Configure games (enable/disable, adjust RTP, set bet limits)
4. Distribute bonuses and manage financial operations
5. Monitor AI agent performance and assign duties
6. View real-time platform health and player demographics

### Tech Stack (MANDATORY)
- **Frontend**: React 18 + TypeScript + React Router 6 (SPA) + Vite + TailwindCSS 3
- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: PostgreSQL 12+
- **Real-time**: Socket.io
- **UI Components**: Radix UI + Shadcn/UI patterns + Lucide Icons
- **State Management**: React Context (Auth, Wallet) + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Payment**: Stripe + Square webhooks
- **AI**: Google Generative AI (Gemini)
- **Security**: bcrypt, JWT, Helmet, express-rate-limit
- **Package Manager**: pnpm

### Project Structure

```
root/
├── client/
│   ├── pages/              # Route components (25+ pages)
│   ├── components/
│   │   ├── ui/            # 30+ reusable UI components
│   │   ├── games/         # Game-specific components
│   │   └── popups/        # Modal popups
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, auth context, API client
│   ├── App.tsx            # Router setup
│   ├── main.tsx           # Entry point
│   └── global.css         # TailwindCSS + design tokens
├── server/
│   ├── routes/            # 50+ endpoint handlers
│   ├── middleware/        # Auth, validation, error handling
│   ├── db/                # Database setup, migrations, queries
│   ├── services/          # AI, game engine, payments
│   ├── validation/        # Zod schemas
│   └── index.ts           # Express app setup
├── shared/
│   └── api.ts             # Shared TypeScript interfaces
├── vite.config.ts         # Client config
├── vite.config.server.ts  # Server config
├── tailwind.config.ts     # Design tokens
└── package.json
```

### Database Schema (PostgreSQL)

**Core Tables:**

1. **players** - User accounts
   - id, email, username, password_hash, avatar_url
   - gc_balance (Gold Coins), sc_balance (Sweeps Coins)
   - total_wagered, vip_status, kyc_verified
   - status (Active/Suspended), last_login, timestamps

2. **games** - Game catalog
   - id, name, type (slots/poker/bingo/etc), category, provider
   - slug, description, image_url, thumbnail
   - rtp (Return to Player %), min_bet, max_bet
   - enabled, featured flags, launch_url, embed_url

3. **store_packs** - Gold Coin packages for purchase
   - id, title, gold_coins, bonus_sc, price_usd
   - position, featured flag, enabled flag, stripe_product_id

4. **wallet_transactions** - All wallet ledger entries
   - id, player_id, transaction_type (purchase/spin_win/spin_loss/bonus/redemption)
   - gc_amount, sc_amount, balance_before/after
   - description, timestamp

5. **game_results** - Individual game plays
   - id, player_id, game_id, game_type
   - bet_amount, win_amount, result (win/loss/pending)
   - multiplier, result_data (JSON), timestamp

6. **leaderboards** - Competitive rankings
   - id, player_id, rank_type (weekly_wagered/top_winners/streak)
   - points, rank, period (weekly/monthly/alltime), timestamp

7. **achievements** - Unlock system
   - achievements table: id, name, description, icon_url, category, points, requirement_data
   - player_achievements table: id, player_id, achievement_id, unlocked_at

8. **challenges** - Daily/weekly tasks
   - challenges table: id, name, description, category, reward_type (gc/sc)
   - reward_amount, progress_target, requirements (JSON)
   - player_challenges table: id, player_id, challenge_id, progress, completed flag

9. **referral_links** - Referral system
   - id, player_id, unique_code, clicks, conversions
   - total_referral_bonus, timestamp

10. **ai_employees** - AI agent definitions
    - id, name, role, status, duties (JSON), timestamp

11. **ai_agent_status** - Real-time AI metrics
    - id, agent_id, agent_name, status, current_task
    - total_conversations, average_response_time_ms, last_activity_at

12. **user_messages** - DM and notification system
    - id, from_player_id, to_player_id, message_text
    - is_read flag, message_type (dm/support/notification), read_at

13. **admin_users** - Admin accounts
    - id, email, password_hash, name, role (super_admin/moderator/support)
    - permissions (JSON), last_login

14. **casino_settings** - Platform configuration
    - setting_key (PRIMARY), setting_value, data_type (string/json/boolean)
    - description, updated_at, updated_by

15. **ai_conversation_history** - Chat logs
    - id, player_id, session_id, agent_id, agent_name
    - message_type (user/ai/system), message_content, sentiment
    - response_time_ms, timestamp

16. **support_tickets** - Customer support
    - id, player_id, subject, description, status, priority
    - category, assigned_admin_id, timestamps

17. **poker_tables** - Poker game rooms
    - id, name, max_players, buy_in_min, buy_in_max, raked

18. **bingo_games** - Bingo game instances
    - id, name, room_name, current_pool, status, max_players

19. **bonuses** - Promotional bonuses
    - id, name, bonus_type (deposit/registration/daily)
    - amount_gc, amount_sc, wagering_multiplier, expiry_date

20. **jackpots** - Progressive jackpots
    - id, name, current_amount, contributed_from (game_type)
    - status, last_winner_id, last_won_at

21. **redemption_requests** - Sweeps Coin withdrawals
    - id, player_id, amount, currency, method
    - status (pending/approved/completed), rejection_reason, timestamps

**Additional Tables** (as needed):
- scratch_tickets, scratch_ticket_results, scratch_ticket_transactions
- pull_tab_designs, pull_tab_tickets, pull_tab_results
- sports_events, sports_bets
- game_config, provider_games
- vip_tiers, player_vip
- fraud_patterns, fraud_flags
- cms_pages, cms_banners
- social_groups, social_group_members
- (and more based on full spec)

### Frontend Features

#### Pages (25+)
1. **Index.tsx** - Home/lobby with featured games
2. **Games.tsx** - Browse all games with filters
3. **Slots.tsx** - Slots lobby
4. **Casino.tsx** - Live casino games
5. **Poker.tsx** - Poker rooms
6. **Bingo.tsx** - Bingo lobbies
7. **Dice.tsx** - Dice games
8. **Scratchers.tsx** - Scratch ticket shop
9. **PullTabs.tsx** - Pull tab lottery
10. **ExternalGames.tsx** - Sweepstake/social casino
11. **Sportsbook.tsx** - Sports betting
12. **Store.tsx** - Gold coin shop
13. **Leaderboards.tsx** - Rankings (weekly/all-time)
14. **Achievements.tsx** - Achievement gallery with progress
15. **Challenges.tsx** - Daily/weekly challenges
16. **Community.tsx** - Social features, groups
17. **Referrals.tsx** - Referral program
18. **VIP.tsx** - VIP tier info and benefits
19. **Profile.tsx** - User profile, settings, stats
20. **Wallet.tsx** - Balance, transactions, history
21. **Account.tsx** - Payment methods, security settings
22. **Support.tsx** - Support tickets, chat
23. **Admin.tsx** - Admin dashboard
24. **AdminGames.tsx** - Game management
25. **AdminPlayers.tsx** - Player management
26. **NotFound.tsx** - 404 page

#### Components (40+)

**UI Components:**
- Button (variants: default, ghost, outline, destructive, sm, lg, icon)
- Card (with header, footer, content sections)
- Badge (with color variants, dismissible)
- Dialog/Modal (with close button, animations)
- Alert (error, warning, success, info)
- Tabs (horizontal/vertical)
- Dropdown/ContextMenu
- Popover/Tooltip
- Input/TextArea/Select/Checkbox/Radio
- Progress (linear and circular)
- Skeleton (loading state)
- Toast/Sonner notifications
- Command/Command Palette
- Separator

**Game Components:**
- SlotMachine (spinning reels, payline indicators)
- PokerTable (seat management, hand visualization)
- BingoCard (5x5 grid with marking)
- DiceRoller (animated dice)
- ScratchTicket (reveal animation)
- PullTabTicket (progressive reveal)
- SpinWheel (game outcomes)
- CardDealer (poker hand display)

**Layout & Structure:**
- Layout.tsx (main wrapper with sidebar navigation)
- Header (with balance display, notifications, profile)
- Sidebar (with game categories, navigation)
- MobileNav (bottom navigation for mobile)
- PageTransition (fade/slide animations between routes)

**Popups & Modals:**
- ChallengesPopup (shown on login)
- DailyBonusPopup (daily reward notification)
- AchievementUnlockedPopup (celebration animation)
- WinNotificationPopup (big win celebration)
- GameRulesPopup (how to play)
- PromotionBannerPopup (limited-time offers)
- NotificationCenter (message inbox)

**AI Integration:**
- AIChatWidget (bottom-right chat bubble)
- AIStatusIndicator (agent online status)
- AIRecommendationCard (suggested games/bonuses)

#### Styling
- Design tokens in global.css (colors, spacing, typography)
- TailwindCSS for all styling (no CSS files)
- Dark theme (background #020617, text #f8fafc)
- Primary blue (#3b82f6), success green (#22c55e), warning amber (#f59e0b)
- Smooth animations and transitions throughout
- Responsive design (mobile-first)
- Accessibility features (ARIA labels, keyboard navigation)

#### State Management
- Auth Context: { user, isAuthenticated, login, logout, refreshProfile, isAdmin }
- Wallet Hook: { wallet, currency, toggleCurrency, refreshWallet }
- TanStack Query for async data (games, leaderboards, achievements)
- LocalStorage for UI state (sidebar collapsed, preferences)
- SessionStorage for auth tokens

#### Key User Flows
1. **Registration**: Email → Password → Email verify → Optional KYC → Home
2. **Game Play**: Select game → Set bet → Play → Win/Loss → Wallet update
3. **Purchase**: Store → Select pack → Stripe checkout → Webhook confirmation → Balance update
4. **Leaderboard**: View rankings → Compare with friends → Claim ranking bonuses
5. **Achievement**: Complete requirements → Auto-unlock → Notification popup → View in profile
6. **AI Chat**: Click widget → Type message → AI responds → Conversation history

### Backend Features

#### Authentication (6 endpoints)
- `POST /api/auth/register` - Create account (email, password)
- `POST /api/auth/login` - Login (email, password) → JWT token
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/profile` - Get current user (requires JWT)
- `PUT /api/auth/profile` - Update profile (username, avatar)
- `POST /api/auth/logout` - Invalidate token

**Implementation:**
- Passwords hashed with bcrypt (12 rounds)
- JWT issued with 24-hour expiry
- Refresh tokens rotated on each use
- Admin role checked with middleware

#### Wallet System (5 endpoints)
- `GET /api/wallet` - Get balance and transaction history
- `POST /api/wallet/update` - Adjust balance (admin only)
- `GET /api/wallet/transactions` - Paginated transaction log

**Implementation:**
- Dual currency: gc_balance, sc_balance
- All changes logged to wallet_transactions
- Optimistic updates in UI, verified on server
- Currency toggle in UI switches display currency

#### Games (20+ endpoints)
- `GET /api/games` - List all enabled games with filters
- `GET /api/games/:id` - Get game details
- `POST /api/slots/spin` - Execute slot spin (requires auth, bet amount)
- `GET /api/slots/config` - Slot configuration (RTP, bet range)
- `POST /api/poker/join` - Join poker table
- `GET /api/poker/tables` - List available tables
- `POST /api/bingo/buy` - Purchase bingo ticket
- `GET /api/bingo/rooms` - List bingo rooms
- `GET /api/external-games` - List sweepstake games
- `POST /api/games/spin` - Generic spin handler for external games
- `GET /api/games/history` - User's game play history

**Game Logic Implementation:**
- Server-side RNG (no client-side chance)
- Store all results in game_results table
- Immediate wallet transaction on result
- Return result data: { bet, win, result, multiplier, resultDetails }
- Validate bet amount before processing

#### Store (5 endpoints)
- `GET /api/store/packs` - List available Gold Coin packages
- `GET /api/store/config` - Store settings
- `POST /api/store/purchase` - Create Stripe checkout session
- `POST /api/store/webhook` - Stripe webhook (payment confirmation)
- `GET /api/store/history` - User's purchase history

**Payment Flow:**
1. User selects pack → GET packs list
2. POST /api/store/purchase { packId } → Stripe session created
3. Redirect to Stripe checkout
4. Stripe processes payment
5. Webhook POST /api/store/webhook → Update player balance
6. Client queries wallet to confirm balance

#### Leaderboard System (3 endpoints)
- `GET /api/leaderboards?type=weekly_wagered&period=weekly` - Ranked list
- `GET /api/leaderboards/my-rank` - Current user's rank
- `POST /api/leaderboards/update` - Recalculate rankings (admin)

**Calculation Logic:**
- weekly_wagered: SUM(bet_amount) from game_results WHERE created_at > 7 days ago
- top_winners: SUM(win_amount) from game_results WHERE win_amount > 0
- streak: Consecutive days with plays
- Recalculate daily via cron or on-demand

#### Achievements System (5 endpoints)
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/my-achievements` - User's unlocked achievements
- `POST /api/achievements/check` - Check if new achievements unlocked
- `POST /api/achievements/award` - Admin: manually award achievement
- `GET /api/achievements/stats` - Global achievement stats

**Unlock Conditions** (examples):
- "First Win": Complete 1 game with positive result
- "High Roller": Single win > 100 SC
- "Slot Master": Win 50 slot games
- "Poker Pro": Win 100 poker hands
- "Social Butterfly": Join 5 social groups
- Check on each game result, auto-unlock when criteria met

#### Challenges System (4 endpoints)
- `GET /api/challenges` - Active challenges
- `POST /api/challenges/claim` - Claim reward for completed challenge
- `GET /api/challenges/progress` - User's progress on current challenges

**Challenge Types:**
- Daily: Spin 5 games of any type → Reward: 50 GC
- Daily: Win 3 games → Reward: 25 SC
- Weekly: Wager 500 GC → Reward: 100 GC + bonus
- Auto-unlock: Check on every game result, if progress >= target, set completed flag

#### Referral System (5 endpoints)
- `GET /api/referral/link` - Get/create user's referral link
- `POST /api/referral/register` - Register new player with referral code
- `POST /api/referral/claim/complete` - Claim referral bonus (eligibility check)
- `GET /api/referral/stats` - Referral stats (conversions, earnings)
- `GET /api/referral/recent` - Recent referrals

**Flow:**
1. Player A generates unique code (stored in referral_links)
2. Shares link to Player B
3. Player B clicks link, registers with code
4. When Player B reaches deposit/play thresholds:
   - Player A gets bonus (e.g., 25 SC)
   - Player B gets bonus (e.g., 50 GC)
5. Track conversions in referral_links.conversions

#### Admin Dashboard (40+ endpoints)

**Player Management:**
- `GET /api/admin/v2/players` - List all players (paginated, filters)
- `GET /api/admin/v2/players/:id` - Detailed player view
- `PUT /api/admin/v2/players/:id/balance` - Adjust balance
- `PUT /api/admin/v2/players/:id/status` - Suspend/activate
- `GET /api/admin/v2/players/:id/transactions` - Transaction history
- `POST /api/admin/v2/kyc/submit` - Process KYC document
- `POST /api/admin/v2/kyc/:docId/approve` - Approve KYC

**Game Management:**
- `GET /api/admin/v2/games` - List all games
- `POST /api/admin/v2/games` - Create new game
- `PUT /api/admin/v2/games/:id` - Update game (RTP, enabled, etc)
- `DELETE /api/admin/v2/games/:id` - Remove game
- `PATCH /api/admin/v2/games/bulk-update` - Batch updates

**Financial Management:**
- `GET /api/admin/v2/bonuses` - List bonuses
- `POST /api/admin/v2/bonuses` - Create bonus
- `PUT /api/admin/v2/bonuses/:id` - Update bonus
- `GET /api/admin/v2/jackpots` - Manage jackpots
- `GET /api/admin/v2/redemptions` - Sweeps withdrawal requests
- `POST /api/admin/v2/redemptions/:id/approve` - Process redemption

**Analytics:**
- `GET /api/admin/v2/dashboard/stats` - KPIs (players, revenue, GMV)
- `GET /api/admin/v2/dashboard/metrics` - Daily metrics (DAU, retention)
- `GET /api/admin/v2/dashboard/health` - System health
- `GET /api/admin/v2/sales/stats` - Revenue analytics
- `GET /api/admin/v2/sales/top-games` - Best-performing games

**AI Management:**
- `GET /api/admin/ai-employees` - List AI agents and status
- `POST /api/admin/ai-duty` - Assign duties to agents
- `POST /api/admin/ai-status` - Update agent status/task

#### Notifications & Messaging (8 endpoints)
- `POST /api/messages/send` - Send DM or support message
- `GET /api/messages` - Get user's message threads
- `GET /api/messages/unread` - Count unread messages
- `POST /api/messages/read` - Mark message as read
- `GET /api/messages/conversation/:userId` - Full conversation history
- `GET /api/messages/threads` - List all message threads
- `DELETE /api/messages/:id` - Delete message

**Notification Types:**
- Friend requests
- Achievement unlocks
- Leaderboard rank changes
- Admin announcements
- Referral conversions
- Daily bonus reminders
- Promotion alerts

#### AI Chat (4 endpoints)
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/status` - Get AI agent status and load
- `GET /api/ai/conversation/history` - Get chat history
- `GET /api/ai/conversation/sessions` - List chat sessions

**AI Agents Implementation:**
- **LuckyAI** (General Manager): Health checks, platform optimization, welcome messages
- **SecurityAI** (Security): Fraud detection, suspicious activity alerts
- **SlotsAI** (Slots Specialist): RTP optimization, slots tips
- **JoseyAI** (Poker): Poker strategy, odds calculation
- **SocialAI** (Community Manager): Chat moderation, community events
- **PromotionsAI** (Marketing): Personalized bonus recommendations

**AI Features:**
- Integration with Google Generative AI (Gemini API)
- Conversation history stored in ai_conversation_history
- Context-aware responses using player data
- Sentiment analysis on user messages
- Auto-escalation to support for issues
- Scheduled background tasks (every 1-5 minutes per agent)

#### Real-time Updates (Socket.io)
- Player balance updated instantly on game result
- Leaderboard position updates when ranking changes
- Achievement unlock notifications
- Announcements broadcast to all connected users
- Chat messages in-game
- Poker table seat updates
- AI agent status updates to admin dashboard

### Security & Compliance

#### Authentication
- JWT tokens with 24-hour expiry
- Refresh token rotation (new token issued on each refresh)
- Password hashing: bcrypt with 12 rounds
- HTTPS enforced in production
- Secure cookie flags (httpOnly, sameSite)
- CORS configured for frontend origin only

#### Authorization
- Role-based access control (user, admin, super_admin)
- Middleware: verifyPlayer (requires auth), verifyAdmin (requires admin role)
- Field-level authorization (players can only see own data)

#### Data Protection
- SQL parameterized queries (no string interpolation)
- Zod validation on all inputs
- Helmet for security headers
- Rate limiting: 1000 requests/15 minutes per IP
- Request logging for audit trail

#### Compliance
- KYC process: Email → ID → Address → Approval
- AML checks: Flag high-risk transactions
- Responsible gaming: Deposit limits, session time warnings
- GDPR: Data export, deletion requests
- Data retention: Archive old records periodically
- Audit logging: All admin actions logged with admin_id, timestamp, action

### Key Implementation Details

#### Game RNG (Random Number Generator)
```typescript
// Server-side only, stored for audit
const random = Math.random();
const isWin = random < (rtp / 100);
const multiplier = calculateMultiplier(random);
const payout = bet * multiplier;

// Store in game_results for verification
await logGameResult({
  playerId, gameId, bet, payout, random, isWin, timestamp
});

// Return to client
return { isWin, payout, resultData };
```

#### Wallet Transaction
```typescript
// 1. Validate balance
if (balance < bet) throw "Insufficient balance";

// 2. Execute game with server-side RNG
const result = executeGame(bet, gameConfig);

// 3. Create transaction
const newBalance = balance - bet + result.payout;
await createTransaction({
  playerId, type: 'game', amount: result.payout - bet, newBalance
});

// 4. Update player balance
await updatePlayerBalance(playerId, newBalance);

// 5. Return to client with new balance
return { result, newBalance };
```

#### Payment Processing
```typescript
// Purchase flow
POST /api/store/purchase { packId }
1. Get pack details
2. Create Stripe session
3. Return sessionId to client
4. Client redirects to Stripe checkout

// Webhook (Stripe → Server)
POST /api/store/webhook
1. Verify webhook signature
2. Check payment_intent.status === 'succeeded'
3. Get amount and customer
4. Find player by Stripe customer ID
5. Add gold coins to balance
6. Create transaction record
7. Send confirmation email

// Client confirmation
// After redirect back:
GET /api/wallet
// Shows updated balance
```

#### AI Chat Flow
```typescript
POST /api/ai/chat { message, sessionId }
1. Validate user authenticated
2. Get conversation history (last 20 messages)
3. Format prompt with player context (name, level, recent wins)
4. Call Google Generative AI API
5. Store message in ai_conversation_history
6. Update ai_agent_status with metrics
7. Emit Socket.io event to update UI
8. Return response to client

Features:
- Context-aware (knows player's stats, preferences)
- Can recommend games based on recent plays
- Can explain game rules
- Can help troubleshoot account issues
- Escalates to support if needed (creates support ticket)
```

### Deployment & DevOps

#### Local Development
```bash
pnpm install
pnpm dev          # Starts Vite + Express on port 8080
# Client: http://localhost:5173
# API: http://localhost:8080/api/*
```

#### Production Build
```bash
pnpm build
# Outputs:
# dist/spa/        - Client static files
# dist/server/     - Backend compiled files
```

#### Environment Variables (Required)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
GOOGLE_AI_API_KEY=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

#### Database Initialization
```bash
# Create tables (auto-run on server start)
node scripts/db-init.js

# Run migrations
node scripts/migrate.js

# Seed initial data
node scripts/seed.js
```

### Testing Strategy

#### Unit Tests
- Game outcome calculation (RNG fairness)
- Wallet math (addition, subtraction, validation)
- Auth token generation/verification
- Leaderboard ranking calculation
- Achievement unlock logic

#### Integration Tests
- Full game flow: login → bet → win → balance update
- Store purchase: Stripe webhook → balance confirmation
- Leaderboard: game results → ranking update
- AI chat: message → response → history

#### E2E Tests (User journeys)
- New player: register → tutorial → first game → profile
- Game play: select game → set bet → play → see result
- Store: view packs → purchase → see balance updated
- Admin: login → view dashboard → manage player → apply change

#### Load Testing
- Concurrent players: 1000+ simultaneous connections
- Game spin latency: < 500ms
- Leaderboard query: < 1s for top 100
- Database pool: minimum 10, maximum 50 connections

### Performance Optimization

#### Frontend
- Code splitting by route
- Lazy loading heavy components (3D games)
- Image compression (WebP, AVIF)
- Service worker for offline support
- Memoization of expensive components
- Debounce/throttle event handlers

#### Backend
- Database connection pooling (pg-pool)
- Query optimization with indexes
- Caching layer for leaderboards (Redis optional)
- Background job queue for async tasks
- Response compression (gzip)
- CDN for static assets

#### Database
- Indexes on frequently queried columns:
  - player_id, game_id (on game_results)
  - created_at (for time range queries)
  - player_id, status (on players)
- Partitioning large tables by date
- Archive old data monthly
- Connection pooling with pg-pool

### Monitoring & Observability

#### Logging
- Request logging: method, endpoint, response code, duration
- Error logging: stack trace, context, severity
- Database slow query logs (> 100ms)
- AI API call logs: tokens used, latency

#### Metrics
- Server uptime / availability
- API response times (p50, p95, p99)
- Database connection pool usage
- Error rates by endpoint
- Active player count
- Game play frequency

#### Alerts
- Database connection pool exhausted
- API error rate > 1%
- Game results with invalid RNG
- Payment webhook failures
- AI API rate limit exceeded
- Server disk space > 80%

### Monitoring Setup Recommendations
- Error tracking: Sentry
- APM: New Relic or DataDog
- Metrics: Prometheus + Grafana
- Logs: ELK Stack or CloudWatch
- Uptime: StatusPage.io

---

## Build Instructions

### Step 1: Setup Repository
```bash
git init coinkrazy-platform
cd coinkrazy-platform
pnpm init
```

### Step 2: Install Dependencies
```bash
pnpm add react react-dom react-router-dom typescript vite
pnpm add -D @vitejs/plugin-react-swc @types/react @types/react-dom
pnpm add express @types/express pg bcrypt jsonwebtoken
pnpm add tailwindcss postcss autoprefixer @tailwindcss/typography
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu ...
pnpm add stripe axios socket.io socket.io-client zod react-hook-form
pnpm add @google/generative-ai helmet cors multer dotenv
```

### Step 3: Create Directory Structure
```bash
# Frontend
mkdir -p client/{pages,components/{ui,games,popups},hooks,lib}
mkdir client/components/ui client/components/games client/components/popups

# Backend
mkdir -p server/{routes,middleware,db,services,validation}

# Config
mkdir shared
```

### Step 4: Implement Files
1. Start with `tsconfig.json` and build configs
2. Implement database schema and initialization
3. Build authentication system
4. Create basic pages and routes
5. Implement game endpoints
6. Add real-time Socket.io
7. Build admin dashboard
8. Integrate AI features
9. Add testing suite
10. Deploy

### Step 5: Testing
```bash
pnpm test                  # Run unit tests
pnpm typecheck            # Verify types
pnpm build                # Build for production
pnpm start                # Run production build locally
```

---

## Customization Points

### Adding a Game Type
1. Create table in database (e.g., `scratch_tickets`)
2. Add route handler in `server/routes/scratch-tickets.ts`
3. Create React page `client/pages/ScratchTickets.tsx`
4. Add game component `client/components/games/ScratchTicket.tsx`
5. Register route in `client/App.tsx`
6. Add to sidebar navigation in `Layout.tsx`
7. Create admin management endpoint

### Adding Payment Method
1. Register with payment provider (Stripe/Square/etc)
2. Add route handler for webhook
3. Update store purchase flow
4. Add payment method selection UI
5. Test webhook signature validation

### Configuring AI Agents
1. Edit `AIService.startAIProcesses()` in `server/services/ai-service.ts`
2. Define agent behavior (what to optimize, monitoring intervals)
3. Set Google AI system prompts
4. Configure response templates
5. Schedule background tasks

### Changing Design Theme
1. Edit color tokens in `tailwind.config.ts`
2. Update `client/global.css` for design tokens
3. Modify component variants in `client/components/ui/*`
4. Test across all pages for consistency

---

## Success Criteria

Your implementation is complete when:

✅ User Registration
- [ ] Users can create account with email/password
- [ ] Passwords hashed with bcrypt
- [ ] Email verification implemented
- [ ] Auto-login after registration

✅ Authentication
- [ ] JWT tokens issued on login (24hr expiry)
- [ ] Refresh tokens rotate on use
- [ ] Protected routes require authentication
- [ ] Logout clears tokens

✅ Games
- [ ] All 7 game types playable (slots, poker, bingo, dice, scratch, pull tabs, sports)
- [ ] Server-side RNG for fairness
- [ ] Results stored in database
- [ ] Wallet updates immediately
- [ ] Game history available

✅ Wallet System
- [ ] Dual currency (GC and SC)
- [ ] Balance updates on game results
- [ ] Transaction history visible
- [ ] Currency toggle in header

✅ Store & Payments
- [ ] Gold Coin packages listed with prices
- [ ] Stripe integration functional
- [ ] Webhook confirms payment
- [ ] Balance updates after purchase

✅ Social Features
- [ ] Leaderboards rank players correctly
- [ ] Achievements unlock automatically
- [ ] Challenges track progress
- [ ] Referral bonuses awarded

✅ Admin Dashboard
- [ ] View all KPIs (players, revenue, GMV)
- [ ] Manage players (balance, suspend, KYC)
- [ ] Configure games (RTP, enable/disable)
- [ ] Distribute bonuses
- [ ] Monitor AI agents

✅ AI Integration
- [ ] AI chat widget responsive and functional
- [ ] Conversation history stored
- [ ] AI agents perform scheduled tasks
- [ ] Recommendations personalized

✅ Real-time
- [ ] Socket.io connected and functional
- [ ] Balance updates broadcast
- [ ] Notifications delivered instantly
- [ ] Leaderboard updates real-time

✅ Security
- [ ] All passwords hashed
- [ ] SQL injection prevented
- [ ] XSS protection active
- [ ] Rate limiting enforced
- [ ] Admin routes protected

✅ Performance
- [ ] Page load < 2 seconds
- [ ] Game spin response < 500ms
- [ ] Leaderboard query < 1 second
- [ ] Database pooling configured

✅ Testing
- [ ] Unit tests for critical functions
- [ ] Integration tests for flows
- [ ] E2E tests for user journeys
- [ ] Load tests for 1000+ concurrent users

✅ Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Deployment guide written
- [ ] Environment variables documented

---

## Support & Troubleshooting

### Common Issues

**"TypeError: Failed to fetch"**
- Check API server is running
- Verify database connection
- Check firewall/CORS settings
- Review server logs for errors

**Game results not saving**
- Verify game_results table exists
- Check database connection pool
- Review transaction creation
- Check player balance update logic

**Leaderboards not updating**
- Verify leaderboards table has entries
- Check leaderboard calculation logic
- Run manual update via admin
- Review cron job/schedule

**Payment not processed**
- Verify Stripe webhook endpoint registered
- Check webhook signature validation
- Review Stripe logs for errors
- Test webhook locally with Stripe CLI

**AI not responding**
- Check Google AI API key valid
- Verify API quota available
- Check conversation history table
- Review API response logs

---

## Conclusion

This is a complete, production-ready specification for building CoinKrazy AI platform. It includes:

✅ Full-stack architecture (React + Node.js + PostgreSQL)
✅ 100+ API endpoints
✅ 7 game types
✅ Dual currency system
✅ Social features (leaderboards, achievements, challenges)
✅ AI integration (6 agents, chat support)
✅ Admin dashboard with 40+ features
✅ Payment processing (Stripe/Square)
✅ Real-time updates (Socket.io)
✅ Security & compliance (KYC, AML, responsible gaming)
✅ Testing strategy
✅ Deployment guide
✅ Performance optimization

**Estimated Development Time:** 
- Solo developer: 3-4 months
- Small team (3-4): 6-8 weeks
- Team of 6+: 3-4 weeks

**Deployment Options:**
- Frontend: Netlify, Vercel, AWS S3 + CloudFront
- Backend: Heroku, AWS EC2, DigitalOcean, Railway
- Database: AWS RDS PostgreSQL, Heroku Postgres, Neon
- Real-time: Socket.io on same server or separate
- Storage: AWS S3 or local multer

Good luck building CoinKrazy AI! 🚀
