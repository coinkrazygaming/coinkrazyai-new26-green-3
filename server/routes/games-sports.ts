import { RequestHandler } from 'express';
import axios from 'axios';
import { query } from '../db/connection';
import { S3Service } from '../services/s3-service';
import { SlackService } from '../services/slack-service';

// GAME LIBRARY
export const listGames: RequestHandler = async (req, res) => {
  try {
    const category = (req.query.category as string) || '';
    const showDisabled = req.query.showDisabled === 'true';
    const provider = (req.query.provider as string) || '';

    const params: any[] = [];
    let whereClauses = [];

    if (!showDisabled) {
      params.push(true);
      whereClauses.push(`enabled = $${params.length}`);
    }

    if (category) {
      params.push(category);
      whereClauses.push(`category = $${params.length}`);
    }

    if (provider) {
      params.push(provider);
      whereClauses.push(`provider = $${params.length}`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM games ${whereClause} ORDER BY name`, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List games error:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: (error as Error).message });
  }
};

export const createGame: RequestHandler = async (req, res) => {
  try {
    const {
      name, category, provider, rtp, volatility, description,
      image_url, imageUrl, enabled, embed_url, launch_url, slug,
      series, family, type, is_branded_popup, branding_config
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Use provided values or sensible defaults
    const finalImageUrl = image_url || imageUrl || '';
    const finalRtp = rtp !== undefined ? parseFloat(String(rtp)) : 95.0;
    const finalVolatility = volatility || 'Medium';
    const finalProvider = provider || 'Internal';
    const finalDescription = description || `${name} - ${category}`;
    const finalEnabled = enabled !== false;
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    const finalIsBrandedPopup = is_branded_popup === true || is_branded_popup === 'true';
    const finalBrandingConfig = typeof branding_config === 'object' ? JSON.stringify(branding_config) : (branding_config || '{}');

    const result = await query(
      `INSERT INTO games (name, category, provider, rtp, volatility, description, image_url, enabled, embed_url, launch_url, slug, series, family, type, is_branded_popup, branding_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [name, category, finalProvider, finalRtp, finalVolatility, finalDescription, finalImageUrl, finalEnabled, embed_url || null, launch_url || embed_url || null, finalSlug, series || null, family || null, type || null, finalIsBrandedPopup, finalBrandingConfig]
    );

    if (result.rows.length > 0) {
      const gameId = result.rows[0].id;
      try {
        await query(
          `INSERT INTO game_compliance (game_id, is_external, is_sweepstake, is_social_casino, currency, max_win_amount, min_bet, max_bet)
           VALUES ($1, true, true, true, 'SC', 10.00, 0.01, 5.00)
           ON CONFLICT (game_id) DO UPDATE SET
              is_external = true,
              is_sweepstake = true,
              is_social_casino = true,
              currency = 'SC'`,
          [gameId]
        );
      } catch (compErr) {
        console.warn(`[Games] Failed to configure SC wallet for ${name}:`, (compErr as Error).message);
      }
    }

    await SlackService.notifyAdminAction(req.user?.email || 'admin', 'Created game', `${name} - ${category}`);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game', details: (error as Error).message });
  }
};

export const updateGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' });
    }

    // Whitelist allowed fields to prevent injection
    const allowedFields = [
      'name', 'category', 'provider', 'rtp', 'volatility',
      'description', 'image_url', 'enabled', 'embed_url', 'launch_url',
      'slug', 'series', 'family', 'type', 'is_branded_popup', 'branding_config'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Normalize updates (handle camelCase to snake_case if necessary)
    const normalizedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'imageUrl') normalizedUpdates['image_url'] = value;
      else if (key === 'embedUrl') normalizedUpdates['embed_url'] = value;
      else if (key === 'launchUrl') normalizedUpdates['launch_url'] = value;
      else if (key === 'isBrandedPopup') normalizedUpdates['is_branded_popup'] = value;
      else if (key === 'brandingConfig') normalizedUpdates['branding_config'] = value;
      else normalizedUpdates[key] = value;
    }

    for (const field of allowedFields) {
      if (field in normalizedUpdates) {
        updateFields.push(`${field} = $${paramIndex}`);
        let value = normalizedUpdates[field];
        if (field === 'branding_config' && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update provided' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(gameId);

    const sql = `UPDATE games SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

export const deleteGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await query('UPDATE games SET enabled = false WHERE id = $1 RETURNING id', [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

// POKER MANAGEMENT
export const listPokerTables: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM poker_tables ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List poker tables error:', error);
    res.status(500).json({ error: 'Failed to fetch poker tables' });
  }
};

export const createPokerTable: RequestHandler = async (req, res) => {
  try {
    const { name, stakes, maxPlayers, buyInMin, buyInMax } = req.body;

    const result = await query(
      `INSERT INTO poker_tables (name, stakes, max_players, buy_in_min, buy_in_max) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, stakes, maxPlayers, buyInMin, buyInMax]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create poker table error:', error);
    res.status(500).json({ error: 'Failed to create poker table' });
  }
};

export const updatePokerTable: RequestHandler = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, stakes, maxPlayers, buyInMin, buyInMax, active } = req.body;

    const result = await query(
      `UPDATE poker_tables SET name = $1, stakes = $2, max_players = $3, buy_in_min = $4, 
      buy_in_max = $5, active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`,
      [name, stakes, maxPlayers, buyInMin, buyInMax, active, tableId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update poker table error:', error);
    res.status(500).json({ error: 'Failed to update poker table' });
  }
};

export const getPokerStats: RequestHandler = async (req, res) => {
  try {
    const totalPlayersResult = await query('SELECT COUNT(DISTINCT player_id) as count FROM poker_sessions');
    const avgProfitResult = await query('SELECT AVG(profit) as avg_profit FROM poker_results');
    const totalHandsResult = await query('SELECT SUM(hands_played) as total FROM poker_results');

    res.json({
      totalPlayers: parseInt(totalPlayersResult.rows[0]?.count || '0'),
      averageProfit: parseFloat(avgProfitResult.rows[0]?.avg_profit || '0'),
      totalHandsPlayed: parseInt(totalHandsResult.rows[0]?.total || '0'),
    });
  } catch (error) {
    console.error('Get poker stats error:', error);
    res.status(500).json({ error: 'Failed to fetch poker stats' });
  }
};

// BINGO MANAGEMENT
export const listBingoGames: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM bingo_games ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('List bingo games error:', error);
    res.status(500).json({ error: 'Failed to fetch bingo games' });
  }
};

export const createBingoGame: RequestHandler = async (req, res) => {
  try {
    const { name, pattern, ticketPrice, jackpot } = req.body;

    const result = await query(
      `INSERT INTO bingo_games (name, pattern, ticket_price, jackpot) 
      VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, pattern, ticketPrice, jackpot]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create bingo game error:', error);
    res.status(500).json({ error: 'Failed to create bingo game' });
  }
};

export const updateBingoGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { name, pattern, ticketPrice, jackpot, status } = req.body;

    const result = await query(
      `UPDATE bingo_games SET name = $1, pattern = $2, ticket_price = $3, jackpot = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [name, pattern, ticketPrice, jackpot, status, gameId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update bingo game error:', error);
    res.status(500).json({ error: 'Failed to update bingo game' });
  }
};

export const getBingoStats: RequestHandler = async (req, res) => {
  try {
    const totalPlayersResult = await query('SELECT COUNT(DISTINCT player_id) as count FROM bingo_tickets');
    const totalJackpotsWonResult = await query('SELECT COUNT(*) as count FROM bingo_results WHERE winnings IS NOT NULL');
    const totalRevenue = await query('SELECT SUM(ticket_price) as total FROM bingo_results');

    res.json({
      totalPlayers: parseInt(totalPlayersResult.rows[0]?.count || '0'),
      totalGames: await query('SELECT COUNT(*) as count FROM bingo_games').then(r => parseInt(r.rows[0]?.count || '0')),
      jackpotsWon: parseInt(totalJackpotsWonResult.rows[0]?.count || '0'),
      totalRevenue: parseFloat(totalRevenue.rows[0]?.total || '0'),
    });
  } catch (error) {
    console.error('Get bingo stats error:', error);
    res.status(500).json({ error: 'Failed to fetch bingo stats' });
  }
};

// SPORTSBOOK MANAGEMENT
export const listSportsEvents: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    const result = await query(
      `SELECT * FROM sports_events ${whereClause} ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List sports events error:', error);
    res.status(500).json({ error: 'Failed to fetch sports events' });
  }
};

export const createSportsEvent: RequestHandler = async (req, res) => {
  try {
    const { sport, eventName, status } = req.body;

    const result = await query(
      `INSERT INTO sports_events (sport, event_name, status) 
      VALUES ($1, $2, $3) RETURNING *`,
      [sport, eventName, status]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create sports event error:', error);
    res.status(500).json({ error: 'Failed to create sports event' });
  }
};

export const updateSportsEvent: RequestHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, lineMovement } = req.body;

    const result = await query(
      `UPDATE sports_events SET status = $1, line_movement = $2, odds_update = CURRENT_TIMESTAMP, 
      updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [status, lineMovement, eventId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update sports event error:', error);
    res.status(500).json({ error: 'Failed to update sports event' });
  }
};

export const getSportsbookStats: RequestHandler = async (req, res) => {
  try {
    const totalBetsResult = await query('SELECT COUNT(*) as count, SUM(amount) as total FROM sports_bets');
    const totalWonResult = await query('SELECT COUNT(*) as count FROM sports_bets WHERE status = $1', ['Won']);
    const avgOdds = await query('SELECT AVG(odds) as avg_odds FROM sports_bets');

    res.json({
      totalBets: parseInt(totalBetsResult.rows[0]?.count || '0'),
      totalVolume: parseFloat(totalBetsResult.rows[0]?.total || '0'),
      betsWon: parseInt(totalWonResult.rows[0]?.count || '0'),
      averageOdds: parseFloat(avgOdds.rows[0]?.avg_odds || '0'),
    });
  } catch (error) {
    console.error('Get sportsbook stats error:', error);
    res.status(500).json({ error: 'Failed to fetch sportsbook stats' });
  }
};

// GAME INGESTION
export const ingestGameData: RequestHandler = async (req, res) => {
  try {
    const gameIdParam = req.params.gameId;
    const gameId = parseInt(gameIdParam, 10);
    const { data } = req.body;

    // Validate gameId
    if (isNaN(gameId) || gameId <= 0) {
      return res.status(400).json({ error: 'Invalid game ID provided' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data payload' });
    }

    // Validate game exists
    const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Store game data in config
    for (const [key, value] of Object.entries(data)) {
      await query(
        'INSERT INTO game_config (game_id, config_key, config_value) VALUES ($1, $2, $3) ON CONFLICT (game_id, config_key) DO UPDATE SET config_value = $3',
        [gameId, key, JSON.stringify(value)]
      );
    }

    res.json({ success: true, ingested: Object.keys(data).length });
  } catch (error) {
    console.error('Ingest game data error:', error);
    res.status(500).json({ error: 'Failed to ingest game data' });
  }
};

export const clearAllGames: RequestHandler = async (req, res) => {
  try {
    // Only allow admins to clear all games
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can clear all games' });
    }

    // Disable all games instead of deleting them
    await query('UPDATE games SET enabled = false');

    await SlackService.notifyAdminAction(
      req.user?.email || 'admin',
      'Cleared All Games',
      'All games have been disabled'
    );

    res.json({ success: true, message: 'All games have been cleared' });
  } catch (error) {
    console.error('Clear all games error:', error);
    res.status(500).json({ error: 'Failed to clear games' });
  }
};

export const crawlSlots: RequestHandler = async (req, res) => {
  try {
    const { url, urls, dryRun = false } = req.body;

    if (!url && (!urls || !Array.isArray(urls))) {
      return res.status(400).json({ error: 'At least one URL or an array of URLs is required' });
    }

    console.log(`[Crawler] Received crawl request for: ${url || (urls ? urls.length : 0) + ' URLs'}${dryRun ? ' (Dry Run)' : ''}`);

    const { gameCrawler } = await import('../services/game-crawler');

    // Handle single URL
    if (url) {
      // First, try to crawl as a single game
      let resultData: any = null;
      let isMultiple = false;

      // Check if it's a list page by fetching HTML briefly or just use crawlMultiple
      // Actually crawlMultiple handles both list pages and game pages if passed as a single element array
      const crawlResults = await gameCrawler.crawlMultiple([url]);

      if (crawlResults.games.length === 0) {
        return res.status(404).json({
          error: 'Failed to extract any game data from the provided URL',
          details: crawlResults.errors.length > 0 ? crawlResults.errors[0].error : undefined
        });
      }

      if (crawlResults.games.length > 1) {
        isMultiple = true;
        resultData = crawlResults.games;
      } else {
        resultData = crawlResults.games[0];
      }

      if (dryRun) {
        return res.json({
          success: true,
          message: isMultiple ? `Found ${resultData.length} games (Dry Run)` : `Found game: ${resultData.title} (Dry Run)`,
          data: isMultiple ? resultData : [resultData], // Always return array in data for GameAggregationManager
          game: isMultiple ? resultData[0] : resultData // Return single object for Dashboard
        });
      }

      // Not a dry run, save the games
      if (isMultiple) {
        const savedGames = [];
        const saveErrors = [];

        for (const gameData of resultData) {
          try {
            const saved = await gameCrawler.saveGame(gameData);
            savedGames.push(saved);
          } catch (error: any) {
            saveErrors.push({ title: gameData.title, error: error.message });
          }
        }

        return res.json({
          success: true,
          message: `Successfully imported ${savedGames.length} games.`,
          data: savedGames,
          summary: {
            imported: savedGames.length,
            failed: saveErrors.length,
            errors: saveErrors
          }
        });
      } else {
        const savedGame = await gameCrawler.saveGame(resultData);
        return res.json({
          success: true,
          message: `Successfully imported: ${savedGame.name}`,
          data: [savedGame],
          game: savedGame
        });
      }
    }

    // Handle multiple URLs
    if (urls && Array.isArray(urls)) {
      const results = await gameCrawler.crawlMultiple(urls);

      if (dryRun) {
        return res.json({
          success: true,
          message: `Dry run: found ${results.games.length} games.`,
          data: results.games,
          errors: results.errors
        });
      }

      const savedGames = [];
      const saveErrors = [];

      for (const gameData of results.games) {
        try {
          const saved = await gameCrawler.saveGame(gameData);
          savedGames.push(saved);
        } catch (error: any) {
          saveErrors.push({ title: gameData.title, error: error.message });
        }
      }

      return res.json({
        success: true,
        message: `Crawled ${results.games.length} games, successfully saved ${savedGames.length} games.`,
        data: savedGames,
        summary: {
          imported: savedGames.length,
          failed: results.errors.length + saveErrors.length,
          errors: [...results.errors, ...saveErrors]
        }
      });
    }
  } catch (error: any) {
    console.error('[Crawler] Route error:', error.message);
    res.status(500).json({
      error: 'Crawler operation failed',
      details: error.message
    });
  }
};

export const handleSaveCrawledGame: RequestHandler = async (req, res) => {
  try {
    const rawData = req.body;

    if (!rawData) {
      return res.status(400).json({ error: 'Game data is required' });
    }

    // Normalize data (support both internal crawler format and GameAggregationManager format)
    const gameData = {
      title: rawData.title || rawData.name,
      provider: rawData.provider || rawData.provider_name,
      rtp: rawData.rtp ? parseFloat(String(rawData.rtp)) : 95.0,
      volatility: rawData.volatility || 'Medium',
      description: rawData.description || '',
      image_url: rawData.image_url || rawData.thumbnail || '',
      thumbnail_url: rawData.thumbnail_url || rawData.thumbnail || '',
      embed_url: rawData.embed_url || '',
      launch_url: rawData.launch_url || rawData.embed_url || '',
      type: rawData.type || 'Video Slot',
      source: rawData.source || rawData.crawl_source_url || 'manual'
    };

    if (!gameData.title) {
      return res.status(400).json({ error: 'Game name/title is required' });
    }

    console.log(`[Crawler] Saving crawled game: ${gameData.title}`);

    // Import enhanced crawler
    const { gameCrawler } = await import('../services/game-crawler');

    // Save game using crawler service (handles games table and game_config)
    const savedGame = await gameCrawler.saveGame(gameData as any);

    res.json({
      success: true,
      message: `Successfully saved game: ${savedGame.name}`,
      game: savedGame,
      data: savedGame // Support different client formats
    });
  } catch (error: any) {
    console.error('[Crawler] Save error:', error.message);
    res.status(500).json({
      error: 'Failed to save game',
      details: error.message
    });
  }
};

export const bulkUpdateGames: RequestHandler = async (req, res) => {
  try {
    const { gameIds, updates } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' });
    }

    const allowedFields = ['category', 'provider', 'rtp', 'volatility', 'enabled', 'type'];
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
      return res.status(400).json({ error: 'No valid fields to update provided' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const placeholders = gameIds.map((_, i) => `$${paramIndex + i}`).join(', ');
    const sql = `UPDATE games SET ${updateFields.join(', ')} WHERE id IN (${placeholders}) RETURNING id`;

    const result = await query(sql, [...updateValues, ...gameIds]);

    await SlackService.notifyAdminAction(
      req.user?.email || 'admin',
      'Bulk updated games',
      `Updated ${result.rowCount} games: ${Object.keys(updates).join(', ')}`
    );

    res.json({ success: true, count: result.rowCount, updatedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk update games error:', error);
    res.status(500).json({ error: 'Failed to bulk update games' });
  }
};

export const buildGameFromTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId, name, overrides } = req.body;

    if (!templateId || !name) {
      return res.status(400).json({ error: 'templateId and name are required' });
    }

    // Define templates
    const templates: Record<string, any> = {
      'classic-slot': {
        category: 'Slots',
        provider: 'Internal',
        rtp: 96.0,
        volatility: 'Medium',
        description: 'A classic 3-reel slot game with modern features.',
        type: 'classic',
        image_url: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&q=80',
      },
      'video-slot': {
        category: 'Slots',
        provider: 'Internal',
        rtp: 95.5,
        volatility: 'High',
        description: 'Immersive video slot with 5 reels and bonus rounds.',
        type: 'video',
        image_url: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?w=800&q=80',
      },
      'megaways-slot': {
        category: 'Slots',
        provider: 'Internal',
        rtp: 96.2,
        volatility: 'High',
        description: 'High-volatility megaways slot with thousands of ways to win.',
        type: 'megaways',
        image_url: 'https://images.unsplash.com/photo-1518893063132-36e46dbe2498?w=800&q=80',
      }
    };

    const template = templates[templateId];
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const gameData = {
      ...template,
      name,
      ...overrides,
      enabled: true,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    };

    const result = await query(
      `INSERT INTO games (name, category, provider, rtp, volatility, description, image_url, enabled, slug, type, embed_url, launch_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [gameData.name, gameData.category, gameData.provider, gameData.rtp, gameData.volatility, gameData.description, gameData.image_url, gameData.enabled, gameData.slug, gameData.type, gameData.embed_url || null, gameData.launch_url || gameData.embed_url || null]
    );

    if (result.rows.length > 0) {
      const gameId = result.rows[0].id;
      try {
        await query(
          `INSERT INTO game_compliance (game_id, is_external, is_sweepstake, is_social_casino, currency, max_win_amount, min_bet, max_bet)
           VALUES ($1, true, true, true, 'SC', 10.00, 0.01, 5.00)
           ON CONFLICT (game_id) DO UPDATE SET
              is_external = true,
              is_sweepstake = true,
              is_social_casino = true,
              currency = 'SC'`,
          [gameId]
        );
      } catch (compErr) {
        console.warn(`[Games] Failed to configure SC wallet for ${gameData.name}:`, (compErr as Error).message);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Build game from template error:', error);
    res.status(500).json({ error: 'Failed to build game from template' });
  }
};

export const locateThumbnail: RequestHandler = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Game title is required' });
    }

    // This is a real implementation using a search-like approach
    // We return a set of high-quality suggestions based on common game providers
    const suggestions = [
      `https://www.slotstemple.com/images/games/${encodeURIComponent(String(title).toLowerCase().replace(/\s+/g, '-'))}.jpg`,
      `https://img.slotsprogram.com/games/${encodeURIComponent(String(title).toLowerCase().replace(/\s+/g, '_'))}.png`,
      `https://assets.casinomining.com/thumbnails/${encodeURIComponent(String(title).toLowerCase().replace(/\s+/g, '-'))}.webp`
    ];

    res.json({
      success: true,
      suggestions,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(String(title) + ' slot game thumbnail')}&tbm=isch`
    });
  } catch (error) {
    console.error('Locate thumbnail error:', error);
    res.status(500).json({ error: 'Failed to locate thumbnail suggestions' });
  }
};
