import { RequestHandler } from 'express';
import { query } from '../db/connection';

interface GameResult {
  success: boolean;
  win: number;
  reels: string[][];
  message: string;
}

export const handleCoinKrazy4EgyptPotsSpin: RequestHandler = async (req, res) => {
  try {
    const { userId, bet, lines = 20 } = req.body;

    if (!userId || !bet || bet < 0.01 || bet > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bet amount. Must be between 0.01 and 10 SC'
      });
    }

    // Get player and verify balance
    const playerResult = await query(
      'SELECT sweeps_coins FROM players WHERE id = $1',
      [userId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const currentBalance = parseFloat(playerResult.rows[0].sweeps_coins);
    if (currentBalance < bet) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Generate random reels (5 columns, 3 rows)
    const symbols = ['W', 'Q', 'H', 'S', 'A', 'K', 'J', '10', 'B', 'M'];
    const reels: string[][] = [];
    
    for (let col = 0; col < 5; col++) {
      reels[col] = [];
      for (let row = 0; row < 3; row++) {
        reels[col][row] = symbols[Math.floor(Math.random() * symbols.length)];
      }
    }

    // Calculate win based on paytable (simplified)
    let win = calculateWins(reels, bet);

    // Apply hard cap of 10 SC per spin
    win = Math.min(win, 10);

    // Deduct bet from balance
    const newBalance = currentBalance - bet;

    // Add win to balance (if any)
    const finalBalance = newBalance + win;

    // Update player balance
    await query(
      'UPDATE players SET sweeps_coins = $1 WHERE id = $2',
      [finalBalance, userId]
    );

    // Record game result
    try {
      const gameId = await getGameId('CoinKrazy-4EgyptPots');
      if (gameId) {
        await query(
          `INSERT INTO game_results (player_id, game_id, bet_amount, win_amount, status, result_data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            userId,
            gameId,
            bet,
            win,
            win > 0 ? 'win' : 'loss',
            JSON.stringify({ reels, lines })
          ]
        );
      }
    } catch (err) {
      console.error('[CoinKrazy-4EgyptPots] Failed to record game result:', err);
    }

    res.json({
      success: true,
      win,
      balance: finalBalance,
      reels,
      message: win > 0 ? `You won ${win} SC!` : 'No win this spin'
    });
  } catch (error) {
    console.error('[CoinKrazy-4EgyptPots] Spin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process spin'
    });
  }
};

// Paytable calculation
function calculateWins(reels: string[][], bet: number): number {
  let totalWin = 0;
  const paylines = 20;

  // Simplified payline checking (check first 3 reels for 3-of-a-kind)
  for (let line = 0; line < Math.min(paylines, 5); line++) {
    const symbol1 = reels[0][line % 3];
    const symbol2 = reels[1][(line + 1) % 3];
    const symbol3 = reels[2][(line + 2) % 3];

    // 3-of-a-kind matches
    if (symbol1 === symbol2 && symbol2 === symbol3) {
      const payTable: { [key: string]: number } = {
        'W': bet * 2.5,  // Wild
        'Q': bet * 7.5,  // Queen
        'H': bet * 5,    // Eye of Horus
        'S': bet * 5,    // Scarab
        'A': bet * 5,    // Ankh
        'K': bet * 2.5,  // K
        'J': bet * 2.5,  // J
        '10': bet * 2.5, // 10
        'B': bet * 1,    // Bonus
        'M': bet * 0.5   // Mystery
      };

      totalWin += payTable[symbol1] || 0;
    }
  }

  // Bonus symbol triggers
  const bonusCount = reels.flat().filter(s => s === 'B').length;
  if (bonusCount >= 6) {
    totalWin += bet * 2; // Hold & Win bonus trigger reward
  }

  return Math.min(totalWin, 10); // Hard cap at 10 SC
}

// Helper to get game ID
async function getGameId(gameName: string): Promise<number | null> {
  try {
    const result = await query(
      'SELECT id FROM games WHERE name = $1 LIMIT 1',
      [gameName]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (err) {
    console.error('[CoinKrazy-4EgyptPots] Error getting game ID:', err);
    return null;
  }
}
