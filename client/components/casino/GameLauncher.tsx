import React, { useState } from 'react';
import { BrandedGameModal } from './BrandedGameModal';
import { GameInfo } from '@shared/api';

interface GameLauncherProps {
  children: (launchGame: (game: any) => void) => React.ReactNode;
}

export const GameLauncher: React.FC<GameLauncherProps> = ({ children }) => {
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const launchGame = (game: any) => {
    // Ensure all required fields for the branded modal are present
    const formattedGame = {
      id: game.id,
      name: game.name,
      embed_url: game.embed_url || game.launch_url || '',
      provider: game.provider,
      branding_config: game.branding_config || {}
    };

    if (!formattedGame.embed_url) {
      console.warn('Game cannot be launched: Missing embed_url', game);
      return;
    }

    setSelectedGame(formattedGame);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  return (
    <>
      {children(launchGame)}
      
      {selectedGame && (
        <BrandedGameModal 
          isOpen={isModalOpen}
          onClose={handleClose}
          game={selectedGame}
        />
      )}
    </>
  );
};
