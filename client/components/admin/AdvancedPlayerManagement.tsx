import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Filter, ChevronDown, Trash2, Lock, Unlock, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { adminV2 } from '@/lib/api';

interface Player {
  id: number;
  username: string;
  name: string;
  email: string;
  gc_balance: number;
  sc_balance: number;
  status: string;
  kyc_level: string;
  kyc_verified: boolean;
  join_date: string;
  last_login: string;
  total_wagered?: number;
  total_won?: number;
}

interface FilterOptions {
  status: string;
  kycLevel: string;
  kyc_verified: boolean | null;
  joinDateFrom: string;
  joinDateTo: string;
  minBalance: number;
  maxBalance: number;
}

const AdvancedPlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    kycLevel: '',
    kyc_verified: null,
    joinDateFrom: '',
    joinDateTo: '',
    minBalance: 0,
    maxBalance: 1000000,
  });
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'joined' | 'last_login'>('name');

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [players, searchTerm, filters, sortBy]);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.listPlayers();
      if (response.success && response.data) {
        setPlayers(response.data);
      }
    } catch (error) {
      console.error('Failed to load players:', error);
      toast.error('Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = players;

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.username.toLowerCase().includes(lower) ||
        p.name.toLowerCase().includes(lower) ||
        p.email.toLowerCase().includes(lower)
      );
    }

    // Filters
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.kycLevel) {
      result = result.filter(p => p.kyc_level === filters.kycLevel);
    }
    if (filters.kyc_verified !== null) {
      result = result.filter(p => p.kyc_verified === filters.kyc_verified);
    }
    if (filters.minBalance) {
      result = result.filter(p => p.gc_balance + p.sc_balance >= filters.minBalance);
    }
    if (filters.maxBalance) {
      result = result.filter(p => p.gc_balance + p.sc_balance <= filters.maxBalance);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return (b.gc_balance + b.sc_balance) - (a.gc_balance + a.sc_balance);
        case 'joined':
          return new Date(b.join_date).getTime() - new Date(a.join_date).getTime();
        case 'last_login':
          return new Date(b.last_login || 0).getTime() - new Date(a.last_login || 0).getTime();
        default:
          return a.username.localeCompare(b.username);
      }
    });

    setFilteredPlayers(result);
  };

  const handleSelectPlayer = (playerId: number) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlayers.size === filteredPlayers.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(filteredPlayers.map(p => p.id)));
    }
  };

  const handleBulkAction = async (action: 'block' | 'unblock' | 'verify') => {
    if (selectedPlayers.size === 0) {
      toast.error('Please select players');
      return;
    }

    try {
      for (const playerId of selectedPlayers) {
        switch (action) {
          case 'block':
            await adminV2.updatePlayerStatus(playerId, { status: 'Suspended' });
            break;
          case 'unblock':
            await adminV2.updatePlayerStatus(playerId, { status: 'Active' });
            break;
          case 'verify':
            // Would need a verification endpoint
            break;
        }
      }
      toast.success(`Action applied to ${selectedPlayers.size} players`);
      setSelectedPlayers(new Set());
      loadPlayers();
    } catch (error) {
      toast.error('Failed to apply action');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black italic uppercase">Player Management</h2>
        <p className="text-muted-foreground mt-1">Manage users, verify KYC, adjust balances</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="outline" onClick={loadPlayers} className="gap-2">
              🔄 Refresh
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-bold">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Banned">Banned</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold">KYC Level</label>
                <select
                  value={filters.kycLevel}
                  onChange={(e) => setFilters({ ...filters, kycLevel: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="Basic">Basic</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Full">Full</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold">Min Balance (SC)</label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minBalance}
                  onChange={(e) => setFilters({ ...filters, minBalance: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Max Balance (SC)</label>
                <Input
                  type="number"
                  min="0"
                  value={filters.maxBalance}
                  onChange={(e) => setFilters({ ...filters, maxBalance: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold">KYC Verified</label>
                <select
                  value={filters.kyc_verified === null ? 'all' : filters.kyc_verified ? 'yes' : 'no'}
                  onChange={(e) => setFilters({
                    ...filters,
                    kyc_verified: e.target.value === 'all' ? null : e.target.value === 'yes'
                  })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Verified</option>
                  <option value="no">Unverified</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="name">Username</option>
                  <option value="balance">Balance</option>
                  <option value="joined">Join Date</option>
                  <option value="last_login">Last Login</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPlayers.size > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="font-bold">{selectedPlayers.size} player(s) selected</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('unblock')}
                  className="gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Unblock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('block')}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Lock className="w-4 h-4" />
                  Block
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlayers(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Players ({filteredPlayers.length})</CardTitle>
            <CardDescription>Total: {players.length}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedPlayers.size === filteredPlayers.length ? 'Deselect All' : 'Select All'}
          </Button>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No players found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-2 font-bold">Username</th>
                    <th className="text-left p-2 font-bold">Email</th>
                    <th className="text-left p-2 font-bold">Balance</th>
                    <th className="text-left p-2 font-bold">Status</th>
                    <th className="text-left p-2 font-bold">KYC</th>
                    <th className="text-left p-2 font-bold">Joined</th>
                    <th className="text-left p-2 font-bold">Last Login</th>
                    <th className="text-left p-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.has(player.id)}
                          onChange={() => handleSelectPlayer(player.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2 font-bold">{player.username}</td>
                      <td className="p-2 text-xs text-muted-foreground">{player.email}</td>
                      <td className="p-2 font-bold">${(player.gc_balance + player.sc_balance).toFixed(2)}</td>
                      <td className="p-2">
                        <Badge className={
                          player.status === 'Active' ? 'bg-green-600' :
                          player.status === 'Suspended' ? 'bg-yellow-600' : 'bg-red-600'
                        }>
                          {player.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={player.kyc_verified ? 'default' : 'secondary'}>
                          {player.kyc_level}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs">{new Date(player.join_date).toLocaleDateString()}</td>
                      <td className="p-2 text-xs">
                        {player.last_login ? new Date(player.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedPlayerManagement;
