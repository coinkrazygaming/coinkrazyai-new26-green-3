import { RequestHandler } from "express";
import { recordSlotsResult, recordWalletTransaction, getPlayerById, getBettingLimits, updateBettingLimits } from "../db/queries";

export const handleSpin: RequestHandler = async (req, res) => {
  const { gameId, betAmount, winAmount = 0, symbols = "" } = req.body;
  const playerId = (req as any).user.playerId;

  if (!gameId || betAmount === undefined) {
    return res.status(400).json({ error: "Missing gameId or betAmount" });
  }

  try {
    const playerResult = await getPlayerById(playerId);
    if (!playerResult.rows.length) {
      return res.status(404).json({ error: "Player not found" });
    }

    const player = playerResult.rows[0];
    const currentSc = parseFloat(player.sc_balance);
    const bet = parseFloat(betAmount);
    const win = parseFloat(winAmount);
    
    // Apply win cap of 10 SC as per requirements
    const cappedWin = Math.min(win, 10.00);

    if (currentSc < bet) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 1. Deduct bet
    await recordWalletTransaction(
      playerId,
      "slot_spin_bet",
      0,
      -bet,
      `Spin bet on game ${gameId}`
    );

    // 2. Add win if any
    if (cappedWin > 0) {
      await recordWalletTransaction(
        playerId,
        "slot_spin_win",
        0,
        cappedWin,
        `Win on game ${gameId}`
      );
    }

    // 3. Log the spin result
    const result = await recordSlotsResult(
      playerId,
      gameId,
      bet,
      cappedWin,
      symbols || "[]"
    );

    const updatedPlayerResult = await getPlayerById(playerId);
    const updatedPlayer = updatedPlayerResult.rows[0];

    res.json({
      success: true,
      balance: {
        gc: parseFloat(updatedPlayer.gc_balance),
        sc: parseFloat(updatedPlayer.sc_balance)
      },
      win: cappedWin,
      resultId: result.rows[0].id
    });

  } catch (error) {
    console.error("Spin error:", error);
    res.status(500).json({ error: "Failed to process spin" });
  }
};

export const handleGetConfig: RequestHandler = async (req, res) => {
  try {
    const result = await getBettingLimits("slots");
    res.json({
      success: true,
      config: result.rows[0] || {
        min_bet_sc: 0.01,
        max_bet_sc: 5.00,
        max_win_per_spin_sc: 10.00
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch slots config" });
  }
};

export const handleUpdateConfig: RequestHandler = async (req, res) => {
  try {
    const { minBetSc, maxBetSc, maxWinPerSpinSc } = req.body;
    const result = await updateBettingLimits("slots", {
      minBetSc,
      maxBetSc,
      maxWinPerSpinSc,
      minRedemptionSc: 50
    });
    res.json({
      success: true,
      config: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update slots config" });
  }
};
