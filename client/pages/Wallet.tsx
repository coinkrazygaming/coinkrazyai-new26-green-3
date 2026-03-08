import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { wallet, store } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, TrendingDown, Send, Download, Coins, Gift, CreditCard, Lock, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Transaction, StorePack } from '@shared/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Wallet = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<StorePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Payment method state
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'card', last4: '4242', brand: 'Visa', expiryDate: '12/25', isDefault: true },
    { id: 2, type: 'card', last4: '5555', brand: 'Mastercard', expiryDate: '08/24', isDefault: false },
  ]);
  
  // Withdrawal settings
  const [withdrawalSettings, setWithdrawalSettings] = useState({
    dailyLimit: 5000,
    monthlyLimit: 50000,
    minimumWithdrawal: 50,
    pendingWithdrawals: 1500,
    lastWithdrawal: '2024-01-15',
  });
  
  // Banking details
  const [bankingDetails, setBankingDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    accountType: 'checking',
    isVerified: false,
  });
  
  // Withdrawal form
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    method: 'bank',
  });
  
  const [showBankingForm, setShowBankingForm] = useState(false);
  const [isUpdatingBanking, setIsUpdatingBanking] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

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

  const handleAddPaymentMethod = () => {
    toast.info('Redirecting to secure payment portal...');
  };

  const handleDeletePaymentMethod = (id: number) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      setPaymentMethods(paymentMethods.filter(m => m.id !== id));
      toast.success('Payment method removed');
    }
  };

  const handleSetDefaultPaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id
    })));
    toast.success('Default payment method updated');
  };

  const handleSaveBankingDetails = async () => {
    if (!bankingDetails.accountNumber || !bankingDetails.routingNumber || !bankingDetails.bankName) {
      toast.error('Please fill in all banking details');
      return;
    }
    
    setIsUpdatingBanking(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBankingDetails(prev => ({ ...prev, isVerified: false }));
      setShowBankingForm(false);
      toast.success('Banking details saved. Verification pending.');
    } catch (err) {
      toast.error('Failed to save banking details');
    } finally {
      setIsUpdatingBanking(false);
    }
  };

  const handleWithdrawal = async () => {
    const amount = Number(withdrawalForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount < withdrawalSettings.minimumWithdrawal) {
      toast.error(`Minimum withdrawal is $${withdrawalSettings.minimumWithdrawal}`);
      return;
    }
    
    if (amount > withdrawalSettings.dailyLimit) {
      toast.error(`Daily limit is $${withdrawalSettings.dailyLimit}`);
      return;
    }

    if (amount > Number(user?.sc_balance ?? 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsProcessingWithdrawal(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Withdrawal of $${amount.toFixed(2)} initiated successfully`);
      setWithdrawalForm({ amount: '', method: 'bank' });
      setShowWithdrawalDialog(false);
    } catch (err) {
      toast.error('Failed to process withdrawal');
    } finally {
      setIsProcessingWithdrawal(false);
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Wallet & Payments</h1>
        <p className="text-muted-foreground">Manage your funds, payment methods, and withdrawal settings</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Sweeps Coins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
              ${Number(user?.sc_balance ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Redeemable Value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="banking">Bank Account</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex gap-4">
            <Button size="lg" asChild className="flex-1">
              <a href="/store">Buy Coins</a>
            </Button>
            <Button size="lg" variant="outline" className="flex-1" onClick={() => setShowWithdrawalDialog(true)}>
              <Send className="w-4 h-4 mr-2" />
              Withdraw Coins
            </Button>
          </div>

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
            </CardContent>
          </Card>

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
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your saved cards and payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <CreditCard className="w-6 h-6 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{method.brand} •••• {method.last4}</p>
                          <p className="text-sm text-muted-foreground">Expires {method.expiryDate}</p>
                        </div>
                        {method.isDefault && (
                          <Badge variant="default" className="ml-2">Default</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!method.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment methods saved</p>
                </div>
              )}
              
              <Button onClick={handleAddPaymentMethod} className="w-full">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Details Tab */}
        <TabsContent value="banking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Bank Account Details
              </CardTitle>
              <CardDescription>Add or update your bank account for withdrawals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bankingDetails.bankName && !showBankingForm ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Holder</p>
                      <p className="font-semibold">{bankingDetails.accountHolder}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-semibold">{bankingDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <p className="font-semibold capitalize">{bankingDetails.accountType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-semibold">•••• {bankingDetails.accountNumber.slice(-4)}</p>
                    </div>
                    {bankingDetails.isVerified ? (
                      <Badge className="bg-green-500">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending Verification</Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowBankingForm(true)}
                  >
                    Edit Bank Details
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Account Holder Name</Label>
                    <Input
                      id="accountHolder"
                      value={bankingDetails.accountHolder}
                      onChange={(e) => setBankingDetails({...bankingDetails, accountHolder: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={bankingDetails.bankName}
                      onChange={(e) => setBankingDetails({...bankingDetails, bankName: e.target.value})}
                      placeholder="Chase Bank"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <select 
                      id="accountType"
                      value={bankingDetails.accountType}
                      onChange={(e) => setBankingDetails({...bankingDetails, accountType: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={bankingDetails.routingNumber}
                      onChange={(e) => setBankingDetails({...bankingDetails, routingNumber: e.target.value})}
                      placeholder="0000000000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={bankingDetails.accountNumber}
                      onChange={(e) => setBankingDetails({...bankingDetails, accountNumber: e.target.value})}
                      placeholder="••••••••••••••••"
                      type="password"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowBankingForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSaveBankingDetails}
                      disabled={isUpdatingBanking}
                    >
                      {isUpdatingBanking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Details
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {bankingDetails.bankName && (
            <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  Security Notice
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-700">
                Your bank details are encrypted and stored securely. We never share your financial information with third parties.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Settings</CardTitle>
              <CardDescription>Configure your withdrawal limits and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Daily Withdrawal Limit</p>
                  <p className="text-2xl font-bold text-primary">${withdrawalSettings.dailyLimit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Withdrawal Limit</p>
                  <p className="text-2xl font-bold text-primary">${withdrawalSettings.monthlyLimit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Minimum Withdrawal</p>
                  <p className="text-2xl font-bold text-primary">${withdrawalSettings.minimumWithdrawal}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-orange-600">${withdrawalSettings.pendingWithdrawals.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Withdrawal limits are set to prevent fraud and ensure account security. To request higher limits, please contact our support team.
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Request Limit Increase
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Preferences</CardTitle>
              <CardDescription>Choose your preferred withdrawal method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <input type="radio" name="withdrawal" id="bank" defaultChecked className="w-4 h-4" />
                <label htmlFor="bank" className="flex-1 cursor-pointer">
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-sm text-muted-foreground">3-5 business days</p>
                </label>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <input type="radio" name="withdrawal" id="card" className="w-4 h-4" />
                <label htmlFor="card" className="flex-1 cursor-pointer">
                  <p className="font-semibold">Credit/Debit Card</p>
                  <p className="text-sm text-muted-foreground">1-2 business days</p>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Coins</DialogTitle>
            <DialogDescription>
              Convert your Sweeps Coins to cash and transfer to your bank account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
              <p className="text-blue-900 dark:text-blue-200">
                Available to withdraw: <span className="font-bold">${Number(user?.sc_balance ?? 0).toFixed(2)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                  className="pl-7"
                  min={withdrawalSettings.minimumWithdrawal}
                  max={Math.min(withdrawalSettings.dailyLimit, Number(user?.sc_balance ?? 0))}
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: ${withdrawalSettings.minimumWithdrawal} | Daily Limit: ${withdrawalSettings.dailyLimit}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Withdrawal Method</Label>
              <select 
                id="method"
                value={withdrawalForm.method}
                onChange={(e) => setWithdrawalForm({...withdrawalForm, method: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="bank">Bank Account</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawalDialog(false)}
              disabled={isProcessingWithdrawal}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleWithdrawal}
              disabled={isProcessingWithdrawal}
            >
              {isProcessingWithdrawal && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
