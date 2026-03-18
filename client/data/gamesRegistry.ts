/**
 * Unified Games Registry
 * Single source of truth for all game metadata across the platform
 * Supports all game types: slots, table games, card games, external providers, mini-games
 */

export type GameType = 'slots' | 'table' | 'card' | 'external' | 'mini' | 'live';
export type GameCategory = 'slots' | 'table' | 'card' | 'poker' | 'bingo' | 'sportsbook' | 'mini' | 'live';

export interface GameMetadata {
  // Core identifying info
  id: string;
  name: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  provider: string;

  // Game classification
  type: GameType;
  category?: GameCategory;

  // Betting configuration
  minBet?: number;
  maxBet?: number;
  defaultBet?: number;
  costPerPlay?: number;

  // Game presentation
  entryComponent?: string; // path to React component relative to components/
  embedUrl?: string; // For external provider games
  gameUrl?: string; // Legacy compatibility

  // Game characteristics
  rtp?: number; // Return to player percentage
  volatility?: 'low' | 'medium' | 'high';
  maxWinAmount?: number;

  // Status & visibility
  isActive?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isBeta?: boolean;

  // Additional metadata (extensible for specific game types)
  metadata?: Record<string, any>;
}

export interface GameRegistry {
  games: GameMetadata[];
  getGameById(id: string): GameMetadata | undefined;
  getGamesByType(type: GameType): GameMetadata[];
  getGamesByCategory(category: GameCategory): GameMetadata[];
  getGamesByProvider(provider: string): GameMetadata[];
  getFeaturedGames(): GameMetadata[];
  getNewGames(): GameMetadata[];
}

// ============================================================================
// GAMES REGISTRY - Unified master list of all games
// ============================================================================

const GAMES: GameMetadata[] = [
  // ---- SLOTS ----
  {
    id: 'mega-spin-slots',
    name: 'Mega Spin Slots',
    slug: 'mega-spin-slots',
    description: 'Classic 3-reel slots with high volatility',
    thumbnail: '/games/slots/mega-spin.jpg',
    provider: 'CoinKrazy Studios',
    type: 'slots',
    category: 'slots',
    minBet: 0.1,
    maxBet: 100,
    defaultBet: 1,
    entryComponent: 'slots/SlotsGameEngine',
    rtp: 95,
    volatility: 'high',
    maxWinAmount: 10,
    isActive: true,
    isFeatured: true,
  },
  // Add more slot games from existing data as needed
  
  // ---- COINUP GAMES ----
  {
    id: 'coinup-classic',
    name: 'CoinUp Classic',
    slug: 'coinup-classic',
    description: 'Cascading coins with progressive multipliers',
    provider: 'CoinKrazy Studios',
    type: 'slots',
    category: 'slots',
    minBet: 0.1,
    maxBet: 10,
    defaultBet: 0.5,
    entryComponent: 'CoinKrazyCoinUp/GameCanvas',
    rtp: 96,
    volatility: 'medium',
    maxWinAmount: 10,
    isActive: true,
    isFeatured: true,
  },

  // ---- TABLE GAMES ----
  {
    id: 'blackjack-classic',
    name: 'Blackjack Classic',
    slug: 'blackjack-classic',
    description: 'Traditional blackjack with side bets',
    thumbnail: '/games/table/blackjack.jpg',
    provider: 'CoinKrazy Studios',
    type: 'table',
    category: 'table',
    minBet: 0.1,
    maxBet: 50,
    defaultBet: 1,
    entryComponent: 'table/BlackjackGame',
    rtp: 99,
    volatility: 'low',
    maxWinAmount: 100,
    isActive: true,
    isFeatured: true,
    isNew: true,
    metadata: {
      deckShoes: 6,
      allowSplits: true,
      allowDoubleDown: true,
    },
  },

  {
    id: 'roulette-european',
    name: 'European Roulette',
    slug: 'roulette-european',
    description: 'European roulette with 37 numbers',
    thumbnail: '/games/table/roulette.jpg',
    provider: 'CoinKrazy Studios',
    type: 'table',
    category: 'table',
    minBet: 0.1,
    maxBet: 100,
    defaultBet: 1,
    entryComponent: 'table/RouletteGame',
    rtp: 97.3,
    volatility: 'medium',
    maxWinAmount: 500,
    isActive: true,
    isFeatured: false,
    isNew: true,
    metadata: {
      wheelType: 'european',
      spinAnimation: true,
    },
  },

  {
    id: 'baccarat-classic',
    name: 'Baccarat Classic',
    slug: 'baccarat-classic',
    description: 'Classic baccarat game',
    thumbnail: '/games/table/baccarat.jpg',
    provider: 'CoinKrazy Studios',
    type: 'table',
    category: 'table',
    minBet: 0.1,
    maxBet: 50,
    defaultBet: 1,
    entryComponent: 'table/BaccaratGame',
    rtp: 98.76,
    volatility: 'low',
    maxWinAmount: 100,
    isActive: true,
    isFeatured: false,
    isNew: true,
  },

  // ---- CARD GAMES ----
  {
    id: 'poker-classic',
    name: 'Poker Classic',
    slug: 'poker-classic',
    description: 'Texas Hold\'em style poker',
    thumbnail: '/games/card/poker.jpg',
    provider: 'CoinKrazy Studios',
    type: 'card',
    category: 'poker',
    minBet: 0.1,
    maxBet: 50,
    defaultBet: 1,
    entryComponent: 'poker/PokerGameEngine',
    rtp: 97,
    volatility: 'medium',
    maxWinAmount: 200,
    isActive: true,
    isFeatured: false,
  },

  // ---- MINI GAMES ----
  {
    id: 'plinko-classic',
    name: 'Plinko',
    slug: 'plinko',
    description: 'Drop chips down a peg board for prizes',
    provider: 'CoinKrazy Studios',
    type: 'mini',
    category: 'mini',
    minBet: 0.1,
    maxBet: 10,
    defaultBet: 0.5,
    entryComponent: 'games/PlinkoGame',
    rtp: 96,
    volatility: 'medium',
    isActive: true,
  },

  {
    id: 'dice-classic',
    name: 'Dice Game',
    slug: 'dice',
    description: 'Roll dice and match numbers',
    provider: 'CoinKrazy Studios',
    type: 'mini',
    category: 'mini',
    minBet: 0.1,
    maxBet: 10,
    defaultBet: 0.5,
    entryComponent: 'games/DiceGame',
    rtp: 95,
    volatility: 'high',
    isActive: true,
  },

  // ---- EXTERNAL PROVIDER GAMES (embedded) ----
  {
    id: 'pragmatic-great-rhino',
    name: 'Great Rhino',
    slug: 'great-rhino',
    description: 'African safari themed slot',
    provider: 'Pragmatic Play',
    type: 'external',
    category: 'slots',
    minBet: 0.01,
    maxBet: 5,
    defaultBet: 0.1,
    embedUrl: '/pragmatic-games/great-rhino',
    rtp: 96.5,
    volatility: 'medium',
    isActive: true,
    isFeatured: false,
  },
];

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

export class GameRegistryImpl implements GameRegistry {
  games: GameMetadata[];

  constructor(gamesList: GameMetadata[] = GAMES) {
    this.games = gamesList;
  }

  getGameById(id: string): GameMetadata | undefined {
    return this.games.find(game => game.id === id);
  }

  getGamesByType(type: GameType): GameMetadata[] {
    return this.games.filter(game => game.type === type);
  }

  getGamesByCategory(category: GameCategory): GameMetadata[] {
    return this.games.filter(game => game.category === category);
  }

  getGamesByProvider(provider: string): GameMetadata[] {
    return this.games.filter(game => game.provider === provider);
  }

  getFeaturedGames(): GameMetadata[] {
    return this.games.filter(game => game.isFeatured);
  }

  getNewGames(): GameMetadata[] {
    return this.games.filter(game => game.isNew);
  }
}

// Export singleton instance
export const gamesRegistry = new GameRegistryImpl();

// Export helper functions
export const getGameById = (id: string) => gamesRegistry.getGameById(id);
export const getGamesByType = (type: GameType) => gamesRegistry.getGamesByType(type);
export const getGamesByCategory = (category: GameCategory) => gamesRegistry.getGamesByCategory(category);
export const getGamesByProvider = (provider: string) => gamesRegistry.getGamesByProvider(provider);
export const getFeaturedGames = () => gamesRegistry.getFeaturedGames();
export const getNewGames = () => gamesRegistry.getNewGames();
