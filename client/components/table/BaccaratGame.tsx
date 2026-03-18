/**
 * Baccarat Game Component
 * Placeholder for Baccarat implementation
 */

import React, { useState } from 'react';
import { BaseGameLayout } from '@/components/game/BaseGameLayout';
import { BetController } from '@/components/game/BetController';
import { useGameSession } from '@/hooks/use-game-session';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const MIN_BET = 0.1;
const MAX_BET = 50;

interface BaccaratGameProps {
  gameId?: string;
  gameName?: string;
  onClose?: () => void;
}

export const BaccaratGame: React.FC<BaccaratGameProps> = ({
  gameId = 'baccarat-classic',
  gameName = 'Baccarat',
  onClose,
}) => {
  const gameSession = useGameSession({
    gameId,
    gameName,
    minBet: MIN_BET,
    maxBet: MAX_BET,
  });

  const [betAmount, setBetAmount] = useState(1);

  const handleSpin = async () => {
    // Placeholder logic - to be implemented
    console.log('Baccarat hand with bet:', betAmount);
  };

  return (
    <BaseGameLayout
      gameName={gameName}
      gameDescription="Classic Baccarat Card Game"
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
                Baccarat is currently in development. The full game implementation
                with betting mechanics, card logic, and animations will be available soon!
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

export default BaccaratGame;
