import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Info } from 'lucide-react';
import { GamePlayerModal } from './GamePlayerModal';
import { BrandedGameModal } from '../casino/BrandedGameModal';

interface ImportedGame {
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
  is_branded_popup?: boolean;
  branding_config?: any;
}

interface ImportedGameCardProps {
  game: ImportedGame;
  onPlay?: (game: ImportedGame) => void;
  onOpenUrl?: (url: string) => void;
  variant?: 'grid' | 'list';
}

export const ImportedGameCard = ({
  game,
  onPlay,
  onOpenUrl,
  variant = 'grid'
}: ImportedGameCardProps) => {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const imageUrl = game.image_url || game.thumbnail || '';

  const handlePlayClick = () => {
    setIsPlayerOpen(true);
  };

  if (variant === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        {imageUrl && (
          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={imageUrl}
              alt={game.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).textContent = '🎰';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{game.name}</h3>
            {!game.enabled && <Badge variant="secondary" className="text-xs">Disabled</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{game.provider}</p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {game.type && <span>{game.type}</span>}
            {game.series && <span>Series: {game.series}</span>}
            {game.rtp && <span>RTP: {game.rtp}%</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {(game.launch_url || game.embed_url) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayClick}
              className="gap-1"
            >
              <Play className="w-4 h-4" />
              Play
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(57,255,20,0.1)]">
      <CardHeader className="p-0">
        <div className="h-48 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600 transition-transform group-hover:scale-105 duration-500 overflow-hidden relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={game.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23475569" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239CA3AF"%3E' + game.name + '%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="text-4xl">🎰</div>
          )}

          {/* Overlay with Play Button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {(game.launch_url || game.embed_url) && (
              <Button
                size="lg"
                onClick={handlePlayClick}
                className="gap-2 font-bold"
              >
                <Play className="w-5 h-5" />
                PLAY
              </Button>
            )}
          </div>

          {/* Status Badges */}
          <div className="absolute top-2 right-2 flex gap-2">
            {!(game.launch_url || game.embed_url) && (
              <Badge variant="destructive" className="gap-1">
                <Info className="w-3 h-3" />
                No Embed
              </Badge>
            )}
            {!game.enabled && (
              <Badge variant="secondary">
                Disabled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div>
          <CardTitle className="text-lg line-clamp-2">{game.name}</CardTitle>
          <CardDescription className="text-sm">{game.provider}</CardDescription>
        </div>

        {/* Game Details */}
        <div className="space-y-2 text-xs">
          {game.type && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{game.type}</span>
            </div>
          )}
          {game.series && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Series:</span>
              <span className="font-medium">{game.series}</span>
            </div>
          )}
          {game.rtp && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">RTP:</span>
              <span className="font-medium">{game.rtp}%</span>
            </div>
          )}
          {game.volatility && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility:</span>
              <span className="font-medium">{game.volatility}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {(game.launch_url || game.embed_url) && (
            <Button
              size="sm"
              className="flex-1 gap-1"
              onClick={handlePlayClick}
            >
              <Play className="w-3 h-3" />
              Play Now
            </Button>
          )}
        </div>
      </CardContent>

      {/* Game Player Modal */}
      {game.is_branded_popup && isPlayerOpen ? (
        <BrandedGameModal
          isOpen={isPlayerOpen}
          game={game as any}
          onClose={() => setIsPlayerOpen(false)}
        />
      ) : (
        <GamePlayerModal
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          game={game}
        />
      )}
    </Card>
  );
};

export default ImportedGameCard;
