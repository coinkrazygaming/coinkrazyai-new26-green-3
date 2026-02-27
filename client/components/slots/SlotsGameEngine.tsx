import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Volume2, VolumeX, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import confetti from 'canvas-confetti';

interface SlotsGameEngineProps {
  gameId?: number;
  gameName?: string;
}

const SYMBOLS = ['🍎', '🍊', '🍋', '🍌', '🍇', '💎', '👑', '7️⃣'];
const REELS = 3;
const ROWS = 3;
const MIN_BET = 0.10;
const MAX_BET = 100;

interface GameState {
  balance: number;
  currentBet: number;
  spinning: boolean;
  reels: string[][];
  lastWinnings: number;
  totalWinnings: number;
  spinHistory: SpinResult[];
  soundEnabled: boolean;
}

interface SpinResult {
  bet: number;
  winnings: number;
  symbols: string;
  timestamp: number;
}

const SlotsGameEngine: React.FC<SlotsGameEngineProps> = ({ gameId, gameName = 'Mega Spin Slots' }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    balance: 1000,
    currentBet: 1,
    spinning: false,
    reels: Array(REELS).fill(Array(ROWS).fill('❓')),
    lastWinnings: 0,
    totalWinnings: 0,
    spinHistory: [],
    soundEnabled: true,
  });

  // Load user balance on mount
  useEffect(() => {
    if (user) {
      setGameState(prev => ({
        ...prev,
        balance: (user as any).sc_balance || 1000,
      }));
    }
  }, [user]);

  const generateReels = (): string[][] => {
    const newReels: string[][] = [];
    for (let i = 0; i < REELS; i++) {
      const reel: string[] = [];
      for (let j = 0; j < ROWS; j++) {
        reel.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      newReels.push(reel);
    }
    return newReels;
  };

  const checkWin = (reels: string[][]): number => {
    let winnings = 0;

    // Check middle row
    const middleRow = reels.map(reel => reel[1]);
    if (middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]) {
      const symbol = middleRow[0];
      const symbolIndex = SYMBOLS.indexOf(symbol);
      const multiplier = [2, 2.5, 3, 3.5, 4, 5, 7.5, 10][symbolIndex];
      winnings += gameState.currentBet * multiplier * 100;
    }

    // Check diagonals
    if (reels[0][0] === reels[1][1] && reels[1][1] === reels[2][2]) {
      const symbolIndex = SYMBOLS.indexOf(reels[1][1]);
      const multiplier = [2, 2.5, 3, 3.5, 4, 5, 7.5, 10][symbolIndex];
      winnings += gameState.currentBet * multiplier * 50;
    }

    if (reels[0][2] === reels[1][1] && reels[1][1] === reels[2][0]) {
      const symbolIndex = SYMBOLS.indexOf(reels[1][1]);
      const multiplier = [2, 2.5, 3, 3.5, 4, 5, 7.5, 10][symbolIndex];
      winnings += gameState.currentBet * multiplier * 50;
    }

    return Math.min(winnings, 10); // Max 10 SC win for compliance
  };

  const playSpin = async () => {
    if (gameState.currentBet < MIN_BET || gameState.currentBet > MAX_BET) {
      toast.error(`Bet must be between ${MIN_BET} and ${MAX_BET}`);
      return;
    }

    if (gameState.balance < gameState.currentBet) {
      toast.error('Insufficient balance');
      return;
    }

    setGameState(prev => ({
      ...prev,
      spinning: true,
      balance: prev.balance - prev.currentBet,
    }));

    // Animate spinning
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setGameState(prev => ({
        ...prev,
        reels: generateReels(),
      }));
    }

    const finalReels = generateReels();
    setGameState(prev => ({
      ...prev,
      reels: finalReels,
    }));

    const winnings = checkWin(finalReels);
    const newBalance = gameState.balance - gameState.currentBet + winnings;

    if (winnings > 0) {
      toast.success(`🎉 Big Win! ${winnings.toFixed(2)} SC!`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Record spin result
      const spinResult: SpinResult = {
        bet: gameState.currentBet,
        winnings,
        symbols: finalReels.map(r => r[1]).join(''),
        timestamp: Date.now(),
      };

      setGameState(prev => ({
        ...prev,
        spinning: false,
        lastWinnings: winnings,
        totalWinnings: prev.totalWinnings + winnings,
        balance: newBalance,
        spinHistory: [spinResult, ...prev.spinHistory].slice(0, 20),
      }));

      // Send to server
      try {
        await fetch('/api/slots/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            bet: gameState.currentBet,
            winnings,
            symbols: finalReels.map(r => r[1]).join(''),
          }),
        });
      } catch (error) {
        console.error('Failed to record spin:', error);
      }
    } else {
      toast.info('No match - try again!');
      setGameState(prev => ({
        ...prev,
        spinning: false,
        lastWinnings: 0,
        balance: newBalance,
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Game Header */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black italic uppercase text-white">{gameName}</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">5X RTP | HIGH VOLATILITY</p>
      </div>

      {/* Game Board */}
      <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-yellow-500/30 overflow-hidden">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Reels Display */}
            <div className="bg-black/50 rounded-3xl p-8 border-2 border-yellow-500/50">
              <div className="grid grid-cols-3 gap-6">
                {gameState.reels.map((reel, reelIdx) => (
                  <div key={reelIdx} className="space-y-2">
                    {reel.map((symbol, rowIdx) => (
                      <div
                        key={`${reelIdx}-${rowIdx}`}
                        className={`
                          w-full h-32 flex items-center justify-center text-6xl font-black rounded-2xl border-2
                          ${rowIdx === 1 ? 'border-yellow-500 bg-yellow-500/20 shadow-lg shadow-yellow-500/50' : 'border-slate-600 bg-slate-800'}
                          ${gameState.spinning ? 'animate-spin' : ''}
                          transition-all duration-300
                        `}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm font-bold uppercase">Balance</p>
                <p className="text-3xl font-black text-white">{gameState.balance.toFixed(2)}</p>
                <p className="text-xs text-slate-500">SC</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm font-bold uppercase">Last Win</p>
                <p className={`text-3xl font-black ${gameState.lastWinnings > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {gameState.lastWinnings.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">SC</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm font-bold uppercase">Total Won</p>
                <p className="text-3xl font-black text-yellow-400">{gameState.totalWinnings.toFixed(2)}</p>
                <p className="text-xs text-slate-500">SC</p>
              </div>
            </div>

            {/* Betting Controls */}
            <div className="space-y-4 bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-slate-400">Bet Amount (${MIN_BET} - ${MAX_BET})</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={MIN_BET}
                    max={MAX_BET}
                    step={0.10}
                    value={gameState.currentBet}
                    onChange={(e) => setGameState(prev => ({
                      ...prev,
                      currentBet: parseFloat(e.target.value) || MIN_BET,
                    }))}
                    disabled={gameState.spinning}
                    className="bg-slate-800 border-slate-700"
                  />
                  <Button
                    onClick={playSpin}
                    disabled={gameState.spinning || gameState.balance < gameState.currentBet}
                    className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-black text-lg italic rounded-xl"
                  >
                    {gameState.spinning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        SPINNING...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        SPIN ({gameState.currentBet.toFixed(2)} SC)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.50, 1, 5, 10].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setGameState(prev => ({ ...prev, currentBet: amount }))}
                    disabled={gameState.spinning}
                    className="text-xs font-bold"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      {gameState.spinHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase italic">Recent Spins</h2>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {gameState.spinHistory.map((spin, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="text-sm font-bold">
                  <span className="text-slate-400">Bet: </span>
                  <span className="text-white">{spin.bet.toFixed(2)} SC</span>
                </div>
                <div className="text-lg font-black">{spin.symbols}</div>
                <Badge className={spin.winnings > 0 ? 'bg-green-600' : 'bg-slate-700'}>
                  {spin.winnings > 0 ? '+' : '-'}{Math.abs(spin.winnings).toFixed(2)} SC
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsGameEngine;
