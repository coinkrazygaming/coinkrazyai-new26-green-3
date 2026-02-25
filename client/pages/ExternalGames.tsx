import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const ExternalGames = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading then show message
    const timer = setTimeout(() => {
      setLoading(false);
      toast.info('Games consolidated into main catalog! 🎮');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sweepstake Games</h1>
        <p className="text-muted-foreground mt-2">
          Our game collection has been consolidated for a better experience
        </p>
      </div>

      {/* Info Alert - Consolidated */}
      <Alert className="border-yellow-500/30 bg-yellow-500/5">
        <AlertCircle className="w-4 h-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700 font-medium">
          <strong>Great news!</strong> All games have been moved to our main <strong>Games Lobby</strong> for easier access and better management. 
          Enjoy all your favorite games in one place!
        </AlertDescription>
      </Alert>

      {/* Empty State with CTA */}
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Games Have Moved! 🎮</h3>
            <p className="text-muted-foreground max-w-md">
              All sweepstake games are now available in our main Games Lobby with improved categorization, 
              search, and filtering.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate('/games')}
              className="w-full max-w-xs h-12 text-base font-bold group"
              size="lg"
            >
              Go to Games Lobby
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full max-w-xs h-12 text-base"
              size="lg"
            >
              Return Home
            </Button>
          </div>

          {/* Benefits list */}
          <div className="pt-6 border-t w-full">
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              Why the change?
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ All games in one unified catalog</li>
              <li>✅ Better filtering and search capabilities</li>
              <li>✅ Improved CoinKrazy Studios games featuring</li>
              <li>✅ Easier game discovery and management</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Admin Note */}
      <Alert variant="secondary">
        <AlertDescription className="text-xs text-muted-foreground">
          Admin: External games have been disabled and consolidated into the main games catalog. 
          All 5 CoinKrazy Studios games are now available in the admin panel for management.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ExternalGames;
