import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ToggleRight, Eye, EyeOff, Settings, Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { games, adminV2 } from '@/lib/api';

interface GameData {
  id: number;
  name: string;
  category: string;
  provider: string;
  rtp: number;
  volatility: string;
  enabled: boolean;
  players_today: number;
  revenue_today: number;
  spins_today: number;
  avg_session: number;
}

const ComprehensiveGameManagement: React.FC = () => {
  const [gameList, setGameList] = useState<GameData[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'rtp' | 'players' | 'revenue'>('name');
  const [editingGame, setEditingGame] = useState<GameData | null>(null);
  const [newRTP, setNewRTP] = useState(95);

  const categories = ['all', 'Slots', 'Poker', 'Bingo', 'Sportsbook'];

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [gameList, searchTerm, selectedCategory, sortBy]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const response = await games.getGames();
      const gamesData = Array.isArray(response) ? response : (response?.data || []);
      setGameList(gamesData);
    } catch (error) {
      console.error('Failed to load games:', error);
      toast.error('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = gameList;

    // Filter by search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(lower) ||
        g.provider.toLowerCase().includes(lower)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(g => g.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rtp':
          return b.rtp - a.rtp;
        case 'players':
          return b.players_today - a.players_today;
        case 'revenue':
          return b.revenue_today - a.revenue_today;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredGames(result);
  };

  const handleToggleGame = async (gameId: number, enabled: boolean) => {
    try {
      // Would use API to toggle
      setGameList(gameList.map(g =>
        g.id === gameId ? { ...g, enabled: !enabled } : g
      ));
      toast.success(`Game ${enabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to toggle game');
    }
  };

  const handleUpdateRTP = async (gameId: number, newRtp: number) => {
    try {
      // Would use API to update RTP
      setGameList(gameList.map(g =>
        g.id === gameId ? { ...g, rtp: newRtp } : g
      ));
      setEditingGame(null);
      toast.success('RTP updated');
    } catch (error) {
      toast.error('Failed to update RTP');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic uppercase">Game Management</h2>
          <p className="text-muted-foreground mt-1">Manage games, RTP, and player access</p>
        </div>
        <Button className="gap-2 h-12 bg-green-600 hover:bg-green-700">
          <Plus className="w-5 h-5" />
          <span className="font-bold">Add Game</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="rtp">Sort by RTP</option>
              <option value="players">Sort by Players</option>
              <option value="revenue">Sort by Revenue</option>
            </select>
            <Button variant="outline" onClick={loadGames} className="gap-2">
              🔄 Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <p className="text-sm font-bold uppercase text-muted-foreground">Total Games</p>
            <p className="text-3xl font-black text-blue-600">{gameList.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{gameList.filter(g => g.enabled).length} enabled</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <p className="text-sm font-bold uppercase text-muted-foreground">Total Players Today</p>
            <p className="text-3xl font-black text-green-600">{gameList.reduce((sum, g) => sum + g.players_today, 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <p className="text-sm font-bold uppercase text-muted-foreground">Total Spins Today</p>
            <p className="text-3xl font-black text-purple-600">{gameList.reduce((sum, g) => sum + g.spins_today, 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-6">
            <p className="text-sm font-bold uppercase text-muted-foreground">Revenue Today</p>
            <p className="text-3xl font-black text-orange-600">${gameList.reduce((sum, g) => sum + g.revenue_today, 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>Games ({filteredGames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGames.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No games found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-bold">Game</th>
                    <th className="text-left p-2 font-bold">Category</th>
                    <th className="text-left p-2 font-bold">Provider</th>
                    <th className="text-center p-2 font-bold">RTP</th>
                    <th className="text-center p-2 font-bold">Volatility</th>
                    <th className="text-center p-2 font-bold">Players</th>
                    <th className="text-right p-2 font-bold">Revenue</th>
                    <th className="text-center p-2 font-bold">Status</th>
                    <th className="text-center p-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) => (
                    <tr key={game.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-bold">{game.name}</td>
                      <td className="p-2 text-xs">{game.category}</td>
                      <td className="p-2 text-xs text-muted-foreground">{game.provider}</td>
                      <td className="p-2 text-center">
                        {editingGame?.id === game.id ? (
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={newRTP}
                              onChange={(e) => setNewRTP(parseFloat(e.target.value))}
                              className="w-16 h-7 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateRTP(game.id, newRTP)}
                              className="h-7 text-xs"
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Badge variant={game.rtp >= 95 ? 'default' : 'secondary'}>
                            {game.rtp.toFixed(1)}%
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-center text-xs">
                        <Badge variant="outline">{game.volatility}</Badge>
                      </td>
                      <td className="p-2 text-center font-bold">{game.players_today}</td>
                      <td className="p-2 text-right font-bold">${game.revenue_today.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <Badge className={game.enabled ? 'bg-green-600' : 'bg-red-600'}>
                          {game.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleGame(game.id, game.enabled)}
                            className="h-7 w-7"
                          >
                            {game.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingGame(game);
                              setNewRTP(game.rtp);
                            }}
                            className="h-7 w-7"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Game Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-bold">Default RTP %</label>
              <Input type="number" min="0" max="100" defaultValue="95" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-bold">Max Bet (SC)</label>
              <Input type="number" min="1" defaultValue="100" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-bold">Min Bet (SC)</label>
              <Input type="number" min="0.01" step="0.01" defaultValue="0.10" className="mt-1" />
            </div>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveGameManagement;
