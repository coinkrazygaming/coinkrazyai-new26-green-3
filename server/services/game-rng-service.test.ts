import { describe, it, expect, beforeEach } from 'vitest';
import { GameRNG } from './game-rng-service';

describe('GameRNG Service', () => {
  describe('Configuration Validation', () => {
    it('should validate correct game configuration', () => {
      const config = {
        rtp: 95.5,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject RTP below 85', () => {
      const config = {
        rtp: 84,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/RTP/);
    });

    it('should reject RTP above 98', () => {
      const config = {
        rtp: 99,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/RTP/);
    });

    it('should reject invalid volatility', () => {
      const config = {
        rtp: 95,
        volatility: 'Extreme' as any,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/volatility/i);
    });

    it('should reject max bet less than min bet', () => {
      const config = {
        rtp: 95,
        volatility: 'Medium' as const,
        minBet: 5.0,
        maxBet: 0.1,
        maxWinAmount: 10.0
      };

      const result = GameRNG.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Maximum bet/);
    });
  });

  describe('Spin Results', () => {
    const config = {
      rtp: 96.0,
      volatility: 'Medium' as const,
      minBet: 0.1,
      maxBet: 5.0,
      maxWinAmount: 10.0
    };

    it('should return a valid spin result', () => {
      const result = GameRNG.processSpin(config, 1.0);

      expect(result).toHaveProperty('isWin');
      expect(result).toHaveProperty('winAmount');
      expect(result).toHaveProperty('multiplier');
      expect(result).toHaveProperty('seed');
      expect(typeof result.isWin).toBe('boolean');
      expect(typeof result.winAmount).toBe('number');
      expect(typeof result.multiplier).toBe('number');
    });

    it('should enforce max win amount cap', () => {
      const result = GameRNG.processSpin(config, 10.0); // Bet large amount

      expect(result.winAmount).toBeLessThanOrEqual(config.maxWinAmount);
    });

    it('should cap win at configured max', () => {
      const smallMaxWin = {
        ...config,
        maxWinAmount: 5.0
      };

      const result = GameRNG.processSpin(smallMaxWin, 1.0);
      expect(result.winAmount).toBeLessThanOrEqual(5.0);
    });

    it('should return 0 win for losses', () => {
      const result = GameRNG.processSpin(config, 1.0);

      if (!result.isWin) {
        expect(result.winAmount).toBe(0);
        expect(result.multiplier).toBe(0);
      }
    });

    it('should have multiplier > 0 for wins', () => {
      const result = GameRNG.processSpin(config, 1.0);

      if (result.isWin) {
        expect(result.multiplier).toBeGreaterThan(0);
        expect(result.winAmount).toBeGreaterThan(0);
      }
    });
  });

  describe('Seeded RNG (Deterministic)', () => {
    const config = {
      rtp: 96.0,
      volatility: 'Medium' as const,
      minBet: 0.1,
      maxBet: 5.0,
      maxWinAmount: 10.0
    };

    it('should produce same result with same seed', () => {
      const seed = 'test-seed-12345';
      const result1 = GameRNG.processSpin(config, 1.0, seed);
      const result2 = GameRNG.processSpin(config, 1.0, seed);

      expect(result1.isWin).toBe(result2.isWin);
      expect(result1.winAmount).toBe(result2.winAmount);
      expect(result1.multiplier).toBe(result2.multiplier);
    });

    it('should produce different results with different seeds', () => {
      const result1 = GameRNG.processSpin(config, 1.0, 'seed1');
      const result2 = GameRNG.processSpin(config, 1.0, 'seed2');

      // Very unlikely both results are identical with different seeds
      const bothEqual = (
        result1.isWin === result2.isWin &&
        result1.winAmount === result2.winAmount
      );
      expect(bothEqual).toBe(false);
    });
  });

  describe('Volatility Behavior', () => {
    const baseConfig = {
      rtp: 95.0,
      minBet: 0.1,
      maxBet: 5.0,
      maxWinAmount: 10.0
    };

    it('low volatility should have frequent wins with smaller amounts', () => {
      const config = { ...baseConfig, volatility: 'Low' as const };
      let wins = 0;
      let totalWinAmount = 0;
      const spins = 100;

      for (let i = 0; i < spins; i++) {
        const result = GameRNG.processSpin(config, 1.0);
        if (result.isWin) {
          wins++;
          totalWinAmount += result.winAmount;
        }
      }

      const winRate = wins / spins;
      const avgWinAmount = totalWinAmount / wins || 0;

      // Low volatility should have higher win rate
      expect(winRate).toBeGreaterThan(0.3);
      // And smaller average multipliers
      expect(avgWinAmount).toBeLessThan(5.0);
    });

    it('high volatility should have fewer wins with larger amounts', () => {
      const config = { ...baseConfig, volatility: 'High' as const };
      let wins = 0;
      let totalWinAmount = 0;
      const spins = 100;

      for (let i = 0; i < spins; i++) {
        const result = GameRNG.processSpin(config, 1.0);
        if (result.isWin) {
          wins++;
          totalWinAmount += result.winAmount;
        }
      }

      const winRate = wins / spins;
      const avgWinAmount = totalWinAmount / wins || 0;

      // High volatility should have lower win rate
      expect(winRate).toBeLessThan(0.4);
    });
  });

  describe('RTP Compliance', () => {
    it('should respect RTP configuration (statistical test)', () => {
      const config = {
        rtp: 90.0,
        volatility: 'Medium' as const,
        minBet: 1.0,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      let totalBet = 0;
      let totalWon = 0;
      const spins = 1000;

      for (let i = 0; i < spins; i++) {
        const betAmount = 1.0;
        const result = GameRNG.processSpin(config, betAmount);

        totalBet += betAmount;
        totalWon += result.winAmount;
      }

      const actualRTP = (totalWon / totalBet) * 100;

      // Allow 5% variance from configured RTP (statistical variance)
      expect(actualRTP).toBeGreaterThan(config.rtp - 5);
      expect(actualRTP).toBeLessThan(config.rtp + 5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum bet amount', () => {
      const config = {
        rtp: 95.0,
        volatility: 'Medium' as const,
        minBet: 0.01,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.processSpin(config, 0.01);
      expect(result.winAmount).toBeGreaterThanOrEqual(0);
      expect(result.winAmount).toBeLessThanOrEqual(10.0);
    });

    it('should handle maximum bet amount', () => {
      const config = {
        rtp: 95.0,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.processSpin(config, 5.0);
      expect(result.winAmount).toBeGreaterThanOrEqual(0);
      expect(result.winAmount).toBeLessThanOrEqual(10.0);
    });

    it('should handle very high RTP', () => {
      const config = {
        rtp: 98.0,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.processSpin(config, 1.0);
      expect(result).toHaveProperty('isWin');
      expect(result).toHaveProperty('winAmount');
    });

    it('should handle very low RTP', () => {
      const config = {
        rtp: 85.0,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const result = GameRNG.processSpin(config, 1.0);
      expect(result).toHaveProperty('isWin');
      expect(result).toHaveProperty('winAmount');
    });
  });

  describe('Volatility Metrics', () => {
    it('should provide metrics for Low volatility', () => {
      const metrics = GameRNG.getVolatilityMetrics('Low');
      expect(metrics.label).toBe('Low Volatility');
      expect(metrics.riskLevel).toBe('Conservative');
    });

    it('should provide metrics for Medium volatility', () => {
      const metrics = GameRNG.getVolatilityMetrics('Medium');
      expect(metrics.label).toBe('Medium Volatility');
      expect(metrics.riskLevel).toBe('Balanced');
    });

    it('should provide metrics for High volatility', () => {
      const metrics = GameRNG.getVolatilityMetrics('High');
      expect(metrics.label).toBe('High Volatility');
      expect(metrics.riskLevel).toBe('Aggressive');
    });
  });

  describe('Theoretical RTP', () => {
    it('should return configured RTP as theoretical RTP', () => {
      const config = {
        rtp: 94.5,
        volatility: 'Medium' as const,
        minBet: 0.1,
        maxBet: 5.0,
        maxWinAmount: 10.0
      };

      const theoretical = GameRNG.getTheoreticalRTP(config);
      expect(theoretical).toBe(94.5);
    });
  });
});
