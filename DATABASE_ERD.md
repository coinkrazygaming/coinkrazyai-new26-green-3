# CoinKrazy AI Database ERD

This document contains the Entity Relationship Diagram for the complete database schema in Mermaid format.

## Mermaid ERD Visualization

```mermaid
erDiagram
    PLAYERS ||--o{ WALLET_TRANSACTIONS : makes
    PLAYERS ||--o{ GAME_RESULTS : plays
    PLAYERS ||--o{ LEADERBOARDS : appears_on
    PLAYERS ||--o{ ACHIEVEMENTS : unlocks
    PLAYERS ||--o{ PLAYER_ACHIEVEMENTS : completes
    PLAYERS ||--o{ PLAYER_CHALLENGES : completes
    PLAYERS ||--o{ CHALLENGES : undertakes
    PLAYERS ||--o{ REFERRAL_LINKS : creates
    PLAYERS ||--o{ USER_MESSAGES : sends
    PLAYERS ||--o{ USER_MESSAGES : receives
    PLAYERS ||--o{ PURCHASES : makes
    PLAYERS ||--o{ PLAYER_VIP : has
    PLAYERS ||--o{ SUPPORT_TICKETS : creates
    PLAYERS ||--o{ AI_CONVERSATION_HISTORY : chats_with

    GAMES ||--o{ GAME_RESULTS : played_in
    GAMES ||--o{ GAME_CONFIG : configured_by
    GAMES ||--o{ GAME_COMPLIANCE : governed_by

    STORE_PACKS ||--o{ PURCHASES : included_in

    ADMIN_USERS ||--o{ SECURITY_ALERTS : resolves
    ADMIN_USERS ||--o{ SUPPORT_TICKETS : manages
    ADMIN_USERS ||--o{ SYSTEM_LOGS : creates
    ADMIN_USERS ||--o{ SUPPORT_TICKET_MESSAGES : sends

    VIP_TIERS ||--o{ PLAYER_VIP : defines

    AI_EMPLOYEES ||--o{ AI_AGENT_STATUS : has_status
    AI_EMPLOYEES ||--o{ AI_CONVERSATION_HISTORY : responds_in

    ACHIEVEMENT_CATEGORIES ||--o{ ACHIEVEMENTS : categorizes

    CHALLENGE_CATEGORIES ||--o{ CHALLENGES : categorizes

    BONUSES ||--o{ BONUS_RECIPIENTS : targets

    JACKPOTS ||--o{ JACKPOT_WINNERS : has

    SUPPORT_TICKETS ||--o{ SUPPORT_TICKET_MESSAGES : contains

    FRAUD_PATTERNS ||--o{ FRAUD_FLAGS : detects

    SOCIAL_GROUPS ||--o{ SOCIAL_GROUP_MEMBERS : contains
    SOCIAL_GROUPS ||--o{ PLAYERS : created_by

    RETENTION_CAMPAIGNS ||--o{ PLAYERS : targets

    AFFILIATE_PARTNERS ||--o{ AFFILIATE_LINKS : has
    AFFILIATE_PARTNERS ||--o{ AFFILIATE_REFERRALS : manages

    REFERRAL_LINKS ||--o{ REFERRAL_CLAIMS : targets

    SPORTS_EVENTS ||--o{ SPORTS_BETS : has

    PROVIDER_GAMES ||--o{ GAMES : syncs_to

    PLAYERS {
        int id PK
        string email UK
        string username UK
        string password_hash
        string avatar_url
        decimal gc_balance
        decimal sc_balance
        decimal total_wagered
        string vip_status
        boolean kyc_verified
        jsonb kyc_documents
        string status
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }

    GAMES {
        int id PK
        string name
        string type
        string category
        string provider
        string slug UK
        text description
        string image_url
        string thumbnail
        decimal rtp
        decimal min_bet
        decimal max_bet
        boolean enabled
        boolean featured
        boolean is_branded_popup
        jsonb branding_config
        string launch_url
        string embed_url
        timestamp created_at
        timestamp updated_at
    }

    GAME_RESULTS {
        int id PK
        int player_id FK
        int game_id FK
        string game_type
        decimal bet_amount
        decimal win_amount
        string result
        decimal multiplier
        jsonb result_data
        timestamp created_at
    }

    WALLET_TRANSACTIONS {
        int id PK
        int player_id FK
        string transaction_type
        decimal gc_amount
        decimal sc_amount
        text description
        decimal balance_before_gc
        decimal balance_after_gc
        decimal balance_before_sc
        decimal balance_after_sc
        timestamp created_at
    }

    STORE_PACKS {
        int id PK
        string title
        int gold_coins
        decimal bonus_sc
        decimal price_usd
        int position
        boolean featured
        boolean enabled
        string stripe_product_id
        timestamp created_at
    }

    PURCHASES {
        int id PK
        int player_id FK
        int pack_id FK
        decimal amount_usd
        int gold_coins
        decimal sweeps_coins
        string payment_method
        string payment_id
        string status
        timestamp created_at
    }

    LEADERBOARDS {
        int id PK
        int player_id FK
        string rank_type
        int points
        int rank
        string period
        timestamp created_at
    }

    ACHIEVEMENTS {
        int id PK
        string name
        text description
        string icon
        string category
        int points
        jsonb requirement_data
        boolean enabled
        timestamp created_at
    }

    ACHIEVEMENT_CATEGORIES {
        int id PK
        string name
        string description
    }

    PLAYER_ACHIEVEMENTS {
        int id PK
        int player_id FK
        int achievement_id FK
        timestamp unlocked_at
    }

    CHALLENGES {
        int id PK
        string name
        text description
        string category
        string reward_type
        decimal reward_amount
        int progress_target
        jsonb requirements
        boolean enabled
        timestamp created_at
    }

    CHALLENGE_CATEGORIES {
        int id PK
        string name
        string description
    }

    PLAYER_CHALLENGES {
        int id PK
        int player_id FK
        int challenge_id FK
        int progress
        boolean completed
        boolean claimed
        timestamp created_at
        timestamp completed_at
        timestamp claimed_at
    }

    REFERRAL_LINKS {
        int id PK
        int player_id FK
        string unique_code UK
        int clicks
        int conversions
        decimal total_referral_bonus
        timestamp created_at
    }

    REFERRAL_CLAIMS {
        int id PK
        int referral_link_id FK
        int referred_player_id FK
        string status
        decimal reward_amount
        timestamp claimed_at
    }

    USER_MESSAGES {
        int id PK
        int from_player_id FK
        int to_player_id FK
        text message_text
        boolean is_read
        string message_type
        timestamp read_at
        timestamp created_at
    }

    ADMIN_USERS {
        int id PK
        string email UK
        string password_hash
        string name
        string role
        jsonb permissions
        timestamp last_login
        timestamp created_at
    }

    CASINO_SETTINGS {
        string setting_key PK
        text setting_value
        string data_type
        text description
        timestamp updated_at
        int updated_by FK
    }

    AI_EMPLOYEES {
        string id PK
        string name
        string role
        string status
        jsonb duties
        timestamp created_at
    }

    AI_AGENT_STATUS {
        int id PK
        string agent_id UK FK
        string agent_name
        string status
        string current_task
        int total_conversations
        int average_response_time_ms
        timestamp last_activity_at
        timestamp created_at
        timestamp updated_at
    }

    AI_CONVERSATION_HISTORY {
        int id PK
        int player_id FK
        string session_id
        string agent_id FK
        string agent_name
        string message_type
        text message_content
        jsonb message_metadata
        string sentiment
        int context_tokens
        int response_time_ms
        timestamp created_at
        timestamp updated_at
    }

    AI_CONVERSATION_SESSIONS {
        int id PK
        string session_id UK
        int player_id FK
        string title
        string topic
        text context_summary
        int total_messages
        int total_context_tokens
        int rating
        text feedback
        string status
        timestamp created_at
        timestamp updated_at
        timestamp last_interaction_at
    }

    PLAYER_VIP {
        int player_id PK FK
        int vip_tier_id FK
        int vip_points
        decimal month_wagered
        timestamp promoted_at
        timestamp expires_at
        text notes
    }

    VIP_TIERS {
        int id PK
        string name
        int level UK
        decimal min_wagered
        decimal reload_bonus_percentage
        decimal birthday_bonus
        jsonb exclusive_games
        boolean priority_support
        jsonb requirements
        jsonb benefits
        timestamp created_at
    }

    SUPPORT_TICKETS {
        int id PK
        int player_id FK
        string subject
        text description
        string status
        string priority
        string category
        int assigned_admin_id FK
        timestamp last_message_at
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    SUPPORT_TICKET_MESSAGES {
        int id PK
        int ticket_id FK
        int sender_id
        string sender_type
        text message
        boolean is_read
        timestamp created_at
    }

    BONUSES {
        int id PK
        string name
        string bonus_type
        decimal amount_gc
        decimal amount_sc
        decimal wagering_multiplier
        timestamp expiry_date
        timestamp created_at
    }

    BONUS_RECIPIENTS {
        int id PK
        int bonus_id FK
        int player_id FK
        timestamp awarded_at
        boolean claimed
    }

    JACKPOTS {
        int id PK
        string name
        decimal current_amount
        string contributed_from
        string status
        int last_winner_id FK
        timestamp last_won_at
        timestamp created_at
    }

    JACKPOT_WINNERS {
        int id PK
        int jackpot_id FK
        int player_id FK
        decimal amount_won
        timestamp won_at
    }

    GAME_CONFIG {
        int id PK
        int game_id FK
        string config_key
        text config_value
        timestamp created_at
        timestamp updated_at
    }

    GAME_COMPLIANCE {
        int id PK
        int game_id FK
        decimal max_win_amount
        string compliance_level
        jsonb restrictions
        timestamp created_at
    }

    SECURITY_ALERTS {
        int id PK
        string alert_type
        string severity
        string title
        text message
        int player_id FK
        string status
        int resolved_by FK
        timestamp created_at
    }

    FRAUD_PATTERNS {
        int id PK
        string pattern_name
        text description
        string rule_type
        decimal threshold_value
        string action
        string severity
        boolean is_active
        timestamp created_at
    }

    FRAUD_FLAGS {
        int id PK
        int player_id FK
        int pattern_id FK
        text reason
        string status
        text resolution_notes
        timestamp resolved_at
        int resolved_by FK
        timestamp created_at
    }

    SYSTEM_LOGS {
        int id PK
        int admin_id FK
        int player_id FK
        string action
        string resource_type
        string resource_id
        text details
        jsonb new_values
        string ip_address
        string status
        timestamp created_at
    }

    SOCIAL_GROUPS {
        int id PK
        string name
        text description
        string image_url
        boolean is_private
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }

    SOCIAL_GROUP_MEMBERS {
        int group_id FK
        int player_id FK
        string role
        timestamp joined_at
    }

    RETENTION_CAMPAIGNS {
        int id PK
        string name
        text description
        string type
        string trigger_event
        string reward_type
        decimal reward_amount
        jsonb target_criteria
        string status
        boolean enabled
        timestamp start_date
        timestamp end_date
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }

    AFFILIATE_PARTNERS {
        int id PK
        string name
        string email UK
        string phone
        string website
        string status
        decimal commission_percentage
        int approved_by FK
        timestamp approved_at
        timestamp created_at
    }

    AFFILIATE_LINKS {
        int id PK
        int affiliate_id FK
        string unique_code UK
        int clicks
        int conversions
        timestamp created_at
    }

    AFFILIATE_REFERRALS {
        int id PK
        int affiliate_id FK
        int player_id FK
        decimal total_wagered
        decimal commission_earned
        timestamp joined_at
    }

    SPORTS_EVENTS {
        int id PK
        string external_event_id
        string sport_type
        string event_name
        string home_team
        string away_team
        timestamp start_time
        string status
        decimal home_odds
        decimal away_odds
        string result
        timestamp created_at
    }

    SPORTS_BETS {
        int id PK
        int player_id FK
        int sports_event_id FK
        string bet_type
        decimal amount
        decimal odds
        decimal potential_winnings
        decimal actual_winnings
        string status
        timestamp settled_at
        timestamp created_at
    }

    PROVIDER_GAMES {
        int id PK
        string external_game_id
        int game_id FK
        string provider_name
        string sync_status
        timestamp last_sync_at
    }
```

## Table Relationships Summary

### Core Players Ecosystem
- **PLAYERS** - Central entity, all user data
- **WALLET_TRANSACTIONS** - Complete ledger of all balance changes
- **GAME_RESULTS** - Every game play outcome
- **PURCHASES** - All store transactions

### Competition & Recognition
- **LEADERBOARDS** - Player rankings by multiple types
- **ACHIEVEMENTS** - Global achievement definitions
- **PLAYER_ACHIEVEMENTS** - Track individual unlocks
- **CHALLENGES** - Dynamic task system
- **PLAYER_CHALLENGES** - Track challenge progress

### Social Features
- **REFERRAL_LINKS** - Each player's referral code
- **REFERRAL_CLAIMS** - Referral bonus tracking
- **USER_MESSAGES** - Direct messaging between players
- **SOCIAL_GROUPS** - Community spaces
- **SOCIAL_GROUP_MEMBERS** - Group membership

### Games & Entertainment
- **GAMES** - Game catalog (500+ games)
- **GAME_RESULTS** - Play history and outcomes
- **GAME_CONFIG** - Per-game configuration
- **GAME_COMPLIANCE** - Regulatory restrictions
- **PROVIDER_GAMES** - 3rd party game mapping

### Financial Management
- **STORE_PACKS** - Gold Coin package definitions
- **PURCHASES** - Purchase records
- **BONUSES** - Promotional bonuses
- **BONUS_RECIPIENTS** - Bonus distribution tracking
- **JACKPOTS** - Progressive jackpot system
- **REDEMPTION_REQUESTS** - Sweeps withdrawal requests

### AI & Automation
- **AI_EMPLOYEES** - 6 AI agents
- **AI_AGENT_STATUS** - Real-time agent metrics
- **AI_CONVERSATION_HISTORY** - Chat history
- **AI_CONVERSATION_SESSIONS** - Chat session tracking

### VIP & Loyalty
- **VIP_TIERS** - VIP tier definitions
- **PLAYER_VIP** - VIP status tracking
- **RETENTION_CAMPAIGNS** - Player retention programs

### Support & Moderation
- **SUPPORT_TICKETS** - Customer support tickets
- **SUPPORT_TICKET_MESSAGES** - Ticket conversation history
- **SECURITY_ALERTS** - Security incidents
- **FRAUD_PATTERNS** - Fraud detection rules
- **FRAUD_FLAGS** - Flagged suspicious accounts
- **SYSTEM_LOGS** - Admin action audit trail

### Administration
- **ADMIN_USERS** - Admin accounts and roles
- **CASINO_SETTINGS** - Platform configuration

### Partnerships
- **AFFILIATE_PARTNERS** - Affiliate program partners
- **AFFILIATE_LINKS** - Affiliate tracking codes
- **AFFILIATE_REFERRALS** - Affiliate conversion tracking

### Sports Betting
- **SPORTS_EVENTS** - Live/upcoming sports events
- **SPORTS_BETS** - Player sports bets

## Key Foreign Keys

| Foreign Key | References | Purpose |
|---|---|---|
| player_id | PLAYERS | Associate records with players |
| game_id | GAMES | Link to game definitions |
| admin_id | ADMIN_USERS | Track admin actions |
| ticket_id | SUPPORT_TICKETS | Link messages to tickets |
| achievement_id | ACHIEVEMENTS | Link unlocks to achievement definitions |
| challenge_id | CHALLENGES | Link progress to challenges |
| affiliate_id | AFFILIATE_PARTNERS | Link referrals to partners |
| vip_tier_id | VIP_TIERS | Link VIP status to tier benefits |
| agent_id | AI_EMPLOYEES | Track AI agent activity |
| sports_event_id | SPORTS_EVENTS | Link bets to events |

## Indexes for Performance

### Primary Indexes (on Primary Keys)
- PLAYERS.id
- GAMES.id
- GAME_RESULTS.id
- WALLET_TRANSACTIONS.id
- etc.

### Foreign Key Indexes
- GAME_RESULTS.player_id
- GAME_RESULTS.game_id
- WALLET_TRANSACTIONS.player_id
- LEADERBOARDS.player_id
- PLAYER_ACHIEVEMENTS.player_id
- PLAYER_CHALLENGES.player_id
- PLAYER_VIP.player_id
- USER_MESSAGES.from_player_id
- USER_MESSAGES.to_player_id
- SUPPORT_TICKETS.player_id
- AI_CONVERSATION_HISTORY.player_id
- SPORTS_BETS.player_id

### Search Indexes
- PLAYERS.email (UNIQUE)
- PLAYERS.username (UNIQUE)
- GAMES.slug (UNIQUE)
- GAMES.enabled
- GAMES.featured
- REFERRAL_LINKS.unique_code (UNIQUE)
- AFFILIATE_LINKS.unique_code (UNIQUE)
- ADMIN_USERS.email (UNIQUE)

### Performance Indexes
- GAME_RESULTS.created_at (for time range queries)
- WALLET_TRANSACTIONS.created_at (for ledger queries)
- LEADERBOARDS.rank_type, period (for ranking queries)
- SUPPORT_TICKETS.status (for admin filtering)
- PLAYER_ACHIEVEMENTS.unlocked_at (for recent unlocks)
- PLAYER_CHALLENGES.player_id, challenge_id (for progress tracking)

## Partitioning Strategy

For production at scale:

### GAME_RESULTS Table
```sql
-- Partition by date (monthly)
CREATE TABLE game_results_2024_01 PARTITION OF game_results
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### WALLET_TRANSACTIONS Table
```sql
-- Partition by date (monthly)
CREATE TABLE wallet_transactions_2024_01 PARTITION OF wallet_transactions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### LEADERBOARDS Table
```sql
-- Partition by period (weekly/monthly/alltime)
CREATE TABLE leaderboards_weekly PARTITION OF leaderboards
    WHERE period = 'weekly';
```

## Archival & Cleanup Strategy

### Weekly Tasks
- Archive GAME_RESULTS older than 6 months
- Archive WALLET_TRANSACTIONS older than 1 year
- Clean up old AI_CONVERSATION_HISTORY (keep 3 months)

### Monthly Tasks
- Analyze and reindex large tables
- Update materialized views for leaderboards
- Generate admin reports

### Quarterly Tasks
- Full backup
- Performance audit
- Capacity planning

## Connection Pooling

Recommended settings:
- Minimum connections: 10
- Maximum connections: 50
- Idle timeout: 10 seconds
- Connection timeout: 5 seconds
- Max lifetime: 30 minutes

## Monitoring Queries

### Table Sizes
```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Slow Queries (> 100ms)
```sql
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

### Index Usage
```sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Table Bloat
```sql
SELECT schemaname, tablename, 
       ROUND(100 * pg_total_relation_size(schemaname||'.'||tablename) / 
       (SELECT sum(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables)::numeric, 2) AS percent
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Visual Notes

### Cardinality Notation
- `||` = one
- `o{` = zero or one
- `||--||` = one to one
- `||--o{` = one to many
- `o{--o{` = many to many

### Color Coding (Conceptual)
- **Blue** - Core player data
- **Green** - Games and entertainment
- **Orange** - Financial/transactions
- **Purple** - Social features
- **Red** - Admin/security
- **Yellow** - AI/automation

This ERD represents the complete production database for CoinKrazy AI platform with all relationships, constraints, and best practices for a social gaming platform at scale.
