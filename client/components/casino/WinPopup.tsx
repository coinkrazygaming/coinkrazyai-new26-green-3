import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Trophy, Coins } from 'lucide-react';

interface WinPopupProps {
  isOpen: boolean;
  onClose: () => void;
  winAmount: number;
}

export const WinPopup: React.FC<WinPopupProps> = ({ isOpen, onClose, winAmount }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // Animate balance counter
      let start = 0;
      const end = winAmount;
      const duration_counter = 1500;
      const stepTime = 50;
      const steps = duration_counter / stepTime;
      const increment = (end - start) / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(start);
        }
      }, stepTime);

      return () => {
        clearInterval(interval);
        clearInterval(timer);
      };
    }
  }, [isOpen, winAmount]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            className="relative max-w-sm w-full bg-gradient-to-b from-yellow-500/20 to-black border-2 border-yellow-500 rounded-3xl p-8 text-center overflow-hidden"
          >
            {/* Background glowing effect */}
            <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full" />
            
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block p-4 bg-yellow-500 rounded-full mb-6 shadow-[0_0_30px_rgba(234,179,8,0.5)]"
              >
                <Trophy className="w-12 h-12 text-black" />
              </motion.div>

              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
                Big Win!
              </h2>
              <p className="text-yellow-500 font-bold mb-6 text-sm uppercase tracking-widest">
                Congratulations
              </p>

              <div className="flex items-center justify-center gap-3 mb-8">
                <Coins className="w-8 h-8 text-yellow-400" />
                <span className="text-6xl font-black text-white tabular-nums">
                  {displayValue.toFixed(2)}
                </span>
                <span className="text-2xl font-bold text-yellow-500 mt-4">SC</span>
              </div>

              <Button
                onClick={onClose}
                size="lg"
                className="w-full h-14 text-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all rounded-xl"
              >
                Continue Playing
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
