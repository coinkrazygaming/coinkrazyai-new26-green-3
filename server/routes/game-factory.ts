import { RequestHandler } from 'express';
import { gameFactory, GameCreateOptions } from '../services/game-factory';
import { asyncHandler } from '../middleware/error-handler';
import { query } from '../db/connection';

// Get all game templates
export const handleGetGameTemplates: RequestHandler = asyncHandler(async (req, res) => {
  const templates = await gameFactory.getTemplates();
  res.json({
    success: true,
    data: templates,
    count: templates.length
  });
});

// Get a specific game template
export const handleGetGameTemplate: RequestHandler = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isNumber = !isNaN(Number(idOrSlug));
  const template = await gameFactory.getTemplate(isNumber ? Number(idOrSlug) : idOrSlug);

  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found'
    });
  }

  res.json({
    success: true,
    data: template
  });
});

// Create a new game template (Admin only)
export const handleCreateGameTemplate: RequestHandler = asyncHandler(async (req, res) => {
  const { name, slug, description, game_type, base_engine, category, min_bet, max_bet, default_rtp, config } = req.body;

  const template = await gameFactory.createTemplate({
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    description,
    game_type,
    base_engine,
    category,
    min_bet,
    max_bet,
    default_rtp,
    config: config || {},
    created_by: req.user?.email || 'system'
  });

  res.json({
    success: true,
    data: template,
    message: `Template "${name}" created successfully`
  });
});

// Create a new game from template
export const handleCreateGameFromTemplate: RequestHandler = asyncHandler(async (req, res) => {
  const { name, slug, description, templateId, templateName, provider, rtp, volatility, config, assets, mechanics } = req.body;

  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      error: 'Name and slug are required'
    });
  }

  const createOptions: GameCreateOptions = {
    name,
    slug,
    description,
    templateId,
    templateName,
    provider: provider || 'CoinKrazy Studios',
    rtp: rtp || 96.5,
    volatility: volatility || 'High',
    config: config || {},
    assets,
    mechanics,
    createdBy: req.user?.email || 'system'
  };

  const result = await gameFactory.createGameFromTemplate(createOptions);

  res.json({
    success: true,
    data: result,
    message: `Game "${name}" created successfully`
  });
});

// Clone a game
export const handleCloneGame: RequestHandler = asyncHandler(async (req, res) => {
  const { sourceGameId, name, slug, description, provider } = req.body;

  if (!sourceGameId || !name || !slug) {
    return res.status(400).json({
      success: false,
      error: 'sourceGameId, name, and slug are required'
    });
  }

  const result = await gameFactory.cloneGame(sourceGameId, {
    name,
    slug,
    description,
    provider: provider || 'CoinKrazy Studios'
  });

  res.json({
    success: true,
    data: result,
    message: `Game cloned to "${name}" successfully`
  });
});

// Update game configuration
export const handleUpdateGameConfig: RequestHandler = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { config } = req.body;

  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'Config is required'
    });
  }

  const result = await gameFactory.updateGameConfig(Number(gameId), config);

  res.json({
    success: true,
    data: result,
    message: 'Game configuration updated successfully'
  });
});

// Get game with all related data (assets, mechanics, versions)
export const handleGetGameDetails: RequestHandler = asyncHandler(async (req, res) => {
  const { gameId } = req.params;

  const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
  if (gameResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }

  const assetsResult = await query('SELECT * FROM game_assets WHERE game_id = $1', [gameId]);
  const mechanicsResult = await query('SELECT * FROM game_mechanics WHERE game_id = $1', [gameId]);
  const versionsResult = await query('SELECT * FROM game_versions WHERE game_id = $1 ORDER BY created_at DESC', [gameId]);
  const resultsResult = await query('SELECT COUNT(*) as total_plays, SUM(win_amount) as total_wins FROM game_results WHERE game_id = $1', [gameId]);

  const game = gameResult.rows[0];

  res.json({
    success: true,
    data: {
      ...game,
      assets: assetsResult.rows,
      mechanics: mechanicsResult.rows,
      versions: versionsResult.rows,
      stats: resultsResult.rows[0]
    }
  });
});

// Get game analytics
export const handleGetGameAnalytics: RequestHandler = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { days = 30 } = req.query;

  const result = await query(
    `SELECT * FROM game_analytics WHERE game_id = $1 AND date >= NOW() - INTERVAL '${days} days' ORDER BY date DESC`,
    [gameId]
  );

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length
  });
});

// List all available game engines/types
export const handleGetGameEngines: RequestHandler = asyncHandler(async (req, res) => {
  const engines = [
    { id: 'coin-up-engine', name: 'CoinUp Engine', description: 'Lightning-fast slots with coin mechanics', supported_features: ['multiplier', 'bonus_round', 'free_spins'] },
    { id: 'card-engine', name: 'Card Engine', description: 'Poker, Blackjack, and card game engine', supported_features: ['draw', 'fold', 'raise', 'call'] },
    { id: 'dice-engine', name: 'Dice Engine', description: 'Dice-based games and craps', supported_features: ['roll', 'bet', 'payout'] },
    { id: 'roulette-engine', name: 'Roulette Engine', description: 'Classic and European roulette', supported_features: ['spin', 'bet_placement', 'wheel_animation'] },
    { id: 'keno-engine', name: 'Keno Engine', description: 'Keno number selection game', supported_features: ['number_selection', 'draw', 'winnings'] },
    { id: 'bingo-engine', name: 'Bingo Engine', description: 'Bingo card and number calling', supported_features: ['card_generation', 'number_call', 'pattern_detection'] },
    { id: 'poker-engine', name: 'Poker Engine', description: 'Texas Hold\'em and poker variants', supported_features: ['betting_rounds', 'hand_ranking', 'multi_player'] },
    { id: 'sportsbook-engine', name: 'Sportsbook Engine', description: 'Sports betting and parlays', supported_features: ['live_odds', 'parlay', 'line_movement'] }
  ];

  res.json({
    success: true,
    data: engines,
    count: engines.length
  });
});

// Get default game templates
export const handleGetDefaultTemplates: RequestHandler = asyncHandler(async (req, res) => {
  const templates = await gameFactory.getTemplates();
  
  res.json({
    success: true,
    data: templates,
    count: templates.length,
    message: `${templates.length} game templates available`
  });
});
