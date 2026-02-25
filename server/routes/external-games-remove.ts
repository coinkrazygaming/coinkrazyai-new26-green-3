/**
 * DEPRECATED: This route handler is being phased out
 * All external games have been removed from the system
 * Use /api/games endpoint instead for all game listings
 * 
 * This file remains for reference only.
 * The /external-games endpoint now returns empty or redirects to main games
 */

import { RequestHandler } from 'express';

export const handleGetExternalGames: RequestHandler = async (req, res) => {
  // External games have been removed from the system
  // Return empty array or redirect users to main games page
  res.json({
    success: true,
    message: 'External games have been consolidated into the main games catalog',
    data: [],
    redirect: '/games'
  });
};

export const handlePlayExternalGame: RequestHandler = async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'External games have been removed. Please use the main games lobby.',
    redirect: '/games'
  });
};
