import { RequestHandler } from "express";
import * as db from "../db/queries";
import { S3Service } from "../services/s3-service";

// Get admin dashboard stats
export const getAdminDashboardStats: RequestHandler = async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
    });
  }
};

// Get players list
export const getPlayersList: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await db.getPlayers(limit, offset);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch players",
    });
  }
};

// Get single player
export const getPlayer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.getPlayerById(parseInt(Array.isArray(id) ? id[0] : id));

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Player not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch player",
    });
  }
};

// Update player balance
export const updatePlayerBalance: RequestHandler = async (req, res) => {
  try {
    const { playerId, gc, sc } = req.body;

    const result = await db.updatePlayerBalance(playerId, gc, sc);

    res.json({
      success: true,
      message: "Player balance updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating player balance:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update balance",
    });
  }
};

// Update player status
export const updatePlayerStatus: RequestHandler = async (req, res) => {
  try {
    const { playerId, status } = req.body;

    const result = await db.updatePlayerStatus(playerId, status);

    res.json({
      success: true,
      message: "Player status updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating player status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update status",
    });
  }
};

// Get games list
export const getGamesList: RequestHandler = async (req, res) => {
  try {
    const result = await db.getGames();
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch games",
    });
  }
};

// Update game RTP
export const updateGameRTP: RequestHandler = async (req, res) => {
  try {
    const { gameId, rtp } = req.body;

    const result = await db.updateGameRTP(gameId, rtp);

    res.json({
      success: true,
      message: "Game RTP updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating game RTP:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update RTP",
    });
  }
};

// Toggle game status
export const toggleGame: RequestHandler = async (req, res) => {
  try {
    const { gameId, enabled } = req.body;

    const result = await db.toggleGameStatus(gameId, enabled);

    res.json({
      success: true,
      message: "Game status updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error toggling game:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle game",
    });
  }
};

// Get bonuses
export const getBonusesList: RequestHandler = async (req, res) => {
  try {
    const result = await db.getBonuses();
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bonuses",
    });
  }
};

// Create bonus
export const createBonus: RequestHandler = async (req, res) => {
  try {
    const bonusData = req.body;

    const result = await db.createBonus(bonusData);

    res.json({
      success: true,
      message: "Bonus created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating bonus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create bonus",
    });
  }
};

// Get transactions
export const getTransactionsList: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await db.getTransactions(limit);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    });
  }
};

// Get security alerts
export const getSecurityAlerts: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await db.getSecurityAlerts(limit);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alerts",
    });
  }
};

// Get KYC documents
export const getKYCDocs: RequestHandler = async (req, res) => {
  try {
    const { playerId } = req.params;
    const result = await db.getKYCDocuments(parseInt(Array.isArray(playerId) ? playerId[0] : playerId));

    // Generate signed URLs for S3 documents
    const documents = await Promise.all(result.rows.map(async (doc) => {
      if (doc.document_url && doc.document_url.includes('.s3.amazonaws.com')) {
        try {
          // Extract key from URL: https://bucket.s3.amazonaws.com/key
          const urlParts = doc.document_url.split('.s3.amazonaws.com/');
          if (urlParts.length > 1) {
            const key = urlParts[1];
            const signedUrlResult = await S3Service.getSignedDownloadUrl(key);
            if (signedUrlResult.success) {
              return { ...doc, document_url: signedUrlResult.url, is_private: true };
            }
          }
        } catch (e) {
          console.error('[Admin] Failed to generate signed URL for:', doc.document_url, e);
        }
      }
      return doc;
    }));

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching KYC documents:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch documents",
    });
  }
};

// Approve KYC
export const approveKYC: RequestHandler = async (req, res) => {
  try {
    const { playerId, level } = req.body;

    const result = await db.updateKYCStatus(playerId, level, true);

    res.json({
      success: true,
      message: "KYC approved",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve KYC",
    });
  }
};

// Get poker tables
export const getPokerTablesList: RequestHandler = async (req, res) => {
  try {
    const result = await db.getPokerTables();
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching poker tables:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tables",
    });
  }
};

// Get bingo games
export const getBingoGamesList: RequestHandler = async (req, res) => {
  try {
    const result = await db.getBingoGames();
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching bingo games:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch games",
    });
  }
};

// Get sports events
export const getSportsEventsList: RequestHandler = async (req, res) => {
  try {
    const result = await db.getSportsEvents();
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching sports events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
    });
  }
};
