/**
 * useGameSession Hook
 * Standardized wallet and transaction handling for all games
 * Handles: bet validation, optimistic updates, server calls, error recovery, wallet refresh
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from 'sonner';

export interface GameResult {
  success: boolean;
  winnings: number;
  newBalance: number;
  details?: Record<string, any>;
}

export interface GameSessionConfig {
  gameId: string;
  gameName?: string;
  minBet: number;
  maxBet: number;
}

export interface GameSessionState {
  isProcessing: boolean;
  lastResult?: GameResult;
  error?: string;
}

export type SpinHandler = (betAmount: number) => Promise<GameResult>;

export function useGameSession(config: GameSessionConfig) {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { sweepsCoins } = wallet;

  const [state, setState] = useState<GameSessionState>({
    isProcessing: false,
  });

  /**
   * Validates bet amount against constraints
   */
  const validateBet = useCallback((betAmount: number): { valid: boolean; error?: string } => {
    if (betAmount < config.minBet) {
      return {
        valid: false,
        error: `Minimum bet is ${config.minBet.toFixed(2)} SC`,
      };
    }

    if (betAmount > config.maxBet) {
      return {
        valid: false,
        error: `Maximum bet is ${config.maxBet.toFixed(2)} SC`,
      };
    }

    if (sweepsCoins < betAmount) {
      return {
        valid: false,
        error: 'Insufficient balance',
      };
    }

    return { valid: true };
  }, [config.minBet, config.maxBet, sweepsCoins]);

  /**
   * Execute a game spin/play with optimistic updates
   * 1. Validate bet
   * 2. Deduct balance optimistically
   * 3. Call spin handler (API call)
   * 4. Update balance based on result
   * 5. Refresh wallet from server
   * 6. Handle errors with rollback
   */
  const playSpin = useCallback(
    async (betAmount: number, spinHandler: SpinHandler) => {
      // 1. Validate bet
      const validation = validateBet(betAmount);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

      try {
        // 2. Call game handler (API call happens here)
        const result = await spinHandler(betAmount);

        if (!result.success) {
          throw new Error('Spin failed');
        }

        // 3. Update state with result
        setState(prev => ({
          ...prev,
          lastResult: result,
          isProcessing: false,
        }));

        // 4. Show win notification if applicable
        if (result.winnings > 0) {
          toast.success(`🎉 Won ${result.winnings.toFixed(2)} SC!`);
        } else {
          toast.info('No win this time. Try again!');
        }

        // 5. Refresh wallet in background to sync with server
        await refreshWallet();

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Game error occurred';
        
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);
        
        // Refresh wallet to ensure balance is in sync
        await refreshWallet();
        
        throw error;
      }
    },
    [validateBet, refreshWallet]
  );

  /**
   * Reset game session state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
    });
  }, []);

  return {
    // State
    isProcessing: state.isProcessing,
    lastResult: state.lastResult,
    error: state.error,
    currentBalance: sweepsCoins,

    // Actions
    playSpin,
    validateBet,
    reset,

    // User info
    userId: user?.id,
  };
}
