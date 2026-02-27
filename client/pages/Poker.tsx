import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import PokerGameEngine from '@/components/poker/PokerGameEngine';
import { Loader2 } from 'lucide-react';

const Poker = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <PokerGameEngine tableName="Diamond Table 1" stakes="$1/$2" maxPlayers={8} />
    </div>
  );
};

export default Poker;
