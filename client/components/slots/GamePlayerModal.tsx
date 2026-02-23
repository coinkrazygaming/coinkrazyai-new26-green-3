import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, RotateCw, Maximize2, Minimize2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BetSelector } from '@/components/external-games/BetSelector';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { apiCall } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SocialSharePopup } from '@/components/popups/SocialSharePopup';
import { motion, AnimatePresence } from 'framer-motion';

interface GamePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: {
    id: number;
    name: string;
    provider: string;
    embed_url?: string;
    launch_url?: string;
    image_url?: string;
    type?: string;
    branding_config?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      customTitle?: string;
      hideHeader?: boolean;
      hideFooter?: boolean;
    };
  };
}

interface GameConfig {
  min_bet: number;
  max_bet: number;
}

export const GamePlayerModal = ({ isOpen, onClose, game }: GamePlayerModalProps) => {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentBet, setCurrentBet] = useState(0.10);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    min_bet: 0.01,
    max_bet: 100
  });
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [optimisticBalance, setOptimisticBalance] = useState<number | null>(null);

  // Load game config on mount
  useEffect(() => {
    const gameUrl = game.launch_url || game.embed_url;
    if (isOpen && gameUrl) {
      const loadGameConfig = async () => {
        try {
          const response = await apiCall<any>(`/games/${game.id}/config`);
          if (response.data) {
            const config = {
              min_bet: response.data.min_bet || 0.01,
              max_bet: response.data.max_bet || 100
            };
            setGameConfig(config);
            setCurrentBet(config.min_bet);
          }
          setIsLoading(false);
          setHasError(false);
        } catch (error) {
          console.error('Failed to load game config:', error);
          setIsLoading(false);
          // Continue with defaults if config fails
        }
      };

      loadGameConfig();
    }
  }, [isOpen, game.id, game.embed_url]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    toast.error('Failed to load game. The provider may be unavailable.');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleFullscreen = async () => {
    const element = document.getElementById(`game-player-container-${game.id}`);
    if (element) {
      try {
        if (!document.fullscreenElement) {
          await element.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      } catch (error) {
        toast.error('Fullscreen not supported');
      }
    }
  };

  const handleBetChange = (amount: number) => {
    setCurrentBet(amount);
  };

  const handlePlaySpin = async () => {
    if (!user) {
      toast.error('You must be logged in to play');
      return;
    }

    try {
      setIsSpinning(true);

      // Optimistically deduct the bet for immediate site-wide feedback feel
      const currentSc = wallet?.sweepsCoins || 0;
      setOptimisticBalance(Math.max(0, currentSc - currentBet));

      // Process spin via API - win calculation is now server-side for security
      const response = await apiCall<any>('/games/spin', {
        method: 'POST',
        body: JSON.stringify({
          game_id: game.id,
          bet_amount: currentBet
        })
      });

      if (response.success && response.data) {
        const { win_amount } = response.data;
        setOptimisticBalance(null); // Clear optimistic once we get real result
        await refreshWallet();

        if (win_amount > 0) {
          toast.success(`🎉 You won ${win_amount.toFixed(2)} SC!`);
          setLastWinAmount(win_amount);
          setShowWinPopup(true);
        }
      } else {
        setOptimisticBalance(null);
        toast.error(response.error || 'Spin failed');
      }
    } catch (error: any) {
      setOptimisticBalance(null);
      toast.error(error.message || 'Failed to process spin');
      console.error('Spin error:', error);
    } finally {
      setIsSpinning(false);
    }
  };

  const scBalance = optimisticBalance !== null ? optimisticBalance : (wallet?.sweepsCoins || 0);
  const gcBalance = wallet?.goldCoins || 0;

  const branding = game.branding_config || {};
  const primaryColor = branding.primaryColor || '#0f172a';
  const accentColor = branding.primaryColor ? `${branding.primaryColor}88` : 'rgba(57,255,20,0.3)';

  // Enhance embed URL with bet and wallet data if possible
  const enhancedEmbedUrl = React.useMemo(() => {
    const gameUrl = game.launch_url || game.embed_url;
    if (!gameUrl) return '';
    try {
      const url = new URL(gameUrl);
      url.searchParams.set('bet', currentBet.toString());
      url.searchParams.set('balance', scBalance.toString());
      url.searchParams.set('sc_balance', scBalance.toString());
      url.searchParams.set('gc_balance', gcBalance.toString());
      url.searchParams.set('currency', 'SC');
      url.searchParams.set('username', user?.username || 'Guest');
      return url.toString();
    } catch (e) {
      // Fallback for relative or invalid URLs
      const separator = gameUrl.includes('?') ? '&' : '?';
      return `${gameUrl}${separator}bet=${currentBet}&balance=${scBalance}&sc_balance=${scBalance}&gc_balance=${gcBalance}&currency=SC&username=${user?.username || 'Guest'}`;
    }
  }, [game.launch_url, game.embed_url, currentBet, scBalance, gcBalance, user?.username]);

  if (!isOpen || !(game.launch_url || game.embed_url)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 bg-black border-slate-800 shadow-2xl">
        <DialogTitle className="sr-only">Playing {game.name}</DialogTitle>

        {/* Top Branding & Status Bar */}
        {!branding.hideHeader && (
          <div
            className="border-b border-slate-800 px-4 py-2 flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                ) : (
                  <span className="text-primary font-black text-xs italic">CK</span>
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">{branding.customTitle || game.name}</h2>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{game.provider}</p>
              </div>
            </div>

            {/* Real-time Wallet Display */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end border-r border-slate-800 pr-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Gold Coins</span>
                <span className="text-sm font-black text-yellow-500">{gcBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Sweeps Coins</span>
                <span className="text-sm font-black text-cyan-400">{scBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} SC</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Game Interface */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Win Animation Overlay */}
          <AnimatePresence>
            {showWinPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-gradient-to-b from-yellow-400 to-orange-600 p-8 rounded-3xl shadow-[0_0_100px_rgba(234,179,8,0.5)] border-4 border-white text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <Trophy className="w-20 h-20 text-white mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">BIG WIN!</h3>
                  <p className="text-6xl font-black text-white drop-shadow-lg">{lastWinAmount.toFixed(2)} SC</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar (Overlays on top of iframe when hovered or active) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full opacity-40 hover:opacity-100 transition-opacity duration-300">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={handleRefresh}>
              <RotateCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={handleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-red-500/50" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* The Game Iframe */}
          <div className="flex-1 bg-black relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#020617] z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-primary font-black italic">CK</span>
                    </div>
                  </div>
                  <p className="text-slate-400 font-bold text-sm animate-pulse tracking-widest uppercase">Initializing Stream...</p>
                </div>
              </div>
            )}

            <iframe
              key={`${refreshKey}-${enhancedEmbedUrl}`}
              id={`game-player-iframe-${game.id}`}
              src={enhancedEmbedUrl}
              title={game.name}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-read; clipboard-write; microphone; camera; midi; geolocation"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Integrated Betting Overlay at the bottom */}
          {!branding.hideFooter && (
            <div
              className="border-t border-slate-800 p-4"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Bet Controls */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Bet</span>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-1 rounded-lg">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white"
                        disabled={currentBet <= gameConfig.min_bet || isSpinning}
                        onClick={() => {
                          const decrement = currentBet <= 0.10 ? 0.01 : 0.10;
                          setCurrentBet(prev => Math.max(gameConfig.min_bet, Math.round((prev - decrement) * 100) / 100));
                        }}
                      >
                        -
                      </Button>
                      <span className="text-lg font-black text-white min-w-[80px] text-center">
                        {currentBet.toFixed(2)} <span className="text-[10px] text-primary">SC</span>
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white"
                        disabled={currentBet >= gameConfig.max_bet || isSpinning}
                        onClick={() => {
                          const increment = currentBet < 0.10 ? 0.01 : 0.10;
                          setCurrentBet(prev => Math.min(gameConfig.max_bet, Math.round((prev + increment) * 100) / 100));
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Quick Bets</span>
                    <div className="flex gap-1">
                      {[0.01, 0.10, 0.50, 1.00, 5.00].map(val => (
                        <Button
                          key={val}
                          size="sm"
                          variant={Math.abs(currentBet - val) < 0.001 ? "default" : "outline"}
                          className="h-8 text-[10px] px-2 border-slate-700"
                          onClick={() => setCurrentBet(val)}
                          disabled={isSpinning}
                        >
                          {val.toFixed(2)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spin / Play Button */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="hidden xl:flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Estimated RTP</span>
                    <span className="text-sm font-bold text-green-500">96.5%</span>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      className={cn(
                        "h-14 px-12 rounded-xl font-black text-xl tracking-tighter transition-all duration-300 shadow-lg shadow-primary/20",
                        isSpinning ? "bg-slate-700" : "bg-gradient-to-r from-primary to-green-500"
                      )}
                      onClick={handlePlaySpin}
                      disabled={isSpinning || scBalance < currentBet}
                    >
                      {isSpinning ? (
                        <RotateCw className="h-6 w-6 animate-spin" />
                      ) : (
                        "SPIN"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showWinPopup && (
          <SocialSharePopup
            isOpen={showWinPopup}
            winAmount={lastWinAmount}
            gameName={game.name}
            gameId={game.id}
            primaryColor={primaryColor}
            onClose={() => setShowWinPopup(false)}
            onShare={async (platform, message) => {
              try {
                await apiCall<any>('/social-sharing/share', {
                  method: 'POST',
                  body: JSON.stringify({
                    platform,
                    message,
                    winAmount: lastWinAmount,
                    gameId: game.id,
                    gameName: game.name
                  })
                });
                toast.success('Share recorded! Check your rewards soon.');
              } catch (error) {
                console.error('Failed to record share:', error);
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GamePlayerModal;
