import { RequestHandler } from 'express';
import { query } from '../db/connection';
import { AuthService } from '../services/auth-service';
import { SlackService } from '../services/slack-service';
import { WalletService } from '../services/wallet-service';

// Helper function to ensure param is a string
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

// Helper function to resolve username to playerId
export const resolvePlayerIdentifier = async (identifier: string): Promise<number | null> => {
  const isNumeric = /^\d+$/.test(identifier);

  if (isNumeric) {
    // Direct ID lookup
    const result = await query('SELECT id FROM players WHERE id = $1', [parseInt(identifier)]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } else {
    // Username lookup
    const result = await query('SELECT id FROM players WHERE username = $1', [identifier]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  }
};

export const searchPlayersPublic: RequestHandler = async (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    if (!search || search.length < 2) {
      return res.json({ players: [] });
    }

    const result = await query(
      `SELECT
        id, username, name, kyc_level, created_at
      FROM players
      WHERE (username ILIKE $1 OR name ILIKE $1) AND status = 'Active'
      ORDER BY created_at DESC
      LIMIT 10`,
      [`%${search}%`]
    );

    res.json({
      players: result.rows
    });
  } catch (error) {
    console.error('Public search players error:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
};

export const listPlayers: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const kycLevel = (req.query.kycLevel as string) || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length} OR name ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (kycLevel) {
      params.push(kycLevel);
      whereClause += ` AND kyc_level = $${params.length}`;
    }

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT
        p.id, p.username, p.email, p.name, p.gc_balance, p.sc_balance,
        p.status, p.kyc_level, p.created_at, p.last_login,
        COALESCE(ps.total_wagered, 0) as total_wagered,
        COALESCE(ps.total_won, 0) as total_won,
        COALESCE(ps.games_played, 0) as games_played
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM players p ${whereClause.replace('LIMIT $' + (params.length - 1) + ' OFFSET $' + params.length, '')}`,
      params.slice(0, -2)
    );

    res.json({
      players: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      page,
      limit,
    });
  } catch (error) {
    console.error('List players error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
};

export const getPlayerDetails: RequestHandler = async (req, res) => {
  try {
    const { playerId } = req.params;

    const playerResult = await query('SELECT * FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const statsResult = await query('SELECT * FROM player_stats WHERE player_id = $1', [playerId]);
    const transactionsResult = await query(
      'SELECT * FROM wallet_ledger WHERE player_id = $1 ORDER BY created_at DESC LIMIT 50',
      [playerId]
    );
    const achievementsResult = await query(
      `SELECT a.* FROM achievements a
      JOIN player_achievements pa ON a.id = pa.achievement_id
      WHERE pa.player_id = $1`,
      [playerId]
    );
    const kycDocsResult = await query('SELECT * FROM kyc_documents WHERE player_id = $1', [playerId]);

    res.json({
      player: playerResult.rows[0],
      stats: statsResult.rows[0],
      transactions: transactionsResult.rows,
      achievements: achievementsResult.rows,
      kycDocuments: kycDocsResult.rows,
    });
  } catch (error) {
    console.error('Get player details error:', error);
    res.status(500).json({ error: 'Failed to fetch player details' });
  }
};

export const updatePlayerStatus: RequestHandler = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { status, reason } = req.body;

    const allowedStatuses = ['Active', 'Suspended', 'Banned', 'Inactive'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query('UPDATE players SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [
      status,
      playerId,
    ]);

    // Log to system logs
    await query(
      'INSERT INTO system_logs (admin_id, player_id, action, resource_type, new_values) VALUES ($1, $2, $3, $4, $5)',
      [req.user?.playerId, playerId, `Status changed to ${status}`, 'player', JSON.stringify({ status, reason })]
    );

    // Notify via Slack
    const player = result.rows[0];
    if (status === 'Banned' || status === 'Suspended') {
      await SlackService.notifySecurityAlert(
        player.email,
        `Player ${status.toLowerCase()}`,
        reason || 'No reason provided'
      );
    }

    res.json({ success: true, player: result.rows[0] });
  } catch (error) {
    console.error('Update player status error:', error);
    res.status(500).json({ error: 'Failed to update player status' });
  }
};

export const updatePlayerBalance: RequestHandler = async (req, res) => {
  try {
    const playerId = getStringParam(req.params.playerId);
    const { gcAmount, scAmount, gcDelta, scDelta, reason } = req.body;

    const playerResult = await query('SELECT gc_balance, sc_balance FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const currentGc = Number(playerResult.rows[0].gc_balance || 0);
    const currentSc = Number(playerResult.rows[0].sc_balance || 0);

    // Support both absolute amounts and deltas
    let newGcBalance = currentGc;
    if (gcAmount !== undefined) {
      newGcBalance = Number(gcAmount);
    } else if (gcDelta !== undefined) {
      newGcBalance = currentGc + Number(gcDelta);
    }

    let newScBalance = currentSc;
    if (scAmount !== undefined) {
      newScBalance = Number(scAmount);
    } else if (scDelta !== undefined) {
      newScBalance = currentSc + Number(scDelta);
    }

    // Calculate the actual change amounts for the ledger
    const actualGcDelta = newGcBalance - currentGc;
    const actualScDelta = newScBalance - currentSc;

    await query('UPDATE players SET gc_balance = $1, sc_balance = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [
      newGcBalance,
      newScBalance,
      playerId,
    ]);

    // Log wallet ledger
    await query(
      'INSERT INTO wallet_ledger (player_id, transaction_type, gc_amount, sc_amount, gc_balance_after, sc_balance_after, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [playerId, 'admin_adjustment', actualGcDelta, actualScDelta, newGcBalance, newScBalance, reason || 'Manual adjustment']
    );

    // Notify wallet update via socket
    WalletService.notifyWalletUpdate(playerId, {
      goldCoins: newGcBalance,
      sweepsCoins: newScBalance
    } as any);

    res.json({ success: true, newGcBalance, newScBalance });
  } catch (error) {
    console.error('Update player balance error:', error);
    res.status(500).json({ error: 'Failed to update player balance' });
  }
};

export const getPlayerTransactions: RequestHandler = async (req, res) => {
  try {
    const playerId = getStringParam(req.params.playerId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
        id,
        transaction_type as type,
        gc_amount,
        sc_amount,
        gc_balance_after,
        sc_balance_after,
        description,
        created_at
      FROM wallet_ledger
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [playerId, limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM wallet_ledger WHERE player_id = $1', [
      playerId,
    ]);

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get player transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const submitKYC: RequestHandler = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { documentType, documentUrl, verificationDetails } = req.body;

    const result = await query(
      'INSERT INTO kyc_documents (player_id, document_type, document_url, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [playerId, documentType, documentUrl, 'pending', verificationDetails || null]
    );

    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({ error: 'Failed to submit KYC document' });
  }
};

export const approveKYC: RequestHandler = async (req, res) => {
  try {
    const documentId = getStringParam(req.params.documentId);
    const { notes } = req.body;

    const docResult = await query('SELECT player_id FROM kyc_documents WHERE id = $1', [documentId]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const playerId = docResult.rows[0].player_id;

    await query(
      'UPDATE kyc_documents SET status = $1, verified_at = CURRENT_TIMESTAMP, notes = $2 WHERE id = $3',
      ['verified', notes, documentId]
    );

    // Check if all documents are verified, then update player KYC level
    const unverifiedDocs = await query(
      'SELECT COUNT(*) as count FROM kyc_documents WHERE player_id = $1 AND status != $2',
      [playerId, 'verified']
    );

    if (parseInt(unverifiedDocs.rows[0]?.count || '0') === 0) {
      await query('UPDATE players SET kyc_level = $1, kyc_verified = $2 WHERE id = $3', ['Full', true, playerId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
};

export const rejectKYC: RequestHandler = async (req, res) => {
  try {
    const documentId = getStringParam(req.params.documentId);
    const { reason } = req.body;

    await query('UPDATE kyc_documents SET status = $1, notes = $2 WHERE id = $3', ['rejected', reason, documentId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
};

// ===== Username-based handlers =====

export const getPlayerTransactionsByUsername: RequestHandler = async (req, res) => {
  try {
    const username = getStringParam(req.params.username);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Resolve username to playerId
    const playerId = await resolvePlayerIdentifier(username);
    if (!playerId) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const result = await query(
      `SELECT
        id,
        transaction_type as type,
        gc_amount,
        sc_amount,
        gc_balance_after,
        sc_balance_after,
        description,
        created_at
      FROM wallet_ledger
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [playerId, limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM wallet_ledger WHERE player_id = $1', [
      playerId,
    ]);

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get player transactions by username error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const updatePlayerBalanceByUsername: RequestHandler = async (req, res) => {
  try {
    const username = getStringParam(req.params.username);
    const { gcAmount, scAmount, gcDelta, scDelta, reason } = req.body;

    // Resolve username to playerId
    const playerId = await resolvePlayerIdentifier(username);
    if (!playerId) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const playerResult = await query('SELECT gc_balance, sc_balance FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const currentGc = Number(playerResult.rows[0].gc_balance || 0);
    const currentSc = Number(playerResult.rows[0].sc_balance || 0);

    // Support both absolute amounts and deltas
    let newGcBalance = currentGc;
    if (gcAmount !== undefined) {
      newGcBalance = Number(gcAmount);
    } else if (gcDelta !== undefined) {
      newGcBalance = currentGc + Number(gcDelta);
    }

    let newScBalance = currentSc;
    if (scAmount !== undefined) {
      newScBalance = Number(scAmount);
    } else if (scDelta !== undefined) {
      newScBalance = currentSc + Number(scDelta);
    }

    // Calculate the actual change amounts for the ledger
    const actualGcDelta = newGcBalance - currentGc;
    const actualScDelta = newScBalance - currentSc;

    await query('UPDATE players SET gc_balance = $1, sc_balance = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [
      newGcBalance,
      newScBalance,
      playerId,
    ]);

    // Log wallet ledger
    await query(
      'INSERT INTO wallet_ledger (player_id, transaction_type, gc_amount, sc_amount, gc_balance_after, sc_balance_after, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [playerId, 'admin_adjustment', actualGcDelta, actualScDelta, newGcBalance, newScBalance, reason || 'Manual adjustment']
    );

    // Notify wallet update via socket
    WalletService.notifyWalletUpdate(playerId, {
      goldCoins: newGcBalance,
      sweepsCoins: newScBalance
    } as any);

    res.json({ success: true, newGcBalance, newScBalance });
  } catch (error) {
    console.error('Update player balance by username error:', error);
    res.status(500).json({ error: 'Failed to update player balance' });
  }
};

export const updatePlayerStatusByUsername: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params as { username: string };
    const { status, reason } = req.body;

    // Resolve username to playerId
    const playerId = await resolvePlayerIdentifier(username);
    if (!playerId) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const allowedStatuses = ['Active', 'Suspended', 'Banned', 'Inactive'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query('UPDATE players SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [
      status,
      playerId,
    ]);

    // Log to system logs
    await query(
      'INSERT INTO system_logs (admin_id, player_id, action, resource_type, new_values) VALUES ($1, $2, $3, $4, $5)',
      [req.user?.playerId, playerId, `Status changed to ${status}`, 'player', JSON.stringify({ status, reason })]
    );

    // Notify via Slack
    const player = result.rows[0];
    if (status === 'Banned' || status === 'Suspended') {
      await SlackService.notifySecurityAlert(
        player.email,
        `Player ${status.toLowerCase()}`,
        reason || 'No reason provided'
      );
    }

    res.json({ success: true, player: result.rows[0] });
  } catch (error) {
    console.error('Update player status by username error:', error);
    res.status(500).json({ error: 'Failed to update player status' });
  }
};
