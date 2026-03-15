import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FraudAlert {
  id: number;
  type: string;
  risk: 'high' | 'medium' | 'low';
  player: string;
  reason: string;
  status: string;
}

export const FraudDetection = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.fraud.listFlags();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setAlerts(data);
    } catch (error: any) {
      console.error('Failed to fetch fraud alerts:', error);
      toast.error('Failed to load fraud alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      setIsRefreshing(true);
      await adminV2.fraud.resolveFlag(alertId, 'resolved');
      toast.success('Fraud alert resolved');
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve alert');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const highRiskCount = alerts.filter(a => a.risk === 'high').length;
  const lowRiskCount = alerts.filter(a => a.risk === 'low').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Alerts</p>
            <p className="text-3xl font-black">{alerts.length}</p>
            <p className="text-xs text-orange-500 mt-2">{highRiskCount} High Risk</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">High Risk</p>
            <p className="text-3xl font-black">{highRiskCount}</p>
            <p className="text-xs text-red-500 mt-2">Requires review</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Low Risk</p>
            <p className="text-3xl font-black">{lowRiskCount}</p>
            <p className="text-xs text-blue-500 mt-2">Monitoring</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Last Refresh</p>
            <p className="text-lg font-black">Now</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchAlerts}
              disabled={isRefreshing}
              className="w-full mt-2 h-6 text-xs"
            >
              {isRefreshing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Fraud Alerts</CardTitle>
          <Badge variant="outline">{alerts.length} alerts</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fraud alerts detected</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${alert.risk === 'high' ? 'bg-red-500/5 border-red-500/20' : alert.risk === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${alert.risk === 'high' ? 'text-red-500' : alert.risk === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <p className="font-bold">{alert.type || 'Unknown Alert'}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Player: {alert.player}</p>
                    <p className="text-sm text-muted-foreground">{alert.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={alert.risk === 'high' ? 'bg-red-500/10 text-red-500' : alert.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'} style={{borderStyle: 'none'}}>
                      {(alert.risk || 'unknown').toUpperCase()}
                    </Badge>
                    <p className="text-xs font-bold mt-1">{alert.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs">Review</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                    Resolve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
