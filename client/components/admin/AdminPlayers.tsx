import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Eye, Lock, Unlock, Trash2, UserPlus, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Player {
  id: number;
  username: string;
  email: string;
  name: string;
  gc_balance: number;
  sc_balance: number;
  status: string;
  kyc_level: string;
  created_at: string;
  last_login?: string;
  total_wagered?: number;
  total_won?: number;
  games_played?: number;
}

const AdminPlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const limit = 20;

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.players.list(page, limit, searchTerm, statusFilter, kycFilter);
      const data = response.data || response;
      setPlayers(data.players || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch players:', error);
      toast.error('Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [page, searchTerm, statusFilter, kycFilter]);

  const handleStatusChange = async (username: string, newStatus: string) => {
    try {
      setIsSaving(true);
      await adminV2.players.updateStatusByUsername(username, newStatus);
      setPlayers(players.map(p => p.username === username ? { ...p, status: newStatus } : p));
      toast.success(`Player status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update player status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBalanceUpdate = async (player: Player) => {
    const gcAmount = prompt('Enter GC amount to add/subtract:', '0');
    if (gcAmount !== null) {
      const scAmount = prompt('Enter SC amount to add/subtract:', '0');
      if (scAmount !== null) {
        try {
          setIsSaving(true);
          const gcNum = parseFloat(gcAmount);
          const scNum = parseFloat(scAmount);
          await adminV2.players.updateBalanceByUsername(player.username, undefined, undefined, gcNum, scNum);
          setPlayers(players.map(p => p.id === player.id ? {
            ...p,
            gc_balance: p.gc_balance + gcNum,
            sc_balance: p.sc_balance + scNum
          } : p));
          toast.success('Player balance updated');
        } catch (error: any) {
          toast.error(error.message || 'Failed to update balance');
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const totalPages = Math.ceil(total / limit);
  const filteredPlayers = players;

  const handleViewPlayer = (player: Player) => {
    setSelectedPlayer(selectedPlayer?.id === player.id ? null : player);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Players ({total})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* PLAYERS LIST */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Username or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">KYC</label>
                  <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="">All</option>
                    <option value="None">None</option>
                    <option value="Basic">Basic</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter(''); setKycFilter(''); }} className="w-full">Clear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Players ({total})</CardTitle>
              <CardDescription>Page {page} of {totalPages}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : filteredPlayers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Player</th>
                        <th className="text-left py-2 px-2">Email</th>
                        <th className="text-left py-2 px-2">Balance</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">KYC</th>
                        <th className="text-left py-2 px-2">Stats</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map(player => (
                        <tr key={player.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-semibold">{player.username}</p>
                              <p className="text-xs text-muted-foreground">{player.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-xs">{player.email}</td>
                          <td className="py-3 px-2 text-xs">
                            <p>{Number(player.gc_balance).toLocaleString()} GC</p>
                            <p className="text-muted-foreground">{Number(player.sc_balance).toFixed(2)} SC</p>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={player.status === 'Active' ? 'default' : 'destructive'}>{player.status}</Badge>
                          </td>
                          <td className="py-3 px-2"><Badge variant="outline">{player.kyc_level}</Badge></td>
                          <td className="py-3 px-2 text-xs">
                            <p>{player.games_played} games</p>
                            <p className="text-muted-foreground">${Number(player.total_wagered || 0).toFixed(2)}</p>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleViewPlayer(player)}>
                                {selectedPlayer?.id === player.id ? 'Hide' : 'View'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleBalanceUpdate(player)} disabled={isSaving}>Balance</Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(player.username, player.status === 'Active' ? 'Suspended' : 'Active')} disabled={isSaving}>
                                {player.status === 'Active' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No players found</p>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = Math.max(1, page - 2) + i;
                      if (pageNum > totalPages) return null;
                      return <Button key={pageNum} variant={pageNum === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(pageNum)}>{pageNum}</Button>;
                    })}
                  </div>
                  <Button variant="outline" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Players</CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">{filteredPlayers.filter(p => p.status === 'Active').length} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Wagered</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${filteredPlayers.reduce((sum, p) => sum + (p.total_wagered || 0), 0).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Avg Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(filteredPlayers.reduce((sum, p) => sum + (p.total_won || 0), 0) / (filteredPlayers.length || 1)).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ACTIONS */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button className="w-full">Send Message to All Players</Button>
                <Button variant="outline" className="w-full">Bonus Campaign</Button>
                <Button variant="outline" className="w-full">Export Players (CSV)</Button>
                <Button variant="destructive" className="w-full">Suspend Inactive Players</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPlayer && (
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Player Details: {selectedPlayer.username}</CardTitle>
              <Badge variant={selectedPlayer.status === 'Active' ? 'default' : 'destructive'}>
                {selectedPlayer.status}
              </Badge>
            </div>
            <CardDescription>{selectedPlayer.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">FULL NAME</p>
                <p className="font-semibold">{selectedPlayer.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">STATUS</p>
                <Badge variant={selectedPlayer.status === 'Active' ? 'default' : 'destructive'}>
                  {selectedPlayer.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">KYC LEVEL</p>
                <p className="font-semibold">{selectedPlayer.kyc_level}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">ID</p>
                <p className="font-semibold text-sm">{selectedPlayer.id}</p>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg border">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">GC BALANCE</p>
                <p className="text-2xl font-black">{Number(selectedPlayer.gc_balance).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">SC BALANCE</p>
                <p className="text-2xl font-black text-green-500">{Number(selectedPlayer.sc_balance).toFixed(2)}</p>
              </div>
            </div>

            {/* Account Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">JOINED</p>
                <p className="text-sm">{new Date(selectedPlayer.created_at).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">LAST LOGIN</p>
                <p className="text-sm">{selectedPlayer.last_login ? new Date(selectedPlayer.last_login).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>

            {/* Gaming Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg border">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">GAMES PLAYED</p>
                <p className="text-2xl font-black">{selectedPlayer.games_played || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">TOTAL WAGERED</p>
                <p className="text-2xl font-black">${Number(selectedPlayer.total_wagered || 0).toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">TOTAL WON</p>
                <p className="text-2xl font-black text-green-500">${Number(selectedPlayer.total_won || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBalanceUpdate(selectedPlayer)}
                disabled={isSaving}
              >
                Update Balance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(selectedPlayer.username, selectedPlayer.status === 'Active' ? 'Suspended' : 'Active')}
                disabled={isSaving}
              >
                {selectedPlayer.status === 'Active' ? 'Suspend' : 'Activate'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlayer(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPlayers;
