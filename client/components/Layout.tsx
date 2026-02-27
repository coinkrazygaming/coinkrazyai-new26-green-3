import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { AIChatWidget } from '@/components/AIChatWidget';
import { PageTransition } from '@/components/PageTransition';
import {
  Coins, User, Users, Home, Gamepad2, ShoppingCart,
  BarChart3, MessageSquare, Trophy, Award, Headphones,
  Settings, Zap, LogOut, Ticket, Dice5, Star,
  ShieldCheck, ChevronRight, Bell, CreditCard, LayoutDashboard, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChallengesPopup } from '@/components/popups/ChallengesPopup';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout, isAdmin, refreshProfile } = useAuth();
  const { wallet, currency, toggleCurrency, refreshWallet } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChallengesOpen, setIsChallengesOpen] = React.useState(false);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [aiEmployees, setAiEmployees] = React.useState<any[]>([]);

  // Calculate Level and Progress
  const totalWagered = Number(user?.total_wagered || 0);
  const level = Math.floor(Math.sqrt(totalWagered / 10)) + 1;
  const nextLevelWagered = Math.pow(level, 2) * 10;
  const currentLevelWagered = Math.pow(level - 1, 2) * 10;
  const levelProgress = totalWagered > 0 ? ((totalWagered - currentLevelWagered) / (nextLevelWagered - currentLevelWagered)) * 100 : 0;
  const progressText = `${Math.round(levelProgress)}% to Level ${level + 1}`;

  // Auto-open challenges popup on login
  React.useEffect(() => {
    if (isAuthenticated && !sessionStorage.getItem('challenges_shown')) {
      const timer = setTimeout(() => {
        setIsChallengesOpen(true);
        sessionStorage.setItem('challenges_shown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Fetch AI Status and Unread Messages
  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s

        const response = await fetch('/api/ai/status', {
          signal: controller.signal,
          credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Non-critical, don't throw
          return;
        }
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
          setAiEmployees(data.data);
        } else if (Array.isArray(data)) {
          setAiEmployees(data);
        }
      } catch (err: any) {
        // Silently fail - this is non-critical, don't log
      }
    };

    const fetchUnread = async () => {
      if (!isAuthenticated) return;
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setUnreadMessages(0);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s

        const response = await fetch('/api/messages/unread', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Non-critical, just reset to 0
          setUnreadMessages(0);
          return;
        }
        const data = await response.json();
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setUnreadMessages(data.length);
        } else if (data && typeof data === 'object' && 'count' in data) {
          setUnreadMessages(data.count);
        } else if (data && typeof data === 'object' && 'data' in data) {
          setUnreadMessages(Array.isArray(data.data) ? data.data.length : 0);
        } else {
          setUnreadMessages(0);
        }
      } catch (err: any) {
        // Silently fail - this is non-critical
        setUnreadMessages(0);
      }
    };

    // Initial fetch
    fetchStatus();
    if (isAuthenticated) fetchUnread();

    // Periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatus();
      if (isAuthenticated) fetchUnread();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const mainNav = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Games Lobby', path: '/games', icon: Gamepad2 },
    { label: 'Live Casino', path: '/casino', icon: Dice5 },
    { label: 'Sweepstakes', path: '/external-games', icon: Zap },
    { label: 'Social Store', path: '/store', icon: ShoppingCart },
  ];

  const gameCategories = [
    { label: 'Slots', path: '/slots', icon: Zap },
    { label: 'Poker', path: '/poker', icon: Coins },
    { label: 'Bingo', path: '/bingo', icon: Gamepad2 },
    { label: 'Dice', path: '/dice', icon: Dice5 },
    { label: 'Plinko', path: '/plinko', icon: Zap },
    { label: 'Scratchers', path: '/scratch-tickets', icon: Ticket },
    { label: 'Pull Tabs', path: '/pull-tabs', icon: Ticket },
  ];

  const socialNav = [
    { label: 'Leaderboard', path: '/leaderboards', icon: Trophy },
    { label: 'Achievements', path: '/achievements', icon: Award },
    { label: 'Community', path: '/community', icon: Users },
    { label: 'Referrals', path: '/referrals', icon: Users },
    { label: 'VIP Club', path: '/vip', icon: Star },
  ];

  const accountNav = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Wallet', path: '/wallet', icon: Coins },
    { label: 'Payment Methods', path: '/account', icon: CreditCard },
    { label: 'Settings', path: '/account', icon: Settings },
    { label: 'Support', path: '/support', icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-foreground font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020617]/60 transition-all duration-300">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 transition-all duration-300 hover:opacity-80 active:scale-95 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/80 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-primary/20 transition-all duration-300 group-hover:shadow-primary/40 group-hover:rotate-3">
              <span className="text-white font-black text-2xl italic tracking-tighter">CK</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter leading-none">
                <span className="text-white">COINKRAZY</span>
                <span className="text-primary">AI</span>
              </span>
              <span className="text-[10px] font-black text-primary/60 tracking-widest uppercase italic">Elite Social Gaming</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Balance Display (Dynamic) */}
                <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 pr-4 shadow-inner">
                  <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-white/5">
                    <button
                      onClick={() => currency !== 'GC' && toggleCurrency()}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-black transition-all duration-300",
                        currency === 'GC'
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20"
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      GC
                    </button>
                    <button
                      onClick={() => currency !== 'SC' && toggleCurrency()}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-black transition-all duration-300",
                        currency === 'SC'
                          ? "bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/20"
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      SC
                    </button>
                  </div>
                  <div className="ml-3 flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      {currency === 'GC' ? 'Gold Coins' : 'Sweeps Coins'}
                    </span>
                    <span className={cn(
                      "font-mono font-black text-lg tracking-tighter",
                      currency === 'GC' ? "text-yellow-500" : "text-primary"
                    )}>
                      {currency === 'GC'
                        ? Number(wallet?.goldCoins ?? 0).toLocaleString()
                        : Number(wallet?.sweepsCoins ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button asChild size="lg" className="hidden sm:flex gap-2 bg-primary hover:bg-primary/90 text-white font-black italic rounded-xl shadow-xl shadow-primary/20 px-8">
                    <Link to="/store">
                      <Coins className="w-5 h-5" />
                      STORE
                    </Link>
                  </Button>

                  {/* Quick Notifications/Messages */}
                  <div className="hidden md:flex gap-2">
                    <Button asChild variant="ghost" size="icon" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white relative">
                      <Link to="/support">
                        <Bell className="w-5 h-5" />
                        {unreadMessages > 0 && (
                          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black text-white">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white relative" onClick={() => navigate('/profile')}>
                      <MessageSquare className="w-5 h-5" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-slate-950">
                          {unreadMessages}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* User Dropdown / Profile */}
                <div className="flex items-center gap-3 border-l border-white/10 pl-6 ml-2">
                  <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-xl overflow-hidden relative">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0).toUpperCase()
                      )}
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-primary" />
                    </div>
                    <div className="hidden xl:flex flex-col items-start">
                      <span className="text-white font-black text-sm tracking-tight group-hover:text-primary transition-colors">{user?.username}</span>
                      <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase px-2 py-0">Platinum VIP</Badge>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                    onClick={logout}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" className="text-white font-bold px-6">
                  <Link to="/login">SIGN IN</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-white font-black px-8 rounded-xl shadow-xl shadow-primary/20">
                  <Link to="/register">JOIN NOW</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="fixed left-0 top-20 hidden h-[calc(100vh-5rem)] w-72 border-r border-white/5 md:block overflow-y-auto bg-[#020617] scrollbar-hide">
          <div className="flex flex-col gap-8 p-6">

            {/* Sidebar Profile Card */}
            {isAuthenticated && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full -mr-12 -mt-12" />

                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                       {user?.kyc_verified ? (
                         <ShieldCheck className="w-8 h-8 text-primary" />
                       ) : (
                         <AlertCircle className="w-8 h-8 text-yellow-500" />
                       )}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Player Status</span>
                       <span className="text-white font-black italic uppercase text-lg tracking-tighter">
                         {user?.kyc_verified ? 'Verified Elite' : 'Unverified'}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-slate-500">Level {level}</span>
                       <span className="text-[10px] font-black uppercase text-primary">{progressText}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                       <div
                         className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000"
                         style={{ width: `${levelProgress}%` }}
                       />
                    </div>
                 </div>

                 <Button asChild variant="ghost" className="w-full mt-4 h-10 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                    <Link to="/profile">View Achievements <ChevronRight className="w-3 h-3 ml-1" /></Link>
                 </Button>
              </div>
            )}

            {/* Admin Toggle */}
            {isAdmin && (
              <div className="space-y-2">
                <Button asChild className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black italic uppercase rounded-xl shadow-xl shadow-red-500/20">
                  <Link to="/admin">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    ADMIN PANEL
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-10 border-red-500/30 text-red-500 hover:bg-red-500/10 font-black italic uppercase rounded-xl">
                  <Link to="/admin/games">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    MANAGE GAMES
                  </Link>
                </Button>

                {/* CoinKrazy Games Management */}
                <div className="pt-2 mt-2 border-t border-red-500/20">
                  <p className="text-[9px] font-black uppercase text-red-500/60 tracking-widest mb-2 pl-2">CoinKrazy Games</p>
                  <div className="space-y-1">
                    <Link
                      to="/admin/games?search=CoinKrazy-CoinUp"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                      <Zap className="w-3 h-3" />
                      CoinUp
                    </Link>
                    <Link
                      to="/admin/games?search=CoinKrazy-Hot"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                      <Zap className="w-3 h-3" />
                      Hot
                    </Link>
                    <Link
                      to="/admin/games?search=CoinKrazy-Thunder"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                      <Zap className="w-3 h-3" />
                      Thunder
                    </Link>
                    <Link
                      to="/admin/games?search=CoinKrazy-4Wolfs"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                      <Zap className="w-3 h-3" />
                      4 Wolfs
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Groups */}
            <nav className="space-y-8 pb-10">
              {/* Main Menu */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 pl-3">Main Lobby</p>
                <div className="space-y-1">
                  {mainNav.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        location.pathname === item.path
                          ? "bg-primary text-white shadow-lg shadow-primary/20 font-black italic uppercase text-sm"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                        location.pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-primary"
                      )} />
                      <span className="text-sm font-bold tracking-tight">{item.label}</span>
                      {location.pathname === item.path && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Game Categories */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 pl-3">Arena Selection</p>
                <div className="grid grid-cols-1 gap-1">
                  {gameCategories.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        location.pathname === item.path
                          ? "bg-white/10 text-primary font-black italic uppercase text-sm border border-primary/20 shadow-inner"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-12",
                        location.pathname === item.path ? "text-primary" : "text-slate-500 group-hover:text-primary"
                      )} />
                      <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Social & Rewards */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 pl-3">Social & Rewards</p>
                <div className="space-y-1">
                  {socialNav.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        location.pathname === item.path
                          ? "bg-white/10 text-primary font-black italic uppercase text-sm border border-primary/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        location.pathname === item.path ? "text-primary" : "text-slate-500 group-hover:text-primary"
                      )} />
                      <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Management */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 pl-3">Account Control</p>
                <div className="space-y-1">
                  {accountNav.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        location.pathname === item.path
                          ? "bg-white/10 text-primary font-black italic uppercase text-sm border border-primary/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        location.pathname === item.path ? "text-primary" : "text-slate-500 group-hover:text-primary"
                      )} />
                      <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

                  {/* AI Status */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-6 pl-3">AI CORE STATUS</p>
                <div className="space-y-4 px-3">
                  {aiEmployees.length > 0 ? (
                    aiEmployees.map((ai) => (
                      <div key={ai.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                            ai.status === 'active' ? "bg-green-500 shadow-green-500/50" :
                            ai.status === 'maintenance' ? "bg-purple-500 shadow-purple-500/50" :
                            "bg-blue-500 shadow-blue-500/50"
                          )} />
                          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">{ai.name}</span>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black",
                          ai.status === 'active' ? "border-green-500/30 text-green-500" :
                          ai.status === 'maintenance' ? "border-purple-500/30 text-purple-500" :
                          "border-blue-500/30 text-blue-500"
                        )}>
                          {ai.status?.toUpperCase() || 'ONLINE'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">LuckyAI</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] border-green-500/30 text-green-500 font-black">ONLINE</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">SecurityAI</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-500 font-black">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">SlotsAI</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] border-purple-500/30 text-purple-500 font-black">TUNING</Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-72 min-h-screen">
          <div className="p-4 sm:p-6 md:p-10 pb-24 md:pb-12 max-w-[1600px] mx-auto">
            <PageTransition animation="fade-in-up">
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      <ChallengesPopup
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
      />

      <AIChatWidget />

      {/* Mobile Nav (Modernized) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-white/5 bg-[#020617]/95 backdrop-blur-xl md:hidden supports-[backdrop-filter]:bg-[#020617]/80 px-4">
        {[
          { icon: Home, label: 'Lobby', path: '/' },
          { icon: Gamepad2, label: 'Games', path: '/games' },
          { icon: ShoppingCart, label: 'Store', path: '/store', special: true },
          { icon: Trophy, label: 'Leaders', path: '/leaderboards' },
          { icon: User, label: 'Profile', path: '/profile' }
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-tighter transition-all duration-300",
              location.pathname === item.path
                ? "text-primary scale-110"
                : "text-slate-500 hover:text-white",
              item.special && "relative -top-6 w-16 h-16 bg-primary rounded-2xl shadow-2xl shadow-primary/40 text-white flex items-center justify-center border-4 border-[#020617]"
            )}
          >
            <item.icon className={cn(item.special ? "w-8 h-8" : "w-6 h-6")} />
            {!item.special && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};
