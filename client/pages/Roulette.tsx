import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Roulette = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(50);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

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

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const spin = async () => {
    if (!selectedNumber && !selectedColor) {
      toast.error('Please select a number or color to bet on');
      return;
    }

    if (betAmount <= 0 || betAmount > balance) {
      toast.error('Invalid bet amount');
      return;
    }

    setIsSpinning(true);

    // Simulate spin
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const spinResult = Math.floor(Math.random() * 37);
    setResult(spinResult);

    let won = false;
    let payout = 0;

    if (selectedNumber !== null && selectedNumber === spinResult) {
      won = true;
      payout = betAmount * 36;
    } else if (selectedColor) {
      const isRed = redNumbers.includes(spinResult);
      const isBlack = blackNumbers.includes(spinResult);

      if ((selectedColor === 'red' && isRed) || (selectedColor === 'black' && isBlack)) {
        won = true;
        payout = betAmount * 2;
      }
    }

    const newBalance = won ? balance - betAmount + payout : balance - betAmount;
    setBalance(newBalance);
    setWinAmount(won ? payout : 0);

    setHistory([
      {
        result: spinResult,
        bet: selectedNumber || selectedColor,
        amount: betAmount,
        won,
        payout
      },
      ...history
    ]);

    if (won) {
      toast.success(`You won ${payout} SC!`);
    } else {
      toast.error('Better luck next time!');
    }

    setIsSpinning(false);
  };

  const getNumberColor = (num: number) => {
    if (redNumbers.includes(num)) return 'bg-red-600';
    if (blackNumbers.includes(num)) return 'bg-black';
    return 'bg-green-600';
  };

  return (
    <div className="space-y-8 pb-20">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Game */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-4xl font-black text-white">ROULETTE</h1>

          {/* Roulette Wheel */}
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-full border-8 border-yellow-500 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center relative overflow-hidden">
                  {result !== null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl font-black text-white text-center">
                        {result}
                      </div>
                    </div>
                  )}
                  {result === null && (
                    <div className="text-4xl font-black text-slate-500">?</div>
                  )}
                </div>

                <p className="text-center text-slate-400 mt-4 font-semibold">
                  {result !== null
                    ? redNumbers.includes(result)
                      ? `${result} - RED`
                      : blackNumbers.includes(result)
                      ? `${result} - BLACK`
                      : `${result} - GREEN`
                    : 'Place your bets...'}
                </p>

                <Button
                  onClick={spin}
                  disabled={isSpinning}
                  className="mt-6 h-14 px-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-black text-lg"
                >
                  {isSpinning ? (
                    <>
                      <RotateCw className="w-5 h-5 mr-2 animate-spin" />
                      SPINNING...
                    </>
                  ) : (
                    'SPIN'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Betting Grid */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Select Number (0-36)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {[0, ...Array.from({ length: 36 }, (_, i) => i + 1)].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(selectedNumber === num ? null : num)}
                    disabled={isSpinning}
                    className={`p-2 rounded font-bold text-white transition-all ${
                      selectedNumber === num
                        ? 'ring-2 ring-yellow-500 scale-110'
                        : 'hover:ring-1 hover:ring-slate-500'
                    } ${getNumberColor(num)}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance */}
          <Card className="bg-gradient-to-br from-yellow-600 to-orange-600 border-none">
            <CardContent className="p-6 text-white">
              <p className="text-sm font-bold uppercase mb-2">Balance</p>
              <p className="text-4xl font-black">{balance.toLocaleString()} SC</p>
            </CardContent>
          </Card>

          {/* Betting */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Place Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Bet Amount
                </label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                  disabled={isSpinning}
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Quick Bets</p>
                <div className="grid grid-cols-2 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      variant="outline"
                      size="sm"
                      disabled={isSpinning}
                    >
                      {amount} SC
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setSelectedColor(selectedColor === 'red' ? null : 'red')}
                  disabled={isSpinning}
                  className={`bg-red-600 hover:bg-red-700 ${selectedColor === 'red' ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  RED
                </Button>
                <Button
                  onClick={() => setSelectedColor(selectedColor === 'black' ? null : 'black')}
                  disabled={isSpinning}
                  className={`bg-black hover:bg-slate-900 ${selectedColor === 'black' ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  BLACK
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Recent Spins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm">No spins yet</p>
              ) : (
                history.slice(0, 5).map((h, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm font-semibold ${
                      h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {h.result} - {h.won ? `Won ${h.payout} SC` : `Lost ${h.amount} SC`}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Roulette;
