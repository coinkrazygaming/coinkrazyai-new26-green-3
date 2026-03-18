import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSpinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  lastReward?: { sc: number; gc: number } | null;
  timeUntilNextSpin: number | null;
  formatTime: (ms: number | null) => string;
  totalSpins?: number;
}

const SpinSegment = ({ index, label, color }: { index: number; label: string; color: string }) => {
  const totalSegments = 8;
  const rotation = (index * 360) / totalSegments;
  
  return (
    <div
      className={`absolute w-full h-full ${color} flex items-center justify-center font-bold text-white text-sm`}
      style={{
        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rotation * Math.PI) / 180)}% ${50 + 50 * Math.sin((rotation * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((rotation + 360 / totalSegments) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((rotation + 360 / totalSegments) * Math.PI) / 180)}%)`,
        transform: `rotate(${rotation}deg) translateY(-70px)`
      }}
    >
      <span className="transform" style={{ transform: `rotate(-${rotation}deg)` }}>
        {label}
      </span>
    </div>
  );
};

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  isSpinning,
  canSpin,
  onSpin,
  lastReward,
  timeUntilNextSpin,
  formatTime,
  totalSpins = 0
}) => {
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    
    // Generate random rotation (at least 5 full spins + random position)
    const randomRotation = Math.random() * 360;
    const totalRotation = rotation + 1800 + randomRotation; // 5 full rotations + random
    setRotation(totalRotation);
    
    onSpin();
  };

  const segments = [
    { label: '💎 0.25 SC', color: 'bg-blue-500' },
    { label: '⭐ 0.50 SC', color: 'bg-purple-500' },
    { label: '💰 0.75 SC', color: 'bg-pink-500' },
    { label: '🎁 1.00 SC', color: 'bg-orange-500' },
    { label: '🏆 0.50 GC', color: 'bg-green-500' },
    { label: '🔥 0.75 GC', color: 'bg-red-500' },
    { label: '✨ 1.00 GC', color: 'bg-cyan-500' },
    { label: '💫 BONUS', color: 'bg-yellow-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-yellow-500/30 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
            Daily Spin Wheel
            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Spin once per day to win SC and GC coins! Rewards range from 0.01 to 1.00
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Spin Wheel */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Pointer */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 flex justify-center">
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-10 border-l-transparent border-r-transparent border-t-yellow-400"></div>
              </div>

              {/* Wheel */}
              <div
                className="relative w-72 h-72 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-slate-800"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                  WebkitTransition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
                }}
              >
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className={`absolute w-full h-full ${segment.color}`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((Math.PI / 4) - (index * Math.PI / 4))}% ${50 - 50 * Math.sin((Math.PI / 4) - (index * Math.PI / 4))}%)`,
                      opacity: 0.9
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs text-center px-2"
                      style={{
                        transform: `rotate(${(index * 360) / 8 + 22.5}deg) translateY(-85px)`,
                        fontSize: '11px'
                      }}
                    >
                      <span style={{ transform: `rotate(${-((index * 360) / 8 + 22.5)}deg)` }}>
                        {segment.label}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Center circle */}
                <div className="absolute inset-0 rounded-full border-4 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-lg flex items-center justify-center border-4 border-white">
                  <Zap className="w-8 h-8 text-slate-900 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Last Reward */}
          {lastReward && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 p-4">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">🎉 Last Reward</p>
                <p className="text-xl font-bold text-white">
                  {lastReward.sc.toFixed(2)} <span className="text-blue-400">SC</span> + {lastReward.gc.toFixed(2)} <span className="text-yellow-400">GC</span>
                </p>
              </div>
            </Card>
          )}

          {/* Status */}
          <div className="text-center space-y-2">
            {canSpin ? (
              <div className="text-green-400 font-bold text-lg">✓ Ready to spin!</div>
            ) : (
              <>
                <p className="text-slate-400 text-sm">Next spin available in:</p>
                <p className="text-3xl font-black text-yellow-400">{formatTime(timeUntilNextSpin)}</p>
              </>
            )}
          </div>

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={!canSpin || isSpinning}
            className={cn(
              'w-full h-12 text-lg font-bold',
              canSpin && !isSpinning
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span>
                Spinning...
              </span>
            ) : canSpin ? (
              '🎉 TAP TO SPIN 🎉'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Come Back Later
              </span>
            )}
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Total Spins</p>
              <p className="text-xl font-bold text-yellow-400">{totalSpins}</p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Status</p>
              <p className={cn('text-xl font-bold', canSpin ? 'text-green-400' : 'text-yellow-400')}>
                {canSpin ? '✓' : '⏱'}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Daily Reward</p>
              <p className="text-xl font-bold text-cyan-400">1x</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
