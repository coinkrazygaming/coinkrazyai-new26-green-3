import { RequestHandler } from 'express';
import { query } from '../db/connection';

// Generate random reward between min and max (inclusive)
const generateRandomReward = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max * 100 - min * 100 + 1) + min * 100) / 100;
};

export const handleGetSpinWheelStatus: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.playerId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get the most recent spin for this player
    const result = await query(
      `SELECT * FROM daily_spin_wheel_rewards 
       WHERE player_id = $1 
       ORDER BY claimed_at DESC 
       LIMIT 1`,
      [playerId]
    );

    const lastSpin = result.rows[0];
    const now = new Date();
    const canSpin = !lastSpin || new Date(lastSpin.next_available_at) <= now;

    if (!lastSpin) {
      // First time spinning
      return res.json({
        success: true,
        data: {
          canSpin: true,
          nextAvailableAt: null,
          lastReward: null,
          totalSpins: 0
        }
      });
    }

    // Count total spins for this player
    const countResult = await query(
      'SELECT COUNT(*) as total FROM daily_spin_wheel_rewards WHERE player_id = $1',
      [playerId]
    );

    return res.json({
      success: true,
      data: {
        canSpin,
        nextAvailableAt: lastSpin.next_available_at,
        lastReward: {
          sc: parseFloat(lastSpin.reward_sc),
          gc: parseFloat(lastSpin.reward_gc),
          claimedAt: lastSpin.claimed_at
        },
        totalSpins: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error: any) {
    console.error('[Daily Spin Wheel] Error getting status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get spin wheel status'
    });
  }
};

export const handleClaimSpinReward: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.playerId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if player can spin (24 hour cooldown)
    const lastSpinResult = await query(
      `SELECT * FROM daily_spin_wheel_rewards 
       WHERE player_id = $1 
       ORDER BY claimed_at DESC 
       LIMIT 1`,
      [playerId]
    );

    const lastSpin = lastSpinResult.rows[0];
    const now = new Date();

    if (lastSpin) {
      const nextAvailable = new Date(lastSpin.next_available_at);
      if (now < nextAvailable) {
        const timeRemainingMs = nextAvailable.getTime() - now.getTime();
        const hoursRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60));
        return res.status(429).json({
          success: false,
          error: `You can spin again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`,
          nextAvailableAt: nextAvailable,
          timeRemainingMs
        });
      }
    }

    // Generate random rewards
    const rewardSC = generateRandomReward(0.01, 1.00);
    const rewardGC = generateRandomReward(0.01, 1.00);

    // Calculate next available time (24 hours from now)
    const nextAvailableAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Insert the reward
    const insertResult = await query(
      `INSERT INTO daily_spin_wheel_rewards (player_id, reward_sc, reward_gc, next_available_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [playerId, rewardSC, rewardGC, nextAvailableAt]
    );

    const reward = insertResult.rows[0];

    // Add to player's wallet (players table has gc_balance and sc_balance)
    await query(
      `UPDATE players
       SET sc_balance = sc_balance + $1,
           gc_balance = gc_balance + $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [rewardSC, rewardGC, playerId]
    );

    // Record transaction in wallet_ledger
    await query(
      `INSERT INTO wallet_ledger (player_id, transaction_type, sc_amount, gc_amount, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [playerId, 'daily_spin', rewardSC, rewardGC, 'Daily Spin Wheel Reward']
    );

    console.log(`[Daily Spin Wheel] Player ${playerId} won SC: ${rewardSC}, GC: ${rewardGC}`);

    return res.json({
      success: true,
      data: {
        rewardSC: parseFloat(reward.reward_sc),
        rewardGC: parseFloat(reward.reward_gc),
        nextAvailableAt: reward.next_available_at,
        claimedAt: reward.claimed_at
      }
    });
  } catch (error: any) {
    console.error('[Daily Spin Wheel] Error claiming reward:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to claim reward'
    });
  }
};
