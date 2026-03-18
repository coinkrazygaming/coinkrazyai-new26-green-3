/**
 * Unified Spin Service
 * Standardizes all game API calls and response handling
 * Abstracts away the complexity of different backend endpoints
 */

import { toast } from 'sonner';

// ============================================================================
// CANONICAL TYPES
// ============================================================================

export interface SpinRequest {
  gameId: string;
  gameName?: string;
  betAmount: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SpinResult {
  success: boolean;
  spinId?: string;
  gameId: string;
  gameName: string;
  betAmount: number;
  winAmount: number;
  netResult: number; // winAmount - betAmount
  result: 'win' | 'loss' | 'push';
  balanceAfter: number;
  wallet?: {
    goldCoins: number;
    sweepsCoins: number;
  };
  metadata?: Record<string, any>;
  error?: string;
}

export interface GameSpinHandler {
  (request: SpinRequest): Promise<SpinResult>;
}

// ============================================================================
// RESPONSE NORMALIZERS
// ============================================================================

/**
 * Normalize different API response shapes to canonical SpinResult
 */
class ResponseNormalizer {
  /**
   * Normalize casino.play response
   */
  static normalizeCasinoResponse(data: any, gameId: string, betAmount: number): SpinResult {
    const winAmount = data.winnings || data.win_amount || 0;
    const balanceAfter = data.new_balance || data.balance_after || data.balance || 0;

    return {
      success: data.success !== false,
      spinId: data.spin_id,
      gameId: data.game_id || gameId,
      gameName: data.game_name || 'Casino Game',
      betAmount,
      winAmount,
      netResult: winAmount - betAmount,
      result: winAmount > 0 ? 'win' : 'loss',
      balanceAfter,
      wallet: data.wallet || {
        goldCoins: 0,
        sweepsCoins: balanceAfter,
      },
      metadata: {
        resultData: data.result_data,
        roll: data.roll,
        message: data.message,
      },
    };
  }

  /**
   * Normalize slots response
   */
  static normalizeSlotsResponse(data: any, gameId: string, betAmount: number): SpinResult {
    const winAmount = data.winnings || 0;
    const balanceAfter = data.new_balance || data.balance || 0;

    return {
      success: data.success !== false,
      spinId: data.spin_id,
      gameId: gameId,
      gameName: 'Slots',
      betAmount,
      winAmount,
      netResult: winAmount - betAmount,
      result: winAmount > betAmount ? 'win' : winAmount === betAmount ? 'push' : 'loss',
      balanceAfter,
      wallet: {
        goldCoins: 0,
        sweepsCoins: balanceAfter,
      },
      metadata: {
        symbols: data.symbols,
        multiplier: data.multiplier,
      },
    };
  }

  /**
   * Normalize external games response
   */
  static normalizeExternalResponse(data: any, gameId: string, betAmount: number): SpinResult {
    const winAmount = data.win_amount || data.winnings || 0;
    const balanceAfter = data.balance_after || data.new_balance || data.balance || 0;

    return {
      success: data.success !== false,
      spinId: data.spin_id,
      gameId: data.game_id || gameId,
      gameName: data.game_name || 'External Game',
      betAmount,
      winAmount,
      netResult: data.net_result || (winAmount - betAmount),
      result: winAmount > 0 ? 'win' : 'loss',
      balanceAfter,
      wallet: data.wallet || {
        goldCoins: 0,
        sweepsCoins: balanceAfter,
      },
      metadata: {
        message: data.message,
      },
    };
  }

  /**
   * Normalize coinkrazy response
   */
  static normalizeCoinKrazyResponse(data: any, gameId: string, betAmount: number): SpinResult {
    const winAmount = data.win || data.winnings || 0;
    const balanceAfter = data.balance || 0;

    return {
      success: data.success !== false,
      spinId: data.spin_id,
      gameId: gameId,
      gameName: data.game_name || 'CoinKrazy Game',
      betAmount,
      winAmount,
      netResult: winAmount - betAmount,
      result: winAmount > 0 ? 'win' : 'loss',
      balanceAfter,
      wallet: {
        goldCoins: 0,
        sweepsCoins: balanceAfter,
      },
      metadata: {
        reels: data.reels,
        multiplier: data.multiplier,
        message: data.message,
      },
    };
  }
}

// ============================================================================
// SPIN SERVICE
// ============================================================================

class SpinServiceClass {
  private baseUrl = '/api';

  /**
   * Play a generic game spin
   * Routes to appropriate handler based on game type/provider
   */
  async playSpin(request: SpinRequest, gameType?: string): Promise<SpinResult> {
    try {
      // Use the generic games endpoint by default
      const endpoint = `${this.baseUrl}/games/spin`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: request.gameId,
          game_name: request.gameName,
          bet_amount: request.betAmount,
          player_id: request.userId,
          ...request.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Spin failed');
      }

      // Normalize response to canonical format
      return ResponseNormalizer.normalizeExternalResponse(
        data.data,
        request.gameId,
        request.betAmount
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SpinService] Error:', message);

      return {
        success: false,
        gameId: request.gameId,
        gameName: request.gameName || 'Game',
        betAmount: request.betAmount,
        winAmount: 0,
        netResult: -request.betAmount,
        result: 'loss',
        balanceAfter: 0,
        error: message,
      };
    }
  }

  /**
   * Play a slots game
   */
  async playSlots(request: SpinRequest): Promise<SpinResult> {
    try {
      const response = await fetch(`${this.baseUrl}/slots/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: request.gameId,
          betAmount: request.betAmount,
          winAmount: 0, // Calculated by server
          symbols: '', // Generated by server
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Slots spin failed');

      return ResponseNormalizer.normalizeSlotsResponse(
        data.data || data,
        request.gameId,
        request.betAmount
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Slots spin error';
      console.error('[SpinService] Slots error:', message);

      return {
        success: false,
        gameId: request.gameId,
        gameName: 'Slots',
        betAmount: request.betAmount,
        winAmount: 0,
        netResult: -request.betAmount,
        result: 'loss',
        balanceAfter: 0,
        error: message,
      };
    }
  }

  /**
   * Play a casino game
   */
  async playCasino(request: SpinRequest): Promise<SpinResult> {
    try {
      const response = await fetch(`${this.baseUrl}/casino/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: request.gameId,
          bet_amount: request.betAmount,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Casino game failed');

      return ResponseNormalizer.normalizeCasinoResponse(
        data.data || data,
        request.gameId,
        request.betAmount
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Casino game error';
      console.error('[SpinService] Casino error:', message);

      return {
        success: false,
        gameId: request.gameId,
        gameName: 'Casino Game',
        betAmount: request.betAmount,
        winAmount: 0,
        netResult: -request.betAmount,
        result: 'loss',
        balanceAfter: 0,
        error: message,
      };
    }
  }

  /**
   * Play a CoinKrazy game
   */
  async playCoinkrazy(gameVariant: string, request: SpinRequest): Promise<SpinResult> {
    try {
      const response = await fetch(`${this.baseUrl}/coinkrazy-${gameVariant}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: request.betAmount,
          playerId: request.userId,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'CoinKrazy game failed');

      return ResponseNormalizer.normalizeCoinKrazyResponse(
        data.data || data,
        request.gameId,
        request.betAmount
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CoinKrazy game error';
      console.error('[SpinService] CoinKrazy error:', message);

      return {
        success: false,
        gameId: request.gameId,
        gameName: request.gameName || 'CoinKrazy Game',
        betAmount: request.betAmount,
        winAmount: 0,
        netResult: -request.betAmount,
        result: 'loss',
        balanceAfter: 0,
        error: message,
      };
    }
  }

  /**
   * Get current user's wallet balance
   */
  async getBalance(): Promise<{ sweepsCoins: number; goldCoins: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.success) return null;

      const walletData = data.data || data;
      return {
        sweepsCoins: walletData.sc_balance || walletData.sweepsCoins || 0,
        goldCoins: walletData.gc_balance || walletData.goldCoins || 0,
      };
    } catch (error) {
      console.error('[SpinService] Failed to fetch balance:', error);
      return null;
    }
  }

  /**
   * Update wallet balance manually
   */
  async updateBalance(scAmount: number, gcAmount: number = 0): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sc_amount: scAmount,
          gc_amount: gcAmount,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('[SpinService] Failed to update balance:', error);
      return false;
    }
  }

  /**
   * Get game configuration/metadata
   */
  async getGameConfig(gameId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${gameId}/config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.success ? data.data || data : null;
    } catch (error) {
      console.error('[SpinService] Failed to fetch game config:', error);
      return null;
    }
  }
}

// Export singleton instance
export const spinService = new SpinServiceClass();

// Export convenience functions
export const playSpin = (request: SpinRequest, gameType?: string) =>
  spinService.playSpin(request, gameType);

export const playSlots = (request: SpinRequest) => spinService.playSlots(request);

export const playCasino = (request: SpinRequest) => spinService.playCasino(request);

export const playCoinkrazy = (variant: string, request: SpinRequest) =>
  spinService.playCoinkrazy(variant, request);

export const getBalance = () => spinService.getBalance();

export const updateBalance = (scAmount: number, gcAmount?: number) =>
  spinService.updateBalance(scAmount, gcAmount);

export const getGameConfig = (gameId: string) => spinService.getGameConfig(gameId);
