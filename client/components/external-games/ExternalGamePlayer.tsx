import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BetSelector } from './BetSelector';
import { WinModal } from './WinModal';
import { apiCall } from '@/lib/api';

interface GameConfig {
  id: number;
  name: string;
  description: string;
  image_url: string;
  embed_url: string;
  launch_url?: string;
  is_sweepstake: boolean;
  max_win_amount: number;
  min_bet: number;
  max_bet: number;
  currency: string;
}

interface ExternalGamePlayerProps {
  gameId: number;
}

export const ExternalGamePlayer: React.FC<ExternalGamePlayerProps> = ({ gameId }) => {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastWin, setLastWin] = useState<{
    game_name: string;
    win_amount: number;
  } | null>(null);

  // Load game config on mount
  useEffect(() => {
    const loadGameConfig = async () => {
      try {
        setLoading(true);
        const response = await apiCall<any>(`/games/${gameId}/config`);
        if (response.data) {
          // Ensure numeric fields are properly converted
          setGameConfig({
            ...response.data,
            max_win_amount: Number(response.data.max_win_amount),
            min_bet: Number(response.data.min_bet),
            max_bet: Number(response.data.max_bet)
          });
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load game');
        toast.error('Failed to load game configuration');
      } finally {
        setLoading(false);
      }
    };

    loadGameConfig();
  }, [gameId]);

  const handleSpin = async (betAmount: number) => {
    if (!user) {
      toast.error('You must be logged in to play');
      return;
    }

    try {
      setIsSpinning(true);

      // Simulate win/loss (in production, this would come from game server)
      // For now, 40% chance to win with random amount
      const winChance = Math.random();
      let winAmount = 0;

      if (winChance > 0.6) {
        // 40% win rate
        winAmount = Math.random() * (gameConfig?.max_win_amount || 20);
        winAmount = Math.round(winAmount * 100) / 100; // Round to 2 decimals
        
        // Cap at max_win
        if (winAmount > (gameConfig?.max_win_amount || 20)) {
          winAmount = gameConfig?.max_win_amount || 20;
        }
      }

      // Process spin via API
      const response = await apiCall<any>('/games/spin', {
        method: 'POST',
        body: JSON.stringify({
          game_id: gameId,
          bet_amount: betAmount,
          win_amount: winAmount
        })
      });

      if (response.success) {
        const spinData = response.data;

        // Update wallet
        await refreshWallet();

        // Show result toast
        if (winAmount > 0) {
          toast.success(`You won ${winAmount.toFixed(2)} SC!`);
          setLastWin({
            game_name: spinData.game_name,
            win_amount: winAmount
          });
          setShowWinModal(true);
        } else {
          toast.info(`You lost ${betAmount.toFixed(2)} SC`);
        }

        console.log('[Game] Spin result:', spinData);
      } else {
        toast.error(response.error || 'Spin failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process spin');
      console.error('[Game] Spin error:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  const handleShareWin = async (platform: string) => {
    if (!user || !lastWin) return;

    try {
      // Record social share
      await apiCall<any>('/social/share', {
        method: 'POST',
        body: JSON.stringify({
          game_id: gameId,
          game_name: lastWin.game_name,
          win_amount: lastWin.win_amount,
          platform: platform
        })
      });
    } catch (err) {
      console.error('[Social] Share error:', err);
    }
  };

  const scBalance = wallet?.sweepsCoins || 0;
  const gcBalance = wallet?.goldCoins || 0;

  // Enhance embed URL with bet and wallet data if possible
  const enhancedEmbedUrl = React.useMemo(() => {
    const gameUrl = gameConfig?.launch_url || gameConfig?.embed_url;
    if (!gameUrl) return '';
    try {
      const url = new URL(gameUrl);
      // We don't have a local 'currentBet' state in this component yet,
      // but we can pass the min_bet or a default
      url.searchParams.set('balance', scBalance.toString());
      url.searchParams.set('sc_balance', scBalance.toString());
      url.searchParams.set('gc_balance', gcBalance.toString());
      url.searchParams.set('currency', 'SC');
      url.searchParams.set('username', user?.username || 'Guest');
      return url.toString();
    } catch (e) {
      const separator = gameUrl.includes('?') ? '&' : '?';
      return `${gameUrl}${separator}balance=${scBalance}&sc_balance=${scBalance}&gc_balance=${gcBalance}&currency=SC&username=${user?.username || 'Guest'}`;
    }
  }, [gameConfig?.launch_url, gameConfig?.embed_url, scBalance, gcBalance, user?.username]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || !gameConfig) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error || 'Game not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Header & Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">{gameConfig.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{gameConfig.description}</p>
        </div>
        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Your Balance</p>
            <p className="text-xl font-black text-cyan-400">{scBalance.toFixed(2)} SC</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Game View */}
        <div className="xl:col-span-3">
          <Card className="h-full bg-black border-slate-800 flex flex-col min-h-[600px] overflow-hidden shadow-2xl rounded-2xl relative">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-white/5">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Game Stream</span>
               </div>
               <div className="flex items-center gap-2">
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5"
                   onClick={() => setRefreshKey(prev => prev + 1)}
                 >
                   <Loader2 className={cn("w-4 h-4", isSpinning && "animate-spin")} />
                 </Button>
               </div>
            </div>
            <div className="flex-1 relative bg-[#020617]">
              {(gameConfig.launch_url || gameConfig.embed_url) ? (
                <iframe
                  key={refreshKey}
                  src={enhancedEmbedUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-read; clipboard-write; microphone; camera; midi; geolocation"
                  allowFullScreen
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-white">{gameConfig.name}</p>
                  <p className="text-sm text-slate-500">Iframe content not available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="xl:col-span-1 space-y-6">
          <BetSelector
            minBet={gameConfig.min_bet}
            maxBet={gameConfig.max_bet}
            currentBalance={scBalance}
            onBetSelect={handleSpin}
            isProcessing={isSpinning}
          />

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-slate-500">Max Win Potential</span>
                <span className="text-sm font-bold text-green-500">{Number(gameConfig.max_win_amount || 0).toFixed(2)} SC</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-slate-500">Currency</span>
                <span className="text-sm font-bold text-white">{gameConfig.currency}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-500">Type</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">SWEEPSTAKES</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWinModal}
        onClose={() => setShowWinModal(false)}
        gameName={gameConfig.name}
        winAmount={lastWin?.win_amount || 0}
        playerUsername={user?.username || ''}
        referralLink={`${window.location.origin}?ref=${user?.id}`}
        onShare={handleShareWin}
      />
    </div>
  );
};
