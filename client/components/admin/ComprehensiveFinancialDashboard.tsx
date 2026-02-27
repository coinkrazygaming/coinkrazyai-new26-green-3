import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { adminV2 } from '@/lib/api';

interface FinancialData {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netRevenue: number;
  revenueByGame: Array<{ name: string; value: number }>;
  revenueByPaymentMethod: Array<{ name: string; value: number }>;
  dailyRevenue: Array<{ date: string; revenue: number; deposits: number; withdrawals: number }>;
  topGames: Array<{ name: string; revenue: number; players: number; rtp: number }>;
  paymentMethods: Array<{ name: string; count: number; total: number; avgTransaction: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const ComprehensiveFinancialDashboard: React.FC = () => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadFinancialData();
  }, [timeRange]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      const [revenueRes, gameStatsRes] = await Promise.all([
        adminV2.getRevenueAnalytics(),
        adminV2.getDashboardStats(),
      ]);

      if (revenueRes.success && revenueRes.data) {
        setData(revenueRes.data);
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Failed to load financial data</p>
          <Button onClick={loadFinancialData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic uppercase">Financial Analytics</h2>
          <p className="text-muted-foreground mt-1">Revenue, deposits, withdrawals, and payouts</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range as any)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-green-600">${data.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Lifetime revenue</p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>+${data.monthlyRevenue.toFixed(2)} this month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposits vs Withdrawals */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-blue-600">${data.totalDeposits.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Player deposits</p>
              <p className="text-xs text-blue-600 font-bold">Avg per deposit: ${(data.totalDeposits / 100).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-orange-600">${data.totalWithdrawals.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Player withdrawals</p>
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <TrendingDown className="w-3 h-3" />
                <span>{((data.totalWithdrawals / data.totalDeposits) * 100).toFixed(1)}% of deposits</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Net Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="deposits" stroke="#3b82f6" name="Deposits" strokeWidth={2} />
                <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" name="Withdrawals" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
            <CardDescription>Distribution across payment channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenueByPaymentMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.revenueByPaymentMethod.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Game */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Game</CardTitle>
            <CardDescription>Top performing games</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByGame}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="value" fill="#8b5cf6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Transactions by payment channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.paymentMethods.map((method, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-bold">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${method.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Avg: ${method.avgTransaction.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Games */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Games</CardTitle>
          <CardDescription>Revenue, player count, and RTP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-bold">Game</th>
                  <th className="text-right p-2 font-bold">Revenue</th>
                  <th className="text-right p-2 font-bold">Players</th>
                  <th className="text-right p-2 font-bold">RTP</th>
                  <th className="text-right p-2 font-bold">%</th>
                </tr>
              </thead>
              <tbody>
                {data.topGames.map((game, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-bold">{game.name}</td>
                    <td className="p-2 text-right">${game.revenue.toFixed(2)}</td>
                    <td className="p-2 text-right">{game.players}</td>
                    <td className="p-2 text-right">{game.rtp.toFixed(1)}%</td>
                    <td className="p-2 text-right">
                      <Badge>{((game.revenue / data.totalRevenue) * 100).toFixed(1)}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="gap-2 h-12">
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button variant="outline" className="gap-2 h-12">
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" className="gap-2 h-12">
              <Download className="w-4 h-4" />
              JSON
            </Button>
            <Button variant="outline" className="gap-2 h-12">
              📊 Custom Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveFinancialDashboard;
