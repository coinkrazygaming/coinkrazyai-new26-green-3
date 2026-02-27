import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Filter, Grid, List as ListIcon, Upload, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { games, adminApiCall } from '@/lib/api';
import { ImportedGameCard } from '@/components/slots/ImportedGameCard';
import { ALL_SLOT_GAMES } from '@shared/slotGamesDatabase';
import SlotsGame from '@/components/slots/SlotsGame';

interface Game {
  id: number;
  name: string;
  provider: string;
  slug?: string;
  series?: string;
  type?: string;
  category?: string;
  rtp?: number;
  volatility?: string;
  image_url?: string;
  thumbnail?: string;
  embed_url?: string;
  launch_url?: string;
  enabled?: boolean;
}

const Slots = () => {
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedVolatility, setSelectedVolatility] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isImportingFromDb, setIsImportingFromDb] = useState(false);
  const [playingGameId, setPlayingGameId] = useState<string | number | null>(null);
  const [playingGameName, setPlayingGameName] = useState<string>('');

  // Fetch games on mount
  useEffect(() => {
    fetchGames();
  }, []);

  // Filter games whenever search or filters change
  useEffect(() => {
    filterGames();
  }, [gamesList, searchTerm, selectedProvider, selectedVolatility]);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await games.getGames();
      const gamesData = Array.isArray(response) ? response : (response?.data || []);
      const enabledGames = gamesData.filter((g: Game) => g.enabled !== false);
      setGamesList(enabledGames);
      toast.success(`Loaded ${enabledGames.length} games`);
    } catch (error) {
      console.error('Failed to fetch games:', error);
      toast.error('Failed to load games');
      setGamesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGames = () => {
    let result = gamesList;

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (game) =>
          game.name.toLowerCase().includes(lowerSearch) ||
          game.provider.toLowerCase().includes(lowerSearch) ||
          game.slug?.toLowerCase().includes(lowerSearch) ||
          game.series?.toLowerCase().includes(lowerSearch)
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

    setFilteredGames(result);
  };

  const providers = [...new Set(gamesList.map((g) => g.provider))].sort();
  const volatilities = [...new Set(gamesList.map((g) => g.volatility).filter(Boolean))].sort();

  const handleImportGamesFromDatabase = async () => {
    try {
      setIsImportingFromDb(true);
      const gamesToImport = ALL_SLOT_GAMES.map(game => ({
        name: game.name,
        description: game.description,
        category: game.category,
        provider: game.provider,
        rtp: game.rtp,
        volatility: game.volatility,
        image_url: game.image_url,
        embed_url: game.embed_url,
        enabled: game.enabled,
        is_branded_popup: true,
        branding_config: {
          primaryColor: '#0f172a',
          accentColor: '#3b82f6',
          buttonStyle: 'rounded'
        }
      }));

      const result = await adminApiCall<any>('/admin/v2/aggregation/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ games: gamesToImport }),
      });

      const message = `Successfully imported ${result.data?.imported || 0} new games and updated ${result.data?.updated || 0} existing games`;
      toast.success(message);
      fetchGames();
    } catch (error) {
      toast.error(`Failed to import games: ${(error as Error).message}`);
    } finally {
      setIsImportingFromDb(false);
    }
  };

  // If a game is being played, show the game instead
  if (playingGameId) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => {
            setPlayingGameId(null);
            setPlayingGameName('');
          }}
          className="gap-2"
        >
          ← Back to Lobby
        </Button>
        <SlotsGame gameId={playingGameId} gameName={playingGameName} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Slot Games</h1>
        <p className="text-muted-foreground">
          Explore our collection of {gamesList.length} slot games from various providers
        </p>
      </div>

      {/* Classic Slots Game Button */}
      <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Classic Slots</h3>
              <p className="text-sm text-muted-foreground">5 Reels • 10 Paylines • Play Now</p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                setPlayingGameId('classic-slots');
                setPlayingGameName('Classic Slots');
              }}
              className="gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              Play Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      {!isLoading && gamesList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{gamesList.length}</p>
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
                <p className="text-2xl font-bold">
                  {gamesList.length > 0
                    ? (
                        gamesList.reduce((sum, g) => sum + (g.rtp || 0), 0) / gamesList.length
                      ).toFixed(1)
                    : 'N/A'}
                  %
                </p>
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

      {/* Quick Import Banner */}
      {gamesList.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">No Games Available</h3>
                <p className="text-sm text-muted-foreground">
                  Import {ALL_SLOT_GAMES.length} pre-configured slot games with working embed URLs
                </p>
              </div>
              <Button
                onClick={handleImportGamesFromDatabase}
                disabled={isImportingFromDb}
                className="gap-2"
              >
                {isImportingFromDb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Games
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by game name, provider, series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <Badge
                      variant={selectedProvider === null ? 'default' : 'outline'}
                      className="cursor-pointer block text-center py-1"
                      onClick={() => setSelectedProvider(null)}
                    >
                      All Providers ({gamesList.length})
                    </Badge>
                    {providers.map((provider) => (
                      <Badge
                        key={provider}
                        variant={selectedProvider === provider ? 'default' : 'outline'}
                        className="cursor-pointer block text-center py-1"
                        onClick={() => setSelectedProvider(selectedProvider === provider ? null : provider)}
                      >
                        {provider} ({gamesList.filter((g) => g.provider === provider).length})
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Volatility</label>
                  <div className="space-y-2">
                    <Badge
                      variant={selectedVolatility === null ? 'default' : 'outline'}
                      className="cursor-pointer block text-center py-1"
                      onClick={() => setSelectedVolatility(null)}
                    >
                      All Volatilities
                    </Badge>
                    {volatilities.map((volatility) => (
                      <Badge
                        key={volatility}
                        variant={selectedVolatility === volatility ? 'default' : 'outline'}
                        className="cursor-pointer block text-center py-1"
                        onClick={() => setSelectedVolatility(selectedVolatility === volatility ? null : volatility)}
                      >
                        {volatility} ({gamesList.filter((g) => g.volatility === volatility).length})
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">RTP Range</label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Min RTP: {gamesList.length > 0 ? Math.min(...gamesList.map((g) => g.rtp || 0)).toFixed(1) : 'N/A'}%</p>
                    <p>Max RTP: {gamesList.length > 0 ? Math.max(...gamesList.map((g) => g.rtp || 0)).toFixed(1) : 'N/A'}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Filters Display */}
        {(searchTerm || selectedProvider || selectedVolatility) && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="gap-2">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-foreground"
                >
                  ✕
                </button>
              </Badge>
            )}
            {selectedProvider && (
              <Badge variant="secondary" className="gap-2">
                Provider: {selectedProvider}
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="ml-1 hover:text-foreground"
                >
                  ✕
                </button>
              </Badge>
            )}
            {selectedVolatility && (
              <Badge variant="secondary" className="gap-2">
                Volatility: {selectedVolatility}
                <button
                  onClick={() => setSelectedVolatility(null)}
                  className="ml-1 hover:text-foreground"
                >
                  ✕
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedProvider(null);
                setSelectedVolatility(null);
              }}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Games Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      ) : filteredGames.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filteredGames.length} of {gamesList.length} games
          </p>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map((game) => (
                <ImportedGameCard
                  key={game.id}
                  game={game}
                  variant="grid"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGames.map((game) => (
                <ImportedGameCard
                  key={game.id}
                  game={game}
                  variant="list"
                />
              ))}
            </div>
          )}
        </>
      ) : gamesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">🎰</div>
            <h3 className="text-lg font-semibold mb-2">No Games Available</h3>
            <p className="text-muted-foreground mb-6 text-center">
              Games are being imported. Please check back soon!
            </p>
            <Button onClick={fetchGames} variant="outline">
              Refresh Games
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No Games Found</h3>
            <p className="text-muted-foreground mb-6 text-center">
              No games match your filters. Try adjusting your search or filters.
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedProvider(null);
                setSelectedVolatility(null);
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Slots;
