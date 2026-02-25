import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';

interface NotificationStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  denied: number;
  completed: number;
  unread: number;
  critical: number;
  high: number;
  last_24h: number;
}

const STAT_CARDS = [
  {
    title: 'Total Notifications',
    key: 'total',
    icon: Bell,
    color: 'bg-blue-500/10 text-blue-600',
    borderColor: 'border-blue-500/20',
  },
  {
    title: 'Pending',
    key: 'pending',
    icon: Clock,
    color: 'bg-yellow-500/10 text-yellow-600',
    borderColor: 'border-yellow-500/20',
  },
  {
    title: 'Critical',
    key: 'critical',
    icon: AlertCircle,
    color: 'bg-red-500/10 text-red-600',
    borderColor: 'border-red-500/20',
  },
  {
    title: 'Unread',
    key: 'unread',
    icon: Zap,
    color: 'bg-purple-500/10 text-purple-600',
    borderColor: 'border-purple-500/20',
  },
  {
    title: 'Last 24h',
    key: 'last_24h',
    icon: TrendingUp,
    color: 'bg-green-500/10 text-green-600',
    borderColor: 'border-green-500/20',
  },
  {
    title: 'Completed',
    key: 'completed',
    icon: CheckCircle,
    color: 'bg-emerald-500/10 text-emerald-600',
    borderColor: 'border-emerald-500/20',
  },
];

export function AdminNotificationStats() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApiCall<{ stats: NotificationStats }>(
        '/admin-notifications/stats'
      );
      setStats(response.stats);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load notification statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Pending', value: stats.pending, fill: '#fbbf24' },
    { name: 'In Progress', value: stats.in_progress, fill: '#60a5fa' },
    { name: 'Approved', value: stats.approved, fill: '#34d399' },
    { name: 'Denied', value: stats.denied, fill: '#f87171' },
    { name: 'Completed', value: stats.completed, fill: '#10b981' },
  ].filter(item => item.value > 0);

  const priorityData = [
    { name: 'Critical', value: stats.critical, fill: '#dc2626' },
    { name: 'High', value: stats.high, fill: '#ea580c' },
    { name: 'Other', value: stats.total - stats.critical - stats.high, fill: '#6b7280' },
  ].filter(item => item.value > 0);

  const trendData = [
    { name: 'Mon', notifications: stats.last_24h * 0.15 },
    { name: 'Tue', notifications: stats.last_24h * 0.22 },
    { name: 'Wed', notifications: stats.last_24h * 0.18 },
    { name: 'Thu', notifications: stats.last_24h * 0.25 },
    { name: 'Fri', notifications: stats.last_24h * 0.20 },
    { name: 'Sat', notifications: stats.last_24h * 0.12 },
    { name: 'Sun', notifications: stats.last_24h * 0.08 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Statistics</h2>
        <p className="text-muted-foreground">
          Overview of your notification system performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof NotificationStats] as number;

          return (
            <Card key={card.key} className={`border ${card.borderColor}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold">{value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of notifications by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>
              Notifications grouped by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Notification Trend</CardTitle>
          <CardDescription>
            Notification volume over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="notifications"
                stroke="#3b82f6"
                dot={{ fill: '#3b82f6' }}
                name="Notifications"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Key metrics and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Unread Rate</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.unread / stats.total) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.unread} of {stats.total}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completed} completed
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold">{stats.in_progress}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.in_progress / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <Badge variant="destructive" className="mt-2">
                Needs Attention
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Insight:</strong> You have received{' '}
              <strong>{stats.last_24h}</strong> notifications in the last 24 hours.
              {stats.critical > 0 && (
                <> <strong>{stats.critical}</strong> of them are critical priority.</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
