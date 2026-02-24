import { RequestHandler } from "express";
import { query } from "../db/connection";

// Symbol types
type SymbolType = 'cherry' | 'lemon' | 'orange' | 'plum' | 'grape' | 'watermelon' | 'wild' | 'collect' | 'bonus' | 'jackpot';

interface SpinRequest {
  betAmount: number;
  playerId: number;
  sessionId?: string;
}

interface SpinResponse {
  reels: SymbolType[][];
  win: number;
  gameState: string;
  message: string;
}

// Symbol payouts (relative to bet)
const SYMBOL_PAYOUTS: Record<SymbolType, number[]> = {
  cherry: [0.1, 0.3, 0.5, 1, 2],
  lemon: [0.2, 0.4, 0.8, 1.5, 3],
  orange: [0.3, 0.6, 1, 2, 4],
  plum: [0.4, 0.8, 1.5, 3, 5],
  grape: [0.5, 1, 2, 4, 6],
  watermelon: [1, 2, 4, 6, 8],
  wild: [0, 0, 0, 0, 0],
  collect: [0, 0, 0, 0, 0],
  bonus: [0.5, 1, 2, 4, 8],
  jackpot: [2, 5, 10, 20, 50],
};

const JACKPOT_MULTIPLIERS = {
  mini: 10,
  minor: 25,
  major: 100,
  grand: 1000,
};

const MAX_BET = 5;
const MAX_WIN = 10; // Hard cap on single spin win
const MIN_BET = 0.1;

// Generate a random symbol
function generateSymbol(): SymbolType {
  const symbols: SymbolType[] = [
    'cherry', 'lemon', 'orange', 'plum', 'grape', 'watermelon', 'wild', 'bonus'
  ];
  
  // Random chance for jackpot
  if (Math.random() < 0.02) {
    return 'jackpot';
  }
  
  // Random chance for collect
  if (Math.random() < 0.05) {
    return 'collect';
  }
  
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// Generate a full reel (column of 3 symbols)
function generateReel(): SymbolType[] {
  return [generateSymbol(), generateSymbol(), generateSymbol()];
}

// Generate all 5 reels
function generateReels(): SymbolType[][] {
  const reels: SymbolType[][] = [];
  for (let i = 0; i < 5; i++) {
    reels.push(generateReel());
  }
  return reels;
}

// Calculate win from reels (simplified 15-line system)
function calculateWin(reels: SymbolType[][], bet: number): { win: number; description: string } {
  let totalWin = 0;
  const winners: string[] = [];

  // Check each payline (simplified - check across all 15 possible lines)
  for (let payline = 0; payline < 15; payline++) {
    const lineSymbols: SymbolType[] = [];
    
    // Get symbols for this payline
    for (let reel = 0; reel < 5; reel++) {
      const row = payline % 3;
      lineSymbols.push(reels[reel][row]);
    }

    // Check for consecutive matches
    let matchCount = 1;
    let baseSymbol = lineSymbols[0];
    
    if (baseSymbol === 'collect') {
      // Collect symbol triggers bonus collection
      winners.push('collect-trigger');
      totalWin += bet * 2; // Base collect reward
      continue;
    }

    for (let i = 1; i < 5; i++) {
      const current = lineSymbols[i];
      
      if (current === baseSymbol || current === 'wild' || baseSymbol === 'wild') {
        matchCount++;
      } else {
        break;
      }
    }

    // Calculate payout for this line
    if (matchCount >= 3 && baseSymbol !== 'wild' && baseSymbol !== 'collect') {
      const symbolIndex = Math.min(matchCount - 3, 4); // Map 3-7+ matches to 0-4 index
      const payout = SYMBOL_PAYOUTS[baseSymbol]?.[symbolIndex] || 0;
      const lineWin = payout * bet;
      
      if (lineWin > 0) {
        totalWin += lineWin;
        winners.push(`${matchCount}x${baseSymbol}`);
      }
    }

    // Check for jackpot symbols
    if (lineSymbols.includes('jackpot')) {
      const jackpotType = Math.random() > 0.75 ? 'grand' : 
                         Math.random() > 0.5 ? 'major' : 
                         Math.random() > 0.25 ? 'minor' : 'mini';
      const jackpotWin = bet * JACKPOT_MULTIPLIERS[jackpotType];
      totalWin += jackpotWin;
      winners.push(`${jackpotType}-jackpot-${jackpotWin}`);
    }
  }

  // Apply hard cap
  const cappedWin = Math.min(Math.max(totalWin, 0), MAX_WIN);
  const description = winners.length > 0 ? winners.join(', ') : 'No win';

  return {
    win: parseFloat(cappedWin.toFixed(2)),
    description
  };
}

// Main spin handler
export const handleCoinKrazyThunderSpin: RequestHandler = async (req, res) => {
  try {
    const { betAmount, playerId } = req.body as SpinRequest;

    // Validate inputs
    if (!betAmount || !playerId) {
      return res.status(400).json({
        error: 'Missing required fields: betAmount, playerId'
      });
    }

    if (betAmount < MIN_BET || betAmount > MAX_BET) {
      return res.status(400).json({
        error: `Invalid bet amount. Must be between ${MIN_BET} and ${MAX_BET}`
      });
    }

    // Get player wallet
    const playerResult = await query(
      'SELECT sc_balance FROM players WHERE id = $1',
      [playerId]
    );

    if (!playerResult.rows.length) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const scBalance = parseFloat(playerResult.rows[0].sc_balance);

    if (scBalance < betAmount) {
      return res.status(400).json({
        error: 'Insufficient SC balance',
        currentBalance: scBalance,
        requiredBalance: betAmount
      });
    }

    // Generate reels
    const reels = generateReels();

    // Calculate win
    const { win, description } = calculateWin(reels, betAmount);

    // Update player balance (debit bet, credit win)
    const newBalance = scBalance - betAmount + win;
    await query(
      'UPDATE players SET sc_balance = $1 WHERE id = $2',
      [newBalance, playerId]
    );

    // Log game result
    await query(
      `INSERT INTO game_results (game_id, player_id, bet_amount, win_amount, multiplier, result_data, status, played_at)
       VALUES (
         (SELECT id FROM games WHERE name = 'CoinKrazy-Thunder' LIMIT 1),
         $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
       )`,
      [
        playerId,
        betAmount,
        win,
        win > 0 ? (win / betAmount) : 0,
        JSON.stringify({ reels, description, lineSummary: description }),
        win > 0 ? 'win' : 'loss'
      ]
    );

    const response: SpinResponse = {
      reels,
      win,
      gameState: win > 0 ? 'WIN' : 'LOSS',
      message: description || 'Spin completed'
    };

    res.json(response);
  } catch (error) {
    console.error('[CoinKrazy-Thunder] Spin error:', error);
    res.status(500).json({
      error: 'Failed to process spin',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get game stats
export const handleGetThunderStats: RequestHandler = async (req, res) => {
  try {
    const { playerId } = req.query;

    if (!playerId) {
      return res.status(400).json({ error: 'Missing playerId' });
    }

    // Get player stats for this game
    const result = await query(
      `SELECT 
         COUNT(*) as total_spins,
         SUM(CASE WHEN win_amount > 0 THEN 1 ELSE 0 END) as total_wins,
         SUM(bet_amount) as total_wagered,
         SUM(win_amount) as total_winnings,
         AVG(CASE WHEN win_amount > 0 THEN win_amount ELSE NULL END) as avg_win,
         MAX(win_amount) as biggest_win
       FROM game_results 
       WHERE player_id = $1 AND game_id = (SELECT id FROM games WHERE name = 'CoinKrazy-Thunder' LIMIT 1)`,
      [playerId]
    );

    const stats = result.rows[0] || {
      total_spins: 0,
      total_wins: 0,
      total_wagered: 0,
      total_winnings: 0,
      avg_win: 0,
      biggest_win: 0
    };

    res.json({
      gameId: 'coinkrazy-thunder',
      gameName: 'CoinKrazy-Thunder',
      playerStats: {
        totalSpins: parseInt(stats.total_spins),
        totalWins: parseInt(stats.total_wins),
        winRate: stats.total_spins > 0 
          ? ((parseInt(stats.total_wins) / parseInt(stats.total_spins)) * 100).toFixed(2) 
          : 0,
        totalWagered: parseFloat(stats.total_wagered || 0).toFixed(2),
        totalWinnings: parseFloat(stats.total_winnings || 0).toFixed(2),
        averageWin: parseFloat(stats.avg_win || 0).toFixed(2),
        biggestWin: parseFloat(stats.biggest_win || 0).toFixed(2),
      }
    });
  } catch (error) {
    console.error('[CoinKrazy-Thunder] Stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  handleCoinKrazyThunderSpin,
  handleGetThunderStats
};
