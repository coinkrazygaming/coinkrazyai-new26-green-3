import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { wallet, store } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Send, Download, Coins, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { Transaction, StorePack } from '@shared/api';

const Wallet = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<StorePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [txResponse, packResponse] = await Promise.all([
          wallet.getTransactions(),
          store.getPacks(),
        ]);
        setTransactions(txResponse.data || []);
        setPackages(packResponse.data || []);
      } catch (error: any) {
        console.error('Failed to fetch wallet data:', error);
        toast.error('Failed to load wallet data');
      } finally {
        setIsLoading(false);
        setPackagesLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Deposit':
      case 'Win':
      case 'Bonus':
      case 'slots_win':
      case 'poker_win':
      case 'bingo_win':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Withdrawal':
      case 'Loss':
      case 'slots_bet':
      case 'poker_buy_in':
      case 'bingo_ticket':
      case 'sports_bet':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'Transfer':
        return <Send className="w-4 h-4 text-blue-600" />;
      default:
        return <Coins className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'slots_bet':
        return '🎰 Slots Spin';
      case 'slots_win':
        return '🎰 Slots Win';
      case 'poker_buy_in':
        return '♠️ Poker Buy-In';
      case 'poker_win':
        return '♠️ Poker Win';
      case 'bingo_ticket':
        return '🎯 Bingo Ticket';
      case 'bingo_win':
        return '🎯 Bingo Win';
      case 'sports_bet':
        return '⚽ Sports Bet';
      case 'sports_win':
        return '⚽ Sports Win';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string, gcAmount?: number, scAmount?: number) => {
    const isDebit = (gcAmount && Number(gcAmount) < 0) || (scAmount && Number(scAmount) < 0) ||
                    ['Loss', 'Withdrawal', 'Purchase', 'slots_bet', 'poker_buy_in', 'bingo_ticket', 'sports_bet', 'parlay_bet', 'Scratch Ticket Purchase', 'Pull Tab Purchase'].includes(type);

    if (isDebit) return 'bg-red-500/10 text-red-700';
    return 'bg-green-500/10 text-green-700';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">Manage your coins and transaction history</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Balance */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Total Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
              {(Number(user?.gc_balance ?? 0) + Number(user?.sc_balance ?? 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">GC + SC Combined</p>
          </CardContent>
        </Card>

        {/* Gold Coins */}
        <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20">
          <CardHeader>
            <CardDescription>Gold Coins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-secondary">
              {Number(user?.gc_balance ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">For Fun Play</p>
          </CardContent>
        </Card>

        {/* Sweeps Coins */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Sweeps Coins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
              {Number(user?.sc_balance ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Redeemable Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button size="lg" asChild className="flex-1">
          <a href="/store">Buy Coins</a>
        </Button>
        <Button size="lg" variant="outline" className="flex-1">
          Withdraw
        </Button>
      </div>

      {/* Get Coins Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Get More Coins
          </CardTitle>
          <CardDescription>Available coin packages</CardDescription>
        </CardHeader>
        <CardContent>
          {packagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.slice(0, 6).map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    pkg.is_best_value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  {pkg.is_best_value && (
                    <Badge className="mb-2 bg-primary">Best Value</Badge>
                  )}
                  {pkg.is_popular && !pkg.is_best_value && (
                    <Badge className="mb-2 bg-blue-500">Popular</Badge>
                  )}
                  <h4 className="font-semibold text-lg mb-1">{pkg.title}</h4>
                  <p className="text-2xl font-black text-primary mb-3">
                    ${Number(pkg.price_usd).toFixed(2)}
                  </p>
                  <div className="space-y-2 mb-4 text-sm">
                    {pkg.gold_coins > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gold Coins:</span>
                        <span className="font-bold text-secondary">
                          {Number(pkg.gold_coins).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {pkg.sweeps_coins > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sweeps Coins:</span>
                        <span className="font-bold text-primary">
                          {Number(pkg.sweeps_coins).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {pkg.bonus_percentage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bonus:</span>
                        <span className="font-bold text-green-600">
                          +{pkg.bonus_percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                  <Button asChild className="w-full">
                    <a href="/store">Buy Now</a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No packages available</p>
              <Button asChild>
                <a href="/store">Go to Store</a>
              </Button>
            </div>
          )}
          {packages.length > 6 && (
            <div className="text-center mt-4">
              <Button asChild variant="outline">
                <a href="/store">View All Packages</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent wallet activity</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  {/* Icon and Description */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full ${getTransactionColor(tx.type, tx.gc_amount, tx.sc_amount)}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{getTransactionLabel(tx.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description || new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="text-right space-y-1">
                    <div className={`font-bold flex flex-col items-end ${
                      (tx.gc_amount && Number(tx.gc_amount) < 0) || (tx.sc_amount && Number(tx.sc_amount) < 0)
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      <div className="flex items-center gap-1">
                        <span>{Number(tx.gc_amount || 0) >= 0 ? '+' : ''}{Number(tx.gc_amount || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-black opacity-70">GC</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span>{Number(tx.sc_amount || 0) >= 0 ? '+' : ''}{Number(tx.sc_amount || 0).toFixed(2)}</span>
                        <span className="text-[10px] font-black opacity-70">SC</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex flex-col items-end opacity-60">
                      <span>Bal: {Number(tx.gc_balance_after ?? 0).toLocaleString()} GC</span>
                      <span>Bal: {Number(tx.sc_balance_after ?? 0).toFixed(2)} SC</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <Button asChild variant="outline" className="mt-4">
                <a href="/store">Buy Your First Coins</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">About Your Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Gold Coins (GC)</span> are used for fun play and cannot be redeemed for real money.
          </p>
          <p>
            <span className="font-semibold">Sweeps Coins (SC)</span> represent real value and can be withdrawn or redeemed.
          </p>
          <p>
            All transactions are processed securely and appear here immediately upon completion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;
