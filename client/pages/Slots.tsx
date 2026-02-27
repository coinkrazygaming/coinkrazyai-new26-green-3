import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import SlotsGameEngine from '@/components/slots/SlotsGameEngine';
import { Loader2 } from 'lucide-react';

const Slots = () => {
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
      <SlotsGameEngine gameName="CoinKrazy Mega Spin Slots" />
    </div>
  );
};

export default Slots;
