'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { ChevronLeft, Volume2, VolumeX, Maximize2, Home, HelpCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SymbolType = 'chili' | 'coin-bonus' | 'mini-bonus' | 'minor-bonus' | 'major-bonus' | 'grand-bonus' | 'collect' | 'empty';

interface GameSymbol {
  type: SymbolType;
  value?: number; // For bonus symbols
  multiplier?: number; // For sticky multipliers
  isLocked?: boolean;
}

interface GameState {
  isSpinning: boolean;
  respinsLeft: number;
  lockedSymbols: Set<string>; // grid positions that are locked
  totalCollected: number;
  baseGameWin: number;
  bonusActive: boolean;
  gameEnded: boolean;
}

interface GridPosition {
  row: number;
  col: number;
}

const COIN_VALUES = {
  mini: 0.10,
  minor: 0.50,
  major: 1.00,
  grand: 5.00,
};

const MAX_BET = 5;
const MAX_WIN = 10;
const BET_AMOUNTS = [0.10, 0.25, 0.50, 1.00, 2.00, 5.00];
const RESPINS = 3;
const GRID_SIZE = 3;

const CoinKrazyChiliCoins = () => {
  const { wallet, refreshWallet } = useWallet();
  const { user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>({
    isSpinning: false,
    respinsLeft: 0,
    lockedSymbols: new Set(),
    totalCollected: 0,
    baseGameWin: 0,
    bonusActive: false,
    gameEnded: false,
  });

  const [currentBet, setCurrentBet] = useState(0.10);
  const [grid, setGrid] = useState<GameSymbol[][]>([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameContainer, setGameContainer] = useState<HTMLDivElement | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [balanceDisplay, setBalanceDisplay] = useState(wallet?.sweepsCoins ?? 0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize
  useEffect(() => {
    initializeGame();
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (err) {
      console.warn('AudioContext not available');
    }
  }, []);

  // Update balance display
  useEffect(() => {
    setBalanceDisplay(wallet?.sweepsCoins ?? 0);
  }, [wallet?.sweepsCoins]);

  const initializeGame = () => {
    const newGrid: GameSymbol[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({ type: 'empty' as SymbolType }))
    );
    setGrid(newGrid);
    setGameState({
      isSpinning: false,
      respinsLeft: 0,
      lockedSymbols: new Set(),
      totalCollected: 0,
      baseGameWin: 0,
      bonusActive: false,
      gameEnded: false,
    });
  };

  const playSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' = 'sine') => {
    if (isMuted || !audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = frequency;
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn('Sound playback error:', err);
    }
  }, [isMuted]);

  // Generate random symbol
  const getRandomSymbol = useCallback((): GameSymbol => {
    const rand = Math.random();
    if (rand < 0.15) return { type: 'chili' };
    if (rand < 0.30) return { type: 'coin-bonus' };
    if (rand < 0.45) return { type: 'mini-bonus', value: COIN_VALUES.mini };
    if (rand < 0.60) return { type: 'minor-bonus', value: COIN_VALUES.minor };
    if (rand < 0.75) return { type: 'major-bonus', value: COIN_VALUES.major };
    if (rand < 0.85) return { type: 'grand-bonus', value: COIN_VALUES.grand };
    return { type: 'empty' };
  }, []);

  // Spin handler
  const handleSpin = useCallback(async () => {
    if (gameState.isSpinning || balanceDisplay < currentBet) {
      toast.error(balanceDisplay < currentBet ? 'Insufficient balance' : 'Spin in progress');
      return;
    }

    try {
      // Debit wallet immediately
      setBalanceDisplay(prev => prev - currentBet);

      setGameState(prev => ({
        ...prev,
        isSpinning: true,
        respinsLeft: 0,
        bonusActive: false,
        gameEnded: false,
        totalCollected: 0,
        baseGameWin: 0,
      }));

      playSound(400, 0.1);

      // Simulate spin animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate base game result
      const newGrid: GameSymbol[][] = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => getRandomSymbol())
      );
      setGrid(newGrid);

      // Check for collect + bonus
      const collectPos = findCollectSymbol(newGrid);
      const hasBonusSymbols = checkBonusSymbols(newGrid);

      if (collectPos && hasBonusSymbols) {
        // Hold & Win triggered
        playSound(800, 0.3);
        setGameState(prev => ({
          ...prev,
          bonusActive: true,
          respinsLeft: RESPINS,
          lockedSymbols: new Set([`${collectPos.row}-${collectPos.col}`]),
        }));
      } else {
        // Regular win check
        const baseWin = calculateBaseGameWin(newGrid, currentBet);
        const finalWin = Math.min(baseWin, MAX_WIN);
        
        setGameState(prev => ({
          ...prev,
          isSpinning: false,
          gameEnded: true,
          baseGameWin: finalWin,
          totalCollected: finalWin,
        }));

        if (finalWin > 0) {
          playSound(1000, 0.5);
          setWinAmount(finalWin);
          setShowWinModal(true);
        }

        await refreshWallet?.();
      }

      setGameState(prev => ({ ...prev, isSpinning: false }));
    } catch (error) {
      toast.error('Error during spin');
      console.error('Spin error:', error);
      setGameState(prev => ({ ...prev, isSpinning: false }));
    }
  }, [currentBet, gameState.isSpinning, balanceDisplay, wallet, getRandomSymbol, playSound, refreshWallet]);

  // Find collect symbol
  const findCollectSymbol = (grid: GameSymbol[][]): GridPosition | null => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j].type === 'collect') {
          return { row: i, col: j };
        }
      }
    }
    return null;
  };

  // Check for bonus symbols
  const checkBonusSymbols = (grid: GameSymbol[][]): boolean => {
    return grid.flat().some(symbol => 
      symbol.type === 'mini-bonus' || 
      symbol.type === 'minor-bonus' || 
      symbol.type === 'major-bonus' || 
      symbol.type === 'grand-bonus'
    );
  };

  // Calculate base game win (line wins)
  const calculateBaseGameWin = (grid: GameSymbol[][], bet: number): number => {
    let totalWin = 0;
    
    // Check horizontal lines
    for (let row = 0; row < GRID_SIZE; row++) {
      const line = grid[row];
      if (line[0].type === line[1].type && line[1].type === line[2].type && line[0].type !== 'empty') {
        const symbol = line[0].type;
        if (symbol === 'chili') {
          totalWin += bet * 2;
        } else if (symbol === 'coin-bonus') {
          totalWin += bet * 1.5;
        }
      }
    }

    // Check vertical lines
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[0][col].type === grid[1][col].type && grid[1][col].type === grid[2][col].type && grid[0][col].type !== 'empty') {
        const symbol = grid[0][col].type;
        if (symbol === 'chili') {
          totalWin += bet * 2;
        } else if (symbol === 'coin-bonus') {
          totalWin += bet * 1.5;
        }
      }
    }

    return Math.min(totalWin, MAX_WIN);
  };

  // Handle respins
  const handleRespin = useCallback(async () => {
    if (gameState.respinsLeft <= 0) return;

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
    }));

    playSound(400, 0.1);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate new symbols, keeping locked ones
    const newGrid = grid.map((row, rowIdx) =>
      row.map((symbol, colIdx) => {
        const posKey = `${rowIdx}-${colIdx}`;
        if (gameState.lockedSymbols.has(posKey)) {
          return symbol;
        }
        return getRandomSymbol();
      })
    );

    setGrid(newGrid);

    // Check for new collect or bonus
    const bonusFound = checkBonusSymbols(newGrid);
    let newCollected = gameState.totalCollected;

    if (bonusFound) {
      // Collect bonus values
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const symbol = newGrid[i][j];
          if (symbol.value) {
            newCollected += symbol.value;
          }
        }
      }
      playSound(800, 0.3);
    }

    const respinsLeft = gameState.respinsLeft - 1;
    newCollected = Math.min(newCollected, MAX_WIN);

    if (respinsLeft > 0 && bonusFound) {
      // Continue respins
      setGameState(prev => ({
        ...prev,
        respinsLeft,
        totalCollected: newCollected,
        isSpinning: false,
      }));
    } else {
      // End bonus feature
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        gameEnded: true,
        bonusActive: false,
        respinsLeft: 0,
        totalCollected: newCollected,
      }));

      if (newCollected > 0) {
        playSound(1000, 0.5);
        setWinAmount(newCollected);
        setShowWinModal(true);
      }

      await refreshWallet?.();
    }

    setGameState(prev => ({ ...prev, isSpinning: false }));
  }, [gameState, grid, getRandomSymbol, playSound, refreshWallet]);

  // Handle win claim
  const handleClaimWin = useCallback(async () => {
    try {
      // Update balance display and refresh wallet from server
      setBalanceDisplay(prev => prev + winAmount);
      await refreshWallet?.();
      
      setShowWinModal(false);
      initializeGame();

      toast.success(`Won ${winAmount} SC!`);
    } catch (error: any) {
      toast.error('Error claiming win');
      console.error('Claim error:', error);
    }
  }, [winAmount, wallet, refreshWallet]);

  // Handle share win
  const handleShareWin = useCallback(async () => {
    await handleClaimWin();
    
    const shareText = `I just won ${winAmount} SC on CoinKrazy ChiliCoins at PlayCoinKrazy.com! 🔥 Come play and win big! #CoinKrazy #ChiliCoins`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CoinKrazy ChiliCoins',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share failed:', err);
      }
    } else {
      // Fallback
      const encodedText = encodeURIComponent(shareText);
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
    }
  }, [winAmount, handleClaimWin]);

  // Render symbol
  const renderSymbol = (symbol: GameSymbol, row: number, col: number): string => {
    switch (symbol.type) {
      case 'chili':
        return '🌶️';
      case 'coin-bonus':
        return '🪙';
      case 'mini-bonus':
        return '💰';
      case 'minor-bonus':
        return '💵';
      case 'major-bonus':
        return '💸';
      case 'grand-bonus':
        return '🏆';
      case 'collect':
        return '✨';
      default:
        return '';
    }
  };

  const increaseBet = () => {
    const currentIndex = BET_AMOUNTS.indexOf(currentBet);
    if (currentIndex < BET_AMOUNTS.length - 1) {
      setCurrentBet(BET_AMOUNTS[currentIndex + 1]);
    }
  };

  const decreaseBet = () => {
    const currentIndex = BET_AMOUNTS.indexOf(currentBet);
    if (currentIndex > 0) {
      setCurrentBet(BET_AMOUNTS[currentIndex - 1]);
    }
  };

  return (
    <div ref={setGameContainer} className="w-full h-screen bg-gradient-to-b from-red-900 via-orange-800 to-yellow-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-300 drop-shadow-lg">🌶️ CoinKrazy ChiliCoins 🔥</h1>
          <p className="text-yellow-200">Hold & Win Slot</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={() => setShowHelpModal(!showHelpModal)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Game Grid */}
        <div className="bg-gradient-to-b from-green-900 to-green-800 p-8 rounded-2xl shadow-2xl border-4 border-yellow-400">
          <div className="grid grid-cols-3 gap-4 bg-black p-4 rounded-lg">
            {grid.map((row, rowIdx) =>
              row.map((symbol, colIdx) => {
                const posKey = `${rowIdx}-${colIdx}`;
                const isLocked = gameState.lockedSymbols.has(posKey);
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={cn(
                      'w-24 h-24 flex items-center justify-center text-5xl rounded-lg font-bold transition-all',
                      'border-2 shadow-lg',
                      symbol.type === 'empty' ? 'bg-gray-800 border-gray-600' : 'bg-yellow-500 border-yellow-600',
                      isLocked && 'ring-4 ring-cyan-400 animate-pulse',
                      gameState.isSpinning && 'animate-bounce'
                    )}
                  >
                    {renderSymbol(symbol, rowIdx, colIdx)}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className="flex gap-8 text-white text-xl font-bold">
          <div className="bg-black/50 px-6 py-3 rounded-lg border-2 border-yellow-400">
            <span className="text-yellow-300">Balance: </span>{balanceDisplay.toFixed(2)} SC
          </div>
          <div className="bg-black/50 px-6 py-3 rounded-lg border-2 border-yellow-400">
            <span className="text-yellow-300">Bet: </span>{currentBet.toFixed(2)} SC
          </div>
          {gameState.bonusActive && (
            <>
              <div className="bg-black/50 px-6 py-3 rounded-lg border-2 border-cyan-400">
                <span className="text-cyan-300">Respins: </span>{gameState.respinsLeft}
              </div>
              <div className="bg-black/50 px-6 py-3 rounded-lg border-2 border-cyan-400">
                <span className="text-cyan-300">Collected: </span>{gameState.totalCollected.toFixed(2)} SC
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Bet Controls */}
          <div className="flex gap-4 items-center bg-black/50 p-4 rounded-lg border-2 border-yellow-400">
            <button
              onClick={decreaseBet}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition text-lg"
              disabled={currentBet === BET_AMOUNTS[0]}
            >
              −
            </button>
            
            <div className="flex gap-2">
              {BET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => setCurrentBet(amount)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-bold transition',
                    currentBet === amount
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  )}
                >
                  {amount.toFixed(2)}
                </button>
              ))}
            </div>

            <button
              onClick={increaseBet}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition text-lg"
              disabled={currentBet === BET_AMOUNTS[BET_AMOUNTS.length - 1]}
            >
              +
            </button>
          </div>

          {/* Spin / Respin Buttons */}
          <div className="flex gap-4">
            {!gameState.bonusActive ? (
              <button
                onClick={handleSpin}
                disabled={gameState.isSpinning || balanceDisplay < currentBet}
                className={cn(
                  'px-12 py-6 rounded-lg font-bold text-2xl transition transform hover:scale-105 active:scale-95',
                  gameState.isSpinning || balanceDisplay < currentBet
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-black hover:shadow-lg'
                )}
              >
                🎰 SPIN
              </button>
            ) : (
              <button
                onClick={handleRespin}
                disabled={gameState.isSpinning || gameState.respinsLeft === 0}
                className={cn(
                  'px-12 py-6 rounded-lg font-bold text-2xl transition transform hover:scale-105 active:scale-95',
                  gameState.isSpinning || gameState.respinsLeft === 0
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-b from-cyan-300 to-cyan-500 text-black hover:shadow-lg'
                )}
              >
                🔄 RESPIN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-yellow-300 animate-bounce">
            <h2 className="text-4xl font-bold text-red-700 mb-4">🎉 CONGRATULATIONS! 🎉</h2>
            <p className="text-2xl font-bold text-black mb-6">
              You won <span className="text-red-600">{winAmount.toFixed(2)} SC</span>!
            </p>
            
            <div className="text-6xl mb-6 animate-pulse">🌶️ 🔥 🌶️</div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleClaimWin}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition transform hover:scale-105"
              >
                ✅ Claim & Continue
              </button>
              <button
                onClick={handleShareWin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <Share2 size={24} />
                🎯 Share your win!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-600 to-purple-800 p-8 rounded-2xl shadow-2xl max-w-2xl w-full text-white border-4 border-yellow-400 overflow-y-auto max-h-96">
            <h2 className="text-3xl font-bold mb-6 text-yellow-300">How to Play 🌶️</h2>
            
            <div className="space-y-4 text-lg">
              <div>
                <h3 className="font-bold text-yellow-300 mb-2">🎯 Objective</h3>
                <p>Match chili symbols to win! Land a Collect symbol (✨) with bonus symbols to unlock Hold & Win respins!</p>
              </div>

              <div>
                <h3 className="font-bold text-yellow-300 mb-2">💰 Symbols</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>🌶️ Chili - High paying symbol</li>
                  <li>🪙 Coin - Medium win</li>
                  <li>💰💵💸🏆 Bonus Symbols - Collect values</li>
                  <li>✨ Collect - Triggers Hold & Win</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-yellow-300 mb-2">🔄 Hold & Win Feature</h3>
                <p>When Collect lands, bonus symbols are locked. Spin up to 3 respins to collect more values. Maximum win is capped at 10 SC.</p>
              </div>

              <div>
                <h3 className="font-bold text-yellow-300 mb-2">⚠️ Rules</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Max bet: 5.00 SC</li>
                  <li>Max win per spin: 10 SC</li>
                  <li>All wins in SC (Sweep Coins)</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold w-full transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CoinKrazyChiliCoins;
