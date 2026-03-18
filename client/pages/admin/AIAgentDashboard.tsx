import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, TrendingUp, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  duties: string[];
}

interface AIAgentStatus {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  current_task: string | null;
  total_conversations: number;
  average_response_time_ms: number | null;
  uptime_percentage: number;
  performance_score: number;
  last_activity_at: string;
}

export const AIAgentDashboard = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AIAgentStatus>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    loadAgentsData();
    const interval = setInterval(loadAgentsData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAgentsData = async () => {
    try {
      const response = await fetch('/api/ai/status', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.employees) {
          setAgents(result.data.employees);
        }
        if (result.data?.status) {
          const statusByAgent = result.data.status.reduce((acc: Record<string, AIAgentStatus>, s: AIAgentStatus) => {
            acc[s.agent_id] = s;
            return acc;
          }, {});
          setStatusMap(statusByAgent);
        }
      }
    } catch (error) {
      console.error('Failed to load AI agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'busy':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUptimeColor = (uptime: number): string => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Agent Dashboard</h1>
        <Button onClick={loadAgentsData} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-block animate-spin">
              <Zap className="w-6 h-6" />
            </div>
            <p className="mt-2">Loading AI agents...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Total Agents</p>
                    <p className="text-2xl font-bold">{agents.length}</p>
                  </div>
                  <Activity className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Active Agents</p>
                    <p className="text-2xl font-bold">
                      {agents.filter(a => statusMap[a.id]?.status === 'active').length}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Avg Performance</p>
                    <p className="text-2xl font-bold">
                      {(
                        agents.reduce((sum, a) => sum + (statusMap[a.id]?.performance_score || 0), 0) / agents.length
                      ).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Avg Uptime</p>
                    <p className="text-2xl font-bold">
                      {(
                        agents.reduce((sum, a) => sum + (statusMap[a.id]?.uptime_percentage || 0), 0) / agents.length
                      ).toFixed(1)}%
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agents List */}
          <Card>
            <CardHeader>
              <CardTitle>AI Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => {
                  const agentStatus = statusMap[agent.id];
                  const isSelected = selectedAgent === agent.id;

                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all",
                        "hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900/50",
                        isSelected ? 'border-primary bg-slate-50 dark:bg-slate-900/50' : 'border-slate-200 dark:border-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <Badge className={getStatusColor(agentStatus?.status || 'offline')}>
                              {agentStatus?.status || 'offline'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{agent.role}</p>

                          {isSelected && (
                            <div className="mt-4 space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500">Current Task</p>
                                  <p className="font-mono text-sm">
                                    {agentStatus?.current_task || 'None'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Conversations</p>
                                  <p className="font-bold text-lg">
                                    {agentStatus?.total_conversations || 0}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Response Time</p>
                                  <p className="font-mono text-sm">
                                    {agentStatus?.average_response_time_ms ? `${agentStatus.average_response_time_ms}ms` : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Performance</p>
                                  <p className={cn('font-bold', getPerformanceColor(agentStatus?.performance_score || 0))}>
                                    {agentStatus?.performance_score.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Uptime</p>
                                  <p className={cn('font-bold', getUptimeColor(agentStatus?.uptime_percentage || 0))}>
                                    {agentStatus?.uptime_percentage.toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              {agent.duties && agent.duties.length > 0 && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-slate-500 mb-2">Duties</p>
                                  <div className="flex flex-wrap gap-2">
                                    {agent.duties.map((duty, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {duty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t">
                                <p className="text-xs text-slate-500 mb-2">Last Activity</p>
                                <p className="text-sm">
                                  {agentStatus?.last_activity_at 
                                    ? new Date(agentStatus.last_activity_at).toLocaleString()
                                    : 'Never'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {!isSelected && (
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              <span className={getPerformanceColor(agentStatus?.performance_score || 0)}>
                                {agentStatus?.performance_score.toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">score</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Agent Commands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Agent Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="w-full">
                  Start All Agents
                </Button>
                <Button variant="outline" className="w-full">
                  Stop All Agents
                </Button>
                <Button variant="outline" className="w-full">
                  Reset Performance Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
