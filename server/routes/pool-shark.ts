import { RequestHandler } from "express";
import { query } from "../db/connection";
import { recordWalletTransaction } from "../db/queries";

// Create a new pool game
export const handleCreateGame: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { opponent_id, wager_amount, game_mode } = req.body;

    if (!wager_amount || wager_amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum wager is 10 SC'
      });
    }

    // Check player balance
    const playerResult = await query(
      'SELECT sc_balance FROM players WHERE id = $1',
      [req.user.playerId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const playerBalance = parseFloat(playerResult.rows[0].sc_balance);

    if (playerBalance < wager_amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance for wager'
      });
    }

    // Create game
    const gameResult = await query(
      `INSERT INTO pool_games (player1_id, player2_id, wager_amount, game_mode, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())
       RETURNING id, player1_id, player2_id, wager_amount, game_mode, status, created_at`,
      [req.user.playerId, opponent_id || null, wager_amount, game_mode || 'quick_match']
    );

    const game = gameResult.rows[0];

    // Deduct wager from player
    await recordWalletTransaction(
      req.user.playerId,
      'pool_wager',
      0,
      -wager_amount,
      `Pool Shark wager: ${wager_amount} SC`
    );

    res.status(201).json({
      success: true,
      data: {
        gameId: game.id,
        playerId: req.user.playerId,
        opponentId: opponent_id,
        wagerAmount: game.wager_amount,
        gameMode: game.game_mode,
        status: game.status
      }
    });
  } catch (error) {
    console.error('[Pool] Create game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
};

// Get game details
export const handleGetGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID required'
      });
    }

    const gameResult = await query(
      `SELECT * FROM pool_games WHERE id = $1`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const game = gameResult.rows[0];

    res.json({
      success: true,
      data: {
        gameId: game.id,
        player1Id: game.player1_id,
        player2Id: game.player2_id,
        wagerAmount: game.wager_amount,
        gameMode: game.game_mode,
        status: game.status,
        currentTurn: game.current_turn,
        player1Score: game.player1_score,
        player2Score: game.player2_score,
        winner: game.winner,
        createdAt: game.created_at
      }
    });
  } catch (error) {
    console.error('[Pool] Get game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game'
    });
  }
};

// Record a shot/move in the game
export const handleRecordMove: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { gameId, angle, power, ballsPocketed } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID required'
      });
    }

    // Record move in database
    await query(
      `INSERT INTO pool_moves (game_id, player_id, angle, power, balls_pocketed, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [gameId, req.user.playerId, angle, power, ballsPocketed]
    );

    res.json({
      success: true,
      data: {
        moveRecorded: true,
        ballsPocketed: ballsPocketed
      }
    });
  } catch (error) {
    console.error('[Pool] Record move error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record move'
    });
  }
};

// Finish/end a pool game
export const handleFinishGame: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { gameId, winnerId, player1Score, player2Score } = req.body;

    if (!gameId || !winnerId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID and winner ID required'
      });
    }

    // Get game details
    const gameResult = await query(
      'SELECT * FROM pool_games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const game = gameResult.rows[0];
    const wagerAmount = game.wager_amount;
    const loser = winnerId === game.player1_id ? game.player2_id : game.player1_id;

    // Update game status
    await query(
      `UPDATE pool_games 
       SET status = $1, winner = $2, player1_score = $3, player2_score = $4, finished_at = NOW()
       WHERE id = $5`,
      ['finished', winnerId, player1Score, player2Score, gameId]
    );

    // Award winnings to winner
    const winningsAmount = wagerAmount * 2 * 0.95; // 5% platform fee
    await recordWalletTransaction(
      winnerId,
      'pool_winnings',
      0,
      winningsAmount,
      `Pool Shark winnings: ${gameId}`
    );

    // Return loser's wager if they're still in the game
    if (loser && loser !== winnerId) {
      try {
        const loserResult = await query(
          'SELECT sc_balance FROM players WHERE id = $1',
          [loser]
        );
        if (loserResult.rows.length > 0) {
          // Loser's wager was already deducted
          console.log('[Pool] Game finished:', { gameId, winner: winnerId, loser });
        }
      } catch (e) {
        console.warn('[Pool] Error processing loser balance:', e);
      }
    }

    res.json({
      success: true,
      data: {
        gameId,
        winnerId,
        winningsAmount,
        status: 'finished'
      }
    });
  } catch (error) {
    console.error('[Pool] Finish game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finish game'
    });
  }
};

// Get player's pool game history
export const handleGetGameHistory: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await query(
      `SELECT * FROM pool_games 
       WHERE (player1_id = $1 OR player2_id = $1) AND status = 'finished'
       ORDER BY finished_at DESC
       LIMIT $2`,
      [req.user.playerId, limit]
    );

    const games = result.rows.map(game => ({
      gameId: game.id,
      opponent: game.player1_id === req.user.playerId ? game.player2_id : game.player1_id,
      wagerAmount: game.wager_amount,
      won: game.winner === req.user.playerId,
      player1Score: game.player1_score,
      player2Score: game.player2_score,
      finishedAt: game.finished_at
    }));

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('[Pool] Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game history'
    });
  }
};

// Get pool leaderboard
export const handleGetLeaderboard: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        CASE WHEN winner = player1_id THEN player1_id ELSE player2_id END as player_id,
        COUNT(*) as games_won,
        SUM(wager_amount * 2 * 0.95) as total_winnings,
        AVG(CASE WHEN winner = player1_id THEN player1_score ELSE player2_score END) as avg_score
       FROM pool_games
       WHERE status = 'finished' AND winner IS NOT NULL
       GROUP BY player_id
       ORDER BY total_winnings DESC
       LIMIT 50`
    );

    const leaderboard = result.rows.map((row, idx) => ({
      rank: idx + 1,
      playerId: row.player_id,
      gamesWon: row.games_won,
      totalWinnings: parseFloat(row.total_winnings),
      averageScore: parseFloat(row.avg_score)
    }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('[Pool] Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
};

// Get pool game stats for a player
export const handleGetStats: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN winner = $1 THEN 1 ELSE 0 END) as games_won,
        SUM(CASE WHEN (player1_id = $1 OR player2_id = $1) AND winner != $1 THEN 1 ELSE 0 END) as games_lost,
        SUM(wager_amount * 2 * 0.95) as total_winnings
       FROM pool_games
       WHERE (player1_id = $1 OR player2_id = $1) AND status = 'finished'`,
      [req.user.playerId]
    );

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalGames: parseInt(stats.total_games || 0),
        gamesWon: parseInt(stats.games_won || 0),
        gamesLost: parseInt(stats.games_lost || 0),
        winRate: stats.total_games > 0 
          ? ((parseInt(stats.games_won || 0) / parseInt(stats.total_games)) * 100).toFixed(2)
          : '0',
        totalWinnings: parseFloat(stats.total_winnings || 0)
      }
    });
  } catch (error) {
    console.error('[Pool] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
};
