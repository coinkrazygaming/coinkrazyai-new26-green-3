import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Filter, Grid, List as ListIcon, ChevronDown, Zap, ChevronRight, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { games } from '@/lib/api';
import { ImportedGameCard } from '@/components/slots/ImportedGameCard';
import { GameLauncher } from '@/components/casino/GameLauncher';
import { BrandedGameModal } from '@/components/casino/BrandedGameModal';

interface Game {
  id: number;
  name: string;
  type: string;
  category: string;
  provider: string;
  rtp?: number;
  volatility?: string;
  image_url?: string;
  thumbnail?: string;
  embed_url?: string;
  enabled?: boolean;
  description?: string;
  features?: string[];
  themes?: string[];
}

type GameType = 'all' | 'slots' | 'poker' | 'bingo' | 'sportsbook' | 'game-shows';

const Games = () => {
  const { category: urlCategory } = useParams<{ category?: string }>();

  // Game type definitions
  const gameTypes: { value: GameType; label: string; count?: number }[] = [
    { value: 'all', label: 'All Games' },
    { value: 'slots', label: 'Slots' },
    { value: 'poker', label: 'Poker' },
    { value: 'bingo', label: 'Bingo' },
    { value: 'game-shows', label: 'Game Shows' },
    { value: 'sportsbook', label: 'Sportsbook' },
  ];

  const [allGames, setAllGames] = useState<Game[]>([]);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('all');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedVolatility, setSelectedVolatility] = useState<string | null>(null);
  const [minRTP, setMinRTP] = useState<number | null>(null);
  const [maxRTP, setMaxRTP] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isBrandedModalOpen, setIsBrandedModalOpen] = useState(false);

  // Set initial game type from URL param
  useEffect(() => {
    if (urlCategory) {
      const type = urlCategory.toLowerCase() as GameType;
      if (gameTypes.some(t => t.value === type)) {
        setSelectedGameType(type);
      }
    }
  }, [urlCategory]);

  // Fetch games on mount
  useEffect(() => {
    fetchGames();
  }, []);

  // Filter games whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [allGames, searchTerm, selectedGameType, selectedProvider, selectedVolatility, minRTP, maxRTP]);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await games.getGames();
      const gamesData = Array.isArray(response) ? response : (response?.data || []);
      const enabledGames = gamesData.filter((g: Game) => g.enabled !== false);
      setAllGames(enabledGames);

      // Calculate featured games - CoinKrazy Games Priority!
      let featured = [];

      // Priority 1: ALL 4 CoinKrazy Games (in order)
      const coinKrazyGameNames = ['CoinKrazy-CoinUp: Lightning Edition', 'CoinKrazy-Hot', 'CoinKrazy-Thunder', 'CoinKrazy-4Wolfs'];
      const coinKrazyGames = coinKrazyGameNames
        .map(name => enabledGames.find((g: Game) => g.name === name))
        .filter((g): g is Game => g !== undefined);

      featured = featured.concat(coinKrazyGames);

      // Priority 2: ALL AI-Generated Games from CoinKrazy Studios (if not already featured)
      const aiGeneratedGames = enabledGames.filter((g: Game) =>
        g.provider === 'CoinKrazy Studios' && !featured.find(f => f.id === g.id)
      );
      featured = featured.concat(aiGeneratedGames);

      // Priority 3: Add remaining games up to 6 total
      if (featured.length < 6) {
        const usedIds = new Set(featured.map(g => g.id));
        featured = featured.concat(
          enabledGames
            .filter((g: Game) => !usedIds.has(g.id))
            .slice(0, 6 - featured.length)
        );
      }

      setFeaturedGames(featured);
      toast.success(`Loaded ${enabledGames.length} games`);
    } catch (error) {
      console.error('Failed to fetch games:', error);
      toast.error('Failed to load games');
      setAllGames([]);
      setFeaturedGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = allGames;

    // Game type filter
    if (selectedGameType !== 'all') {
      const typeStr = selectedGameType.replace('-', ' ').toLowerCase();
      const singularType = selectedGameType.endsWith('s') ? selectedGameType.slice(0, -1) : selectedGameType;
      const singularTypeStr = typeStr.endsWith('s') ? typeStr.slice(0, -1) : typeStr;

      result = result.filter(
        (game) => {
          const gType = game.type?.toLowerCase() || '';
          const gCat = game.category?.toLowerCase() || '';
          return (
            gType === selectedGameType ||
            gCat === selectedGameType ||
            gType === typeStr ||
            gCat === typeStr ||
            gType === singularType ||
            gCat === singularType ||
            gType === singularTypeStr ||
            gCat === singularTypeStr ||
            gType.includes(singularType) ||
            gCat.includes(singularType)
          );
        }
      );
    }

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (game) =>
          game.name.toLowerCase().includes(lowerSearch) ||
          game.provider?.toLowerCase().includes(lowerSearch) ||
          game.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // Provider filter
    if (selectedProvider) {
      result = result.filter((game) => game.provider === selectedProvider);
    }

    // Volatility filter
    if (selectedVolatility) {
      result = result.filter((game) => game.volatility === selectedVolatility);
    }

    // RTP range filter
    if (minRTP !== null && minRTP !== undefined) {
      result = result.filter((game) => (game.rtp || 0) >= minRTP);
    }
    if (maxRTP !== null && maxRTP !== undefined) {
      result = result.filter((game) => (game.rtp || 0) <= maxRTP);
    }

    setFilteredGames(result);
  };

  // Calculate dynamic counts for game types
  const getGameTypeCount = (type: GameType): number => {
    if (type === 'all') return allGames.length;
    const typeStr = type.replace('-', ' ').toLowerCase();
    const singularType = type.endsWith('s') ? type.slice(0, -1) : type;
    const singularTypeStr = typeStr.endsWith('s') ? typeStr.slice(0, -1) : typeStr;

    return allGames.filter(
      (g) => {
        const gType = g.type?.toLowerCase() || '';
        const gCat = g.category?.toLowerCase() || '';
        return (
          gType === type ||
          gCat === type ||
          gType === typeStr ||
          gCat === typeStr ||
          gType === singularType ||
          gCat === singularType ||
          gType === singularTypeStr ||
          gCat === singularTypeStr ||
          gType.includes(singularType) ||
          gCat.includes(singularType)
        );
      }
    ).length;
  };

  // Get unique providers from filtered games
  const providers = [...new Set(filteredGames.map((g) => g.provider))].filter(Boolean).sort();
  const volatilities = [...new Set(filteredGames.map((g) => g.volatility).filter(Boolean))].sort();

  // Calculate statistics
  const avgRTP = filteredGames.length > 0
    ? (filteredGames.reduce((sum, g) => sum + (g.rtp || 0), 0) / filteredGames.length).toFixed(1)
    : 0;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGameType('all');
    setSelectedProvider(null);
    setSelectedVolatility(null);
    setMinRTP(null);
    setMaxRTP(null);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedGameType !== 'all' ||
    selectedProvider ||
    selectedVolatility ||
    minRTP !== null ||
    maxRTP !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Game Library</h1>
        <p className="text-muted-foreground">
          Explore our collection of {allGames.length} games from various providers
        </p>
      </div>

      {/* Featured Games Section */}
      {featuredGames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">⚡ Featured Games</h2>
            <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500">NEW</Badge>
          </div>
          <GameLauncher>
            {(launchGame) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredGames.map((game) => (
                  <Card
                    key={game.id}
                    className="h-full border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent hover:border-cyan-500 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-cyan-500/30 hover:scale-105 cursor-pointer group"
                    onClick={() => {
                      setSelectedGame(game);
                      if (game.is_branded_popup) {
                        setIsBrandedModalOpen(true);
                      } else {
                        launchGame(game);
                      }
                    }}
                  >
                    <div className="h-40 bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
                      {game.image_url ? (
                        <img
                          src={game.image_url}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <>
                          <Zap className="w-20 h-20 text-white/30 absolute -right-4 -bottom-4 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                          <Gamepad2 className="w-12 h-12 text-white relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <div>
                        <h3 className="font-black text-xl line-clamp-1">{game.name}</h3>
                        <p className="text-xs text-muted-foreground font-semibold mt-1">{game.provider}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {game.description || `Experience ${game.name} with amazing payouts and features`}
                      </p>
                      <div className="space-y-1 pt-2 border-t border-cyan-500/30">
                        {game.rtp && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">RTP</span>
                            <span className="font-bold text-cyan-400">{game.rtp}%</span>
                          </div>
                        )}
                        {game.volatility && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Volatility</span>
                            <span className="font-bold text-cyan-400">{game.volatility}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 flex items-center text-cyan-400 font-black text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                        Play Now <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </GameLauncher>
        </div>
      )}

      {/* Game Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {gameTypes.map((type) => (
          <Button
            key={type.value}
            onClick={() => setSelectedGameType(type.value)}
            variant={selectedGameType === type.value ? 'default' : 'outline'}
            className="gap-2"
          >
            {type.label}
            <Badge variant="secondary" className="ml-1">
              {getGameTypeCount(type.value)}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Stats Bar */}
      {!isLoading && filteredGames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{filteredGames.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Providers</p>
                <p className="text-2xl font-bold">{providers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg RTP</p>
                <p className="text-2xl font-bold">{avgRTP}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Now Showing</p>
                <p className="text-2xl font-bold">{filteredGames.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search games by name, provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Provider Filter */}
          <div className="relative">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">Provider</div>
            <select
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(e.target.value || null)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          {/* Volatility Filter */}
          <div className="relative">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">Volatility</div>
            <select
              value={selectedVolatility || ''}
              onChange={(e) => setSelectedVolatility(e.target.value || null)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Volatilities</option>
              {volatilities.map((vol) => (
                <option key={vol} value={vol}>
                  {vol}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded border ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
              title="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded border ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
              title="List view"
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-end">
            <Button
              variant={showAdvancedFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RTP Range */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">RTP Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      min="0"
                      max="100"
                      value={minRTP ?? ''}
                      onChange={(e) => setMinRTP(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-24"
                    />
                    <span className="flex items-center text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      min="0"
                      max="100"
                      value={maxRTP ?? ''}
                      onChange={(e) => setMaxRTP(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-24"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            {searchTerm && (
              <Badge variant="secondary" className="gap-2">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:opacity-70">
                  ✕
                </button>
              </Badge>
            )}
            {selectedGameType !== 'all' && (
              <Badge variant="secondary" className="gap-2">
                Type: {selectedGameType}
                <button onClick={() => setSelectedGameType('all')} className="hover:opacity-70">
                  ✕
                </button>
              </Badge>
            )}
            {selectedProvider && (
              <Badge variant="secondary" className="gap-2">
                Provider: {selectedProvider}
                <button onClick={() => setSelectedProvider(null)} className="hover:opacity-70">
                  ✕
                </button>
              </Badge>
            )}
            {selectedVolatility && (
              <Badge variant="secondary" className="gap-2">
                Volatility: {selectedVolatility}
                <button onClick={() => setSelectedVolatility(null)} className="hover:opacity-70">
                  ✕
                </button>
              </Badge>
            )}
            {(minRTP !== null || maxRTP !== null) && (
              <Badge variant="secondary" className="gap-2">
                RTP: {minRTP ?? '0'} - {maxRTP ?? '100'}%
                <button
                  onClick={() => {
                    setMinRTP(null);
                    setMaxRTP(null);
                  }}
                  className="hover:opacity-70"
                >
                  ✕
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredGames.length === 0 && allGames.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-2xl font-semibold mb-2">No games available</p>
          <p className="text-muted-foreground">Check back soon for more games!</p>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && filteredGames.length === 0 && allGames.length > 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-2xl font-semibold mb-2">No games match your filters</p>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Games Grid/List */}
      {!isLoading && filteredGames.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }
        >
          {filteredGames.map((game) => (
            <ImportedGameCard
              key={game.id}
              game={game}
              variant={viewMode === 'list' ? 'list' : 'grid'}
            />
          ))}
        </div>
      )}

      {/* Branded Game Modal */}
      {selectedGame && isBrandedModalOpen && (
        <BrandedGameModal
          isOpen={isBrandedModalOpen}
          game={selectedGame}
          onClose={() => {
            setIsBrandedModalOpen(false);
            setSelectedGame(null);
          }}
        />
      )}

    </div>
  );
};

export default Games;
