import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GameCanvas } from '@/components/CoinKrazyCoinHot/GameCanvas';
import { apiCall } from '@/lib/api';

interface WinPopupProps {
  isOpen: boolean;
  winAmount: number;
  playerUsername?: string;
  onClaim: () => void;
  onShare: () => void;
}

const WinPopup: React.FC<WinPopupProps> = ({
  isOpen,
  winAmount,
  playerUsername = 'Player',
  onClaim,
  onShare,
}) => {
  useEffect(() => {
    if (isOpen && winAmount > 0) {
      // Trigger confetti with fire colors
      confetti({
        particleCount: 100,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FF6400', '#FFA500', '#FFFF00', '#FF0000', '#000000'],
      });

      // Trigger another burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 240,
          startVelocity: 30,
          origin: { x: 0.5, y: 0 },
          colors: ['#FF6400', '#FFA500', '#FFFF00'],
        });
      }, 200);
    }
  }, [isOpen, winAmount]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="bg-gradient-to-b from-red-900 to-black border-4 border-orange-400 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: `0 0 30px rgba(255, 100, 0, 0.8), inset 0 0 20px rgba(255, 200, 0, 0.3)`,
            }}
          >
            {/* Animated fire border */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 100, 0, 0.5)',
                  '0 0 40px rgba(255, 150, 0, 0.8)',
                  '0 0 20px rgba(255, 100, 0, 0.5)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 border-4 border-orange-400 rounded-xl pointer-events-none"
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Title */}
              <h2 className="text-4xl font-black text-center mb-4 text-yellow-300 drop-shadow-lg">
                🔥 CONGRATULATIONS! 🔥
              </h2>

              {/* Win amount */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  textShadow: [
                    '0 0 5px rgba(255, 255, 0, 0)',
                    '0 0 20px rgba(255, 255, 0, 1)',
                    '0 0 5px rgba(255, 255, 0, 0)',
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-5xl font-black text-center mb-6 text-yellow-300"
              >
                +{winAmount.toFixed(2)} SC
              </motion.div>

              {/* Message */}
              <p className="text-center text-orange-200 mb-8 text-lg">
                You just scorched the reels on{' '}
                <span className="font-bold text-yellow-300">CoinKrazy-CoinHot!</span>
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-4">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 25px rgba(255, 200, 0, 0.8)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClaim}
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-600 text-black font-bold text-lg rounded-lg border-2 border-yellow-300 transition-all"
                >
                  ✓ Claim & Continue
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 25px rgba(255, 100, 50, 0.8)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShare}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg border-2 border-red-400 transition-all"
                >
                  📱 Share your win!
                </motion.button>
              </div>

              {/* Floating embers */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.sin(i) * 10, 0],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.4,
                    repeat: Infinity,
                  }}
                  className="absolute w-2 h-2 rounded-full bg-orange-400"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: '10%',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const CoinKrazyCoinHotPage: React.FC = () => {
  const [scBalance, setScBalance] = useState<number>(0);
  const [playerUsername, setPlayerUsername] = useState<string>('Player');
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch player balance on mount
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        const response = await apiCall('/api/player/profile');
        if (response.sc_balance !== undefined) {
          setScBalance(response.sc_balance);
          setPlayerUsername(response.username || 'Player');
        }
      } catch (err) {
        console.error('Failed to fetch player data:', err);
        setError('Failed to load player data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, []);

  const handleBet = async (amount: number) => {
    // Bet is deducted immediately when processing spin on backend
    // This is called before the spin request is sent
    console.log(`Betting ${amount} SC`);
  };

  const handleWin = async (winAmount: number) => {
    setLastWin(winAmount);
    setShowWinPopup(true);
    
    // Update balance immediately (optimistic update)
    setScBalance(prev => prev + winAmount);
  };

  const handleClaimWin = () => {
    setShowWinPopup(false);
    // The balance is already updated optimistically
  };

  const handleShareWin = () => {
    const text = `Just scorched the reels and won ${lastWin.toFixed(2)} SC on CoinKrazy-CoinHot 🔥 The hottest game on PlayCoinKrazy.com! Come burn the house down with me! https://playcoinkrazy.com`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Share text copied to clipboard!');
    });

    // Try to open share dialog if available
    if (navigator.share) {
      navigator.share({
        title: 'CoinKrazy-CoinHot - Big Win!',
        text: text,
      }).catch(err => console.log('Share cancelled:', err));
    }

    setShowWinPopup(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-red-950 via-orange-950 to-red-950 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading CoinKrazy-CoinHot...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-red-950 via-orange-950 to-red-950 flex items-center justify-center">
        <div className="text-red-300 text-2xl font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <GameCanvas
        initialBalance={scBalance}
        onWin={handleWin}
        onBet={handleBet}
        maxBet={5}
      />

      <WinPopup
        isOpen={showWinPopup}
        winAmount={lastWin}
        playerUsername={playerUsername}
        onClaim={handleClaimWin}
        onShare={handleShareWin}
      />
    </div>
  );
};

export default CoinKrazyCoinHotPage;
