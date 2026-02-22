import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Coins, ChevronLeft, ChevronRight, PlayCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/lib/auth-context';
import { slots } from '@/lib/api';
import { WinPopup } from './WinPopup';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BrandedGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: {
    id: number;
    name: string;
    embed_url: string;
    provider?: string;
    branding_config?: any;
  };
}

export const BrandedGameModal: React.FC<BrandedGameModalProps> = ({ isOpen, onClose, game }) => {
  const { sweepsCoins, refreshWallet } = useWallet();
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState(0.20);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bet range and increments
  const MIN_BET = 0.01;
  const MAX_BET = 5.00;
  const BET_INCREMENT = 0.01;

  const adjustBet = (amount: number) => {
    setBetAmount(prev => {
      const next = Math.max(MIN_BET, Math.min(MAX_BET, prev + amount));
      return parseFloat(next.toFixed(2));
    });
  };

  const handleSpin = async () => {
    if (isSpinning || sweepsCoins < betAmount) {
      if (sweepsCoins < betAmount) toast.error("Insufficient balance");
      return;
    }

    setIsSpinning(true);
    try {
      // 1. Send spin request to backend (deducts bet)
      // For this integration, we simulate the spin result if it's an external provider, 
      // or we handle the deduction first.
      
      // Simulation: 30% chance to win something between 0.5x and 5x bet
      const isWin = Math.random() < 0.3;
      const simulatedWin = isWin ? parseFloat((betAmount * (0.5 + Math.random() * 4.5)).toFixed(2)) : 0;
      
      const response = await slots.spin(game.id, betAmount, simulatedWin, "[]");
      
      if (response.success) {
        // 2. Real-time balance is updated via socket, but we also refresh profile to be sure
        await refreshWallet();
        
        // 3. Update the in-game balance if the game supports it via postMessage
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'BALANCE_UPDATE',
            balance: response.balance.sc
          }, '*');
        }

        // 4. If win, show animation
        if (response.win > 0) {
          setWinAmount(response.win);
          setShowWinPopup(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process spin");
    } finally {
      setIsSpinning(false);
    }
  };

  // Iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPIN_START') {
        handleSpin();
      }
      if (event.data?.type === 'REQUEST_BALANCE') {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'BALANCE_UPDATE',
          balance: sweepsCoins
        }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sweepsCoins, betAmount, isSpinning]);

  if (!isOpen) return null;

  const branding = game.branding_config || {};

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-screen overflow-hidden select-none">
      {/* Branded Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-zinc-900 border-b border-zinc-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/images/logo.png" 
            alt="Site Logo" 
            className="h-8 w-auto"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
          <div className="h-6 w-[1px] bg-zinc-700 mx-1 hidden sm:block" />
          <span className="font-bold text-zinc-300 hidden sm:block truncate max-w-[150px]">
            {game.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 px-3 py-1 bg-black rounded-full border border-yellow-500/30">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-black text-white tabular-nums">
                {sweepsCoins.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-yellow-500">SC</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
              <User className="w-3 h-3 text-zinc-400" />
              <span className="text-[10px] font-medium text-zinc-300 truncate max-w-[100px]">
                {user?.username}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative flex-grow bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-4"
            >
              <Loader2 className="w-12 h-12 text-yellow-500" />
            </motion.div>
            <p className="text-zinc-400 font-medium animate-pulse">Launching {game.name}...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-30 p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Failed to load game</h3>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button onClick={onClose} variant="outline" className="border-zinc-700">Go Back</Button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={game.embed_url}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => setError("The game provider is currently unavailable.")}
          allow="autoplay; fullscreen; encrypted-media"
        />

        {/* Bet Selector Overlay (Site Branded) */}
        {!isLoading && !error && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Select Bet</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => adjustBet(-BET_INCREMENT)}
                    className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-grow bg-black rounded-lg py-1.5 px-3 border border-zinc-700 text-center min-w-[80px]">
                    <span className="text-lg font-black text-white tabular-nums">{betAmount.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-yellow-500 ml-1">SC</span>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => adjustBet(BET_INCREMENT)}
                    className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="shrink-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSpin}
                  disabled={isSpinning || sweepsCoins < betAmount}
                  className={cn(
                    "relative h-16 w-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.2)] group transition-all",
                    isSpinning ? "bg-zinc-700" : "bg-yellow-500 hover:bg-yellow-400"
                  )}
                >
                  {isSpinning ? (
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                  ) : (
                    <>
                      <PlayCircle className="w-10 h-10 text-black fill-black/10 group-hover:scale-110 transition-transform" />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black text-[9px] font-black px-1.5 rounded text-yellow-500 whitespace-nowrap">SPIN</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Win Popup Overlay */}
      <WinPopup 
        isOpen={showWinPopup} 
        onClose={() => setShowWinPopup(false)} 
        winAmount={winAmount} 
      />
    </div>
  );
};
