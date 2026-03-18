import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { TicketDesignCard } from '@/components/pull-tabs/TicketDesignCard';
import { PullTabTicket } from '@/components/pull-tabs/PullTabTicket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptModal } from '@/components/ui/ReceiptModal';
import { useNavigate } from 'react-router-dom';

interface PullTabDesign {
  id: number;
  name: string;
  description?: string;
  cost_sc: number;
  tab_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url?: string;
  background_color: string;
  enabled: boolean;
}

interface PullTabTicketData {
  id: number;
  ticket_number: string;
  design_id: number;
  tabs: any[];
  status: 'active' | 'expired' | 'claimed';
  claim_status: 'unclaimed' | 'claimed';
  winning_tab_index: number | null;
  created_at: string;
}

interface PullTabTransaction {
  id: number;
  transaction_type: string;
  amount_sc: number;
  description: string;
  created_at: string;
  design_name?: string;
}

export default function PullTabs() {
  const { user, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [activeTab, setActiveTab] = useState('shop');
  const [designs, setDesigns] = useState<PullTabDesign[]>([]);
  const [myTickets, setMyTickets] = useState<PullTabTicketData[]>([]);
  const [transactions, setTransactions] = useState<PullTabTransaction[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [purchasingDesignId, setPurchasingDesignId] = useState<number | null>(null);

  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    title: string;
    description: string;
    amount: string;
    currency: 'GC' | 'SC';
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDesigns();
      loadMyTickets();
      loadTransactions();
    }
  }, [isAuthenticated]);

  const loadDesigns = async () => {
    try {
      setIsLoadingDesigns(true);
      const response = await apiCall<{ success: boolean; data?: any[] }>('/pull-tabs/designs');
      if (response.success) {
        setDesigns(response.data ?? []);
      } else {
        toast.error('Failed to load designs');
      }
    } catch (error) {
      console.error('Failed to load designs:', error);
      toast.error('Failed to load designs');
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  const loadMyTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const response = await apiCall<{ success: boolean; data?: any[] }>('/pull-tabs');
      if (response.success) {
        setMyTickets(response.data ?? []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const response = await apiCall<{ success: boolean; data?: any[] }>('/pull-tabs/history/transactions?limit=50');
      if (response.success) {
        setTransactions(response.data ?? []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handlePurchase = async (designId: number) => {
    if (!user) {
      toast.error('Please log in to purchase tickets');
      return;
    }

    try {
      setPurchasingDesignId(designId);
      const response = await apiCall<{ success: boolean; data?: any; error?: string }>('/pull-tabs/purchase', {
        method: 'POST',
        body: JSON.stringify({ designId }),
      });

      if (response.success) {
        // Show receipt
        const design = designs.find(d => d.id === designId);
        if (design) {
          setReceiptData({
            title: `Pull Tab: ${design.name}`,
            description: `Purchased instant reveal ticket`,
            amount: design.cost_sc.toString(),
            currency: 'SC'
          });
          setShowReceipt(true);
        }

        toast.success('Ticket purchased! Check your collection.');
        await loadMyTickets();
        await refreshProfile();
        // Switch to collection tab
        setActiveTab('collection');
      } else {
        toast.error(response.error || 'Failed to purchase ticket');
      }
    } catch (error: any) {
      console.error('Failed to purchase ticket:', error);
      toast.error(error.message || 'Failed to purchase ticket');
    } finally {
      setPurchasingDesignId(null);
    }
  };

  const insufficientBalance = (cost: number) => {
    const balance = wallet?.sweepsCoins || 0;
    return balance < cost;
  };

  const unclaimedWins = myTickets.filter(
    t => t.claim_status === 'unclaimed' && t.winning_tab_index !== null
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">CoinKrazy Pull Tab Lottery</h1>
            <p className="text-orange-100">
              Pull tabs, reveal instant prizes, and win Sweeps Coins!
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-100 mb-1">Your Balance</div>
            <div className="text-3xl font-bold">{wallet?.sweepsCoins || 0}</div>
            <div className="text-xs text-orange-100">SC</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {unclaimedWins > 0 && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-200">
                  You have {unclaimedWins} unclaimed winning ticket{unclaimedWins !== 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Click on your winning tickets to claim your prize.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setActiveTab('collection')}
              size="sm"
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              View Tickets
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="collection">
            My Collection {myTickets.length > 0 && <Badge className="ml-2">{myTickets.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Shop Tab */}
        <TabsContent value="shop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Pull Tab Designs</CardTitle>
              <CardDescription>
                Choose a ticket design and start pulling for instant prizes!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDesigns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : designs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tickets available at the moment
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {designs.map(design => (
                    <TicketDesignCard
                      key={design.id}
                      {...design}
                      onPurchase={handlePurchase}
                      isPurchasing={purchasingDesignId === design.id}
                      insufficientBalance={insufficientBalance(design.cost_sc)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collection Tab */}
        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>
                Your pull tab tickets. Click tabs to reveal prizes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : myTickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No tickets purchased yet</p>
                  <Button onClick={() => setActiveTab('shop')}>Shop Now</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myTickets.map(ticket => (
                    <PullTabTicket
                      key={ticket.id}
                      ticket={ticket}
                      onRefresh={loadMyTickets}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your pull tab purchases and wins
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadTransactions()}
                disabled={isLoadingTransactions}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()} at{' '}
                          {new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div
                        className={`font-bold text-sm ${
                          tx.transaction_type === 'claim'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.transaction_type === 'claim' ? '+' : '-'}
                        {tx.amount_sc} SC
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {receiptData && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          title={receiptData.title}
          description={receiptData.description}
          amount={receiptData.amount}
          currency={receiptData.currency}
        />
      )}
    </div>
  );
}
