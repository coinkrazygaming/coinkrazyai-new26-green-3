import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useWallet } from '@/hooks/use-wallet';
import { Dice5, Trophy, AlertCircle, TrendingUp, History, Coins, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { SocialSharePopup } from '@/components/popups/SocialSharePopup';

const Dice = () => {
  const { wallet, currency, refreshWallet } = useWallet();
  const [betAmount, setBetAmount] = useState<number>(1.00);
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [winStatus, setWinStatus] = useState<'win' | 'loss' | null>(null);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [recentGames, setRecentGames] = useState<any[]>([]);

  // Calculate Win Chance and Multiplier
  const winChance = isRollUnder ? targetNumber : (100 - targetNumber);
  const multiplier = (99 / winChance).toFixed(2);
  const potentialWin = (betAmount * parseFloat(multiplier)).toFixed(2);

  const handleRoll = async () => {
    if (isRolling) return;
    
    const balance = currency === 'GC' ? wallet?.goldCoins : wallet?.sweepsCoins;
    if (!balance || betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setIsRolling(true);
      setWinStatus(null);
      
      // Simulate backend call or actually call an endpoint if we add one
      // For now, let's use the casino/play endpoint if possible, or simulate
      
      const response = await apiCall<any>('/casino/play', {
        method: 'POST',
        body: JSON.stringify({
          gameId: 'krazy-dice',
          betAmount: betAmount,
          currency: currency,
          gameData: {
            targetNumber,
            isRollUnder
          }
        })
      });

      if (response.success) {
        const result = response.result.roll; // Assuming backend returns the roll
        setLastResult(result);

        const isWin = isRollUnder ? (result < targetNumber) : (result > targetNumber);
        setWinStatus(isWin ? 'win' : 'loss');

        if (isWin) {
          toast.success(`You won ${response.result.payout} ${currency}!`);
          setLastWinAmount(response.result.payout);
          setShowWinPopup(true);
        } else {
          toast.error('Better luck next time!');
        }

        refreshWallet();
        fetchRecentGames();
      }
    } catch (error: any) {
      console.error('Roll failed:', error);
      toast.error(error.message || 'Failed to roll dice');
    } finally {
      setIsRolling(false);
    }
  };

  const fetchRecentGames = async () => {
    try {
      const response = await apiCall<any>('/casino/spins?gameId=krazy-dice');
      if (response && response.data) {
        // Handle both array and object formats for backward compatibility
        const games = Array.isArray(response.data) ? response.data : (response.data.spins || response.spins || []);
        setRecentGames(games.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch recent games:', error);
      // Don't show error to user, just silently fail for history
    }
  };

  useEffect(() => {
    fetchRecentGames();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tight uppercase flex items-center gap-3">
            <Dice5 className="w-10 h-10 text-primary animate-bounce" />
            Krazy Dice
          </h1>
          <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest mt-1">AI-Powered Provably Fair Dice</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 border-2 font-black italic uppercase">
            RTP: 99.0%
          </Badge>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-mono font-bold">
              {currency === 'GC' ? wallet?.goldCoins.toLocaleString() : wallet?.sweepsCoins.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Betting Controls */}
        <Card className="lg:col-span-1 border-4 border-slate-900 shadow-2xl">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle className="text-xl font-black italic uppercase">Wager Setup</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-500">Bet Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  className="h-14 text-xl font-black pl-10 bg-slate-50 border-2 focus:border-primary"
                  min={0.01}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                   <Coins className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 font-bold" onClick={() => setBetAmount(prev => prev / 2)}>1/2</Button>
                <Button variant="outline" size="sm" className="flex-1 font-bold" onClick={() => setBetAmount(prev => prev * 2)}>2x</Button>
                <Button variant="outline" size="sm" className="flex-1 font-bold" onClick={() => {
                   const balance = currency === 'GC' ? wallet?.goldCoins : wallet?.sweepsCoins;
                   if (balance) setBetAmount(balance);
                }}>MAX</Button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Win Chance</p>
                   <p className="text-2xl font-black italic">{winChance.toFixed(2)}%</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Multiplier</p>
                   <p className="text-2xl font-black italic text-primary">{multiplier}x</p>
                 </div>
               </div>
               
               <div className="bg-slate-900 rounded-2xl p-4 text-center">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Potential Payout</p>
                 <p className="text-3xl font-black italic text-yellow-400">{potentialWin} {currency}</p>
               </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-20 text-2xl font-black italic uppercase rounded-2xl shadow-xl shadow-primary/20 animate-pulse-slow"
              onClick={handleRoll}
              disabled={isRolling}
            >
              {isRolling ? <Loader2 className="w-8 h-8 animate-spin" /> : 'ROLL DICE'}
            </Button>
          </CardContent>
        </Card>

        {/* Game Area */}
        <Card className="lg:col-span-2 border-4 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-primary" />
           
           <CardContent className="p-8 md:p-16 space-y-12">
             {/* Result Display */}
             <div className="flex justify-center">
               <div className={cn(
                 "w-48 h-48 md:w-64 md:h-64 rounded-[2.5rem] border-8 flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative group",
                 winStatus === 'win' ? "bg-green-500/10 border-green-500 text-green-500 scale-110" : 
                 winStatus === 'loss' ? "bg-red-500/10 border-red-500 text-red-500" :
                 "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-300"
               )}>
                 {isRolling ? (
                   <div className="text-6xl md:text-8xl font-black animate-bounce italic">??</div>
                 ) : lastResult !== null ? (
                   <>
                     <div className="text-8xl md:text-9xl font-black italic tracking-tighter">{lastResult.toFixed(2)}</div>
                     <div className="text-xs md:text-sm font-black uppercase tracking-widest mt-2">{winStatus === 'win' ? 'JACKPOT WIN!' : 'TRY AGAIN'}</div>
                   </>
                 ) : (
                   <Dice5 className="w-24 h-24 md:w-32 md:h-32 opacity-20" />
                 )}
                 
                 {/* Decorative Corner Icons */}
                 <div className="absolute top-4 left-4 opacity-30"><Trophy className="w-6 h-6" /></div>
                 <div className="absolute bottom-4 right-4 opacity-30"><Sparkles className="w-6 h-6" /></div>
               </div>
             </div>

             {/* Slider Controls */}
             <div className="space-y-8">
               <div className="flex items-center gap-4">
                 <Button 
                   variant={isRollUnder ? 'default' : 'outline'}
                   className="flex-1 h-14 font-black italic uppercase rounded-xl border-2"
                   onClick={() => setIsRollUnder(true)}
                 >
                   ROLL UNDER
                 </Button>
                 <Button 
                   variant={!isRollUnder ? 'default' : 'outline'}
                   className="flex-1 h-14 font-black italic uppercase rounded-xl border-2"
                   onClick={() => setIsRollUnder(false)}
                 >
                   ROLL OVER
                 </Button>
               </div>

               <div className="relative pt-10 pb-4">
                 {/* Markers */}
                 <div className="absolute top-0 inset-x-0 flex justify-between px-1">
                   {[0, 25, 50, 75, 100].map(m => (
                     <div key={m} className="flex flex-col items-center">
                       <div className="w-1 h-2 bg-slate-300 rounded-full" />
                       <span className="text-[10px] font-black text-slate-400 mt-1 italic">{m}</span>
                     </div>
                   ))}
                 </div>
                 
                 {/* Visual Track Overlay */}
                 <div className="absolute inset-x-0 h-4 top-10 pointer-events-none rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full absolute left-0 transition-all duration-300",
                        isRollUnder ? "bg-green-500/30" : "bg-red-500/30"
                      )} 
                      style={{ width: `${targetNumber}%` }} 
                    />
                    <div 
                      className={cn(
                        "h-full absolute right-0 transition-all duration-300",
                        !isRollUnder ? "bg-green-500/30" : "bg-red-500/30"
                      )} 
                      style={{ width: `${100 - targetNumber}%` }} 
                    />
                 </div>

                 <Slider
                   value={[targetNumber]}
                   onValueChange={(val) => setTargetNumber(val[0])}
                   max={98}
                   min={2}
                   step={1}
                   className="relative z-10"
                 />
                 
                 <div className="flex justify-center mt-6">
                    <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xl font-black italic shadow-xl">
                      {targetNumber}
                    </div>
                 </div>
               </div>
             </div>
           </CardContent>
        </Card>
      </div>

      <SocialSharePopup
        isOpen={showWinPopup}
        winAmount={lastWinAmount}
        gameName="Krazy Dice"
        onClose={() => setShowWinPopup(false)}
        onShare={async (platform, message) => {
          try {
            await apiCall('/social-sharing/share', {
              method: 'POST',
              body: JSON.stringify({
                platform,
                message,
                winAmount: lastWinAmount,
                gameName: 'Krazy Dice'
              })
            });
            toast.success('Share recorded!');
          } catch (error) {
            console.error('Failed to record share:', error);
          }
        }}
      />

      {/* Stats & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-slate-100">
           <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50">
             <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
               <History className="w-4 h-4" />
               Recent Activity
             </CardTitle>
             <TrendingUp className="w-4 h-4 text-primary" />
           </CardHeader>
           <CardContent className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-100/50 text-[10px] font-black uppercase text-slate-500 border-b">
                     <th className="p-3">Result</th>
                     <th className="p-3">Target</th>
                     <th className="p-3">Wager</th>
                     <th className="p-3">Payout</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {recentGames.length > 0 ? recentGames.map((game, i) => {
                     const resultData = typeof game.result_data === 'string' ? JSON.parse(game.result_data) : game.result_data || {};
                     return (
                       <tr key={i} className="hover:bg-slate-50 transition-colors">
                         <td className="p-3">
                           <span className={cn(
                             "font-mono font-black",
                             game.winnings > 0 ? "text-green-500" : "text-red-500"
                           )}>
                             {parseFloat(resultData.roll || 0).toFixed(2)}
                           </span>
                         </td>
                         <td className="p-3 text-xs font-bold text-slate-500">
                           {resultData.isRollUnder ? '<' : '>'} {resultData.targetNumber}
                         </td>
                         <td className="p-3 text-xs font-bold">
                           {game.bet_amount} {currency}
                         </td>
                         <td className="p-3 text-xs font-black text-primary">
                           {game.winnings > 0 ? `+${game.winnings}` : '-'}
                         </td>
                       </tr>
                     );
                   }) : (
                     <tr>
                       <td colSpan={4} className="p-8 text-center text-slate-400 font-bold italic">No recent games found</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </CardContent>
        </Card>

        <Card className="border-2 border-slate-100">
           <CardHeader className="border-b bg-slate-50">
             <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
               <AlertCircle className="w-4 h-4" />
               Game Rules & Fairness
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-4">
             <div className="space-y-2">
               <h4 className="font-black italic text-sm">PROVABLY FAIR</h4>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 Every roll is generated using a cryptographically secure random number generator. You can verify the fairness of any roll using our transparency tool in your profile.
               </p>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-500">House Edge</p>
                  <p className="text-lg font-black italic">1.0%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-500">Max Payout</p>
                  <p className="text-lg font-black italic text-primary">50.00 SC</p>
                </div>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase italic mt-4">
               * AI agents monitor game activity 24/7 to ensure platform integrity and fair play for all users.
             </p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dice;
