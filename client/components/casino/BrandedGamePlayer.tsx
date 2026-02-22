import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { X, User, Coins, Loader2, AlertCircle, Maximize2, RefreshCw } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CoinAnimation } from '../CoinAnimation';

interface BrandedGamePlayerProps {
  game: any;
  onClose: () => void;
}

export const BrandedGamePlayer: React.FC<BrandedGamePlayerProps> = ({ game, onClose }) => {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(0.10);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [optimisticBalance, setOptimisticBalance] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const branding = typeof game.branding_config === 'string' 
    ? JSON.parse(game.branding_config) 
    : (game.branding_config || {});

  const primaryColor = branding.primaryColor || '#0f172a';
  const accentColor = branding.accentColor || '#3b82f6';
  const displayName = branding.displayName || game.name;

  useEffect(() => {
    // Listen for postMessage from game iframe
    const handleMessage = async (event: MessageEvent) => {
      // Security check: validate origin if possible, or check message structure
      // For this implementation, we assume trusted providers
      
      const { type, data } = event.data || {};
      
      if (type === 'SPIN_STARTED') {
        handleSpin();
      } else if (type === 'SPIN_RESULT') {
        handleSpinResult(data);
      } else if (type === 'REQUEST_BALANCE') {
        sendBalanceToIframe();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user?.sc_balance, betAmount]);

  useEffect(() => {
    if (!isLoading) {
      sendBalanceToIframe();
    }
  }, [user?.sc_balance]);

  const sendBalanceToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'BALANCE_UPDATE',
        data: {
          balance: user?.sc_balance || 0,
          currency: 'SC'
        }
      }, '*');
    }
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    
    const currentBalance = Number(user?.sc_balance || 0);
    if (currentBalance < betAmount) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);
    setOptimisticBalance(Math.max(0, currentBalance - betAmount));

    try {
      // Process spin on backend
      const response = await apiCall<any>('/casino/slots/spin', {
        method: 'POST',
        body: JSON.stringify({
          game_id: game.id || game.slug,
          bet_amount: betAmount
        })
      });

      if (response.success) {
        setOptimisticBalance(null);
        // Backend already deducted bet and recorded spin
        // WebSocket will update balance, but we can also trigger local refresh
        await refreshProfile();
        sendBalanceToIframe();
      } else {
        setOptimisticBalance(null);
      }
    } catch (err: any) {
      setOptimisticBalance(null);
      console.error('[BrandedPlayer] Spin failed:', err);
      toast.error(err.message || 'Spin failed');
    } finally {
      setIsSpinning(false);
    }
  };

  const handleSpinResult = async (data: any) => {
    let { winnings, outcome } = data;

    // Enforce 10 SC win cap (Defense in Depth)
    if (winnings > 10) {
      console.warn(`[BrandedPlayer] Winnings cap applied: ${winnings} -> 10`);
      winnings = 10;
    }

    if (winnings > 0) {
      setWinAmount(winnings);
      setShowWinAnimation(true);

      // Update balance on backend for winnings
      try {
        const response = await apiCall<any>('/casino/slots/spin', {
          method: 'POST',
          body: JSON.stringify({
            game_id: game.id || game.slug,
            bet_amount: 0, // No bet for winning result update
            winnings: winnings,
            outcome: outcome
          })
        });

        if (response.success) {
          await refreshProfile();
          sendBalanceToIframe();
        }
      } catch (err) {
        console.error('[BrandedPlayer] Failed to record winnings:', err);
      }
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    sendBalanceToIframe();
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load game content. Please try again.');
  };

  const currentScBalance = optimisticBalance !== null ? optimisticBalance : (user?.sc_balance || 0);

  // Build final embed URL with params
  const embedUrl = new URL(game.embed_url || '');
  embedUrl.searchParams.set('balance', String(currentScBalance));
  embedUrl.searchParams.set('sc_balance', String(currentScBalance));
  embedUrl.searchParams.set('username', user?.username || 'Player');
  embedUrl.searchParams.set('currency', 'SC');
  embedUrl.searchParams.set('branded', 'true');
  embedUrl.searchParams.set('bet', String(betAmount));

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden"
      style={{ 
        backgroundImage: branding.backgroundUrl ? `url(${branding.backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top Bar Branded */}
      <div 
        className="h-16 flex items-center justify-between px-4 lg:px-8 z-10 border-b border-white/10 backdrop-blur-md bg-black/40"
        style={{ borderBottomColor: `${accentColor}20` }}
      >
        <div className="flex items-center gap-4">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="text-xl font-black tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-white hidden sm:inline">COINKRAZY<span className="text-blue-500">AI</span></span>
            </div>
          )}
          <div className="h-6 w-[1px] bg-white/20 mx-2 hidden md:block"></div>
          <h2 className="text-white font-bold truncate max-w-[150px] lg:max-w-none">{displayName}</h2>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-200 hidden sm:inline">{user?.username}</span>
          </div>
          
          <div 
            className="flex items-center gap-2 bg-blue-600/20 px-4 py-1.5 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
          >
            <Coins className="w-4 h-4 text-blue-400" style={{ color: accentColor }} />
            <span className="text-sm font-black text-white">
              {Number(currentScBalance).toFixed(2)} <span className="text-[10px] opacity-70">SC</span>
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 transition-all border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-4 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
            />
            <p className="text-white font-bold tracking-widest animate-pulse">INITIALIZING GAME ENGINE...</p>
            <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
                className="h-full bg-blue-500"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center space-y-4 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-white">Playback Error</h3>
            <p className="text-gray-400">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Try Refreshing</Button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl.toString()}
            className="w-full h-full border-none shadow-2xl"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="autoplay; fullscreen; encrypted-media"
            sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin"
          />
        )}

        {/* Bet Selector Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-6 min-w-[320px] max-w-[90vw]">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-gray-400">
              <span>Bet Amount</span>
              <span className="text-white bg-blue-600 px-1.5 py-0.5 rounded" style={{ backgroundColor: accentColor }}>{betAmount.toFixed(2)} SC</span>
            </div>
            <input 
              type="range"
              min="0.01"
              max="5.00"
              step="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{ accentColor: accentColor }}
            />
            <div className="flex justify-between text-[10px] font-bold text-gray-500">
              <span>0.01</span>
              <span>1.00</span>
              <span>2.50</span>
              <span>5.00</span>
            </div>
          </div>
          
          <Button 
            className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all"
            style={{ backgroundColor: accentColor }}
            onClick={handleSpin}
            disabled={isSpinning || isLoading || (user?.sc_balance || 0) < betAmount}
          >
            {isSpinning ? <Loader2 className="w-6 h-6 animate-spin" /> : "SPIN"}
          </Button>
        </div>

        {/* Controls Overlay (Side) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          <button 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-xl"
            onClick={() => iframeRef.current?.requestFullscreen()}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-xl"
            onClick={() => {
              setIsLoading(true);
              if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
            }}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Win Celebration Overlay */}
      <AnimatePresence>
        {showWinAnimation && (
          <WinCelebration 
            amount={winAmount} 
            onClose={() => {
              setShowWinAnimation(false);
              setWinAmount(0);
            }} 
            accentColor={accentColor}
          />
        )}
      </AnimatePresence>
      
      {/* Coin/Confetti Animation Trigger */}
      <CoinAnimation trigger={showWinAnimation} />
    </div>
  );
};

interface WinCelebrationProps {
  amount: number;
  onClose: () => void;
  accentColor: string;
}

const WinCelebration: React.FC<WinCelebrationProps> = ({ amount, onClose, accentColor }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = amount;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayAmount(end);
        clearInterval(timer);
      } else {
        setDisplayAmount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [amount]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        className="bg-gray-900 border-2 border-yellow-500/50 rounded-[2.5rem] p-12 text-center max-w-lg w-full mx-4 shadow-[0_0_100px_rgba(234,179,8,0.3)]"
        style={{ borderColor: `${accentColor}80`, boxShadow: `0 0 100px ${accentColor}40` }}
      >
        <motion.div 
          animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="text-6xl mb-6"
        >
          🎉
        </motion.div>
        
        <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">BIG WIN!</h2>
        <p className="text-gray-400 font-bold mb-8">CONGRATULATIONS!</p>
        
        <div className="bg-black/40 rounded-3xl py-8 px-4 mb-8 border border-white/5 relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" style={{ color: accentColor }}>
            {displayAmount.toFixed(2)} <span className="text-2xl">SC</span>
          </div>
        </div>

        <Button 
          onClick={onClose}
          className="w-full h-16 text-xl font-black bg-yellow-500 hover:bg-yellow-600 text-black rounded-2xl shadow-xl transition-all active:scale-95"
          style={{ backgroundColor: accentColor, color: '#fff' }}
        >
          CONTINUE PLAYING
        </Button>
      </motion.div>
    </motion.div>
  );
};
