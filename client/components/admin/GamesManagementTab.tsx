import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Search,
  Toggle2,
  Edit2,
  Trash2,
  Zap,
  ChevronDown,
  Play,
  MoreVertical,
} from 'lucide-react';

interface Game {
  id: number;
  name: string;
  slug: string;
  category: string;
  provider: string;
  rtp: number;
  volatility: string;
  enabled: boolean;
  image_url?: string;
  created_at: string;
}

interface FilterOptions {
  search: string;
  category: string;
  provider: string;
  status: 'all' | 'active' | 'inactive';
  volatility: string;
}

export const GamesManagementTab: React.FC<{
  onOpenBuilder?: (gameId?: number) => void;
}> = ({ onOpenBuilder }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    provider: '',
    status: 'all',
    volatility: '',
  });
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [games, filters]);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/admin/v2/games', {
        headers: { 'Content-Type': 'application/json' },
      });

      if ((response as any).success) {
        setGames((response as any).data || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
      toast.error('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = games;

    if (filters.search) {
      filtered = filtered.filter((g) =>
        g.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        g.slug.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter((g) => g.category === filters.category);
    }

    if (filters.provider) {
      filtered = filtered.filter((g) => g.provider === filters.provider);
    }

    if (filters.status === 'active') {
      filtered = filtered.filter((g) => g.enabled);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter((g) => !g.enabled);
    }

    if (filters.volatility) {
      filtered = filtered.filter((g) => g.volatility === filters.volatility);
    }

    setFilteredGames(filtered);
  };

  const toggleGameStatus = async (gameId: number, currentStatus: boolean) => {
    try {
      const response = await apiCall(`/admin/v2/games/${gameId}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !currentStatus }),
      });

      if ((response as any).success) {
        setGames((prev) =>
          prev.map((g) =>
            g.id === gameId ? { ...g, enabled: !currentStatus } : g
          )
        );
        toast.success(
          `Game ${!currentStatus ? 'enabled' : 'disabled'} successfully`
        );
      }
    } catch (error) {
      console.error('Failed to toggle game status:', error);
      toast.error('Failed to update game');
    }
  };

  const deleteGame = async (gameId: number, gameName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${gameName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await apiCall(`/admin/v2/games/${gameId}`, { method: 'DELETE' });
      setGames((prev) => prev.filter((g) => g.id !== gameId));
      toast.success('Game deleted successfully');
    } catch (error) {
      console.error('Failed to delete game:', error);
      toast.error('Failed to delete game');
    }
  };

  const handleReworkWithAI = (gameId: number) => {
    toast.info('Opening AI Game Builder with this game...');
    if (onOpenBuilder) {
      onOpenBuilder(gameId);
    }
  };

  const categories = [...new Set(games.map((g) => g.category))];
  const providers = [...new Set(games.map((g) => g.provider))];
  const volatilities = ['Low', 'Medium', 'High'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">🎮 Games Management</h2>
          <p className="text-gray-400">
            Manage all games on the platform ({filteredGames.length} of {games.length})
          </p>
        </div>
        <Button
          onClick={() => onOpenBuilder?.(undefined)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold"
        >
          + New Game
        </Button>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or slug..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            value={filters.provider}
            onChange={(e) =>
              setFilters({ ...filters, provider: e.target.value })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">All Providers</option>
            {providers.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>

          {/* Volatility Filter */}
          <select
            value={filters.volatility}
            onChange={(e) =>
              setFilters({ ...filters, volatility: e.target.value })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">All Volatility</option>
            {volatilities.map((vol) => (
              <option key={vol} value={vol}>
                {vol}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as FilterOptions['status'],
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'grid' ? 'bg-orange-600' : ''}
            >
              Grid
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'list' ? 'bg-orange-600' : ''}
            >
              List
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Games Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading games...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <p className="text-gray-400 mb-4">No games found matching your filters</p>
          <Button
            onClick={() => setFilters({ search: '', category: '', provider: '', status: 'all', volatility: '' })}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-orange-500 transition-colors"
            >
              {game.image_url && (
                <img
                  src={game.image_url}
                  alt={game.name}
                  className="w-full h-32 object-cover"
                />
              )}

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-white">{game.name}</h3>
                  <p className="text-xs text-gray-400">{game.slug}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <div>
                    <span className="text-gray-500">Category:</span> {game.category}
                  </div>
                  <div>
                    <span className="text-gray-500">RTP:</span> {game.rtp}%
                  </div>
                  <div>
                    <span className="text-gray-500">Volatility:</span> {game.volatility}
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={
                        game.enabled ? 'text-green-400 ml-1' : 'text-red-400 ml-1'
                      }
                    >
                      {game.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleGameStatus(game.id, game.enabled)}
                    size="sm"
                    className={`flex-1 text-xs ${
                      game.enabled
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <Toggle2 className="w-3 h-3 mr-1" />
                    {game.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    onClick={() => handleReworkWithAI(game.id)}
                    size="sm"
                    className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    AI Rework
                  </Button>
                </div>

                <Button
                  onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MoreVertical className="w-3 h-3 mr-2" />
                  More Actions
                </Button>
              </div>

              {expandedGameId === game.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-gray-700 p-4 bg-gray-900 space-y-2"
                >
                  <Button
                    onClick={() => onOpenBuilder?.(game.id)}
                    className="w-full text-sm bg-purple-600 hover:bg-purple-700 text-white justify-center"
                  >
                    <Edit2 className="w-3 h-3 mr-2" />
                    Edit in Builder
                  </Button>
                  <Button
                    onClick={() => deleteGame(game.id, game.name)}
                    className="w-full text-sm bg-red-600 hover:bg-red-700 text-white justify-center"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete Game
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.01 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-orange-500 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-bold text-white">{game.name}</h3>
                <p className="text-xs text-gray-400">
                  {game.category} • {game.provider} • RTP: {game.rtp}% •{' '}
                  <span
                    className={
                      game.enabled ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {game.enabled ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => toggleGameStatus(game.id, game.enabled)}
                  size="sm"
                  className={`${
                    game.enabled
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Toggle2 className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => handleReworkWithAI(game.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => onOpenBuilder?.(game.id)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => deleteGame(game.id, game.name)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamesManagementTab;
