import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Users, Coins, Gamepad2, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { adminV2 } from '@/lib/api';

interface DashboardStats {
  totalPlayers: number;
  activeToday: number;
  newThisMonth: number;
  totalRevenue: number;
  revenueToday: number;
  averageSessionLength: number;
  retention7Day: number;
  retention30Day: number;
  totalGamesPlayed: number;
  gamesPlayedToday: number;
  averageRTP: number;
  systemHealth: string;
  uptime: number;
}

interface ChartData {
  date: string;
  players: number;
  revenue: number;
  spins: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const EnhancedAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, metricsRes] = await Promise.all([
        adminV2.getDashboardStats(),
        adminV2.getDailyMetrics(),
      ]);

      if (dashRes.success && dashRes.data) {
        setStats(dashRes.data);
      }

      if (metricsRes.success && metricsRes.data) {
        const chartData = metricsRes.data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          players: d.unique_players,
          revenue: d.total_revenue,
          spins: d.total_spins,
        }));
        setChartData(chartData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic uppercase">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">Real-time platform metrics and analytics</p>
        </div>
        <Button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* System Status */}
      <Card className={`border-2 ${stats.systemHealth === 'Optimal' ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase text-muted-foreground">System Status</p>
              <p className="text-3xl font-black">{stats.systemHealth}</p>
              <p className="text-sm text-muted-foreground">Uptime: {stats.uptime.toFixed(2)}%</p>
            </div>
            <div className="text-right">
              {stats.systemHealth === 'Optimal' ? (
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-yellow-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Players */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-blue-600">{stats.totalPlayers.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-xs">
                <Users className="w-3 h-3" />
                <span className="text-muted-foreground">{stats.activeToday} active today</span>
              </div>
              <p className="text-xs text-green-600 font-bold">+{stats.newThisMonth} this month</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-green-600">${stats.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-muted-foreground">${stats.revenueToday.toFixed(2)} today</span>
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
          </CardContent>
        </Card>

        {/* Games Played */}
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Games Played</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-purple-600">{stats.totalGamesPlayed.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-xs">
                <Gamepad2 className="w-3 h-3" />
                <span className="text-muted-foreground">{stats.gamesPlayedToday} today</span>
              </div>
              <p className="text-xs text-muted-foreground">Total spins/rounds</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Session Length */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Avg Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-orange-600">{stats.averageSessionLength.toFixed(0)}m</p>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                <span className="text-muted-foreground">Average length</span>
              </div>
              <p className="text-xs text-muted-foreground">Per player</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention & RTP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">7-Day Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-indigo-600">{stats.retention7Day.toFixed(1)}%</p>
              <div className="h-2 bg-indigo-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${stats.retention7Day}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Players returning after 7 days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">30-Day Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-cyan-600">{stats.retention30Day.toFixed(1)}%</p>
              <div className="h-2 bg-cyan-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600" style={{ width: `${stats.retention30Day}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Players returning after 30 days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">Avg RTP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-black text-rose-600">{stats.averageRTP.toFixed(1)}%</p>
              <div className="h-2 bg-rose-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600" style={{ width: `${Math.min(stats.averageRTP, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Return to player across all games</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players & Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Players & Revenue Trend</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="players" stroke="#3b82f6" name="Active Players" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Games Played Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Game Activity Trend</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spins" fill="#8b5cf6" name="Games Played" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="h-12">
              📊 View Reports
            </Button>
            <Button variant="outline" className="h-12">
              🎮 Manage Games
            </Button>
            <Button variant="outline" className="h-12">
              👥 View Players
            </Button>
            <Button variant="outline" className="h-12">
              💰 Financial
            </Button>
            <Button variant="outline" className="h-12">
              🔐 Security
            </Button>
            <Button variant="outline" className="h-12">
              ⚙️ Settings
            </Button>
            <Button variant="outline" className="h-12">
              🚨 Alerts
            </Button>
            <Button variant="outline" className="h-12">
              📈 Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAdminDashboard;
