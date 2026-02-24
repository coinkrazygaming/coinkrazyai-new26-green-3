'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { coinkrazyCoinUp } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { ChevronLeft, Settings, RotateCw, Volume2, VolumeX, Maximize2, Home, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import GameCanvas from '@/components/CoinKrazyCoinUp/GameCanvas';
import BettingUI from '@/components/CoinKrazyCoinUp/BettingUI';
import WinModal from '@/components/CoinKrazyCoinUp/WinModal';
import SettingsPanel from '@/components/CoinKrazyCoinUp/SettingsPanel';
import HowToPlayModal from '@/components/CoinKrazyCoinUp/HowToPlayModal';

interface GameState {
  isSpinning: boolean;
  lastWin: number | null;
  totalWins: number;
  gameHistory: Array<{ bet: number; win: number; timestamp: Date }>;
}

interface SymbolValue {
  id: string;
  value: number;
  symbol: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Define the symbol values for Coin UP: Lightning
const SYMBOL_VALUES: SymbolValue[] = [
  { id: 'coin-01', value: 0.1, symbol: '💰', rarity: 'common' },
  { id: 'coin-02', value: 0.2, symbol: '💰', rarity: 'common' },
  { id: 'coin-03', value: 0.5, symbol: '💰', rarity: 'common' },
  { id: 'coin-04', value: 1, symbol: '🪙', rarity: 'rare' },
  { id: 'coin-05', value: 2, symbol: '🪙', rarity: 'rare' },
  { id: 'coin-06', value: 5, symbol: '✨', rarity: 'epic' },
  { id: 'coin-07', value: 10, symbol: '⚡', rarity: 'epic' },
  { id: 'coin-08', value: 20, symbol: '⭐', rarity: 'legendary' },
  { id: 'coin-09', value: 50, symbol: '👑', rarity: 'legendary' },
  { id: 'coin-10', value: 100, symbol: '💎', rarity: 'legendary' },
];

const MULTIUP_SYMBOL = { id: 'multiup', value: 0, symbol: '×2', rarity: 'epic' as const };
const COINUP_SYMBOL = { id: 'coinup', value: 0, symbol: '🎁', rarity: 'legendary' as const };

// Hard caps
const MAX_BET_PER_SPIN = 5;
const MAX_WIN_PER_SPIN = 10;

const CoinKrazyCoinUp = () => {
  // Wallet integration
  const { wallet, refreshWallet } = useWallet();
  const { user } = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isSpinning: false,
    lastWin: null,
    totalWins: 0,
    gameHistory: [],
  });

  const [currentBet, setCurrentBet] = useState(0.1);
  const [reels, setReels] = useState<SymbolValue[][]>([
    [...Array(3)],
    [...Array(3)],
    [...Array(3)],
  ]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameContainer, setGameContainer] = useState<HTMLDivElement | null>(null);

  const gameCanvasRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (err) {
      console.warn('AudioContext not available:', err);
    }
  }, []);

  // Validate and normalize bet
  const handleBetChange = useCallback((newBet: number) => {
    const normalized = Math.min(Math.max(newBet, 0.1), MAX_BET_PER_SPIN);
    
    // Show toast if trying to exceed max bet
    if (newBet > MAX_BET_PER_SPIN) {
      toast.error('Maximum bet is 5 SC per spin', {
        description: 'Bet has been capped at 5 SC',
        duration: 2000,
      });
    }
    
    setCurrentBet(normalized);
  }, []);

  // Generate random reel symbols
  const generateReels = useCallback((): SymbolValue[][] => {
    const allSymbols = [...SYMBOL_VALUES, MULTIUP_SYMBOL, COINUP_SYMBOL];
    return [
      [allSymbols[Math.floor(Math.random() * allSymbols.length)], allSymbols[Math.floor(Math.random() * allSymbols.length)], allSymbols[Math.floor(Math.random() * allSymbols.length)]],
      [allSymbols[Math.floor(Math.random() * allSymbols.length)], allSymbols[Math.floor(Math.random() * allSymbols.length)], allSymbols[Math.floor(Math.random() * allSymbols.length)]],
      [allSymbols[Math.floor(Math.random() * allSymbols.length)], allSymbols[Math.floor(Math.random() * allSymbols.length)], allSymbols[Math.floor(Math.random() * allSymbols.length)]],
    ];
  }, []);

  // Calculate win based on middle row matching
  const calculateWin = useCallback((reelSet: SymbolValue[][]): number => {
    const middleRow = [reelSet[0][1], reelSet[1][1], reelSet[2][1]];
    
    // Check if all three symbols in middle row are the same
    if (
      middleRow[0].id === middleRow[1].id &&
      middleRow[1].id === middleRow[2].id
    ) {
      const symbol = middleRow[0];

      // Coin Up bonus trigger (3 matching coins in middle row)
      if (symbol.id.startsWith('coin-')) {
        // Coin Up bonus: 3 respins with potential multi-ups and extra wins
        const baseWin = symbol.value * 3; // Base triple match
        const bonusWin = calculateCoinUpBonus(symbol, currentBet);
        const totalWin = baseWin + bonusWin;
        
        // Apply hard cap
        return Math.min(totalWin, MAX_WIN_PER_SPIN);
      }

      // Multi-Up symbol (2x multiplier)
      if (symbol.id === 'multiup') {
        return 0; // Multi-up is a modifier, needs matching coins
      }

      // Coin-Up symbol (bonus trigger)
      if (symbol.id === 'coinup') {
        const bonusWin = calculateCoinUpBonus(SYMBOL_VALUES[5], currentBet); // Use 5 SC symbol as base
        return Math.min(bonusWin, MAX_WIN_PER_SPIN);
      }
    }

    // Check for diagonal wins
    const diagonal1 = [reelSet[0][0], reelSet[1][1], reelSet[2][2]];
    const diagonal2 = [reelSet[0][2], reelSet[1][1], reelSet[2][0]];

    if (
      diagonal1[0].id === diagonal1[1].id &&
      diagonal1[1].id === diagonal1[2].id &&
      diagonal1[0].id.startsWith('coin-')
    ) {
      const win = diagonal1[0].value * 1.5 * currentBet;
      return Math.min(win, MAX_WIN_PER_SPIN);
    }

    if (
      diagonal2[0].id === diagonal2[1].id &&
      diagonal2[1].id === diagonal2[2].id &&
      diagonal2[0].id.startsWith('coin-')
    ) {
      const win = diagonal2[0].value * 1.5 * currentBet;
      return Math.min(win, MAX_WIN_PER_SPIN);
    }

    return 0;
  }, [currentBet]);

  // Coin Up bonus round simulation
  const calculateCoinUpBonus = (symbol: SymbolValue, bet: number): number => {
    let bonus = 0;

    // Simulate 3 respins with coin collection
    for (let i = 0; i < 3; i++) {
      const randomCoin = SYMBOL_VALUES[Math.floor(Math.random() * SYMBOL_VALUES.length)];
      
      // Random chance of multi-up (2x modifier)
      if (Math.random() < 0.2) {
        bonus += randomCoin.value * 2;
      } else {
        bonus += randomCoin.value;
      }
    }

    return bonus;
  };

  // Play sound effect
  const playSound = useCallback((type: 'spin' | 'win' | 'tick') => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'spin':
        osc.frequency.value = 200;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'win':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'tick':
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
    }
  }, [isMuted]);

  // Handle spin
  const handleSpin = useCallback(async () => {
    if (gameState.isSpinning || wallet.sweepsCoins < currentBet) {
      toast.error('Insufficient SC balance or game is spinning');
      return;
    }

    // Check if bet exceeds max
    if (currentBet > MAX_BET_PER_SPIN) {
      toast.error('Bet exceeds maximum of 5 SC per spin');
      return;
    }

    try {
      // Deduct bet from wallet immediately
      setGameState(prev => ({ ...prev, isSpinning: true }));
      playSound('spin');

      // Call the backend spin endpoint
      const response = await coinkrazyCoinUp.spin(currentBet, user!.id);

      // Set the reels from the API response
      setReels(response.reels);

      // Simulate spin animation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the win from the response
      const winAmount = response.win || 0;

      // Log the transaction
      console.log(`[CoinKrazy-CoinUp] Spin: Bet=${currentBet} SC, Win=${winAmount} SC`);

      // Add to game history
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        gameHistory: [
          ...prev.gameHistory,
          { bet: currentBet, win: winAmount, timestamp: new Date() },
        ],
      }));

      if (winAmount > 0) {
        playSound('win');
        setWinAmount(winAmount);
        setShowWinModal(true);
        setGameState(prev => ({
          ...prev,
          lastWin: winAmount,
          totalWins: prev.totalWins + winAmount,
        }));
      }

      // Refresh wallet to show new balance
      await refreshWallet();
    } catch (error) {
      console.error('Spin error:', error);
      toast.error('Spin failed. Please try again.');
      setGameState(prev => ({ ...prev, isSpinning: false }));
      await refreshWallet();
    }
  }, [gameState.isSpinning, wallet.sweepsCoins, currentBet, generateReels, calculateWin, playSound, refreshWallet]);

  // Handle win claim
  const handleClaimWin = useCallback(async () => {
    try {
      toast.success(`Won ${winAmount} SC!`, {
        description: 'Your winnings have been credited to your wallet.',
      });

      setShowWinModal(false);
      setWinAmount(0);
    } catch (error) {
      console.error('Claim win error:', error);
      toast.error('Failed to claim win. Please try again.');
    }
  }, [winAmount]);

  // Handle share
  const handleShare = useCallback((platform: string) => {
    const cappedWin = Math.min(winAmount, MAX_WIN_PER_SPIN);
    const shareText = `Just hit a massive ${cappedWin} SC win on CoinKrazy-CoinUp! 🔥⚡ The lightning is striking on PlayCoinKrazy.com! Come chase your own wins! #CoinKrazy #CoinUp #BigWin`;

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`,
      instagram: `https://www.instagram.com/`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard!');
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }

    // After share, close modal
    setTimeout(() => {
      setShowWinModal(false);
      setWinAmount(0);
    }, 500);
  }, [winAmount]);

  // Toggle fullscreen
  const handleFullscreen = useCallback(async () => {
    if (gameContainer) {
      try {
        if (!isFullscreen) {
          if (gameContainer.requestFullscreen) {
            await gameContainer.requestFullscreen();
          } else if ((gameContainer as any).webkitRequestFullscreen) {
            await (gameContainer as any).webkitRequestFullscreen();
          } else if ((gameContainer as any).mozRequestFullScreen) {
            await (gameContainer as any).mozRequestFullScreen();
          } else if ((gameContainer as any).msRequestFullscreen) {
            await (gameContainer as any).msRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
        }
        setIsFullscreen(!isFullscreen);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    }
  }, [gameContainer, isFullscreen]);

  return (
    <div
      ref={setGameContainer}
      className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-black flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 bg-opacity-20 border-b border-cyan-500/30 px-4 py-4 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Back to Lobby"
          >
            <ChevronLeft className="w-6 h-6 text-cyan-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              CoinKrazy-CoinUp
            </h1>
            <p className="text-xs text-cyan-300">⚡ Lightning Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-cyan-300 font-semibold">SC Balance</div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {wallet.sweepsCoins.toFixed(2)} SC
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-cyan-400" />
              ) : (
                <Volume2 className="w-6 h-6 text-cyan-400" />
              )}
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-6 h-6 text-cyan-400" />
            </button>

            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="How to Play"
            >
              <HelpCircle className="w-6 h-6 text-cyan-400" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-6 h-6 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-auto">
        {/* Reels */}
        <div className="relative w-full max-w-2xl aspect-square bg-gradient-to-b from-purple-900/50 to-black/50 rounded-2xl border-4 border-cyan-500/50 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
          <GameCanvas
            ref={gameCanvasRef}
            reels={reels}
            isSpinning={gameState.isSpinning}
            onSpinComplete={() => {}}
          />

          {/* Win indicator */}
          {gameState.lastWin !== null && gameState.lastWin > 0 && !showWinModal && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg animate-pulse">
              Last Win: {gameState.lastWin} SC
            </div>
          )}
        </div>

        {/* Betting & Spin Controls */}
        <BettingUI
          currentBet={currentBet}
          onBetChange={handleBetChange}
          onSpin={handleSpin}
          isSpinning={gameState.isSpinning}
          maxBet={MAX_BET_PER_SPIN}
          balance={wallet.sweepsCoins}
        />

        {/* Game Stats */}
        <div className="w-full max-w-2xl grid grid-cols-3 gap-4 text-center">
          <div className="bg-gradient-to-br from-purple-500/30 to-black/30 border border-purple-500/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-purple-300">Total Spins</div>
            <div className="text-2xl font-bold text-purple-400">{gameState.gameHistory.length}</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/30 to-black/30 border border-cyan-500/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-cyan-300">Session Wins</div>
            <div className="text-2xl font-bold text-cyan-400">{gameState.totalWins.toFixed(2)} SC</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/30 to-black/30 border border-green-500/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-green-300">ROI</div>
            <div className="text-2xl font-bold text-green-400">
              {gameState.gameHistory.length > 0
                ? ((gameState.totalWins -
                    gameState.gameHistory.reduce((sum, g) => sum + g.bet, 0)) *
                    100).toFixed(0)
                : '0'}
              %
            </div>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWinModal}
        winAmount={Math.min(winAmount, MAX_WIN_PER_SPIN)}
        onClaim={handleClaimWin}
        onShare={handleShare}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isMuted={isMuted}
        onMuteChange={setIsMuted}
      />

      {/* How to Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
};

export default CoinKrazyCoinUp;
