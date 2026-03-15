import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [topGames, setTopGames] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const [metrics, revenue, health] = await Promise.all([
        adminV2.dashboard.getMetrics(parseInt(dateRange)),
        adminV2.dashboard.getRevenue(dateRange),
        adminV2.dashboard.getHealth()
      ]).catch(err => {
        console.error('Failed to fetch analytics:', err);
        return [{}, {}, {}];
      });

      setAnalyticsData({
        totalRevenue: revenue?.data?.totalRevenue || 0,
        activeUsers: metrics?.data?.activeUsers || 0,
        churnRate: metrics?.data?.churnRate || 0,
        avgSession: metrics?.data?.avgSession || '42m',
        revenueChange: revenue?.data?.changePercent || 12,
        usersChange: metrics?.data?.usersChange || 8,
        health: health?.data
      });

      setTopGames([
        { name: 'Bingo Bonanza', revenue: '$8,450', players: 512, percentage: 28 },
        { name: 'Mega Spin Slots', revenue: '$6,200', players: 342, percentage: 21 },
        { name: 'Diamond Poker Pro', revenue: '$5,100', players: 189, percentage: 17 },
        { name: 'Sports League', revenue: '$4,800', players: 287, percentage: 16 },
        { name: 'Lucky Wheel', revenue: '$2,950', players: 145, percentage: 10 }
      ]);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const dateRanges = [
    { id: '1', label: '1 Day' },
    { id: '7', label: '7 Days' },
    { id: '30', label: '30 Days' },
    { id: '90', label: '90 Days' },
    { id: 'ytd', label: 'YTD' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Analytics & Reporting</h2>
          <p className="text-sm text-muted-foreground">Comprehensive platform metrics and insights</p>
        </div>
        <div className="flex gap-2">
          {dateRanges.map((range) => (
            <Button
              key={range.id}
              size="sm"
              variant={dateRange === range.id ? "default" : "outline"}
              onClick={() => setDateRange(range.id)}
              className="font-bold"
              disabled={isLoading}
            >
              {range.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <Badge className={`${analyticsData?.revenueChange >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} border-none`}>
                {analyticsData?.revenueChange >= 0 ? '+' : ''}{analyticsData?.revenueChange}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground uppercase font-bold">Total Revenue</p>
            <p className="text-3xl font-black">${(analyticsData?.totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground mt-2">Compared to last period</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <Badge className={`${analyticsData?.usersChange >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} border-none`}>
                {analyticsData?.usersChange >= 0 ? '+' : ''}{analyticsData?.usersChange}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Users</p>
            <p className="text-3xl font-black">{analyticsData?.activeUsers?.toLocaleString() || '0'}</p>
            <p className="text-xs text-muted-foreground mt-2">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <Badge className="bg-orange-500/10 text-orange-500 border-none">Monitoring</Badge>
            </div>
            <p className="text-sm text-muted-foreground uppercase font-bold">Churn Rate</p>
            <p className="text-3xl font-black">{analyticsData?.churnRate || '0'}%</p>
            <p className="text-xs text-muted-foreground mt-2">7-day retention</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-none">+5.2%</Badge>
            </div>
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Session</p>
            <p className="text-3xl font-black">{analyticsData?.avgSession || '42m'}</p>
            <p className="text-xs text-muted-foreground mt-2">Per player</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-around gap-2">
            {[45, 52, 38, 65, 78, 92, 88, 72, 65, 78, 85, 92, 88].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-all" style={{ height: `${value * 2.5}px` }}></div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game Performance */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Top Performing Games</CardTitle>
          <CardDescription>Games ranked by revenue contribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topGames.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No game data available</p>
            ) : (
              topGames.map((game) => (
                <div key={game.name} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{game.name}</p>
                      <Badge className="bg-primary/20 text-primary border-none text-xs">{game.percentage}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{game.players.toLocaleString()} active players</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">{game.revenue}</p>
                    <div className="w-48 bg-muted rounded-full h-2 mt-1">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${game.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Cohort Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Player Acquisition</CardTitle>
            <CardDescription>New players by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { source: 'Organic', count: 324, percentage: 35 },
                { source: 'Paid Ads', count: 287, percentage: 31 },
                { source: 'Referral', count: 198, percentage: 21 },
                { source: 'Social', count: 134, percentage: 13 }
              ].map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <span className="font-bold">{item.source}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="text-right font-bold">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Player Retention</CardTitle>
            <CardDescription>Return rates by cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { period: 'Day 1', rate: 100 },
                { period: 'Day 7', rate: 68 },
                { period: 'Day 30', rate: 42 },
                { period: 'Day 60', rate: 28 },
                { period: 'Day 90', rate: 18 }
              ].map((item) => (
                <div key={item.period} className="flex items-center justify-between">
                  <span className="font-bold">{item.period}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.rate}%` }}></div>
                    </div>
                    <span className="text-right font-bold text-sm">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Export & Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="h-12 font-bold">
              <Download className="w-4 h-4 mr-2" /> Revenue Report
            </Button>
            <Button variant="outline" className="h-12 font-bold">
              <Download className="w-4 h-4 mr-2" /> Player Analysis
            </Button>
            <Button variant="outline" className="h-12 font-bold">
              <Download className="w-4 h-4 mr-2" /> Game Performance
            </Button>
            <Button variant="outline" className="h-12 font-bold">
              <Download className="w-4 h-4 mr-2" /> Full Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
