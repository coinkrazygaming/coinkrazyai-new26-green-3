/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// ===== AUTHENTICATION =====
export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    player: PlayerProfile;
  };
}

// ===== PLAYER & WALLET =====
export interface PlayerProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  gc_balance: number;
  sc_balance: number;
  status: string;
  kyc_level: string;
  kyc_verified: boolean;
  join_date: string;
  last_login?: string;
  avatar_url?: string;
  created_at?: string;
  password?: string;
  // Admin fields
  isAdmin?: boolean;
  role?: string;
  // Stats & VIP
  total_wagered?: number;
  total_won?: number;
  games_played?: number;
  vip_tier?: string;
}

export interface Wallet {
  goldCoins: number;
  sweepsCoins: number;
}

export interface GCPack {
  id: number;
  title: string;
  description: string;
  price_usd: number;
  gold_coins: number;
  sweeps_coins: number;
  bonus_sc: number;
  bonus_percentage: number;
  is_popular: boolean;
  is_best_value: boolean;
}

export interface StorePack extends GCPack {
  enabled: boolean;
  display_order: number;
}

export interface PurchaseRequest {
  pack_id: number;
  payment_method: 'stripe' | 'square';
  payment_token?: string;
}

export interface Transaction {
  id: number;
  type: string;
  gc_amount?: number;
  sc_amount?: number;
  gc_balance_after?: number;
  sc_balance_after?: number;
  description?: string;
  created_at: string;
}

// ===== GAMES =====
export type GameType = 'slots' | 'poker' | 'bingo' | 'sportsbook';

export interface GameInfo {
  id: string | number;
  type: GameType;
  name: string;
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
  category?: string;
  rtp?: number;
  volatility?: string;
  active_users?: number;
  activePlayers?: number;
}

// ===== SLOT GAMES =====
export interface SlotGame {
  id: string | number;
  title: string;
  provider: string;
  image: string;
  gameUrl: string;
  launchUrl?: string;
  badges: ('New' | 'Buy Bonus' | 'Classic')[];
  releaseDate?: string;
  slug?: string;
  thumbnail?: string;
}

export interface GameMetadata {
  id: number;
  name: string;
  category: string;
  provider: string;
  description: string;
  image_url?: string;
  embed_url?: string;
  launch_url?: string;
  rtp: number;
  volatility: 'Low' | 'Medium' | 'High';
  max_paylines?: number;
  theme?: string;
  release_date?: string;
  provider_game_id?: string;
  game_rating: number;
  total_ratings: number;
  download_count: number;
  is_featured: boolean;
  is_new: boolean;
  min_bet?: number;
  max_bet?: number;
  features?: GameFeature[];
  themes?: GameTheme[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameFeature {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
}

export interface GameTheme {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
}

export interface GameRating {
  id: number;
  game_id: number;
  player_id?: number;
  rating: number;
  comment?: string;
  helpful_count: number;
  created_at: string;
}

export interface GameStatistics {
  game_id: number;
  total_plays: number;
  total_wagered: number;
  total_winnings: number;
  average_win: number;
  updated_at: string;
}

// ===== SLOTS =====
export interface SlotsSpinRequest {
  game_id: number;
  bet_amount: number;
}

export interface SlotsSpinResult {
  symbols: string[];
  bet_amount: number;
  winnings: number;
  multiplier: number;
  isWin: boolean;
  wallet: Wallet;
}

// ===== CASINO =====
export interface CasinoPlayResponse {
  game_id: string | number;
  bet_amount: number;
  winnings: number;
  result: 'win' | 'loss';
  new_balance: number;
  wallet: Wallet;
}

// ===== POKER =====
export interface PokerTable {
  id: number;
  name: string;
  stakes: string;
  max_players: number;
  current_players: number;
  buy_in_min: number;
  buy_in_max: number;
  status: string;
}

export interface PokerJoinRequest {
  table_id: number;
  buy_in: number;
}

// ===== BINGO =====
export interface BingoGame {
  id: number;
  name: string;
  pattern: string;
  players: number;
  ticket_price: number;
  jackpot: number;
  status: string;
}

export interface BingoBuyTicketRequest {
  game_id: number;
}

// ===== SPORTSBOOK =====
export interface SportsEvent {
  id: number;
  sport: string;
  event_name: string;
  event_date?: string;
  status: string;
  total_bets?: number;
  line_movement?: string;
  locked?: boolean;
  odds?: number;
}

export interface SportsBetRequest {
  event_id: number;
  bet_type: 'single' | 'parlay';
  amount: number;
  odds: number;
}

export interface SportsBet {
  id: number;
  event_id: number;
  bet_type: string;
  amount: number;
  odds: number;
  status: string;
  potential_winnings: number;
  actual_winnings?: number;
  created_at: string;
}

// ===== ACHIEVEMENTS =====
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  badge_name: string;
  requirement_type: string;
  requirement_value: number;
}

// ===== LEADERBOARD =====
export interface LeaderboardEntry {
  player_id: number;
  username: string;
  name: string;
  rank: number;
  score: number;
  period: string;
}

// ===== ADMIN =====
export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'monitoring';
  lastReport: string;
  tasks: string[];
}

// ===== RESPONSES =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WalletResponse {
  gc_balance: number;
  sc_balance: number;
  last_updated: string;
}

// ===== TICKET GAMES =====
export interface TicketPurchaseResponse {
  success: boolean;
  data?: {
    ticket_id: string;
    design_id: number;
    cost_sc: number;
    slots: any[];
  };
  error?: string;
}

export interface TicketRevealResponse {
  success: boolean;
  data?: {
    slot_index: number;
    revealed: any;
    is_winner: boolean;
    prize_sc: number;
  };
  error?: string;
}

export interface TicketClaimResponse {
  success: boolean;
  data?: {
    prize_sc: number;
    new_balance: number;
  };
  error?: string;
}

// ===== GAME PROVIDER AGGREGATION =====
export interface GameProvider {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_enabled: boolean;
  status: 'inactive' | 'connected' | 'syncing' | 'error';
  last_sync_at?: string;
  total_games: number;
  supports_live_sync: boolean;
  sync_interval_minutes: number;
  authentication_type: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderGame {
  id: number;
  provider_id: number;
  game_id: number;
  provider_game_id: string;
  provider_game_name?: string;
  is_active: boolean;
  last_synced_at?: string;
}

export interface GameImportHistory {
  id: number;
  import_type: string;
  provider?: string;
  games_imported: number;
  total_games_imported?: number;
  games_updated?: number;
  total_games_updated?: number;
  games_failed?: number;
  total_games_skipped?: number;
  source_url?: string;
  import_log?: Record<string, any>;
  import_duration_seconds?: number;
  error_message?: string;
  status: 'completed' | 'in_progress' | 'failed';
  started_at: string;
  completed_at?: string;
  imported_by?: number;
  created_at: string;
}

export interface ProviderCreateRequest {
  name: string;
  slug: string;
  type: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  api_endpoint?: string;
  api_key?: string;
  api_secret?: string;
  authentication_type?: string;
  sync_interval_minutes?: number;
}

export interface ProviderUpdateRequest {
  name?: string;
  description?: string;
  is_enabled?: boolean;
  api_endpoint?: string;
  api_key?: string;
  api_secret?: string;
  sync_interval_minutes?: number;
}

export interface ImportGamesRequest {
  provider_id: number;
  import_type: 'manual' | 'scheduled' | 'api_sync';
}

export interface BulkImportResponse {
  success: boolean;
  import_id?: number;
  message?: string;
  error?: string;
}
