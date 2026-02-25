import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecentWinners } from '@/components/RecentWinners';
import { Gamepad2, Coins, TrendingUp, Users, Zap, MessageSquare, Loader2, Sparkles, Trophy, Star, Gift, Crown, ArrowRight, Dice5, ShieldCheck, Cpu } from 'lucide-react';
import { games as gamesApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GameLauncher } from '@/components/casino/GameLauncher';
import { GamePlayerModal } from '@/components/slots/GamePlayerModal';
import { BrandedGameModal } from '@/components/casino/BrandedGameModal';

interface Game {
  id: number;
  name: string;
  provider: string;
  slug?: string;
  series?: string;
  type?: string;
  category?: string;
  rtp?: number;
  volatility?: string;
  image_url?: string;
  thumbnail?: string;
  embed_url?: string;
  launch_url?: string;
  enabled?: boolean;
  is_branded_popup?: boolean;
  branding_config?: any;
}

const Index = () => {
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isBrandedModalOpen, setIsBrandedModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [platformStats, setPlatformStats] = useState({
    activePlayers: '...',
    jackpotTotal: '...',
    gamesLive: '...',
    aiStatus: '...',
    totalPlayers: 0
  });

  // Fetch featured games and stats from backend
  useEffect(() => {
    fetchFeaturedGames();
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch('/api/platform/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setPlatformStats({
          activePlayers: result.data.activePlayers.toLocaleString(),
          jackpotTotal: `${(result.data.jackpotTotal || 0).toLocaleString()} SC`,
          gamesLive: (result.data.gamesLive || 0).toString(),
          aiStatus: result.data.aiStatus || 'Optimal',
          totalPlayers: result.data.totalPlayers || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    }
  };

  const fetchFeaturedGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await gamesApi.getGames();
      const allGames = Array.isArray(response) ? response : (response?.data || []);
      const enabledGames = allGames.filter((g: Game) => g.enabled !== false);

      let featured = [];

      // Priority 1: ALL CoinKrazy Studios Games (provider-based, fully automatic)
      const coinKrazyGames = enabledGames.filter((g: Game) => g.provider === 'CoinKrazy Studios');
      featured = featured.concat(coinKrazyGames);

      // Priority 2: Add remaining games up to 6 total to showcase more variety
      if (featured.length < 6) {
        const usedIds = new Set(featured.map(g => g.id));
        featured = featured.concat(
          enabledGames
            .filter((g: Game) => !usedIds.has(g.id))
            .slice(0, 6 - featured.length)
        );
      }

      setFeaturedGames(featured);
    } catch (error) {
      console.error('Failed to fetch featured games:', error);
      setFeaturedGames([]);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Prepare games data with additional properties
  const games = featuredGames.map((game) => ({
    ...game,
    icon: Gamepad2,
    players: Math.floor(Math.random() * 2000 + 500).toLocaleString(),
    badge: game.series || 'Featured',
    color: 'from-blue-600 to-blue-400',
    type: 'imported' as const,
  }));

  // Debug: Log featured games data
  console.log('[Index] Featured Games Loaded:', {
    count: games.length,
    games: games.map((g) => ({
      id: g.id,
      name: g.name,
      provider: g.provider,
    })),
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Mega Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 md:p-16 border-4 border-yellow-500/30 shadow-[0_0_80px_rgba(234,179,8,0.15)] group">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-blue-600/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-700" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5">
              <Sparkles className="w-4 h-4 text-yellow-500 animate-spin-slow" />
              <span className="text-yellow-500 font-black uppercase tracking-widest text-[10px]">The Future of Social Gaming</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white italic uppercase">
                PLAY KRAZY <br />
                <span className="bg-gradient-to-r from-yellow-400 via-white to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl">
                  WIN BIG
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 font-bold uppercase tracking-tight italic max-w-xl">
                Experience the world's most advanced AI-powered Social Casino!
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild className="h-16 px-10 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black text-xl italic border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all rounded-2xl shadow-xl shadow-orange-500/20">
                <Link to="/slots">PLAY NOW</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-16 px-10 bg-white/5 hover:bg-white/10 text-white border-2 border-white/10 font-black text-xl italic rounded-2xl transition-all">
                <Link to="/store">GET FREE SC</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 border-t border-white/5">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-yellow-500 flex items-center justify-center text-slate-950 font-black text-xs">
                  +{platformStats.totalPlayers > 1000 ? `${Math.floor(platformStats.totalPlayers / 1000)}k` : platformStats.totalPlayers}
                </div>
              </div>
              <div className="text-xs font-black uppercase text-slate-500 tracking-widest">
                Trusted by {platformStats.totalPlayers > 1000 ? `${(platformStats.totalPlayers / 1000).toFixed(1)}k+` : platformStats.totalPlayers} Players
              </div>
            </div>
          </div>

          {/* Krazy Kev Mascot */}
          <div className="relative w-full max-w-md aspect-square lg:max-w-lg">
            <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {/* This would be an image of Krazy Kev */}
              <div className="relative group/kev transform hover:scale-110 transition-transform duration-500">
                <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 group-hover/kev:opacity-40 transition-opacity" />
                <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border-[10px] border-yellow-200 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                   {/* Coin Details */}
                   <div className="absolute inset-4 border-4 border-yellow-400/50 rounded-full border-dashed animate-spin-slow" />
                   <span className="text-8xl md:text-9xl font-black text-yellow-100/30 drop-shadow-2xl italic select-none">CK</span>

                   {/* Sunglasses (CSS representation) */}
                   <div className="flex gap-2 mb-4 relative z-20">
                     <div className="w-12 h-8 md:w-16 md:h-10 bg-slate-950 rounded-full shadow-2xl transform -skew-x-12" />
                     <div className="w-12 h-8 md:w-16 md:h-10 bg-slate-950 rounded-full shadow-2xl transform -skew-x-12" />
                   </div>

                   {/* Mouth */}
                   <div className="w-12 h-4 md:w-16 md:h-6 bg-slate-950 rounded-b-full shadow-inner relative z-20" />
                </div>

                {/* Floating Rewards Around Mascot */}
                <div className="absolute -top-10 -right-10 bg-slate-900 border-2 border-yellow-500 p-3 rounded-2xl shadow-2xl animate-bounce">
                  <Coins className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="absolute bottom-0 -left-10 bg-slate-900 border-2 border-blue-500 p-3 rounded-2xl shadow-2xl animate-bounce delay-700">
                  <Star className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="absolute bottom-[-20px] bg-yellow-500 text-slate-950 font-black px-6 py-2 rounded-xl text-xl italic shadow-2xl transform rotate-3">
                MEET KRAZY KEV! 🕶️
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
          <div className="relative z-10 space-y-4">
            <Gift className="w-10 h-10 text-white/50" />
            <h3 className="text-2xl font-black italic uppercase leading-none">FREE DAILY <br /> SWEWPS COINS</h3>
            <p className="text-white/70 font-bold uppercase text-xs">Log in every 24 hours to claim your gift!</p>
            <Button size="sm" className="bg-white text-blue-700 font-black rounded-xl">CLAIM NOW</Button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Coins className="w-40 h-40" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
          <div className="relative z-10 space-y-4">
            <Crown className="w-10 h-10 text-white/50" />
            <h3 className="text-2xl font-black italic uppercase leading-none">VIP STATUS <br /> CHALLENGES</h3>
            <p className="text-white/70 font-bold uppercase text-xs">Complete challenges to level up your status!</p>
            <Button size="sm" className="bg-slate-950 text-yellow-500 font-black rounded-xl" asChild>
              <Link to="/vip">VIEW BENEFITS</Link>
            </Button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Trophy className="w-40 h-40" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
          <div className="relative z-10 space-y-4">
            <Zap className="w-10 h-10 text-white/50" />
            <h3 className="text-2xl font-black italic uppercase leading-none">REFER A <br /> FRIEND BONUS</h3>
            <p className="text-white/70 font-bold uppercase text-xs">Earn 5.00 SC for every friend who joins!</p>
            <Button size="sm" className="bg-white text-emerald-700 font-black rounded-xl" asChild>
              <Link to="/referrals">SHARE LINK</Link>
            </Button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Users className="w-40 h-40" />
          </div>
        </div>
      </section>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Players', value: platformStats.activePlayers, icon: Users },
          { label: 'Jackpot Total', value: platformStats.jackpotTotal, icon: Coins },
          { label: 'Games Live', value: platformStats.gamesLive, icon: Gamepad2 },
          { label: 'AI Status', value: platformStats.aiStatus, icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="p-2 bg-muted rounded-lg">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Winners Section */}
      <RecentWinners />

      {/* Games Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">FEATURED GAMES</h2>
          <Button variant="link" className="text-primary" asChild>
            <Link to="/slots">View All Games</Link>
          </Button>
        </div>
        {isLoadingGames ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading featured games...</p>
            </div>
          </div>
        ) : games.length > 0 ? (
          <GameLauncher>
            {(launchGame) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => {
                  const isAiGenerated = game.provider === 'CoinKrazy Studios';
                  return (
                  <Card
                    key={game.id}
                    className={cn(
                      "group overflow-hidden border-border/50 transition-all hover:shadow-[0_0_20px_rgba(57,255,20,0.1)]",
                      isAiGenerated ? "border-orange-500/50 hover:border-orange-500" : "hover:border-primary/50"
                    )}
                  >
                    <CardHeader className="p-0 relative">
                      {isAiGenerated && (
                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-3 h-3" />
                          AI Generated
                        </div>
                      )}
                      <div className={cn(
                        "h-40 flex items-center justify-center transition-transform group-hover:scale-105 duration-500 overflow-hidden",
                        isAiGenerated
                          ? "bg-gradient-to-br from-orange-600 to-red-500"
                          : "bg-gradient-to-br from-blue-600 to-blue-400"
                      )}>
                        <img
                          src={game.image_url || game.thumbnail}
                          alt={game.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%231e40af" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239CA3AF"%3EGame Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl font-bold line-clamp-1">{game.name}</CardTitle>
                        <Badge className={cn(
                          "border-none text-xs",
                          isAiGenerated
                            ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                            : "bg-primary/20 text-primary hover:bg-primary/20"
                        )}>
                          {isAiGenerated ? "AI Studio" : game.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-muted-foreground text-sm">{game.provider}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 flex justify-between items-center">
                      <div className="flex items-center text-xs text-muted-foreground font-medium">
                        <Users className="w-3 h-3 mr-1" />
                        {game.players} online
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          if (game.enabled === false) return;

                          if (game.is_branded_popup !== false && (game.embed_url || game.launch_url)) {
                            launchGame(game);
                          } else if (game.launch_url || game.embed_url) {
                            setSelectedGame(game);
                            setIsPlayerOpen(true);
                          } else {
                            toast.info('Game embed URL not available');
                          }
                        }}
                      >
                        PLAY
                      </Button>
                    </CardFooter>
                  </Card>
                );
                })}
              </div>
            )}
          </GameLauncher>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="text-5xl mb-4">🎰</div>
              <h3 className="text-lg font-semibold mb-2">Games Coming Soon</h3>
              <p className="text-muted-foreground mb-6">Games are being imported. Check back soon!</p>
              <Button onClick={fetchFeaturedGames} variant="outline">
                Refresh Games
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Game Player Modal */}
        {selectedGame && (
          <GamePlayerModal
            isOpen={isPlayerOpen}
            onClose={() => setIsPlayerOpen(false)}
            game={selectedGame}
          />
        )}
      </section>

      {/* New Sections: Mini Games & Coming Soon */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black italic uppercase tracking-tight">Mini Games</h2>
            <Button variant="outline" size="sm" className="font-black italic text-xs uppercase border-2">PLAY MINI</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/dice" className="block">
              <Card className="bg-slate-900 border-2 border-white/5 overflow-hidden group hover:border-yellow-500/30 transition-all">
                <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Dice5 className="w-12 h-12 text-white animate-bounce" />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-black italic uppercase text-sm">Krazy Dice</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Multiplayer Fun</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/plinko" className="block">
              <Card className="bg-slate-900 border-2 border-white/5 overflow-hidden group hover:border-yellow-500/30 transition-all">
                <div className="h-32 bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                  <Zap className="w-12 h-12 text-white animate-pulse" />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-black italic uppercase text-sm">Power Plinko</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Instant Drops</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-slate-400">Coming Soon</h2>
            <Badge className="bg-slate-800 text-slate-400 border-none font-black italic uppercase">WINTER 2025</Badge>
          </div>
          <Link to="/pool-shark" className="block">
            <Card className="bg-slate-950 border-4 border-dashed border-white/5 h-[230px] flex items-center justify-center relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
              <div className="relative z-10 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-white/10 shadow-2xl">
                  <Trophy className="w-10 h-10 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-300">POOL SHARK</h3>
                  <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mt-1">Multiplayer Billiards Arena</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Under Development</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* AI Employment Notice */}
      <section className="bg-slate-950 border-4 border-yellow-500/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-pulse">
            <Cpu className="w-16 h-16 md:w-24 md:h-24 text-slate-950" />
          </div>
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5">
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 font-black uppercase tracking-widest text-[10px]">AI-POWERED INTEGRITY</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                MEET THE <br />
                <span className="text-yellow-500">KRAZY AI TEAM</span>
              </h2>
              <p className="text-slate-400 font-bold text-lg max-w-2xl">
                CoinKrazy AI is the world's first platform managed entirely by specialized AI employees.
                From LuckyAI optimizing your odds to SecurityAI protecting your wallet, our team works 24/7.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {[
                { name: 'LuckyAI', role: 'Optimizer', color: 'bg-green-500' },
                { name: 'SecurityAI', role: 'Protector', color: 'bg-blue-500' },
                { name: 'SlotsAI', role: 'Dealer', color: 'bg-purple-500' },
                { name: 'SocialAI', role: 'Moderator', color: 'bg-orange-500' },
              ].map((ai) => (
                <div key={ai.name} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                   <div className={cn("w-2 h-2 rounded-full animate-pulse", ai.color)} />
                   <div className="text-left">
                     <p className="text-[10px] font-black uppercase text-slate-500 leading-none">{ai.role}</p>
                     <p className="text-xs font-black text-white">{ai.name}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
