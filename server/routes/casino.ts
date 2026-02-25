import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { query } from '../db/connection';
import { emitWalletUpdate } from '../socket';

export const handlePlayCasinoGame: RequestHandler = async (req, res) => {
  try {
    // Accept both camelCase and snake_case field names
    const gameId = req.body.game_id || req.body.gameId;
    const rawBetAmount = req.body.bet_amount || req.body.betAmount;
    const game_id = gameId;
    const bet_amount = parseFloat(rawBetAmount);
    const { gameData } = req.body;
    const playerId = (req as any).user?.playerId;

    if (!playerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!game_id || isNaN(bet_amount) || bet_amount <= 0) {
      return res.status(400).json({ error: 'Invalid game_id or bet_amount' });
    }

    // Get current player
    const playerResult = await query(
      'SELECT sc_balance FROM players WHERE id = $1',
      [playerId]
    );

    if (!playerResult.rows.length) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const currentBalance = Number(playerResult.rows[0].sc_balance);

    // Check if player has enough balance
    if (currentBalance < bet_amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        current_balance: currentBalance,
        required: bet_amount
      });
    }

    // Game Logic
    let wins = false;
    let winnings = 0;
    let result_data: any = {};

    if (game_id === 'krazy-dice') {
      const { targetNumber, isRollUnder } = gameData || { targetNumber: 50, isRollUnder: true };
      const roll = Math.random() * 100;
      wins = isRollUnder ? (roll < targetNumber) : (roll > targetNumber);

      if (wins) {
        const winChance = isRollUnder ? targetNumber : (100 - targetNumber);
        const multiplier = 99 / winChance;
        winnings = Math.round(bet_amount * multiplier * 100) / 100;
      }
      result_data = { roll, targetNumber, isRollUnder };
    } else if (game_id === 'power-plinko') {
      const multipliers = [5.6, 2.1, 1.1, 0.5, 0.2, 0.5, 1.1, 2.1, 5.6];
      // Simple random walk for plinko
      let pos = 4; // Start at center
      const rows = 8;
      for (let i = 0; i < rows; i++) {
        pos += Math.random() > 0.5 ? 0.5 : -0.5;
      }
      // Map pos to index in multipliers array (0 to 8)
      const finalIndex = Math.max(0, Math.min(8, Math.round(pos + 4)));
      const multiplier = multipliers[finalIndex];
      winnings = Math.round(bet_amount * multiplier * 100) / 100;
      wins = winnings > bet_amount;
      result_data = { finalIndex, multiplier };
    } else if (game_id === 'pool-shark') {
      // Pool Shark logic: Random outcome for now as it's "Coming Soon"
      wins = Math.random() < 0.3; // 30% win rate for beta
      if (wins) {
        const multiplier = 2.0;
        winnings = bet_amount * multiplier;
      }
      result_data = { message: "Alpha preview", shots: Math.floor(Math.random() * 5) + 1 };
    } else {
      // Default random 40% win rate for other games
      wins = Math.random() < 0.4;
      if (wins) {
        const multiplier = 1 + Math.random() * 4;
        winnings = Math.round(bet_amount * multiplier * 100) / 100;
      }
    }

    // Calculate new balance
    const newBalance = currentBalance - bet_amount + winnings;

    // Deduct bet from balance
    await dbQueries.recordWalletTransaction(
      playerId,
      'Loss',
      0,
      -bet_amount,
      `Casino game spin (${game_id}): ${wins ? 'Win' : 'Loss'}`
    );

    // Add winnings if any
    if (winnings > 0) {
      await dbQueries.recordWalletTransaction(
        playerId,
        'Win',
        0,
        winnings,
        `Casino game winnings (${game_id})`
      );
    }

    // Track spin in casino_game_spins table
    try {
      await query(
        `INSERT INTO casino_game_spins
        (player_id, game_id, game_name, provider, bet_amount, winnings, balance_before, balance_after, result, result_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          playerId,
          game_id,
          game_id, // game_name - use game_id for now, could be enhanced
          'CoinKrazy', // provider
          bet_amount,
          winnings,
          currentBalance,
          newBalance,
          wins ? 'win' : 'loss',
          JSON.stringify(result_data)
        ]
      );
    } catch (err: any) {
      console.error('[Casino] Failed to record spin:', err);
      // Don't fail the request if tracking fails
    }

    // Emit wallet update via Socket.io for real-time balance updates
    emitWalletUpdate(playerId, {
      userId: playerId,
      sweepsCoins: newBalance,
      goldCoins: 0,
      type: 'casino_game',
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      result: {
        roll: result_data.roll, // For dice game specifically
        payout: winnings, // Payout amount
        win: wins
      },
      data: {
        game_id,
        bet_amount,
        winnings,
        result: wins ? 'win' : 'loss',
        result_data,
        new_balance: newBalance,
        wallet: {
          goldCoins: 0, // Keep this from context
          sweepsCoins: newBalance
        }
      }
    });
  } catch (err) {
    console.error('[Casino] Play game error:', err);
    return res.status(500).json({ error: 'Failed to process game' });
  }
};

export const handleSlotsSpin: RequestHandler = async (req, res) => {
  try {
    const { game_id, bet_amount: raw_bet_amount, winnings: raw_winnings, outcome } = req.body;
    const playerId = (req as any).user?.playerId;
    const bet_amount = parseFloat(raw_bet_amount);
    let winnings = parseFloat(raw_winnings || 0);

    if (!playerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!game_id || isNaN(bet_amount) || bet_amount < 0) {
      return res.status(400).json({ error: 'Invalid game_id or bet_amount' });
    }

    // Hard cap winnings at 10 SC
    if (winnings > 10) {
      console.warn(`[Casino] Winnings cap applied for player ${playerId}: ${winnings} -> 10`);
      winnings = 10;
    }

    // Get current player
    const playerResult = await query(
      'SELECT sc_balance FROM players WHERE id = $1',
      [playerId]
    );

    if (!playerResult.rows.length) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const currentBalance = Number(playerResult.rows[0].sc_balance);

    // Check if player has enough balance for the bet
    if (currentBalance < bet_amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        current_balance: currentBalance,
        required: bet_amount
      });
    }

    // Calculate new balance
    const newBalance = currentBalance - bet_amount + winnings;

    // Deduct bet from balance
    if (bet_amount > 0) {
      await dbQueries.recordWalletTransaction(
        playerId,
        'Loss',
        0,
        -bet_amount,
        `Slot game bet (${game_id})`
      );
    }

    // Add winnings if any
    if (winnings > 0) {
      await dbQueries.recordWalletTransaction(
        playerId,
        'Win',
        0,
        winnings,
        `Slot game winnings (${game_id})`
      );
    }

    // Track spin in casino_game_spins table
    try {
      const gameResult = await query('SELECT name, provider FROM games WHERE id = $1 OR slug = $2', [isNaN(parseInt(game_id)) ? -1 : parseInt(game_id), game_id]);
      const gameName = gameResult.rows[0]?.name || game_id;
      const provider = gameResult.rows[0]?.provider || 'External';

      await query(
        `INSERT INTO casino_game_spins
        (player_id, game_id, game_name, provider, bet_amount, winnings, balance_before, balance_after, result, result_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          playerId,
          isNaN(parseInt(game_id)) ? null : parseInt(game_id),
          gameName,
          provider,
          bet_amount,
          winnings,
          currentBalance,
          newBalance,
          winnings > bet_amount ? 'win' : (winnings === 0 ? 'loss' : 'push'),
          JSON.stringify({ outcome, raw_winnings })
        ]
      );
    } catch (err: any) {
      console.error('[Casino] Failed to record slot spin:', err);
    }

    // Emit wallet update via Socket.io
    emitWalletUpdate(playerId, {
      userId: playerId,
      sweepsCoins: newBalance,
      goldCoins: 0,
      type: 'slot_game',
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      data: {
        winnings,
        new_balance: newBalance
      }
    });
  } catch (err) {
    console.error('[Casino] Slot spin error:', err);
    return res.status(500).json({ error: 'Failed to process spin' });
  }
};

export const handleGetSpinHistory: RequestHandler = async (req, res) => {
  const playerId = (req as any).user?.playerId;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  // Support both gameId and game_id query parameters
  const gameIdFilter = req.query.gameId || req.query.game_id;

  if (!playerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    let sqlQuery = `SELECT id, game_id, game_name, provider, bet_amount, winnings, balance_before, balance_after, result, result_data, created_at
       FROM casino_game_spins
       WHERE player_id = $1`;
    let countQuery = 'SELECT COUNT(*) as total FROM casino_game_spins WHERE player_id = $1';
    let params: any[] = [playerId];
    let countParams: any[] = [playerId];

    // Add game_id filter if provided
    if (gameIdFilter) {
      sqlQuery += ` AND game_id = $${params.length + 1}`;
      countQuery += ` AND game_id = $${countParams.length + 1}`;
      params.push(gameIdFilter);
      countParams.push(gameIdFilter);
    }

    sqlQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Get spin history
    const spinsResult = await query(sqlQuery, params);

    // Get total count
    const countResult = await query(countQuery, countParams);

    // Return both formats: array directly and wrapped in data object for compatibility
    return res.json({
      success: true,
      data: spinsResult.rows, // Return as array directly for compatibility with existing clients
      spins: spinsResult.rows, // Also include as spins property for consistency
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (err) {
    console.error('[Casino] Get spin history error:', err);
    return res.status(500).json({ error: 'Failed to fetch spin history' });
  }
};

export const handleGetSpinStats: RequestHandler = async (req, res) => {
  const playerId = (req as any).user?.playerId;

  if (!playerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Get stats
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_spins,
        SUM(bet_amount) as total_wagered,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as total_wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as total_losses,
        SUM(winnings) as total_winnings,
        ROUND(AVG(CASE WHEN result = 'win' THEN winnings ELSE NULL END), 2) as avg_win,
        MAX(winnings) as max_win,
        COUNT(DISTINCT game_id) as games_played
      FROM casino_game_spins
      WHERE player_id = $1`,
      [playerId]
    );

    const stats = statsResult.rows[0];

    return res.json({
      success: true,
      data: {
        total_spins: parseInt(stats.total_spins),
        total_wagered: parseFloat(stats.total_wagered || 0),
        total_wins: parseInt(stats.total_wins),
        total_losses: parseInt(stats.total_losses),
        total_winnings: parseFloat(stats.total_winnings || 0),
        avg_win: parseFloat(stats.avg_win || 0),
        max_win: parseFloat(stats.max_win || 0),
        games_played: parseInt(stats.games_played),
        win_rate: stats.total_spins > 0 ? (parseInt(stats.total_wins) / parseInt(stats.total_spins) * 100).toFixed(2) : '0.00'
      }
    });
  } catch (err) {
    console.error('[Casino] Get spin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch spin stats' });
  }
};
