/**
 * Roulette Game Component
 * Placeholder for European Roulette implementation
 */

import React, { useState } from 'react';
import { BaseGameLayout } from '@/components/game/BaseGameLayout';
import { BetController } from '@/components/game/BetController';
import { useGameSession } from '@/hooks/use-game-session';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const MIN_BET = 0.1;
const MAX_BET = 100;

interface RouletteGameProps {
  gameId?: string;
  gameName?: string;
  onClose?: () => void;
}

export const RouletteGame: React.FC<RouletteGameProps> = ({
  gameId = 'roulette-european',
  gameName = 'European Roulette',
  onClose,
}) => {
  const gameSession = useGameSession({
    gameId: gameId || 'roulette-european',
    gameName: gameName || 'European Roulette',
    minBet: MIN_BET,
    maxBet: MAX_BET,
    gameType: 'table',
  });

  const [betAmount, setBetAmount] = useState(1);

  const handleSpin = async () => {
    // Spinner handler for Roulette - will integrate with backend
    const spinHandler = async (bet: number) => {
      // Placeholder - would call server with roulette-specific logic
      return {
        success: true,
        gameId: gameId || 'roulette-european',
        gameName: gameName || 'European Roulette',
        betAmount: bet,
        winAmount: 0,
        netResult: -bet,
        result: 'loss' as const,
        balanceAfter: gameSession.currentBalance - bet,
      };
    };

    await gameSession.playSpin(betAmount, spinHandler);
  };

  return (
    <BaseGameLayout
      gameName={gameName}
      gameDescription="European Roulette with 37 numbers"
      balance={gameSession.currentBalance}
      onClose={onClose}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-yellow-950/20 border-yellow-700">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-100 mb-1">Coming Soon</h3>
              <p className="text-sm text-yellow-200">
                European Roulette is currently in development. The full game implementation
                with betting mechanics, animations, and multiplayer features will be available soon!
              </p>
            </div>
          </CardContent>
        </Card>

        <BetController
          betAmount={betAmount}
          onBetChange={setBetAmount}
          onSpin={handleSpin}
          minBet={MIN_BET}
          maxBet={MAX_BET}
          balance={gameSession.currentBalance}
          isSpinning={gameSession.isProcessing}
        />
      </div>
    </BaseGameLayout>
  );
};

export default RouletteGame;
