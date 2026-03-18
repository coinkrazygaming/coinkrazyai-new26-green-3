import { PlayerProfile, AuthResponse, StorePack, Wallet, Transaction, GameInfo, PokerTable, BingoGame, SportsEvent, Achievement, LeaderboardEntry, AIEmployee } from '@shared/api';

const API_BASE = '/api';

// Helper function to make API calls (player)
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  console.log(`[apiCall] Fetching: ${url}`);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    let errorDetails = null;
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
      errorDetails = error.details || error;

      // Only log error message string, not the entire object
      // For 401 auth errors, use debug level since they're often expected (user not logged in)
      if (response.status === 401 && url.includes('/auth/profile')) {
        console.debug(`[Auth] Not authenticated: ${errorMessage}`);
      } else {
        console.error(`[API Error] ${url}: ${errorMessage}`);
      }
    } catch (e) {
      console.error(`[API Error] ${url}: Failed to parse error response, status: ${response.status}`);
    }
    const err = new Error(errorMessage);
    (err as any).status = response.status;
    (err as any).details = errorDetails;
    throw err;
  }

  return response.json();
}

// Helper function for admin API calls
export async function adminApiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData.details || '';
        console.error(`[Admin API Error] ${url}: ${errorMessage}${errorDetails ? ' - ' + errorDetails : ''}`);
      } catch (e) {
        console.error(`[Admin API Error] ${url}: Failed to parse error response, status: ${response.status}`);
      }
      const err = new Error(errorMessage);
      (err as any).status = response.status;
      (err as any).details = errorDetails;
      throw err;
    }

    return response.json();
  } catch (error: any) {
    console.error(`[Admin API] Request to ${url} failed:`, error.message);
    throw error;
  }
}

// ===== AUTHENTICATION =====
export const auth = {
  register: async (username: string, name: string, email: string, password: string) => {
    return apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, name, email, password }),
    });
  },

  login: async (username: string, password: string) => {
    return apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  adminLogin: async (email: string, password: string) => {
    return apiCall<any>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return apiCall<any>('/auth/logout', { method: 'POST' });
  },

  adminLogout: async () => {
    return apiCall<any>('/auth/admin/logout', { method: 'POST' });
  },

  getProfile: async () => {
    return apiCall<{ success: boolean; data: PlayerProfile }>('/auth/profile');
  },

  updateProfile: async (updates: Partial<PlayerProfile>) => {
    return apiCall<{ success: boolean; data: PlayerProfile }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ===== WALLET =====
export const wallet = {
  getBalance: async () => {
    return apiCall<{ success: boolean; data: Wallet }>('/wallet');
  },

  getTransactions: async () => {
    return apiCall<{ success: boolean; data: Transaction[] }>('/wallet/transactions');
  },

  updateBalance: async (gcAmount: number, scAmount: number) => {
    const payload = { gc_amount: gcAmount, sc_amount: scAmount };
    console.log('[Wallet] Sending updateBalance request:', payload);
    return apiCall<{ success: boolean }>('/wallet/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// ===== STORE =====
export const store = {
  getPacks: async () => {
    return apiCall<{ success: boolean; data: StorePack[] }>('/store/packs');
  },

  purchase: async (packId: number, paymentMethod: string, paymentToken?: string) => {
    return apiCall<{ success: boolean; data: any }>('/store/purchase', {
      method: 'POST',
      body: JSON.stringify({ pack_id: packId, payment_method: paymentMethod, payment_token: paymentToken }),
    });
  },

  getPurchaseHistory: async () => {
    return apiCall<{ success: boolean; data: any[] }>('/store/history');
  },

  getPaymentMethods: async () => {
    return apiCall<{ success: boolean; data: any[] }>('/store/payment-methods');
  },
};

// ===== CASINO =====
export const casino = {
  playGame: async (gameId: string, betAmount: number) => {
    const payload = { game_id: gameId, bet_amount: betAmount };
    console.log('[Casino API] Playing game:', payload);

    try {
      // Try the dedicated casino endpoint first
      return await apiCall<{ success: boolean; data: any }>('/casino/play', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Casino API] Primary endpoint failed, trying alternative...');
      // Fallback: Try deducting from wallet directly
      try {
        return await apiCall<{ success: boolean; data: any }>('/wallet/update', {
          method: 'POST',
          body: JSON.stringify({
            gc_amount: 0,
            sc_amount: -betAmount
          }),
        });
      } catch (walletErr) {
        console.error('[Casino API] Both endpoints failed:', { primary: err, fallback: walletErr });
        throw err; // Throw the original error
      }
    }
  },

  getSpinHistory: async (limit: number = 20, offset: number = 0) => {
    return apiCall<{ success: boolean; data: any }>(`/casino/spins?limit=${limit}&offset=${offset}`);
  },

  getStats: async () => {
    return apiCall<{ success: boolean; data: any }>('/casino/stats');
  },
};

// ===== GAMES =====
export const games = {
  getGames: async () => {
    return apiCall<{ success: boolean; data: GameInfo[] }>('/games');
  },

  getGameById: async (id: number) => {
    return apiCall<{ success: boolean; data: GameInfo }>(`/games/${id}`);
  },
};

// ===== COINKRAZY GAMES =====
export const coinkrazyCoinUp = {
  spin: async (betAmount: number, playerId: number) => {
    return apiCall<any>('/coinkrazy-coinup/spin', {
      method: 'POST',
      body: JSON.stringify({ betAmount, playerId }),
    });
  },

  updateBalance: async (newBalance: number) => {
    return apiCall<any>('/wallet/update', {
      method: 'POST',
      body: JSON.stringify({ gc_amount: 0, sc_amount: newBalance }),
    });
  },
};

export const coinkrazyCoinHot = {
  spin: async (betAmount: number, playerId: number) => {
    return apiCall<any>('/coinkrazy-coinhot/spin', {
      method: 'POST',
      body: JSON.stringify({ betAmount, playerId }),
    });
  },

  updateBalance: async (newBalance: number) => {
    return apiCall<any>('/wallet/update', {
      method: 'POST',
      body: JSON.stringify({ gc_amount: 0, sc_amount: newBalance }),
    });
  },
};

export const coinkrazyThunder = {
  spin: async (betAmount: number, playerId: number) => {
    return apiCall<any>('/coinkrazy-thunder/spin', {
      method: 'POST',
      body: JSON.stringify({ betAmount, playerId }),
    });
  },

  getStats: async (playerId: number) => {
    return apiCall<any>(`/coinkrazy-thunder/stats?playerId=${playerId}`);
  },

  updateBalance: async (newBalance: number) => {
    return apiCall<any>('/wallet/update', {
      method: 'POST',
      body: JSON.stringify({ gc_amount: 0, sc_amount: newBalance }),
    });
  },
};

export const coinkrazy4Wolfs = {
  spin: async (betAmount: number, playerId: number) => {
    return apiCall<any>('/coinkrazy-4wolfs/spin', {
      method: 'POST',
      body: JSON.stringify({ betAmount, playerId }),
    });
  },

  updateBalance: async (newBalance: number) => {
    return apiCall<any>('/wallet/update', {
      method: 'POST',
      body: JSON.stringify({ gc_amount: 0, sc_amount: newBalance }),
    });
  },
};

// ===== SLOTS =====
export const slots = {
  spin: async (gameId: string | number, betAmount: number, winAmount: number = 0, symbols: string = "") => {
    return apiCall<any>('/slots/spin', {
      method: 'POST',
      body: JSON.stringify({ gameId, betAmount, winAmount, symbols }),
    });
  },

  getConfig: async () => {
    return apiCall<any>('/slots/config');
  },

  updateConfig: async (config: any) => {
    return apiCall<any>('/slots/config/update', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};

// ===== POKER =====
export const poker = {
  getTables: async () => {
    return apiCall<{ success: boolean; data: PokerTable[] }>('/poker/tables');
  },

  joinTable: async (tableId: number, buyIn: number) => {
    return apiCall<{ success: boolean; data: any }>('/poker/join', {
      method: 'POST',
      body: JSON.stringify({ table_id: tableId, buy_in: buyIn }),
    });
  },

  fold: async (sessionId: number) => {
    return apiCall<{ success: boolean }>('/poker/fold', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  },

  cashOut: async (sessionId: number) => {
    return apiCall<{ success: boolean; data: any }>('/poker/cash-out', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  },

  getConfig: async () => {
    return apiCall<any>('/poker/config');
  },

  updateConfig: async (config: any) => {
    return apiCall<any>('/poker/config/update', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};

// ===== BINGO =====
export const bingo = {
  getRooms: async () => {
    return apiCall<{ success: boolean; data: BingoGame[] }>('/bingo/rooms');
  },

  buyTicket: async (gameId: number) => {
    return apiCall<{ success: boolean; data: any }>('/bingo/buy', {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId }),
    });
  },

  markNumber: async (ticketId: number, number: number) => {
    return apiCall<{ success: boolean }>('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId, number }),
    });
  },

  win: async (ticketId: number) => {
    return apiCall<{ success: boolean; data: any }>('/bingo/win', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId }),
    });
  },

  getConfig: async () => {
    return apiCall<any>('/bingo/config');
  },

  updateConfig: async (config: any) => {
    return apiCall<any>('/bingo/config/update', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};

// ===== SPORTSBOOK =====
export const sportsbook = {
  getLiveGames: async () => {
    return apiCall<{ success: boolean; data: SportsEvent[] }>('/sportsbook/games');
  },

  placeParlay: async (eventIds: number[], amounts: number[], odds: number[]) => {
    return apiCall<{ success: boolean; data: any }>('/sportsbook/parlay', {
      method: 'POST',
      body: JSON.stringify({ event_ids: eventIds, amounts, odds }),
    });
  },

  placeBet: async (eventId: number, amount: number, odds: number) => {
    return apiCall<{ success: boolean; data: any }>('/sportsbook/bet', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, amount, odds }),
    });
  },

  getConfig: async () => {
    return apiCall<any>('/sportsbook/config');
  },

  updateConfig: async (config: any) => {
    return apiCall<any>('/sportsbook/config/update', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};

// ===== LEADERBOARDS =====
export const leaderboards = {
  getLeaderboard: async () => {
    return apiCall<{ success: boolean; data: { entries: LeaderboardEntry[] } }>('/leaderboards');
  },

  getMyRank: async () => {
    return apiCall<{ success: boolean; data: LeaderboardEntry }>('/leaderboards/my-rank');
  },

  update: async () => {
    return apiCall<{ success: boolean }>('/leaderboards/update', {
      method: 'POST',
    });
  },
};

// ===== ACHIEVEMENTS =====
export const achievements = {
  getAll: async () => {
    return apiCall<{ success: boolean; data: Achievement[] }>('/achievements');
  },

  getMyAchievements: async () => {
    return apiCall<{ success: boolean; data: Achievement[] }>('/achievements/my-achievements');
  },

  check: async () => {
    return apiCall<{ success: boolean; data: any }>('/achievements/check', {
      method: 'POST',
    });
  },

  award: async (playerId: number, achievementId: number) => {
    return apiCall<{ success: boolean }>('/achievements/award', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId, achievement_id: achievementId }),
    });
  },

  getStats: async () => {
    return apiCall<{ success: boolean; data: any }>('/achievements/stats');
  },
};

// ===== ADMIN V2 - NEW COMPREHENSIVE ENDPOINTS =====
export const adminV2 = {
  // Dashboard
  dashboard: {
    getStats: async () => {
      return adminApiCall<any>('/admin/v2/dashboard/stats');
    },
    getMetrics: async (days = 30) => {
      return adminApiCall<any>(`/admin/v2/dashboard/metrics?days=${days}`);
    },
    getHealth: async () => {
      return adminApiCall<any>('/admin/v2/dashboard/health');
    },
    getRevenue: async (timeframe = 'month') => {
      return adminApiCall<any>(`/admin/v2/dashboard/revenue?timeframe=${timeframe}`);
    },
    getDemographics: async () => {
      return adminApiCall<any>('/admin/v2/dashboard/demographics');
    },
  },

  // Players
  players: {
    list: async (page = 1, limit = 20, search = '', status = '', kycLevel = '') => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search, status, kycLevel });
      return adminApiCall<any>(`/admin/v2/players?${params}`);
    },
    get: async (playerId: number) => {
      return adminApiCall<any>(`/admin/v2/players/${playerId}`);
    },
    updateStatus: async (playerId: number, status: string, reason?: string) => {
      return adminApiCall<any>(`/admin/v2/players/${playerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      });
    },
    updateBalance: async (playerId: number, gcAmount?: number, scAmount?: number, gcDelta?: number, scDelta?: number, reason?: string) => {
      return adminApiCall<any>(`/admin/v2/players/${playerId}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ gcAmount, scAmount, gcDelta, scDelta, reason }),
      });
    },
    getTransactions: async (playerId: number, page = 1, limit = 50) => {
      return adminApiCall<any>(`/admin/v2/players/${playerId}/transactions?page=${page}&limit=${limit}`);
    },

    // Username-based operations
    updateStatusByUsername: async (username: string, status: string, reason?: string) => {
      return adminApiCall<any>(`/admin/v2/players/username/${encodeURIComponent(username)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      });
    },
    updateBalanceByUsername: async (username: string, gcAmount?: number, scAmount?: number, gcDelta?: number, scDelta?: number, reason?: string) => {
      return adminApiCall<any>(`/admin/v2/players/username/${encodeURIComponent(username)}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ gcAmount, scAmount, gcDelta, scDelta, reason }),
      });
    },
    getTransactionsByUsername: async (username: string, page = 1, limit = 50) => {
      return adminApiCall<any>(`/admin/v2/players/username/${encodeURIComponent(username)}/transactions?page=${page}&limit=${limit}`);
    },
  },

  // KYC
  kyc: {
    submit: async (playerId: number, documentType: string, documentUrl: string) => {
      return adminApiCall<any>('/admin/v2/kyc/submit', {
        method: 'POST',
        body: JSON.stringify({ playerId, documentType, documentUrl }),
      });
    },
    approve: async (documentId: number, notes?: string) => {
      return adminApiCall<any>(`/admin/v2/kyc/${documentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },
    reject: async (documentId: number, reason: string) => {
      return adminApiCall<any>(`/admin/v2/kyc/${documentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  },

  // Financial
  bonuses: {
    list: async () => {
      return adminApiCall<any>('/admin/v2/bonuses');
    },
    create: async (bonus: any) => {
      return adminApiCall<any>('/admin/v2/bonuses', {
        method: 'POST',
        body: JSON.stringify(bonus),
      });
    },
    update: async (bonusId: number, bonus: any) => {
      return adminApiCall<any>(`/admin/v2/bonuses/${bonusId}`, {
        method: 'PUT',
        body: JSON.stringify(bonus),
      });
    },
    delete: async (bonusId: number) => {
      return adminApiCall<any>(`/admin/v2/bonuses/${bonusId}`, {
        method: 'DELETE',
      });
    },
  },

  jackpots: {
    list: async () => {
      return adminApiCall<any>('/admin/v2/jackpots');
    },
    create: async (jackpot: any) => {
      return adminApiCall<any>('/admin/v2/jackpots', {
        method: 'POST',
        body: JSON.stringify(jackpot),
      });
    },
    update: async (jackpotId: number, newAmount: number) => {
      return adminApiCall<any>(`/admin/v2/jackpots/${jackpotId}`, {
        method: 'PUT',
        body: JSON.stringify({ newAmount }),
      });
    },
    recordWin: async (jackpotId: number, playerId: number, amountWon: number) => {
      return adminApiCall<any>('/admin/v2/jackpots/win', {
        method: 'POST',
        body: JSON.stringify({ jackpotId, playerId, amountWon }),
      });
    },
  },

  makeItRain: {
    list: async () => {
      return adminApiCall<any>('/admin/v2/make-it-rain');
    },
    create: async (campaign: any) => {
      return adminApiCall<any>('/admin/v2/make-it-rain', {
        method: 'POST',
        body: JSON.stringify(campaign),
      });
    },
    distribute: async (campaignId: number, playerIds: number[], amountPerPlayer: number) => {
      return adminApiCall<any>(`/admin/v2/make-it-rain/${campaignId}/distribute`, {
        method: 'POST',
        body: JSON.stringify({ playerIds, amountPerPlayer }),
      });
    },
  },

  redemptions: {
    list: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return adminApiCall<any>(`/admin/v2/redemptions${params}`);
    },
    approve: async (requestId: number, notes?: string) => {
      return adminApiCall<any>(`/admin/v2/redemptions/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },
    reject: async (requestId: number, reason: string) => {
      return adminApiCall<any>(`/admin/v2/redemptions/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  },

  // Games & Sports
  games: {
    list: async (category?: string) => {
      const params = category ? `?category=${category}` : '';
      return adminApiCall<any>(`/admin/v2/games${params}`);
    },
    create: async (game: any) => {
      return adminApiCall<any>('/admin/v2/games', {
        method: 'POST',
        body: JSON.stringify(game),
      });
    },
    update: async (gameId: number, game: any) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}`, {
        method: 'PUT',
        body: JSON.stringify(game),
      });
    },
    delete: async (gameId: number) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}`, {
        method: 'DELETE',
      });
    },
    ingestData: async (gameId: number, data: any) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}/ingest`, {
        method: 'POST',
        body: JSON.stringify({ gameId, data }),
      });
    },
    crawlSlots: async (url?: string, urls?: string[], dryRun: boolean = false) => {
      return adminApiCall<any>('/admin/v2/games/crawl', {
        method: 'POST',
        body: JSON.stringify({ url, urls, dryRun }),
      });
    },
    saveCrawledGame: async (gameData: any) => {
      return adminApiCall<any>('/admin/v2/games/save-crawled', {
        method: 'POST',
        body: JSON.stringify(gameData),
      });
    },
    clearAll: async () => {
      return adminApiCall<any>('/admin/v2/games/clear-all', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    getConfigs: async () => {
      return adminApiCall<any>('/admin/v2/games/configs');
    },
    updateMaxWin: async (gameId: number, maxWinAmount: number) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}/max-win`, {
        method: 'PUT',
        body: JSON.stringify({ max_win_amount: maxWinAmount }),
      });
    },
  },

  // Provider Management
  providers: {
    getAvailable: async () => {
      return adminApiCall<any>('/admin/v2/providers/available');
    },
    list: async () => {
      return adminApiCall<any>('/admin/v2/providers');
    },
    get: async (providerId: number) => {
      return adminApiCall<any>(`/admin/v2/providers/${providerId}`);
    },
    create: async (provider: any) => {
      return adminApiCall<any>('/admin/v2/providers', {
        method: 'POST',
        body: JSON.stringify(provider),
      });
    },
    update: async (providerId: number, provider: any) => {
      return adminApiCall<any>(`/admin/v2/providers/${providerId}`, {
        method: 'PUT',
        body: JSON.stringify(provider),
      });
    },
    testConnection: async (providerId: number) => {
      return adminApiCall<any>(`/admin/v2/providers/${providerId}/test`, {
        method: 'POST',
      });
    },
    sync: async (providerId: number) => {
      return adminApiCall<any>(`/admin/v2/providers/${providerId}/sync`, {
        method: 'POST',
      });
    },
    getGames: async (providerId: number, limit = 20, offset = 0) => {
      return adminApiCall<any>(`/admin/v2/providers/${providerId}/games?limit=${limit}&offset=${offset}`);
    },
    getStats: async (providerId: number) => {
      return adminApiCall<any>(`/admin/v2/providers/${providerId}/stats`);
    },
  },

  // Import History
  importHistory: {
    list: async (limit = 20, offset = 0) => {
      return adminApiCall<any>(`/admin/v2/import-history?limit=${limit}&offset=${offset}`);
    },
    get: async (importId: number) => {
      return adminApiCall<any>(`/admin/v2/import-history/${importId}`);
    },
  },

  // Game Metadata
  gameMetadata: {
    get: async (gameId: number) => {
      return apiCall<any>(`/admin/v2/games/${gameId}/metadata`);
    },
    update: async (gameId: number, metadata: any) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify(metadata),
      });
    },
    getRatings: async (gameId: number, limit = 10, offset = 0) => {
      return apiCall<any>(`/admin/v2/games/${gameId}/ratings?limit=${limit}&offset=${offset}`);
    },
    rateGame: async (gameId: number, rating: number, comment?: string) => {
      return apiCall<any>(`/admin/v2/games/${gameId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
    },
    getStatistics: async (gameId: number) => {
      return apiCall<any>(`/admin/v2/games/${gameId}/statistics`);
    },
  },

  // Game Features
  gameFeatures: {
    list: async () => {
      return apiCall<any>('/admin/v2/features');
    },
    create: async (feature: any) => {
      return adminApiCall<any>('/admin/v2/features', {
        method: 'POST',
        body: JSON.stringify(feature),
      });
    },
    addToGame: async (gameId: number, featureId: number) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}/features`, {
        method: 'POST',
        body: JSON.stringify({ gameId, featureId }),
      });
    },
    removeFromGame: async (gameId: number, featureId: number) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}/features/${featureId}`, {
        method: 'DELETE',
      });
    },
    getGameFeatures: async (gameId: number) => {
      return apiCall<any>(`/admin/v2/games/${gameId}/features`);
    },
  },

  // Game Themes
  gameThemes: {
    list: async () => {
      return apiCall<any>('/admin/v2/themes');
    },
    create: async (theme: any) => {
      return adminApiCall<any>('/admin/v2/themes', {
        method: 'POST',
        body: JSON.stringify(theme),
      });
    },
    addToGame: async (gameId: number, themeId: number) => {
      return adminApiCall<any>(`/admin/v2/games/${gameId}/themes`, {
        method: 'POST',
        body: JSON.stringify({ gameId, themeId }),
      });
    },
    getGameThemes: async (gameId: number) => {
      return apiCall<any>(`/admin/v2/games/${gameId}/themes`);
    },
  },

  aggregation: {
    getProviders: async () => {
      return adminApiCall<any>('/admin/v2/aggregation/providers');
    },
    syncProvider: async (providerId: string, forceRefresh?: boolean) => {
      return adminApiCall<any>(`/admin/v2/aggregation/sync/${providerId}`, {
        method: 'POST',
        body: JSON.stringify({ providerId, forceRefresh }),
      });
    },
    syncAllProviders: async () => {
      return adminApiCall<any>('/admin/v2/aggregation/sync-all', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    getStats: async () => {
      return adminApiCall<any>('/admin/v2/aggregation/stats');
    },
    bulkImport: async (games: any[]) => {
      return adminApiCall<any>('/admin/v2/aggregation/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ games }),
      });
    },
    exportGames: async (filters?: { provider?: string; category?: string }) => {
      const params = new URLSearchParams();
      if (filters?.provider) params.append('provider', filters.provider);
      if (filters?.category) params.append('category', filters.category);
      return adminApiCall<any>(`/admin/v2/aggregation/export?${params.toString()}`);
    },
    getGamesByProvider: async (provider: string) => {
      return adminApiCall<any>(`/admin/v2/aggregation/provider/${provider}/games`);
    },
    deleteProviderGames: async (provider: string) => {
      return adminApiCall<any>(`/admin/v2/aggregation/provider/${provider}/games`, {
        method: 'DELETE',
      });
    },
  },

  poker: {
    listTables: async () => {
      return adminApiCall<any>('/admin/v2/poker/tables');
    },
    createTable: async (table: any) => {
      return adminApiCall<any>('/admin/v2/poker/tables', {
        method: 'POST',
        body: JSON.stringify(table),
      });
    },
    updateTable: async (tableId: number, table: any) => {
      return adminApiCall<any>(`/admin/v2/poker/tables/${tableId}`, {
        method: 'PUT',
        body: JSON.stringify(table),
      });
    },
    getStats: async () => {
      return adminApiCall<any>('/admin/v2/poker/stats');
    },
  },

  bingo: {
    listGames: async () => {
      return adminApiCall<any>('/admin/v2/bingo/games');
    },
    createGame: async (game: any) => {
      return adminApiCall<any>('/admin/v2/bingo/games', {
        method: 'POST',
        body: JSON.stringify(game),
      });
    },
    updateGame: async (gameId: number, game: any) => {
      return adminApiCall<any>(`/admin/v2/bingo/games/${gameId}`, {
        method: 'PUT',
        body: JSON.stringify(game),
      });
    },
    getStats: async () => {
      return adminApiCall<any>('/admin/v2/bingo/stats');
    },
  },

  sportsbook: {
    listEvents: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return adminApiCall<any>(`/admin/v2/sportsbook/events${params}`);
    },
    createEvent: async (event: any) => {
      return adminApiCall<any>('/admin/v2/sportsbook/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    },
    updateEvent: async (eventId: number, event: any) => {
      return adminApiCall<any>(`/admin/v2/sportsbook/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });
    },
    getStats: async () => {
      return adminApiCall<any>('/admin/v2/sportsbook/stats');
    },
  },

  // Operations
  security: {
    listAlerts: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return adminApiCall<any>(`/admin/v2/security/alerts${params}`);
    },
    resolveAlert: async (alertId: number, resolution: string) => {
      return adminApiCall<any>(`/admin/v2/security/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
    },
  },

  content: {
    listPages: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return adminApiCall<any>(`/admin/v2/cms/pages${params}`);
    },
    createPage: async (page: any) => {
      return adminApiCall<any>('/admin/v2/cms/pages', {
        method: 'POST',
        body: JSON.stringify(page),
      });
    },
    updatePage: async (pageId: number, page: any) => {
      return adminApiCall<any>(`/admin/v2/cms/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify(page),
      });
    },
    deletePage: async (pageId: number) => {
      return adminApiCall<any>(`/admin/v2/cms/pages/${pageId}`, {
        method: 'DELETE',
      });
    },
    listBanners: async () => {
      return adminApiCall<any>('/admin/v2/cms/banners');
    },
    createBanner: async (banner: any) => {
      return adminApiCall<any>('/admin/v2/cms/banners', {
        method: 'POST',
        body: JSON.stringify(banner),
      });
    },
  },

  casino: {
    getSettings: async () => {
      return adminApiCall<any>('/admin/v2/casino/settings');
    },
    updateSettings: async (settings: any) => {
      return adminApiCall<any>('/admin/v2/casino/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },

  social: {
    listGroups: async () => {
      return adminApiCall<any>('/admin/v2/social/groups');
    },
    getGroupMembers: async (groupId: number) => {
      return adminApiCall<any>(`/admin/v2/social/groups/${groupId}/members`);
    },
  },

  retention: {
    listCampaigns: async () => {
      return adminApiCall<any>('/admin/v2/retention/campaigns');
    },
    createCampaign: async (campaign: any) => {
      return adminApiCall<any>('/admin/v2/retention/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaign),
      });
    },
    updateCampaign: async (campaignId: number, campaign: any) => {
      return adminApiCall<any>(`/admin/v2/retention/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(campaign),
      });
    },
  },

  // Advanced
  vip: {
    listTiers: async () => {
      return adminApiCall<any>('/admin/v2/vip/tiers');
    },
    createTier: async (tier: any) => {
      return adminApiCall<any>('/admin/v2/vip/tiers', {
        method: 'POST',
        body: JSON.stringify(tier),
      });
    },
    promotePlayer: async (playerId: number, vipTierId: number) => {
      return adminApiCall<any>('/admin/v2/vip/promote', {
        method: 'POST',
        body: JSON.stringify({ playerId, vipTierId }),
      });
    },
    listVIPPlayers: async () => {
      return adminApiCall<any>('/admin/v2/vip/players');
    },
  },

  fraud: {
    listPatterns: async () => {
      return adminApiCall<any>('/admin/v2/fraud/patterns');
    },
    createPattern: async (pattern: any) => {
      return adminApiCall<any>('/admin/v2/fraud/patterns', {
        method: 'POST',
        body: JSON.stringify(pattern),
      });
    },
    listFlags: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return adminApiCall<any>(`/admin/v2/fraud/flags${params}`);
    },
    resolveFlag: async (flagId: number, resolution: string) => {
      return adminApiCall<any>(`/admin/v2/fraud/flags/${flagId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
    },
  },

  affiliate: {
    listPartners: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return adminApiCall<any>(`/admin/v2/affiliates${params}`);
    },
    createPartner: async (partner: any) => {
      return adminApiCall<any>('/admin/v2/affiliates', {
        method: 'POST',
        body: JSON.stringify(partner),
      });
    },
    approvePartner: async (partnerId: number) => {
      return adminApiCall<any>(`/admin/v2/affiliates/${partnerId}/approve`, {
        method: 'POST',
      });
    },
    getStats: async (partnerId: number) => {
      return adminApiCall<any>(`/admin/v2/affiliates/${partnerId}/stats`);
    },
  },

  support: {
    listTickets: async (status?: string, priority?: string) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      return adminApiCall<any>(`/admin/v2/support/tickets?${params}`);
    },
    getMessages: async (ticketId: number) => {
      return adminApiCall<any>(`/admin/v2/support/tickets/${ticketId}/messages`);
    },
    assignTicket: async (ticketId: number, adminId: number) => {
      return adminApiCall<any>(`/admin/v2/support/tickets/${ticketId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ adminId }),
      });
    },
    closeTicket: async (ticketId: number) => {
      return adminApiCall<any>(`/admin/v2/support/tickets/${ticketId}/close`, {
        method: 'POST',
      });
    },
  },

  logs: {
    listSystemLogs: async (page = 1, limit = 50, action?: string, adminId?: number) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (action) params.append('action', action);
      if (adminId) params.append('adminId', String(adminId));
      return adminApiCall<any>(`/admin/v2/system/logs?${params}`);
    },
  },

  api: {
    listKeys: async () => {
      return adminApiCall<any>('/admin/v2/api/keys');
    },
    createKey: async (key: any) => {
      return adminApiCall<any>('/admin/v2/api/keys', {
        method: 'POST',
        body: JSON.stringify(key),
      });
    },
    revokeKey: async (keyId: number) => {
      return adminApiCall<any>(`/admin/v2/api/keys/${keyId}/revoke`, {
        method: 'POST',
      });
    },
  },

  notifications: {
    listTemplates: async () => {
      return adminApiCall<any>('/admin/v2/notifications/templates');
    },
    createTemplate: async (template: any) => {
      return adminApiCall<any>('/admin/v2/notifications/templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    },
  },

  compliance: {
    listLogs: async () => {
      return adminApiCall<any>('/admin/v2/compliance/logs');
    },
    listAMLChecks: async () => {
      return adminApiCall<any>('/admin/v2/compliance/aml-checks');
    },
    verifyAMLCheck: async (checkId: number, status: string, riskLevel: string) => {
      return adminApiCall<any>(`/admin/v2/compliance/aml-checks/${checkId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status, riskLevel }),
      });
    },
  },

  // Pull Tabs
  pullTabs: {
    getStats: async () => {
      return adminApiCall<any>('/admin/v2/pull-tabs/stats');
    },
    getTransactions: async (limit = 100) => {
      return adminApiCall<any>(`/admin/v2/pull-tabs/transactions?limit=${limit}`);
    },
    getResults: async (limit = 100) => {
      return adminApiCall<any>(`/admin/v2/pull-tabs/results?limit=${limit}`);
    },
    getDesigns: async () => {
      return adminApiCall<any>('/admin/v2/pull-tabs/designs');
    },
    createDesign: async (design: any) => {
      return adminApiCall<any>('/admin/v2/pull-tabs/designs', {
        method: 'POST',
        body: JSON.stringify(design),
      });
    },
    updateDesign: async (id: number, design: any) => {
      return adminApiCall<any>(`/admin/v2/pull-tabs/designs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(design),
      });
    },
    deleteDesign: async (id: number) => {
      return adminApiCall<any>(`/admin/v2/pull-tabs/designs/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Store Management
  store: {
    getPackages: async () => {
      return adminApiCall<any>('/admin/v2/store/packages');
    },
    createPackage: async (package_data: any) => {
      return adminApiCall<any>('/admin/v2/store/packages', {
        method: 'POST',
        body: JSON.stringify(package_data),
      });
    },
    updatePackage: async (packageId: number, package_data: any) => {
      return adminApiCall<any>(`/admin/v2/store/packages/${packageId}`, {
        method: 'PUT',
        body: JSON.stringify(package_data),
      });
    },
    deletePackage: async (packageId: number) => {
      return adminApiCall<any>(`/admin/v2/store/packages/${packageId}`, {
        method: 'DELETE',
      });
    },

    getPaymentMethods: async () => {
      return adminApiCall<any>('/admin/v2/store/payment-methods');
    },
    createPaymentMethod: async (method_data: any) => {
      return adminApiCall<any>('/admin/v2/store/payment-methods', {
        method: 'POST',
        body: JSON.stringify(method_data),
      });
    },
    updatePaymentMethod: async (methodId: number, method_data: any) => {
      return adminApiCall<any>(`/admin/v2/store/payment-methods/${methodId}`, {
        method: 'PUT',
        body: JSON.stringify(method_data),
      });
    },
    deletePaymentMethod: async (methodId: number) => {
      return adminApiCall<any>(`/admin/v2/store/payment-methods/${methodId}`, {
        method: 'DELETE',
      });
    },

    getSettings: async () => {
      return adminApiCall<any>('/admin/v2/store/settings');
    },
    updateSettings: async (settings: any) => {
      return adminApiCall<any>('/admin/v2/store/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },
};

// ===== ADMIN (Legacy) =====
export const admin = {
  getDashboardStats: async () => {
    return adminApiCall<{ success: boolean; data: any }>('/admin/dashboard/stats');
  },

  getPlayers: async (page = 1, limit = 20) => {
    return adminApiCall<{ success: boolean; data: any }>(`/admin/players?page=${page}&limit=${limit}`);
  },

  getPlayer: async (playerId: number) => {
    return adminApiCall<{ success: boolean; data: any }>(`/admin/players/${playerId}`);
  },

  updatePlayerBalance: async (playerId: number, gc: number, sc: number) => {
    return adminApiCall<{ success: boolean }>('/admin/players/balance', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId, gc_balance: gc, sc_balance: sc }),
    });
  },

  updatePlayerStatus: async (playerId: number, status: string) => {
    return adminApiCall<{ success: boolean }>('/admin/players/status', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId, status }),
    });
  },

  getGames: async () => {
    return adminApiCall<{ success: boolean; data: any }>('/admin/games');
  },

  updateGameRTP: async (gameId: number, rtp: number) => {
    return adminApiCall<{ success: boolean }>('/admin/games/rtp', {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId, rtp }),
    });
  },

  toggleGame: async (gameId: number, enabled: boolean) => {
    return adminApiCall<{ success: boolean }>('/admin/games/toggle', {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId, enabled }),
    });
  },

  getBonuses: async () => {
    return adminApiCall<{ success: boolean; data: any }>('/admin/bonuses');
  },

  createBonus: async (bonusData: any) => {
    return adminApiCall<{ success: boolean }>('/admin/bonuses/create', {
      method: 'POST',
      body: JSON.stringify(bonusData),
    });
  },

  getTransactions: async () => {
    return adminApiCall<{ success: boolean; data: any }>('/admin/transactions');
  },

  getAlerts: async () => {
    return adminApiCall<{ success: boolean; data: any }>('/admin/alerts');
  },

  getAIEmployees: async () => {
    return adminApiCall<{ success: boolean; data: AIEmployee[] }>('/admin/ai-employees');
  },

  assignAIDuty: async (aiId: string, duty: string) => {
    return adminApiCall<{ success: boolean }>('/admin/ai-duty', {
      method: 'POST',
      body: JSON.stringify({ ai_id: aiId, duty }),
    });
  },

  updateAIStatus: async (aiId: string, status: string) => {
    return adminApiCall<{ success: boolean }>('/admin/ai-status', {
      method: 'POST',
      body: JSON.stringify({ ai_id: aiId, status }),
    });
  },

  setMaintenanceMode: async (enabled: boolean) => {
    return adminApiCall<{ success: boolean }>('/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  },

  getSystemHealth: async () => {
    return adminApiCall<{ success: boolean; data: any }>('/admin/health');
  },
};

// ===== DAILY BONUS =====
export const dailyBonus = {
  getStatus: async () => {
    return apiCall<{ success: boolean; data: any }>('/daily-bonus');
  },
  claim: async () => {
    return apiCall<{ success: boolean; data: any }>('/daily-bonus/claim', {
      method: 'POST',
    });
  },
  getStreak: async () => {
    return apiCall<{ success: boolean; data: any }>('/daily-bonus/streak');
  },
};

// ===== REFERRALS =====
export const referrals = {
  getLink: async () => {
    return apiCall<{ success: boolean; data: any }>('/referral/link');
  },
  getStats: async () => {
    return apiCall<{ success: boolean; data: any }>('/referral/stats');
  },
  getRecent: async (limit = 10) => {
    return apiCall<{ success: boolean; data: any[] }>(`/referral/recent?limit=${limit}`);
  },
  register: async (referralCode: string, registrationData: any) => {
    return apiCall<{ success: boolean; data: any }>('/referral/register', {
      method: 'POST',
      body: JSON.stringify({ referralCode, ...registrationData }),
    });
  },
};

// ===== SOCIAL SHARING =====
export const socialSharing = {
  recordShare: async (platform: string, gameId?: number) => {
    return apiCall<{ success: boolean; data: any }>('/social/share', {
      method: 'POST',
      body: JSON.stringify({ platform, gameId }),
    });
  },
  getHistory: async () => {
    return apiCall<{ success: boolean; data: any }>('/social/history');
  },
};

// ===== MESSAGING =====
export const messaging = {
  getThreads: async () => {
    return apiCall<{ success: boolean; data: any }>('/messages/threads');
  },
  getMessages: async (threadId?: string) => {
    const params = threadId ? `?threadId=${threadId}` : '';
    return apiCall<{ success: boolean; data: any }>(`/messages${params}`);
  },
  sendMessage: async (recipientId: number, message: string) => {
    return apiCall<{ success: boolean; data: any }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    });
  },
  markRead: async (messageIds: number[]) => {
    return apiCall<{ success: boolean }>('/messages/read', {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    });
  },
};

// ===== CHALLENGES =====
export const challenges = {
  getChallenges: async () => {
    return apiCall<{ success: boolean; data: any }>('/challenges');
  },
  claimReward: async (challengeId: number) => {
    return apiCall<{ success: boolean; data: any }>('/challenges/claim', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });
  },
};
