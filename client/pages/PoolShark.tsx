import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PoolGameEngine } from '@/components/pool-shark/PoolGameEngine';
import { toast } from 'sonner';

const PoolShark = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showGame, setShowGame] = useState(false);
  const [selectedWager, setSelectedWager] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const wagerOptions = [
    { amount: 50, label: '50 SC' },
    { amount: 100, label: '100 SC' },
    { amount: 250, label: '250 SC' },
    { amount: 500, label: '500 SC' },
  ];

  if (!showGame) {
    return (
      <div className="space-y-8 pb-20">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Link>
        </Button>

        {/* Game Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Game Info */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-blue-500 text-white mb-4">NOW LIVE</Badge>
              <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                POOL <br />
                <span className="text-blue-500">SHARK</span>
              </h1>
              <p className="text-xl text-slate-400 font-bold uppercase tracking-tight italic max-w-xl">
                The World's First AI-Driven Multiplayer Billiards Arena
              </p>
            </div>

            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">🎱 Break Shot</h4>
                    <p className="text-slate-400">Adjust angle and power, then click Break to start your turn.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">⚡ Strategy</h4>
                    <p className="text-slate-400">Pocket solid or stripe balls. Sink the 8-ball last to win!</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">💰 Winnings</h4>
                    <p className="text-slate-400">Win SC and climb the leaderboard. Play against AI or friends.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
                <CardContent className="p-4 space-y-2 text-sm">
                  <p className="font-bold text-blue-400">✨ Features</p>
                  <ul className="text-slate-300 space-y-1">
                    <li>• Realistic physics engine</li>
                    <li>• 1v1 Multiplayer & AI opponents</li>
                    <li>• Adjustable difficulty levels</li>
                    <li>• Tournament mode with rankings</li>
                    <li>• Daily challenges & special events</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Game Selection */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Select Your Wager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wagerOptions.map((option) => (
                  <button
                    key={option.amount}
                    onClick={() => {
                      setSelectedWager(option.amount);
                      setShowGame(true);
                      toast.success(`Wager set to ${option.label}`);
                    }}
                    className={`w-full p-4 rounded-lg border-2 font-bold text-lg italic transition-all ${
                      selectedWager === option.amount
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-slate-700 bg-slate-800 text-white hover:border-blue-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}

                <Button
                  onClick={() => {
                    if (!selectedWager) {
                      toast.error('Please select a wager amount');
                      return;
                    }
                    setShowGame(true);
                  }}
                  disabled={!selectedWager}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-lg italic rounded-lg"
                >
                  START PLAYING
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Game Modes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-blue-500">
                  <p className="font-bold text-blue-400">1v1 Quick Match</p>
                  <p className="text-xs text-slate-400 mt-1">Play against AI or another player</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-purple-500">
                  <p className="font-bold text-purple-400">Tournament Mode</p>
                  <p className="text-xs text-slate-400 mt-1">Compete for bigger prizes</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-green-500">
                  <p className="font-bold text-green-400">Practice Mode</p>
                  <p className="text-xs text-slate-400 mt-1">No wager, hone your skills</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setShowGame(false)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <Badge className="bg-green-500 text-white">Wager: {selectedWager} SC</Badge>
      </div>

      <div className="space-y-6">
        <h1 className="text-4xl font-black text-white">POOL SHARK</h1>
        <PoolGameEngine />
      </div>
    </div>
  );
};

export default PoolShark;
