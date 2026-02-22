import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { query } from '../db/connection';

// ===== TYPES =====
interface SpinRequest {
  game_id: number;
  bet_amount: number;
}

interface SpinResult {
  game_id: number;
  game_name: string;
  bet_amount: number;
  win_amount: number;
  net_result: number;
  balance_after: number;
  spin_id: number;
}

// ===== GET GAME COMPLIANCE CONFIG =====
export const handleGetGameConfig: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    const result = await query(
      `SELECT
        g.id, g.name, g.description, g.image_url, g.embed_url, g.launch_url,
        gc.is_external, gc.is_sweepstake, gc.is_social_casino,
        gc.max_win_amount, gc.currency, gc.min_bet, gc.max_bet,
        gc.bet_increments
      FROM games g
      LEFT JOIN game_compliance gc ON g.id = gc.game_id
      WHERE g.id = $1`,
      [gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('[External Games] Error fetching game config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ===== PROCESS SPIN =====
export const handleProcessSpin: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { game_id, bet_amount } = req.body as {
      game_id: number;
      bet_amount: number;
    };

    // Validate inputs
    if (!game_id || !bet_amount) {
      return res.status(400).json({
        success: false,
        error: 'game_id and bet_amount required'
      });
    }

    // Get player's current SC balance
    const playerResult = await dbQueries.getPlayerById(req.user.playerId);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const player = playerResult.rows[0];
    const currentBalance = parseFloat(player.sc_balance);

    // Get game config
    const gameResult = await query(
      `SELECT g.id, g.name, gc.max_win_amount, gc.min_bet, gc.max_bet
       FROM games g
       LEFT JOIN game_compliance gc ON g.id = gc.game_id
       WHERE g.id = $1`,
      [game_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const gameConfig = gameResult.rows[0];
    // User requested max win limit of 10 SC
    const maxWin = Math.min(gameConfig.max_win_amount || 10.00, 10.00);
    const minBet = gameConfig.min_bet || 0.01;
    const maxBet = gameConfig.max_bet || 5.00;

    // Validate bet amount
    if (bet_amount < minBet || bet_amount > maxBet) {
      return res.status(400).json({
        success: false,
        error: `Bet must be between ${minBet} SC and ${maxBet} SC`
      });
    }

    // Check if player has enough balance for the bet
    if (currentBalance < bet_amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You have ${currentBalance.toFixed(2)} SC, but need ${bet_amount.toFixed(2)} SC`
      });
    }

    // 35% win rate, win between 0.2x and 10x bet, capped at 10 SC.
    const winChance = Math.random();
    let actualWin = 0;

    if (winChance > 0.65) {
      // For social casino, we want more frequent smaller wins
      const multiplier = 0.2 + Math.random() * 5.0;
      actualWin = Math.round(bet_amount * multiplier * 100) / 100;
    }

    // Strictly enforce the 10 SC limit requested by the user
    if (actualWin > 10.00) {
      actualWin = 10.00;
    }

    // Calculate net result
    const netResult = actualWin - bet_amount;
    const newBalance = currentBalance + netResult;

    // Update player SC balance
    await query(
      'UPDATE players SET sc_balance = $1, updated_at = NOW() WHERE id = $2',
      [newBalance, req.user.playerId]
    );

    // Log spin result
    const spinResult = await query(
      `INSERT INTO spin_results 
       (player_id, game_id, game_name, bet_amount, win_amount, net_result, balance_before, balance_after, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SC', 'completed')
       RETURNING id, player_id, game_id, game_name, bet_amount, win_amount, net_result, balance_after`,
      [req.user.playerId, game_id, gameConfig.name, bet_amount, actualWin, netResult, currentBalance, newBalance]
    );

    const spin = spinResult.rows[0];

    console.log(`[Spin] Player ${req.user.playerId} played ${gameConfig.name}: bet ${bet_amount} SC, won ${actualWin} SC, net ${netResult} SC, new balance ${newBalance.toFixed(2)} SC`);

    res.json({
      success: true,
      data: {
        spin_id: spin.id,
        game_id: spin.game_id,
        game_name: spin.game_name,
        bet_amount: parseFloat(spin.bet_amount),
        win_amount: parseFloat(spin.win_amount),
        net_result: parseFloat(spin.net_result),
        balance_after: parseFloat(spin.balance_after),
        message: actualWin > 0 
          ? `You won ${actualWin.toFixed(2)} SC!` 
          : `You lost ${bet_amount.toFixed(2)} SC`
      }
    });
  } catch (error: any) {
    console.error('[Spin] Error processing spin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process spin'
    });
  }
};

// ===== GET PLAYER SPIN HISTORY =====
export const handleGetSpinHistory: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { limit = '20', offset = '0', game_id } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let queryStr = `SELECT 
      sr.id, sr.game_id, sr.game_name, sr.bet_amount, sr.win_amount,
      sr.net_result, sr.balance_after, sr.created_at, sr.status
      FROM spin_results sr
      WHERE sr.player_id = $1`;

    const params: any[] = [req.user.playerId];

    if (game_id) {
      queryStr += ` AND sr.game_id = $${params.length + 1}`;
      params.push(game_id);
    }

    queryStr += ` ORDER BY sr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offsetNum);

    const result = await query(queryStr, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM spin_results WHERE player_id = $1';
    const countParams: any[] = [req.user.playerId];

    if (game_id) {
      countQuery += ` AND game_id = $${countParams.length + 1}`;
      countParams.push(game_id);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        game_id: row.game_id,
        game_name: row.game_name,
        bet_amount: parseFloat(row.bet_amount),
        win_amount: parseFloat(row.win_amount),
        net_result: parseFloat(row.net_result),
        balance_after: parseFloat(row.balance_after),
        created_at: row.created_at,
        status: row.status
      })),
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error: any) {
    console.error('[Spin] Error fetching spin history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ===== GET GAME LIST WITH COMPLIANCE INFO =====
export const handleGetExternalGames: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        g.id, g.name, g.description, g.image_url, g.embed_url, g.launch_url, g.slug,
        gc.is_external, gc.is_sweepstake, gc.max_win_amount,
        gc.min_bet, gc.max_bet, gc.currency
      FROM games g
      LEFT JOIN game_compliance gc ON g.id = gc.game_id
      WHERE g.enabled = TRUE AND (gc.is_external = TRUE OR gc.is_external IS NULL)
      ORDER BY g.name ASC`
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        image_url: row.image_url,
        embed_url: row.embed_url,
        launch_url: row.launch_url,
        slug: row.slug,
        is_external: row.is_external,
        is_sweepstake: row.is_sweepstake,
        max_win_amount: parseFloat(row.max_win_amount || '20.00'),
        min_bet: parseFloat(row.min_bet || '0.01'),
        max_bet: parseFloat(row.max_bet || '5.00'),
        currency: row.currency || 'SC'
      }))
    });
  } catch (error: any) {
    console.error('[External Games] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ===== ADMIN: UPDATE GAME MAX_WIN =====
export const handleUpdateGameMaxWin: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { max_win_amount } = req.body;

    if (!max_win_amount || max_win_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'max_win_amount must be greater than 0'
      });
    }

    // Check if compliance record exists
    const existingResult = await query(
      'SELECT id FROM game_compliance WHERE game_id = $1',
      [gameId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await query(
        'UPDATE game_compliance SET max_win_amount = $1, updated_at = NOW() WHERE game_id = $2',
        [max_win_amount, gameId]
      );
    } else {
      // Create new
      await query(
        `INSERT INTO game_compliance (game_id, max_win_amount, is_external, is_sweepstake, is_social_casino, currency)
         VALUES ($1, $2, TRUE, TRUE, TRUE, 'SC')`,
        [gameId, max_win_amount]
      );
    }

    res.json({
      success: true,
      message: `Updated max_win_amount to ${max_win_amount} SC for game ${gameId}`
    });
  } catch (error: any) {
    console.error('[Admin] Error updating game max_win:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ===== ADMIN: GET ALL GAME COMPLIANCE CONFIG =====
export const handleGetAllGameConfigs: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        g.id, g.name, gc.max_win_amount, gc.min_bet, gc.max_bet,
        gc.is_external, gc.is_sweepstake, gc.is_social_casino
      FROM games g
      LEFT JOIN game_compliance gc ON g.id = gc.game_id
      WHERE g.enabled = TRUE
      ORDER BY g.name ASC`
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        game_id: row.id,
        game_name: row.name,
        max_win_amount: parseFloat(row.max_win_amount || '20.00'),
        min_bet: parseFloat(row.min_bet || '0.01'),
        max_bet: parseFloat(row.max_bet || '5.00'),
        is_external: row.is_external || false,
        is_sweepstake: row.is_sweepstake !== false,
        is_social_casino: row.is_social_casino !== false
      }))
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching game configs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
