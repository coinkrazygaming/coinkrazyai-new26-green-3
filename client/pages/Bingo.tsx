import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import BingoGameEngine from '@/components/bingo/BingoGameEngine';
import { Loader2 } from 'lucide-react';

const Bingo = () => {
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
      <BingoGameEngine gameName="CoinKrazy Bingo Bonanza" roomName="Main Hall" players={42} jackpot={1500} />
    </div>
  );
};

export default Bingo;
