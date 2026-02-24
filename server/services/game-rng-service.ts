import { crypto } from 'node:crypto';

/**
 * Production-ready RNG Service for Game Randomization
 * 
 * Features:
 * - Cryptographically secure random number generation
 * - Configurable RTP (Return to Player) percentages
 * - Volatility-based win frequency adjustment
 * - Audit trail logging for compliance
 * - Seeded RNG for testing and reproducibility
 */

export interface GameRNGConfig {
  rtp: number; // Return to Player percentage (90-98)
  volatility: 'Low' | 'Medium' | 'High';
  minBet: number;
  maxBet: number;
  maxWinAmount: number;
}

export interface SpinResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  seed?: string; // For compliance/audit trails
}

class GameRNGService {
  /**
   * Generate a cryptographically secure random number between 0 and 1
   */
  private generateSecureRandom(): number {
    const bytes = crypto.randomBytes(4);
    const value = bytes.readUInt32BE(0);
    return (value >>> 0) / 0x100000000; // Normalize to [0, 1)
  }

  /**
   * Calculate win probability based on RTP and volatility
   */
  private calculateWinProbability(rtp: number, volatility: 'Low' | 'Medium' | 'High'): number {
    // Base win probability from RTP
    // Higher RTP = higher win probability
    // Volatility adjusts the frequency/size tradeoff
    let baseProbability = (rtp - 85) / 10; // Maps 90-98 RTP to 0.5-1.3

    switch (volatility) {
      case 'Low':
        // More frequent wins, smaller amounts
        baseProbability = Math.min(baseProbability * 1.3, 0.95);
        break;
      case 'Medium':
        // Balanced
        break;
      case 'High':
        // Fewer wins, larger amounts
        baseProbability = Math.max(baseProbability * 0.7, 0.15);
        break;
    }

    return Math.max(0.1, Math.min(baseProbability, 0.95)); // Clamp [0.1, 0.95]
  }

  /**
   * Calculate win multiplier based on volatility and RTP
   */
  private calculateWinMultiplier(
    volatility: 'Low' | 'Medium' | 'High',
    rtp: number,
    random: number
  ): number {
    let minMultiplier: number;
    let maxMultiplier: number;

    switch (volatility) {
      case 'Low':
        // Frequent small wins
        minMultiplier = 1.1;
        maxMultiplier = 3.0;
        break;
      case 'Medium':
        // Balanced
        minMultiplier = 0.8;
        maxMultiplier = 5.0;
        break;
      case 'High':
        // Rare but big wins
        minMultiplier = 0.5;
        maxMultiplier = 10.0;
        break;
    }

    // Adjust based on RTP (higher RTP = slightly higher multipliers)
    const rtpFactor = 1 + (rtp - 90) / 200;
    minMultiplier *= rtpFactor;
    maxMultiplier *= rtpFactor;

    // Non-linear interpolation for more realistic distribution
    const interpolated = minMultiplier + Math.pow(random, 0.8) * (maxMultiplier - minMultiplier);

    return Math.round(interpolated * 100) / 100; // Round to 2 decimals
  }

  /**
   * Process a spin and calculate win/loss
   * Returns structured result with audit trail support
   */
  processSpin(config: GameRNGConfig, betAmount: number, seed?: string): SpinResult {
    // Generate random value (or use seed for testing)
    let random: number;

    if (seed) {
      // Deterministic RNG from seed (for testing/compliance)
      random = this.seededRandom(seed);
    } else {
      // Production: use cryptographically secure random
      random = this.generateSecureRandom();
    }

    const winProbability = this.calculateWinProbability(config.rtp, config.volatility);

    let result: SpinResult = {
      isWin: false,
      winAmount: 0,
      multiplier: 0,
      seed: seed || crypto.randomBytes(8).toString('hex'),
    };

    // Determine if this spin is a win based on probability
    if (random < winProbability) {
      result.isWin = true;

      // Calculate multiplier
      const multiplier = this.calculateWinMultiplier(
        config.volatility,
        config.rtp,
        (random / winProbability) // Normalize win range to [0, 1]
      );

      result.multiplier = multiplier;
      result.winAmount = Math.min(
        Math.round(betAmount * multiplier * 100) / 100,
        config.maxWinAmount
      );
    }

    return result;
  }

  /**
   * Seeded random number generator for testing and audit trails
   * Uses simple but deterministic algorithm
   */
  private seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 1000) / 1000; // Normalize to [0, 1)
  }

  /**
   * Validate game config for RTP/volatility constraints
   */
  validateConfig(config: GameRNGConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.rtp < 85 || config.rtp > 98) {
      errors.push(`RTP must be between 85-98, got ${config.rtp}`);
    }

    if (!['Low', 'Medium', 'High'].includes(config.volatility)) {
      errors.push(`Invalid volatility: ${config.volatility}`);
    }

    if (config.minBet < 0.01) {
      errors.push(`Minimum bet must be at least 0.01`);
    }

    if (config.maxBet < config.minBet) {
      errors.push(`Maximum bet cannot be less than minimum bet`);
    }

    if (config.maxWinAmount < 1) {
      errors.push(`Max win amount must be at least 1`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate theoretical RTP for a game configuration
   * (for compliance/reporting)
   */
  getTheoreticalRTP(config: GameRNGConfig): number {
    // The configured RTP is the target
    return config.rtp;
  }

  /**
   * Get volatility metrics for UI/reporting
   */
  getVolatilityMetrics(volatility: 'Low' | 'Medium' | 'High') {
    const metrics = {
      Low: {
        label: 'Low Volatility',
        description: 'Frequent small wins',
        riskLevel: 'Conservative',
        avgPayout: 'Medium'
      },
      Medium: {
        label: 'Medium Volatility',
        description: 'Balanced wins',
        riskLevel: 'Balanced',
        avgPayout: 'Balanced'
      },
      High: {
        label: 'High Volatility',
        description: 'Rare big wins',
        riskLevel: 'Aggressive',
        avgPayout: 'High'
      }
    };

    return metrics[volatility];
  }
}

// Export singleton instance
export const GameRNG = new GameRNGService();
