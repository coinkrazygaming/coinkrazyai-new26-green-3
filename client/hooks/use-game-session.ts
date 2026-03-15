/**
 * useGameSession Hook
 * Standardized wallet and transaction handling for all games
 * Handles: bet validation, optimistic updates, server calls, error recovery, wallet refresh
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { spinService, SpinResult, SpinRequest } from '@/lib/spin-service';
import { toast } from 'sonner';

export interface GameSessionConfig {
  gameId: string;
  gameName?: string;
  minBet: number;
  maxBet: number;
  gameType?: 'slots' | 'casino' | 'table' | 'card' | 'mini' | 'external';
  coinkrazyVariant?: string; // e.g., 'coinup', 'coinhot'
}

export interface GameSessionState {
  isProcessing: boolean;
  lastResult?: SpinResult;
  error?: string;
}

export type SpinHandler = (betAmount: number, userId?: string) => Promise<SpinResult>;

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
  const validateBet = useCallback(
    (betAmount: number): { valid: boolean; error?: string } => {
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
    },
    [config.minBet, config.maxBet, sweepsCoins]
  );

  /**
   * Execute a game spin using spinService
   * 1. Validate bet
   * 2. Call appropriate spin handler based on game type
   * 3. Update balance based on result
   * 4. Refresh wallet from server
   * 5. Handle errors with rollback
   */
  const playSpin = useCallback(
    async (betAmount: number, spinHandler?: SpinHandler) => {
      // 1. Validate bet
      const validation = validateBet(betAmount);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

      try {
        let result: SpinResult;

        // 2. Use provided handler OR call spinService based on game type
        if (spinHandler) {
          // Custom handler (for games with special logic)
          result = await spinHandler(betAmount, user?.id);
        } else {
          // Use spinService based on game type
          const spinRequest: SpinRequest = {
            gameId: config.gameId,
            gameName: config.gameName,
            betAmount,
            userId: user?.id,
          };

          switch (config.gameType) {
            case 'slots':
              result = await spinService.playSlots(spinRequest);
              break;
            case 'casino':
              result = await spinService.playCasino(spinRequest);
              break;
            case 'external':
              result = await spinService.playSpin(spinRequest, 'external');
              break;
            default:
              // Generic game endpoint
              result = await spinService.playSpin(spinRequest);
          }
        }

        if (!result.success) {
          throw new Error(result.error || 'Spin failed');
        }

        // 3. Update state with result
        setState(prev => ({
          ...prev,
          lastResult: result,
          isProcessing: false,
        }));

        // 4. Show win notification if applicable
        if (result.winAmount > 0) {
          toast.success(`🎉 Won ${result.winAmount.toFixed(2)} SC!`);
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
    [config.gameId, config.gameName, config.gameType, user?.id, validateBet, refreshWallet]
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
    lastWin: state.lastResult?.winAmount || 0,
    lastNetResult: state.lastResult?.netResult || 0,

    // Actions
    playSpin,
    validateBet,
    reset,

    // User info
    userId: user?.id,
    username: (user as any)?.username,
  };
}
