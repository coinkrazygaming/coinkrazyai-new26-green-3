import { query } from '../db/connection';

// Game types supported by the system
export type GameType = 'slots' | 'cards' | 'dice' | 'coin-up' | 'bingo' | 'poker' | 'sports' | 'roulette' | 'keno';
export type GameEngine = 'coin-up-engine' | 'card-engine' | 'dice-engine' | 'roulette-engine' | 'keno-engine' | 'bingo-engine' | 'poker-engine' | 'sportsbook-engine';

export interface GameMechanic {
  name: string;
  description: string;
  probability: number; // 0-100
  config: Record<string, any>;
  reward_config: Record<string, any>;
}

export interface GameAsset {
  type: 'reel' | 'symbol' | 'animation' | 'background' | 'audio' | 'thumbnail' | 'hero_image';
  name: string;
  url: string;
  width?: number;
  height?: number;
  fileType?: string;
}

export interface GameTemplateConfig {
  type: GameType;
  engine: GameEngine;
  minBet: number;
  maxBet: number;
  defaultRTP: number;
  features: string[];
  mechanics: GameMechanic[];
  assets: GameAsset[];
  customConfig: Record<string, any>;
}

export interface GameCreateOptions {
  name: string;
  slug: string;
  description: string;
  templateId?: number;
  templateName?: string;
  provider: string;
  rtp: number;
  volatility: string;
  config: Partial<GameTemplateConfig>;
  assets?: GameAsset[];
  mechanics?: GameMechanic[];
  createdBy?: string;
}

class GameFactory {
  /**
   * Create a new game based on a template
   */
  async createGameFromTemplate(options: GameCreateOptions): Promise<any> {
    try {
      // Get template if templateId is provided
      let templateConfig: any = {};
      if (options.templateId) {
        const templateResult = await query(
          'SELECT config FROM game_templates WHERE id = $1',
          [options.templateId]
        );
        if (templateResult.rows.length > 0) {
          templateConfig = templateResult.rows[0].config;
        }
      } else if (options.templateName) {
        const templateResult = await query(
          'SELECT config FROM game_templates WHERE slug = $1',
          [options.templateName.toLowerCase().replace(/\s+/g, '-')]
        );
        if (templateResult.rows.length > 0) {
          templateConfig = templateResult.rows[0].config;
        }
      }

      // Merge template config with provided config
      const finalConfig: GameTemplateConfig = {
        type: options.config.type || (templateConfig.type || 'slots'),
        engine: options.config.engine || (templateConfig.engine || 'coin-up-engine'),
        minBet: options.config.minBet || templateConfig.minBet || 0.01,
        maxBet: options.config.maxBet || templateConfig.maxBet || 5.00,
        defaultRTP: options.rtp || templateConfig.defaultRTP || 96.5,
        features: options.config.features || templateConfig.features || [],
        mechanics: options.mechanics || templateConfig.mechanics || [],
        assets: options.assets || templateConfig.assets || [],
        customConfig: options.config.customConfig || templateConfig.customConfig || {}
      };

      // Insert game
      const gameResult = await query(
        `INSERT INTO games (
          name, slug, category, type, provider, rtp, volatility, description,
          game_config, enabled, is_branded_popup, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          options.name,
          options.slug,
          finalConfig.type === 'slots' ? 'Slots' : finalConfig.type.charAt(0).toUpperCase() + finalConfig.type.slice(1),
          finalConfig.type,
          options.provider,
          options.rtp,
          options.volatility,
          options.description,
          JSON.stringify(finalConfig),
          true,
          finalConfig.type === 'coin-up' ? true : false
        ]
      );

      const gameId = gameResult.rows[0].id;

      // Add assets
      if (finalConfig.assets && finalConfig.assets.length > 0) {
        for (const asset of finalConfig.assets) {
          await query(
            `INSERT INTO game_assets (game_id, asset_type, asset_name, asset_url, file_type, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [gameId, asset.type, asset.name, asset.url, asset.fileType || 'image/png']
          );
        }
      }

      // Add mechanics
      if (finalConfig.mechanics && finalConfig.mechanics.length > 0) {
        for (const mechanic of finalConfig.mechanics) {
          await query(
            `INSERT INTO game_mechanics (game_id, mechanic_name, description, config, probability, reward_config, enabled, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
              gameId,
              mechanic.name,
              mechanic.description,
              JSON.stringify(mechanic.config),
              mechanic.probability,
              JSON.stringify(mechanic.reward_config),
              true
            ]
          );
        }
      }

      // Create initial version
      await query(
        `INSERT INTO game_versions (game_id, version_number, release_notes, config, rtp, enabled, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [gameId, '1.0.0', `Initial version created${options.createdBy ? ` by ${options.createdBy}` : ''}`, JSON.stringify(finalConfig), options.rtp, true]
      );

      console.log(`[GameFactory] Created game "${options.name}" with ID ${gameId}`);
      return { success: true, gameId, game: finalConfig };
    } catch (error) {
      console.error('[GameFactory] Error creating game:', error);
      throw error;
    }
  }

  /**
   * Get all available game templates
   */
  async getTemplates(): Promise<any[]> {
    try {
      const result = await query(
        'SELECT * FROM game_templates WHERE enabled = true ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('[GameFactory] Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Get a game template by ID or slug
   */
  async getTemplate(idOrSlug: number | string): Promise<any> {
    try {
      const query_str = typeof idOrSlug === 'number'
        ? 'SELECT * FROM game_templates WHERE id = $1'
        : 'SELECT * FROM game_templates WHERE slug = $1';
      
      const result = await query(query_str, [idOrSlug]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[GameFactory] Error fetching template:', error);
      return null;
    }
  }

  /**
   * Create a new game template
   */
  async createTemplate(templateData: {
    name: string;
    slug: string;
    description?: string;
    game_type: GameType;
    base_engine: GameEngine;
    category: string;
    min_bet: number;
    max_bet: number;
    default_rtp: number;
    config: Record<string, any>;
    created_by: string;
  }): Promise<any> {
    try {
      const result = await query(
        `INSERT INTO game_templates (
          name, slug, description, game_type, base_engine, category,
          min_bet, max_bet, default_rtp, config, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          templateData.name,
          templateData.slug,
          templateData.description,
          templateData.game_type,
          templateData.base_engine,
          templateData.category,
          templateData.min_bet,
          templateData.max_bet,
          templateData.default_rtp,
          JSON.stringify(templateData.config),
          templateData.created_by
        ]
      );

      console.log(`[GameFactory] Created template "${templateData.name}"`);
      return result.rows[0];
    } catch (error) {
      console.error('[GameFactory] Error creating template:', error);
      throw error;
    }
  }

  /**
   * Clone a game from an existing game
   */
  async cloneGame(sourceGameId: number, newGameData: {
    name: string;
    slug: string;
    description?: string;
    provider: string;
  }): Promise<any> {
    try {
      // Get source game
      const sourceResult = await query('SELECT * FROM games WHERE id = $1', [sourceGameId]);
      if (sourceResult.rows.length === 0) {
        throw new Error('Source game not found');
      }

      const sourceGame = sourceResult.rows[0];

      // Get source assets
      const assetsResult = await query('SELECT * FROM game_assets WHERE game_id = $1', [sourceGameId]);
      const assets = assetsResult.rows;

      // Get source mechanics
      const mechanicsResult = await query('SELECT * FROM game_mechanics WHERE game_id = $1', [sourceGameId]);
      const mechanics = mechanicsResult.rows;

      // Create new game with cloned data
      const newGameConfig = sourceGame.game_config;

      const gameResult = await query(
        `INSERT INTO games (
          name, slug, category, type, provider, rtp, volatility, description,
          game_config, enabled, is_branded_popup, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          newGameData.name,
          newGameData.slug,
          sourceGame.category,
          sourceGame.type,
          newGameData.provider,
          sourceGame.rtp,
          sourceGame.volatility,
          newGameData.description || sourceGame.description,
          JSON.stringify(newGameConfig),
          true,
          sourceGame.is_branded_popup
        ]
      );

      const clonedGameId = gameResult.rows[0].id;

      // Clone assets
      for (const asset of assets) {
        await query(
          `INSERT INTO game_assets (game_id, asset_type, asset_name, asset_url, file_type, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [clonedGameId, asset.asset_type, asset.asset_name, asset.asset_url, asset.file_type]
        );
      }

      // Clone mechanics
      for (const mechanic of mechanics) {
        await query(
          `INSERT INTO game_mechanics (game_id, mechanic_name, description, config, probability, reward_config, enabled, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [clonedGameId, mechanic.mechanic_name, mechanic.description, mechanic.config, mechanic.probability, mechanic.reward_config, mechanic.enabled]
        );
      }

      console.log(`[GameFactory] Cloned game from ${sourceGameId} to ${clonedGameId}`);
      return { success: true, gameId: clonedGameId };
    } catch (error) {
      console.error('[GameFactory] Error cloning game:', error);
      throw error;
    }
  }

  /**
   * Update game configuration
   */
  async updateGameConfig(gameId: number, configUpdates: Partial<GameTemplateConfig>): Promise<any> {
    try {
      const gameResult = await query('SELECT game_config FROM games WHERE id = $1', [gameId]);
      if (gameResult.rows.length === 0) {
        throw new Error('Game not found');
      }

      const currentConfig = gameResult.rows[0].game_config || {};
      const updatedConfig = { ...currentConfig, ...configUpdates };

      await query(
        'UPDATE games SET game_config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(updatedConfig), gameId]
      );

      console.log(`[GameFactory] Updated game config for game ${gameId}`);
      return { success: true, config: updatedConfig };
    } catch (error) {
      console.error('[GameFactory] Error updating game config:', error);
      throw error;
    }
  }
}

export const gameFactory = new GameFactory();
