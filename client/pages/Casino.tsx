import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dice5, Zap, Gamepad2, Coins, Trophy, 
  Sparkles, Star, ChevronRight, Play 
} from 'lucide-react';
import { RecentWinners } from '@/components/RecentWinners';

const CASINO_CATEGORIES = [
  {
    title: 'Slots & Reels',
    desc: 'High-speed action with massive jackpots',
    icon: Zap,
    path: '/slots',
    color: 'from-blue-600 to-indigo-700',
    count: '250+ Games'
  },
  {
    title: 'Poker Tables',
    desc: 'Test your skill against the AI dealers',
    icon: Coins,
    path: '/poker',
    color: 'from-red-600 to-rose-700',
    count: '12 Rooms'
  },
  {
    title: 'Bingo Hall',
    desc: 'Social multiplayer bingo with big prizes',
    icon: Gamepad2,
    path: '/bingo',
    color: 'from-emerald-600 to-green-700',
    count: 'Live Now'
  },
  {
    title: 'Game Shows',
    desc: 'Interactive live-style entertainment',
    icon: Star,
    path: '/games/game-shows',
    color: 'from-purple-600 to-fuchsia-700',
    count: 'Top Rated'
  },
  {
    title: 'Mini Games',
    desc: 'Instant win dice and plinko action',
    icon: Dice5,
    path: '/dice',
    color: 'from-orange-600 to-yellow-600',
    count: 'Provably Fair'
  }
];

const Casino = () => {
  return (
    <div className="space-y-12 pb-20">
      {/* Casino Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 md:p-12 border-b-4 border-primary/30 shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10 pointer-events-none" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
               <Badge className="bg-primary/20 text-primary border-none font-black italic uppercase tracking-widest px-4 py-1">The Grand Casino</Badge>
               <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                  ELITE <span className="text-primary">GAMING</span> ARENA
               </h1>
               <p className="text-slate-400 font-bold uppercase tracking-tight max-w-xl">
                  Explore our massive collection of premium games. From high-stakes slots to skill-based poker, the AI dealers are waiting.
               </p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-xs font-black uppercase text-slate-500 mb-1">Active Players</p>
                  <p className="text-3xl font-black italic">1,402</p>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center border-primary/30">
                  <p className="text-xs font-black uppercase text-primary mb-1">Current Jackpot</p>
                  <p className="text-3xl font-black italic text-primary">52,140 SC</p>
               </div>
            </div>
         </div>
      </section>

      {/* Categories Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {CASINO_CATEGORIES.map((cat) => (
           <Link key={cat.title} to={cat.path} className="group">
             <Card className="h-full border-2 border-border/50 bg-card hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-primary/10">
                <div className={`h-32 bg-gradient-to-br ${cat.color} flex items-center justify-center relative overflow-hidden`}>
                   <cat.icon className="w-16 h-16 text-white/20 absolute -right-4 -bottom-4 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                   <cat.icon className="w-12 h-12 text-white relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6 space-y-2">
                   <div className="flex items-center justify-between">
                      <h3 className="font-black italic uppercase text-lg">{cat.title}</h3>
                      <Badge variant="outline" className="text-[10px] font-black uppercase opacity-60">{cat.count}</Badge>
                   </div>
                   <p className="text-xs text-muted-foreground font-bold uppercase">{cat.desc}</p>
                   <div className="pt-4 flex items-center text-primary font-black italic text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                      Enter Lobby <ChevronRight className="w-4 h-4" />
                   </div>
                </CardContent>
             </Card>
           </Link>
         ))}
      </section>

      {/* Recent Activity */}
      <RecentWinners />

      {/* Featured Slots Promotion */}
      <section className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-4 border-blue-500/20 rounded-[3rem] p-12 relative overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
         <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
               <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5">
                  <Star className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-black uppercase tracking-widest text-[10px]">Staff Pick</span>
               </div>
               <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                  KRAZY FRUITS <br />
                  <span className="text-blue-500 text-6xl md:text-8xl">ULTRA</span>
               </h2>
               <p className="text-slate-300 font-bold text-lg max-w-xl">
                  The latest AI-optimized slot experience. Features a massive 50,000x max win and custom bonus rounds designed by SlotsAI.
               </p>
               <Button size="lg" className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl italic rounded-2xl shadow-xl shadow-blue-500/20" asChild>
                  <Link to="/slots">PLAY NOW <Play className="w-5 h-5 ml-2 fill-current" /></Link>
               </Button>
            </div>
            <div className="w-full lg:w-96 aspect-square bg-slate-900 rounded-[2rem] border-4 border-white/5 flex items-center justify-center shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
               <Zap className="w-40 h-40 text-blue-500 animate-pulse" />
               <div className="absolute bottom-6 left-6 right-6 p-4 bg-slate-950/80 backdrop-blur rounded-xl border border-white/10">
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-black uppercase text-slate-500">Current RTP</p>
                     <p className="text-lg font-black italic text-green-500">98.2%</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Bottom Info Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="bg-card border-border p-8 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
               </div>
               <h3 className="text-2xl font-black italic uppercase">Provably Fair</h3>
            </div>
            <p className="text-muted-foreground font-bold leading-relaxed">
               All mini-games and slots use our proprietary AI-driven Provably Fair system. You can verify every single spin result through our cryptographic transparency portal.
            </p>
         </Card>
         <Card className="bg-card border-border p-8 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-500" />
               </div>
               <h3 className="text-2xl font-black italic uppercase">Daily Tournaments</h3>
            </div>
            <p className="text-muted-foreground font-bold leading-relaxed">
               Compete against other players in our daily slot and poker tournaments. Top 50 players on the leaderboard share a massive daily prize pool of up to 10,000 SC.
            </p>
         </Card>
      </section>
    </div>
  );
};

export default Casino;
