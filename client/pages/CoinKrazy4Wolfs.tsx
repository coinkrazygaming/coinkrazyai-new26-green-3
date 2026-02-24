'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { coinkrazyThunder } from '@/lib/api'; // Use Thunder API as base (same structure)
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { ChevronLeft, Volume2, VolumeX, Maximize2, Home, HelpCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Symbol types for 4 Wolfs
type SymbolType = 'wolf' | 'pack' | 'prey' | 'moon' | 'claw' | 'fang' | 'wild' | 'bonus' | 'scatter' | 'jackpot';

interface Reel {
  symbols: SymbolType[];
  position: number;
}

interface GameState {
  isSpinning: boolean;
  respinsLeft: number;
  lockedReels: Set<number>;
  lastWin: number | null;
  gameHistory: Array<{ bet: number; win: number; timestamp: Date }>;
}

const SYMBOL_PAYOUTS: Record<SymbolType, number[]> = {
  wolf: [0.5, 1, 2, 4, 8],
  pack: [0.8, 1.5, 3, 6, 12],
  prey: [1, 2, 4, 8, 15],
  moon: [1.5, 3, 6, 12, 20],
  claw: [0.2, 0.4, 0.8, 1.5, 3],
  fang: [0.3, 0.6, 1, 2, 4],
  wild: [0, 0, 0, 0, 0], // Wild substitutes
  bonus: [0.5, 1, 2, 4, 8], // Bonus symbols
  scatter: [1, 2, 4, 8, 10], // Scatter symbols
  jackpot: [2, 5, 10, 20, 50], // Jackpot symbols
};

const JACKPOT_MULTIPLIERS = {
  mini: 10,
  minor: 25,
  major: 100,
  grand: 1000,
};

const MAX_BET = 5;
const MAX_WIN = 10;
const BET_AMOUNTS = [0.1, 0.25, 0.5, 1, 2, 5];

const CoinKrazy4Wolfs = () => {
  const { wallet, refreshWallet } = useWallet();
  const { user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>({
    isSpinning: false,
    respinsLeft: 0,
    lockedReels: new Set(),
    lastWin: null,
    gameHistory: [],
  });

  const [currentBet, setCurrentBet] = useState(0.1);
  const [reels, setReels] = useState<SymbolType[][]>([
    ['wolf', 'pack', 'prey'],
    ['pack', 'prey', 'moon'],
    ['prey', 'moon', 'claw'],
    ['moon', 'claw', 'fang'],
    ['claw', 'fang', 'wild'],
  ]);

  const [showWinModal, setShowWinModal] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameContainer, setGameContainer] = useState<HTMLDivElement | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (err) {
      console.warn('AudioContext not available:', err);
    }
  }, []);

  const playSound = useCallback((frequency: number, duration: number) => {
    if (isMuted || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, [isMuted]);

  // Play wolf howl sound effect
  const playWolfHowl = useCallback(() => {
    playSound(150, 0.6);
    setTimeout(() => playSound(120, 0.4), 300);
  }, [playSound]);

  // Generate random symbols
  const generateReel = (excludeJackpot: boolean = false): SymbolType[] => {
    const symbols: SymbolType[] = ['wolf', 'pack', 'prey', 'moon', 'claw', 'fang', 'wild'];
    if (!excludeJackpot) {
      symbols.push('bonus', 'scatter');
    }
    
    return [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
  };

  // Calculate winnings from current reels
  const calculateWin = useCallback((): number => {
    let totalWin = 0;

    // Check for matching symbols on paylines (simplified 15-line system)
    for (let payline = 0; payline < 15; payline++) {
      const lineSymbols: SymbolType[] = [];
      
      // Get symbols for this payline
      for (let reel = 0; reel < 5; reel++) {
        const row = payline % 3;
        lineSymbols.push(reels[reel][row]);
      }

      // Check for matches
      let matchCount = 1;
      for (let i = 1; i < 5; i++) {
        const current = lineSymbols[i];
        const previous = lineSymbols[i - 1];
        
        if (current === previous || current === 'wild' || previous === 'wild') {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= 3) {
        const matchSymbol = lineSymbols[0] as SymbolType;
        const multiplier = Math.min(matchCount - 1, 4); // 3-5 matches
        totalWin += (SYMBOL_PAYOUTS[matchSymbol]?.[multiplier] || 0) * currentBet;
      }
    }

    // Apply max win cap
    return Math.min(totalWin, MAX_WIN);
  }, [reels, currentBet]);

  // Handle spin
  const handleSpin = useCallback(async () => {
    if (gameState.isSpinning) return;
    if (!wallet || !user || wallet.sc_balance < currentBet) {
      toast.error('Insufficient SC balance');
      return;
    }

    setGameState(prev => ({ ...prev, isSpinning: true }));

    try {
      // Play wolf howl sound
      playWolfHowl();

      // Call the backend spin API (using Thunder endpoint as placeholder)
      const response = await coinkrazyThunder.spin(currentBet, user.id);

      // Set the reels from the API response
      setReels(response.reels);

      // Simulate spinning animation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the win from the response
      const win = response.win || 0;
      setWinAmount(win);

      if (win > 0) {
        setShowWinModal(true);

        // Log to history
        setGameState(prev => ({
          ...prev,
          lastWin: win,
          gameHistory: [...prev.gameHistory, {
            bet: currentBet,
            win,
            timestamp: new Date(),
          }],
        }));
      }

      // Refresh wallet to show new balance
      await refreshWallet();

      setGameState(prev => ({ ...prev, isSpinning: false }));
    } catch (error) {
      console.error('Spin error:', error);
      toast.error('Failed to process spin');
      setGameState(prev => ({ ...prev, isSpinning: false }));
      // Refresh wallet in case balance changed
      await refreshWallet();
    }
  }, [gameState.isSpinning, wallet, user, currentBet, playWolfHowl, refreshWallet]);

  const handleShare = useCallback(() => {
    const text = `Just dominated the reels on CoinKrazy-4Wolfs for ${winAmount} SC! 🐺 Come hunt for wins at PlayCoinKrazy.com!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'CoinKrazy-4Wolfs Win',
        text: text,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(text);
      toast.success('Share message copied to clipboard');
    }
  }, [winAmount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-900 to-black relative overflow-hidden">
      {/* Forest background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-600 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-indigo-500">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-6 h-6 text-amber-400 cursor-pointer" onClick={() => window.history.back()} />
          <h1 className="text-2xl font-bold text-amber-400">🐺 CoinKrazy-4Wolfs 🐺</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600">
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          <button onClick={() => setShowHelpModal(true)} className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600">
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Game canvas */}
        <div className="mb-8 p-6 bg-gradient-to-b from-indigo-800 to-slate-900 rounded-2xl border-4 border-amber-400 shadow-2xl w-full max-w-2xl">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {reels.map((reel, reelIdx) => (
              <div key={reelIdx} className="aspect-square bg-gray-900 rounded-lg border-2 border-amber-400 flex items-center justify-center">
                <div className="text-center">
                  <div className={cn(
                    'text-4xl transition-all',
                    gameState.isSpinning ? 'animate-spin' : ''
                  )}>
                    {getSymbolEmoji(reel[0])}
                  </div>
                  <div className="text-xs text-amber-400 mt-2">{reel[0]}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Payline indicator */}
          <div className="text-center text-sm text-amber-400">
            15 Fixed Paylines | Max Win: {MAX_WIN} SC
          </div>
        </div>

        {/* Betting UI */}
        <div className="bg-gradient-to-b from-indigo-800 to-slate-900 rounded-2xl p-6 border-2 border-amber-400 w-full max-w-2xl">
          <div className="mb-6">
            <label className="block text-amber-400 font-bold mb-3">Bet Amount (SC)</label>
            <div className="grid grid-cols-3 gap-2">
              {BET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => setCurrentBet(amount)}
                  className={cn(
                    'py-2 px-3 rounded-lg font-bold transition-all',
                    currentBet === amount
                      ? 'bg-amber-400 text-black'
                      : 'bg-indigo-700 text-amber-400 hover:bg-indigo-600'
                  )}
                >
                  {amount.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 flex justify-between">
            <div>
              <p className="text-amber-400 text-sm">Balance</p>
              <p className="text-2xl font-bold text-white">{wallet?.sc_balance.toFixed(2) || '0.00'} SC</p>
            </div>
            <div>
              <p className="text-amber-400 text-sm">Current Bet</p>
              <p className="text-2xl font-bold text-white">{currentBet.toFixed(2)} SC</p>
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={gameState.isSpinning || !wallet || wallet.sc_balance < currentBet}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-bold text-lg transition-all',
              gameState.isSpinning || !wallet || wallet.sc_balance < currentBet
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:shadow-2xl hover:shadow-amber-400'
            )}
          >
            {gameState.isSpinning ? '🐺 HUNTING 🐺' : '🎰 SPIN NOW! 🎰'}
          </button>
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gradient-to-b from-amber-400 to-orange-400 rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-3xl font-bold text-black text-center mb-2">🎉 PACK WINS! 🎉</h2>
            <p className="text-center text-black text-lg mb-4">
              Your wolf pack just defeated the reels! Won <span className="font-bold text-4xl text-red-600">{winAmount} SC</span> on CoinKrazy-4Wolfs!
            </p>
            <p className="text-center text-gray-800 mb-6">Your winnings have been added to your wallet.</p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowWinModal(false)}
                className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-bold hover:bg-gray-800"
              >
                Claim & Continue
              </button>
              <button
                onClick={() => {
                  handleShare();
                  setShowWinModal(false);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gradient-to-b from-indigo-900 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-amber-400">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">How to Play</h2>
            <div className="text-white text-sm space-y-3">
              <p>🐺 <strong>Wolf Pack:</strong> Match wolf symbols across 15 fixed paylines</p>
              <p>🐾 <strong>Claw & Fang:</strong> Wild symbols that substitute for any icon</p>
              <p>🌙 <strong>Moon Bonus:</strong> Special moon symbols trigger bonus rounds</p>
              <p>👑 <strong>Jackpots:</strong> Mini, Minor, Major, and Grand jackpots available</p>
              <p>💫 <strong>Max Win:</strong> {MAX_WIN} SC per spin</p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-6 py-2 bg-amber-400 text-black rounded-lg font-bold hover:bg-amber-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get symbol emoji
function getSymbolEmoji(symbol: SymbolType): string {
  const emojis: Record<SymbolType, string> = {
    wolf: '🐺',
    pack: '🐺👥',
    prey: '🦌',
    moon: '🌙',
    claw: '🐾',
    fang: '⚔️',
    wild: '🃏',
    bonus: '💰',
    scatter: '✨',
    jackpot: '👑',
  };
  return emojis[symbol] || '?';
}

export default CoinKrazy4Wolfs;
