/**
 * GameAdapter
 * Maps game types to their rendering components
 * Handles dynamic loading and error recovery
 */

import React, { Suspense, lazy } from 'react';
import { GameMetadata, GameType } from '@/data/gamesRegistry';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// GAME COMPONENT REGISTRY
// ============================================================================

type GameComponentType = React.LazyExoticComponent<React.FC<any>> | React.FC<any>;

interface GameAdapterMap {
  [key: string]: {
    component: GameComponentType;
    lazy: boolean;
  };
}

// Map of game types/components to their implementation
// Lazy-loaded to reduce initial bundle size
const GAME_ADAPTERS: GameAdapterMap = {
  // Slots
  'slots/SlotsGameEngine': {
    component: lazy(() => import('@/components/slots/SlotsGameEngine')),
    lazy: true,
  },
  'slots/SlotsGame': {
    component: lazy(() => import('@/components/slots/SlotsGame')),
    lazy: true,
  },

  // CoinKrazy games
  'CoinKrazyCoinUp/GameCanvas': {
    component: lazy(() =>
      import('@/components/CoinKrazyCoinUp/GameCanvas').then(mod => ({
        default: mod.GameCanvas,
      }))
    ),
    lazy: true,
  },
  'CoinKrazyCoinHot/GameCanvas': {
    component: lazy(() =>
      import('@/components/CoinKrazyCoinHot/GameCanvas').then(mod => ({
        default: mod.GameCanvas,
      }))
    ),
    lazy: true,
  },

  // Existing games (backward compatibility)
  'poker/PokerGameEngine': {
    component: lazy(() => import('@/components/poker/PokerGameEngine')),
    lazy: true,
  },

  // Table games (new)
  'table/BlackjackGame': {
    component: lazy(() => import('@/components/table/BlackjackGame')),
    lazy: true,
  },
  'table/RouletteGame': {
    component: lazy(() => import('@/components/table/RouletteGame')),
    lazy: true,
  },
  'table/BaccaratGame': {
    component: lazy(() => import('@/components/table/BaccaratGame')),
    lazy: true,
  },

  // External games (embedded in iframe)
  'external/ExternalGamePlayer': {
    component: lazy(() => import('@/components/casino/BrandedGameModal')),
    lazy: true,
  },
};

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================

const GameLoadingFallback: React.FC<{ gameName: string }> = ({ gameName }) => (
  <div className="flex flex-col items-center justify-center min-h-96">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto" />
      <p className="text-lg font-semibold text-slate-300">Loading {gameName}...</p>
    </div>
  </div>
);

const GameErrorFallback: React.FC<{ error: string }> = ({ error }) => (
  <Card className="bg-red-950/20 border-red-900">
    <CardContent className="pt-6">
      <p className="text-red-400 font-semibold mb-2">Failed to load game</p>
      <p className="text-sm text-red-300">{error}</p>
    </CardContent>
  </Card>
);

// ============================================================================
// GAME ADAPTER HOOK
// ============================================================================

export interface UseGameAdapterProps {
  game: GameMetadata;
  onError?: (error: Error) => void;
}

export interface UseGameAdapterReturn {
  Component: React.FC<any> | null;
  isLoading: boolean;
  error: Error | null;
  componentProps: Record<string, any>;
}

/**
 * Hook to get the right component and props for a game
 */
export function useGameAdapter(props: UseGameAdapterProps): UseGameAdapterReturn {
  const { game, onError } = props;

  try {
    // Get component based on entry point
    const entryComponent = game.entryComponent;
    if (!entryComponent) {
      throw new Error('Game has no entry component configured');
    }

    const adapterConfig = GAME_ADAPTERS[entryComponent];
    if (!adapterConfig) {
      throw new Error(`No adapter found for game type: ${entryComponent}`);
    }

    // Prepare props for the game component
    const componentProps: Record<string, any> = {
      gameId: game.id,
      gameName: game.name,
      gameSlug: game.slug,
      minBet: game.minBet,
      maxBet: game.maxBet,
      defaultBet: game.defaultBet,
      embedUrl: game.embedUrl,
      metadata: game.metadata,
    };

    return {
      Component: adapterConfig.component as React.FC<any>,
      isLoading: false,
      error: null,
      componentProps,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    return {
      Component: null,
      isLoading: false,
      error: err,
      componentProps: {},
    };
  }
}

// ============================================================================
// GAME ADAPTER COMPONENT
// ============================================================================

export interface GameAdapterProps {
  game: GameMetadata;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * GameAdapter Component
 * Wraps the game component with loading states and error handling
 */
export const GameAdapter: React.FC<GameAdapterProps> = ({
  game,
  onError,
  onClose,
}) => {
  const { Component, error, componentProps } = useGameAdapter({
    game,
    onError,
  });

  if (error) {
    return <GameErrorFallback error={error.message} />;
  }

  if (!Component) {
    return <GameErrorFallback error="Game component not found" />;
  }

  // Wrap component with Suspense for lazy loading
  return (
    <Suspense fallback={<GameLoadingFallback gameName={game.name} />}>
      <Component
        {...componentProps}
        onClose={onClose}
      />
    </Suspense>
  );
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Get the appropriate renderer for a game
 * Returns null if game type is not supported
 */
export function getGameComponent(game: GameMetadata): React.FC<any> | null {
  const entryComponent = game.entryComponent;
  if (!entryComponent) return null;

  const config = GAME_ADAPTERS[entryComponent];
  return config?.component || null;
}

/**
 * Check if a game type is supported
 */
export function isGameSupported(game: GameMetadata): boolean {
  return !!game.entryComponent && !!GAME_ADAPTERS[game.entryComponent];
}
