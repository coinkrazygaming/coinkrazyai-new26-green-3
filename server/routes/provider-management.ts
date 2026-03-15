import { RequestHandler } from 'express';
import { query } from '../db/connection';
import * as providerIntegrations from '../services/provider-api-integrations';

// ===== GET REGISTERED PROVIDERS =====
export const getAvailableProviders: RequestHandler = async (req, res) => {
  try {
    const providers = providerIntegrations.getRegisteredProviders();
    res.json(providers);
  } catch (error) {
    console.error('Get available providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
};

// ===== CREATE PROVIDER CONFIGURATION =====
export const createProviderConfig: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      slug,
      api_endpoint,
      api_key,
      api_secret,
      description,
      is_enabled,
    } = req.body;

    if (!name || !slug || !api_endpoint) {
      return res.status(400).json({
        error: 'name, slug, and api_endpoint are required',
      });
    }

    // Check if provider config already exists
    const existing = await query(
      'SELECT id FROM game_providers WHERE slug = $1',
      [slug.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Provider configuration already exists' });
    }

    const result = await query(
      `INSERT INTO game_providers (name, slug, api_endpoint, api_key, api_secret, description, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, slug.toLowerCase(), api_endpoint, api_key || null, api_secret || null, description || null, is_enabled !== false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create provider config error:', error);
    res.status(500).json({ error: 'Failed to create provider configuration' });
  }
};

// ===== GET PROVIDER CONFIGURATION =====
export const getProviderConfig: RequestHandler = async (req, res) => {
  try {
    const { providerId } = req.params;

    const result = await query(
      'SELECT * FROM game_providers WHERE id = $1',
      [providerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get provider config error:', error);
    res.status(500).json({ error: 'Failed to fetch provider configuration' });
  }
};

// ===== LIST PROVIDER CONFIGURATIONS =====
export const listProviderConfigs: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM game_providers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('List provider configs error:', error);
    res.status(500).json({ error: 'Failed to fetch provider configurations' });
  }
};

// ===== UPDATE PROVIDER CONFIGURATION =====
export const updateProviderConfig: RequestHandler = async (req, res) => {
  try {
    const { providerId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const allowedFields = [
      'name',
      'description',
      'api_endpoint',
      'api_key',
      'api_secret',
      'is_enabled',
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(providerId);

    const sql = `UPDATE game_providers SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update provider config error:', error);
    res.status(500).json({ error: 'Failed to update provider configuration' });
  }
};

// ===== TEST PROVIDER CONNECTION =====
export const testProviderConnection: RequestHandler = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Get provider config
    const providerResult = await query(
      'SELECT * FROM game_providers WHERE id = $1',
      [providerId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = providerResult.rows[0];
    const config = {
      api_endpoint: provider.api_endpoint,
      api_key: provider.api_key,
      api_secret: provider.api_secret,
      timeout: 15000,
    };

    const testResult = await providerIntegrations.testProviderConfig(provider.slug, config);
    res.json(testResult);
  } catch (error) {
    console.error('Test provider connection error:', error);
    res.status(500).json({ error: 'Failed to test provider connection' });
  }
};

// ===== SYNC PROVIDER GAMES =====
export const syncProviderGames: RequestHandler = async (req, res) => {
  try {
    const { providerId } = req.params as { providerId: string };
    const providerIdNum = parseInt(providerId, 10);

    // Get provider config
    const providerResult = await query(
      'SELECT * FROM game_providers WHERE id = $1',
      [providerIdNum]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = providerResult.rows[0];

    if (!provider.is_enabled) {
      return res.status(400).json({ error: 'Provider is not enabled' });
    }

    // Prepare config
    const config = {
      api_endpoint: provider.api_endpoint,
      api_key: provider.api_key,
      api_secret: provider.api_secret,
      timeout: 15000,
    };

    // Run sync
    const syncResult = await providerIntegrations.syncProviderGamesToDb(
      providerIdNum,
      provider.slug,
      config,
      req.user?.id
    );

    // Update provider last sync time
    await query(
      'UPDATE game_providers SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
      [providerIdNum]
    );

    res.json({
      success: true,
      message: `Sync complete for ${provider.name}`,
      data: syncResult,
    });
  } catch (error: any) {
    console.error('Sync provider games error:', error);
    res.status(500).json({
      error: 'Failed to sync provider games',
      details: error.message,
    });
  }
};

// ===== GET PROVIDER GAMES =====
export const getProviderGames: RequestHandler = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT g.* FROM games g
       WHERE g.provider = (
         SELECT name FROM game_providers WHERE id = $1
       )
       ORDER BY g.name
       LIMIT $2 OFFSET $3`,
      [providerId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM games g
       WHERE g.provider = (
         SELECT name FROM game_providers WHERE id = $1
       )`,
      [providerId]
    );

    res.json({
      games: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      limit: parseInt(String(limit)),
      offset: parseInt(String(offset)),
    });
  } catch (error) {
    console.error('Get provider games error:', error);
    res.status(500).json({ error: 'Failed to fetch provider games' });
  }
};

// ===== GET IMPORT HISTORY =====
export const getImportHistory: RequestHandler = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT * FROM game_import_history
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM game_import_history');

    res.json({
      history: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      limit: parseInt(String(limit)),
      offset: parseInt(String(offset)),
    });
  } catch (error) {
    console.error('Get import history error:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
};

// ===== GET IMPORT HISTORY DETAILS =====
export const getImportHistoryDetails: RequestHandler = async (req, res) => {
  try {
    const { importId } = req.params;

    const result = await query(
      'SELECT * FROM game_import_history WHERE id = $1',
      [importId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Import history not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get import history details error:', error);
    res.status(500).json({ error: 'Failed to fetch import history details' });
  }
};

// ===== GET PROVIDER STATISTICS =====
export const getProviderStats: RequestHandler = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Get provider info
    const providerResult = await query(
      'SELECT * FROM game_providers WHERE id = $1',
      [providerId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = providerResult.rows[0];

    // Get game count
    const gameCountResult = await query(
      `SELECT COUNT(*) as total FROM games WHERE provider = $1`,
      [provider.name]
    );

    // Get recent import
    const recentImportResult = await query(
      `SELECT * FROM game_import_history 
       WHERE provider = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [provider.slug]
    );

    // Get stats
    const statsResult = await query(
      `SELECT 
         COUNT(DISTINCT g.id) as total_games,
         AVG(g.rtp) as avg_rtp,
         SUM(gs.total_plays) as total_plays,
         SUM(gs.total_wagered) as total_wagered
       FROM games g
       LEFT JOIN game_statistics gs ON g.id = gs.game_id
       WHERE g.provider = $1`,
      [provider.name]
    );

    res.json({
      provider,
      stats: {
        total_games: parseInt(gameCountResult.rows[0]?.total || '0'),
        avg_rtp: parseFloat(statsResult.rows[0]?.avg_rtp || '0'),
        total_plays: parseInt(statsResult.rows[0]?.total_plays || '0'),
        total_wagered: parseFloat(statsResult.rows[0]?.total_wagered || '0'),
      },
      last_sync: recentImportResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get provider stats error:', error);
    res.status(500).json({ error: 'Failed to fetch provider statistics' });
  }
};
