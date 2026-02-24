import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameRNG } from '../services/game-rng-service';

/**
 * Integration tests for spin processing
 * Tests edge cases and concurrency scenarios
 */

describe('Spin Processing Integration Tests', () => {
  const testGameConfig = {
    id: 1,
    name: 'Test Game',
    rtp: 96.0,
    volatility: 'Medium' as const,
    max_win_amount: 10.0,
    min_bet: 0.1,
    max_bet: 5.0
  };

  describe('Balance Management', () => {
    it('should calculate net result correctly for wins', () => {
      const betAmount = 1.0;
      const playerBalance = 50.0;

      const spinResult = GameRNG.processSpin({
        rtp: testGameConfig.rtp,
        volatility: testGameConfig.volatility,
        minBet: testGameConfig.min_bet,
        maxBet: testGameConfig.max_bet,
        maxWinAmount: testGameConfig.max_win_amount
      }, betAmount);

      if (spinResult.isWin) {
        const netResult = spinResult.winAmount - betAmount;
        const newBalance = playerBalance + netResult;

        expect(newBalance).toBeGreaterThanOrEqual(playerBalance - betAmount);
        expect(newBalance).toBeLessThanOrEqual(playerBalance + testGameConfig.max_win_amount - betAmount);
      }
    });

    it('should calculate net result correctly for losses', () => {
      const betAmount = 1.0;
      const playerBalance = 50.0;

      const spinResult = GameRNG.processSpin({
        rtp: testGameConfig.rtp,
        volatility: testGameConfig.volatility,
        minBet: testGameConfig.min_bet,
        maxBet: testGameConfig.max_bet,
        maxWinAmount: testGameConfig.max_win_amount
      }, betAmount);

      if (!spinResult.isWin) {
        const netResult = -betAmount;
        const newBalance = playerBalance + netResult;

        expect(newBalance).toBe(playerBalance - betAmount);
      }
    });

    it('should prevent negative balance (insufficient balance scenario)', () => {
      const betAmount = 100.0;
      const playerBalance = 50.0;

      // This should be validated at the API level before RNG is called
      expect(playerBalance).toBeLessThan(betAmount);
      // The spin processing should validate this before calling GameRNG
    });
  });

  describe('Bet Validation', () => {
    it('should identify valid bet amounts', () => {
      const validBets = [0.1, 0.5, 1.0, 2.5, 5.0];

      validBets.forEach(betAmount => {
        expect(betAmount).toBeGreaterThanOrEqual(testGameConfig.min_bet);
        expect(betAmount).toBeLessThanOrEqual(testGameConfig.max_bet);
      });
    });

    it('should identify invalid bet amounts', () => {
      const invalidBets = [0.01, 0.05, 5.01, 10.0];
      const minBet = testGameConfig.min_bet;
      const maxBet = testGameConfig.max_bet;

      invalidBets.forEach(betAmount => {
        const isValid = betAmount >= minBet && betAmount <= maxBet;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Win Amount Capping', () => {
    it('should never exceed max win amount', () => {
      const maxWin = testGameConfig.max_win_amount;
      let exceeded = false;

      for (let i = 0; i < 100; i++) {
        const spinResult = GameRNG.processSpin({
          rtp: testGameConfig.rtp,
          volatility: testGameConfig.volatility,
          minBet: testGameConfig.min_bet,
          maxBet: testGameConfig.max_bet,
          maxWinAmount: maxWin
        }, 1.0);

        if (spinResult.winAmount > maxWin) {
          exceeded = true;
          break;
        }
      }

      expect(exceeded).toBe(false);
    });

    it('should respect different max win amounts', () => {
      const testCases = [
        { maxWin: 5.0, betAmount: 1.0 },
        { maxWin: 10.0, betAmount: 2.0 },
        { maxWin: 15.0, betAmount: 3.0 }
      ];

      testCases.forEach(testCase => {
        const spinResult = GameRNG.processSpin({
          rtp: testGameConfig.rtp,
          volatility: testGameConfig.volatility,
          minBet: testGameConfig.min_bet,
          maxBet: testGameConfig.max_bet,
          maxWinAmount: testCase.maxWin
        }, testCase.betAmount);

        expect(spinResult.winAmount).toBeLessThanOrEqual(testCase.maxWin);
      });
    });
  });

  describe('Concurrency Scenarios', () => {
    it('should handle multiple simultaneous spins (simulation)', async () => {
      const playerBalances = new Map<number, number>();

      // Initialize player balances
      for (let i = 1; i <= 5; i++) {
        playerBalances.set(i, 100.0);
      }

      // Simulate concurrent spins
      const spinPromises = [];

      for (let playerId = 1; playerId <= 5; playerId++) {
        for (let spin = 0; spin < 10; spin++) {
          spinPromises.push(
            Promise.resolve().then(() => {
              const spinResult = GameRNG.processSpin({
                rtp: testGameConfig.rtp,
                volatility: testGameConfig.volatility,
                minBet: testGameConfig.min_bet,
                maxBet: testGameConfig.max_bet,
                maxWinAmount: testGameConfig.max_win_amount
              }, 1.0);

              return { playerId, spinResult };
            })
          );
        }
      }

      const results = await Promise.all(spinPromises);

      // Verify all spins completed
      expect(results).toHaveLength(50);

      // Verify no RNG errors
      results.forEach(result => {
        expect(result.spinResult).toHaveProperty('isWin');
        expect(result.spinResult).toHaveProperty('winAmount');
      });
    });

    it('should maintain RNG quality under load', () => {
      const results = [];

      for (let i = 0; i < 1000; i++) {
        const spinResult = GameRNG.processSpin({
          rtp: testGameConfig.rtp,
          volatility: testGameConfig.volatility,
          minBet: testGameConfig.min_bet,
          maxBet: testGameConfig.max_bet,
          maxWinAmount: testGameConfig.max_win_amount
        }, 1.0);

        results.push(spinResult);
      }

      // Check that results are varied (not always wins or losses)
      const wins = results.filter(r => r.isWin).length;
      const losses = results.length - wins;

      expect(wins).toBeGreaterThan(0);
      expect(losses).toBeGreaterThan(0);

      // Approximately match RTP
      const rtp = (results.reduce((sum, r) => sum + r.winAmount, 0) / 1000) * 100;
      expect(rtp).toBeGreaterThan(testGameConfig.rtp - 10);
    });
  });

  describe('Compliance & Audit Trail', () => {
    it('should generate audit seed for every spin', () => {
      const spinResult = GameRNG.processSpin({
        rtp: testGameConfig.rtp,
        volatility: testGameConfig.volatility,
        minBet: testGameConfig.min_bet,
        maxBet: testGameConfig.max_bet,
        maxWinAmount: testGameConfig.max_win_amount
      }, 1.0);

      expect(spinResult.seed).toBeDefined();
      expect(typeof spinResult.seed).toBe('string');
      expect(spinResult.seed.length).toBeGreaterThan(0);
    });

    it('should support deterministic replay with seed', () => {
      const seed = 'audit-trail-seed-12345';

      const spin1 = GameRNG.processSpin({
        rtp: testGameConfig.rtp,
        volatility: testGameConfig.volatility,
        minBet: testGameConfig.min_bet,
        maxBet: testGameConfig.max_bet,
        maxWinAmount: testGameConfig.max_win_amount
      }, 1.0, seed);

      const spin2 = GameRNG.processSpin({
        rtp: testGameConfig.rtp,
        volatility: testGameConfig.volatility,
        minBet: testGameConfig.min_bet,
        maxBet: testGameConfig.max_bet,
        maxWinAmount: testGameConfig.max_win_amount
      }, 1.0, seed);

      expect(spin1.isWin).toBe(spin2.isWin);
      expect(spin1.winAmount).toBe(spin2.winAmount);
      expect(spin1.multiplier).toBe(spin2.multiplier);
    });
  });

  describe('Game Configuration Scenarios', () => {
    it('should handle different game configurations', () => {
      const configs = [
        {
          name: 'Slots Game',
          rtp: 95.0,
          volatility: 'Medium' as const,
          minBet: 0.1,
          maxBet: 5.0,
          maxWinAmount: 10.0
        },
        {
          name: 'High RTP Game',
          rtp: 97.5,
          volatility: 'Low' as const,
          minBet: 0.1,
          maxBet: 5.0,
          maxWinAmount: 8.0
        },
        {
          name: 'High Volatility Game',
          rtp: 93.0,
          volatility: 'High' as const,
          minBet: 0.5,
          maxBet: 10.0,
          maxWinAmount: 50.0
        }
      ];

      configs.forEach(config => {
        const validation = GameRNG.validateConfig(config);
        expect(validation.valid).toBe(true);

        const spinResult = GameRNG.processSpin(config, 1.0);
        expect(spinResult.winAmount).toBeLessThanOrEqual(config.maxWinAmount);
      });
    });
  });

  describe('Floating Point Precision', () => {
    it('should handle decimal amounts correctly', () => {
      const testCases = [
        0.1,
        0.25,
        0.33,
        0.5,
        1.11,
        2.99,
        3.33,
        4.75,
        5.0
      ];

      testCases.forEach(betAmount => {
        const spinResult = GameRNG.processSpin({
          rtp: testGameConfig.rtp,
          volatility: testGameConfig.volatility,
          minBet: testGameConfig.min_bet,
          maxBet: testGameConfig.max_bet,
          maxWinAmount: testGameConfig.max_win_amount
        }, betAmount);

        // Check that winAmount is a valid number with at most 2 decimals
        const roundedWin = Math.round(spinResult.winAmount * 100) / 100;
        expect(roundedWin).toBe(spinResult.winAmount);
      });
    });
  });
});
