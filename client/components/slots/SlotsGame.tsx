import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Volume2, VolumeX, RotateCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { slots, wallet } from '@/lib/api';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';

// Slot symbols
const SYMBOLS = ['🍎', '🍊', '🍋', '🍒', '💎', '🔔', '⭐', '👑'];
const WILD = '🃏';
const NUM_REELS = 5;
const NUM_ROWS = 3;
const NUM_PAYLINES = 10;

interface SpinResult {
  reels: string[][];
  winAmount: number;
  winningLines: number[];
  symbols: string;
  result: 'win' | 'loss' | 'push';
}

interface PaylineWin {
  lineIndex: number;
  matchCount: number;
  symbol: string;
  multiplier: number;
  amount: number;
}

const SlotsGame: React.FC<{ gameId?: string | number; gameName?: string }> = ({
  gameId = 'slots-game',
  gameName = 'Classic Slots'
}) => {
  // Game state
  const { wallet: walletData, refreshWallet } = useWallet();
  const [reels, setReels] = useState<string[][]>(
    Array(NUM_REELS).fill(null).map(() => Array(NUM_ROWS).fill('🍎'))
  );
  const [spinning, setSpinning] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [totalBet, setTotalBet] = useState(NUM_PAYLINES);
  const [winAmount, setWinAmount] = useState(0);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [winningLines, setWinningLines] = useState<PaylineWin[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animatingReels, setAnimatingReels] = useState<number[]>([]);
  const [balance, setBalance] = useState(walletData?.sweepsCoins ?? 0);

  // Update balance when wallet changes
  useEffect(() => {
    setBalance(walletData?.sweepsCoins ?? 0);
  }, [walletData]);

  // Calculate payline positions
  const getPaylinePositions = (lineIndex: number): [number, number][] => {
    const positions: [number, number][] = [];
    const centerRow = Math.floor(NUM_ROWS / 2);

    for (let reel = 0; reel < NUM_REELS; reel++) {
      let row = centerRow;

      // Different patterns for different paylines
      if (lineIndex < 3) {
        // Horizontal lines (top, middle, bottom)
        row = lineIndex;
      } else if (lineIndex < 6) {
        // V patterns
        const v = lineIndex - 3;
        row = v === 0 ? 0 : (v === 1 ? (reel % 2 === 0 ? 0 : 2) : 2);
      } else {
        // Z patterns and others
        row = (reel % 2 === 0) ? 0 : 2;
      }

      positions.push([reel, Math.min(Math.max(row, 0), NUM_ROWS - 1)]);
    }

    return positions;
  };

  // Check win on a single payline
  const checkPaylineWin = (paylineIndex: number, reelData: string[][]): PaylineWin | null => {
    const positions = getPaylinePositions(paylineIndex);
    const symbols = positions.map(([reel, row]) => reelData[reel][row]);

    // Check for matching symbols
    let symbol = symbols[0];
    let matchCount = 1;

    for (let i = 1; i < symbols.length; i++) {
      const currentSymbol = symbols[i];
      if (currentSymbol === symbol || currentSymbol === WILD || symbol === WILD) {
        if (symbol !== WILD && currentSymbol !== WILD) {
          symbol = currentSymbol;
        }
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3 && symbol !== WILD) {
      // Calculate payout based on match count
      const baseMultiplier = [0, 0, 2, 3, 5, 10][matchCount] || 10;
      const multiplier = baseMultiplier * (matchCount === 5 ? 2 : 1);
      const amount = totalBet * multiplier;

      return {
        lineIndex: paylineIndex,
        matchCount,
        symbol,
        multiplier,
        amount
      };
    }

    return null;
  };

  // Check all paylines for wins
  const checkAllWins = (reelData: string[][]): PaylineWin[] => {
    const wins: PaylineWin[] = [];

    for (let i = 0; i < NUM_PAYLINES; i++) {
      const win = checkPaylineWin(i, reelData);
      if (win) {
        wins.push(win);
      }
    }

    return wins;
  };

  // Spin the reels
  const performSpin = useCallback(async () => {
    if (spinning || isSpinning) return;
    if (balance < totalBet) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSpinning(true);
      setIsSpinning(true);
      setWinAmount(0);
      setWinningLines([]);
      setLastResult(null);

      // Animate reels spinning
      const spinDuration = 2500;
      setAnimatingReels(Array.from({ length: NUM_REELS }, (_, i) => i));

      // Generate initial random reels for animation
      const animationFrames: string[][][] = [];
      const frameCount = 20;

      for (let frame = 0; frame < frameCount; frame++) {
        const frameReels = Array(NUM_REELS).fill(null).map(() =>
          Array(NUM_ROWS).fill(null).map(() =>
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          )
        );
        animationFrames.push(frameReels);
      }

      // Animate spinning
      for (let i = 0; i < frameCount; i++) {
        await new Promise(resolve => setTimeout(resolve, spinDuration / frameCount));
        setReels(animationFrames[i]);
      }

      // Call API to get actual result
      const result = await slots.spin(gameId, totalBet);

      // Parse result
      let finalReels = animationFrames[animationFrames.length - 1];
      let resultWinAmount = 0;
      let resultWinningLines: PaylineWin[] = [];
      let spinResult: 'win' | 'loss' | 'push' = 'loss';

      if (result.success && result.data) {
        // If API returns specific result, use it
        if (result.data.winnings) {
          resultWinAmount = result.data.winnings;
          spinResult = resultWinAmount > totalBet ? 'win' : (resultWinAmount === totalBet ? 'push' : 'loss');
        } else if (result.data.outcome) {
          // Generate reels based on outcome
          const outcomeData = JSON.parse(result.data.outcome || '{}');
          if (outcomeData.winnings) {
            resultWinAmount = outcomeData.winnings;
          }
        }
      }

      // Generate final reel display
      finalReels = Array(NUM_REELS).fill(null).map(() =>
        Array(NUM_ROWS).fill(null).map(() =>
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        )
      );

      // If won, ensure we have some matching symbols
      if (resultWinAmount > 0) {
        // Place some matching symbols in the middle row for visual feedback
        for (let reel = 0; reel < 3; reel++) {
          finalReels[reel][1] = SYMBOLS[Math.floor(Math.random() * 4)];
        }
      }

      setReels(finalReels);

      // Check for wins
      resultWinningLines = checkAllWins(finalReels);
      if (resultWinningLines.length > 0) {
        resultWinAmount = resultWinningLines.reduce((sum, w) => sum + w.amount, 0);
        spinResult = 'win';
      }

      // Update balance
      const newBalance = balance - totalBet + resultWinAmount;
      setBalance(newBalance);
      setWinAmount(resultWinAmount);
      setWinningLines(resultWinningLines);
      setLastResult({
        reels: finalReels,
        winAmount: resultWinAmount,
        winningLines: resultWinningLines.map(w => w.lineIndex),
        symbols: '',
        result: spinResult
      });

      // Play sound
      if (soundEnabled && resultWinAmount > 0) {
        playWinSound();
      }

      // Show toast
      if (resultWinAmount > totalBet) {
        toast.success(`🎉 You won ${resultWinAmount.toFixed(2)} SC!`);
      } else if (resultWinAmount === totalBet) {
        toast.info('Push - Bet returned');
      } else {
        toast.error('No win this spin');
      }

      // Refresh wallet
      await refreshWallet();
    } catch (error) {
      console.error('Spin failed:', error);
      toast.error('Spin failed. Please try again.');
    } finally {
      setSpinning(false);
      setIsSpinning(false);
      setAnimatingReels([]);
    }
  }, [balance, totalBet, soundEnabled, gameId, spinning, isSpinning, refreshWallet]);

  // Simple win sound
  const playWinSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.2);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  };

  const quickBets = [1, 5, 10, 25, 50];
  const maxBet = Math.floor(balance / NUM_PAYLINES);

  return (
    <div className="space-y-6">
      {/* Game Info */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{gameName}</h1>
        <p className="text-muted-foreground">
          {NUM_PAYLINES} Paylines • {NUM_REELS} Reels • Max Win 10x
        </p>
      </div>

      {/* Game Container */}
      <Card className="border-primary/20 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardContent className="pt-8">
          {/* Game Grid */}
          <div className="mb-8 p-4 md:p-6 bg-black rounded-2xl border-4 border-primary/20 overflow-x-auto">
            <div className="grid gap-2 md:gap-3 min-w-max md:min-w-0" style={{ gridTemplateColumns: `repeat(${NUM_REELS}, 1fr)` }}>
              {reels.map((reel, reelIndex) => (
                <div
                  key={reelIndex}
                  className={cn(
                    'relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border-2 border-primary/30 p-2 transition-all duration-300',
                    animatingReels.includes(reelIndex) && 'animate-pulse border-primary'
                  )}
                >
                  <div className="space-y-1">
                    {reel.map((symbol, rowIndex) => (
                      <div
                        key={`${reelIndex}-${rowIndex}`}
                        className={cn(
                          'text-3xl md:text-5xl h-16 md:h-20 flex items-center justify-center rounded-lg transition-all duration-300',
                          rowIndex === 1
                            ? 'bg-primary/20 border-2 border-primary scale-110 shadow-lg shadow-primary/50'
                            : 'bg-slate-700/50'
                        )}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Paylines Visualization */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Active Paylines: {NUM_PAYLINES}</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: NUM_PAYLINES }).map((_, i) => (
                  <Badge
                    key={i}
                    variant={winningLines.some(w => w.lineIndex === i) ? 'default' : 'outline'}
                    className={cn(
                      'text-xs justify-center',
                      winningLines.some(w => w.lineIndex === i) && 'bg-green-500 text-white animate-pulse'
                    )}
                  >
                    Line {i + 1}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Win Display */}
          {winAmount > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border-2 border-green-500/50 text-center">
              <p className="text-sm text-green-400 uppercase tracking-wide font-bold">
                🎉 YOU WON! 🎉
              </p>
              <p className="text-4xl font-black text-green-400 mt-2">
                {winAmount.toFixed(2)} SC
              </p>
              {winningLines.length > 0 && (
                <p className="text-sm text-green-300 mt-2">
                  {winningLines.length} winning payline{winningLines.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Bet Controls */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bet per Line */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bet per Line</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0.1"
                    max={maxBet}
                    step="0.1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Bet</p>
                    <p className="text-xl font-bold text-primary">{totalBet.toFixed(2)} SC</p>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sweeps Coin Balance</label>
                <div className="flex items-center h-10 px-3 bg-slate-800 rounded-md border border-slate-700">
                  <span className="text-xl font-bold text-primary">{balance.toFixed(2)} SC</span>
                </div>
              </div>
            </div>

            {/* Quick Bet Buttons */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick Bets</p>
              <div className="grid grid-cols-5 gap-2">
                {quickBets.map((bet) => (
                  <Button
                    key={bet}
                    variant={betAmount === bet ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBetAmount(Math.min(bet, maxBet))}
                    disabled={isSpinning}
                  >
                    {bet}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={performSpin}
              disabled={isSpinning || balance < totalBet}
              className="flex-1 gap-2 text-lg font-bold h-14"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SPINNING...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  SPIN {totalBet.toFixed(2)} SC
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-14"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>

          {/* Info */}
          {balance < totalBet && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              ⚠️ Insufficient balance. Adjust your bet or add more funds.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Bet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBet.toFixed(2)} SC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Win</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              'text-2xl font-bold',
              winAmount > 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {winAmount.toFixed(2)} SC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{balance.toFixed(2)} SC</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • Set your bet amount per line and spin the {NUM_REELS} reels
          </p>
          <p>
            • Match symbols across one of {NUM_PAYLINES} paylines to win
          </p>
          <p>
            • 3 matching symbols = 2x your bet • 4 symbols = 3x • 5 symbols = 10x
          </p>
          <p>
            • Minimum 3 matching symbols required to win on a payline
          </p>
          <p>
            • Wild symbols can substitute for any regular symbol
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlotsGame;
