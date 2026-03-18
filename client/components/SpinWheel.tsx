import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinWheelProps {
  isSpinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  lastReward?: { sc: number; gc: number } | null;
  timeUntilNextSpin: number | null;
  formatTime: (ms: number | null) => string;
  totalSpins?: number;
}

const SpinWheelSegment = ({ index, color, icon, label }: { index: number; color: string; icon: string; label: string }) => {
  const angle = (index * 360) / 8;
  
  return (
    <div
      className="absolute w-full h-full flex items-center justify-center"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div
        className="absolute top-8 flex flex-col items-center text-white font-bold text-sm"
        style={{ transform: `rotate(-${angle}deg)` }}
      >
        <span className="text-2xl mb-1">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
    </div>
  );
};

export const SpinWheel: React.FC<SpinWheelProps> = ({
  isSpinning,
  canSpin,
  onSpin,
  lastReward,
  timeUntilNextSpin,
  formatTime,
  totalSpins = 0
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);

  // Segments with different colors and rewards
  const segments = [
    { color: 'from-blue-500 to-blue-600', icon: '💎', label: '0.25 SC' },
    { color: 'from-purple-500 to-purple-600', icon: '⭐', label: '0.50 SC' },
    { color: 'from-pink-500 to-pink-600', icon: '💰', label: '0.75 SC' },
    { color: 'from-orange-500 to-orange-600', icon: '🎁', label: '1.00 SC' },
    { color: 'from-green-500 to-green-600', icon: '🏆', label: '0.50 GC' },
    { color: 'from-red-500 to-red-600', icon: '🔥', label: '0.75 GC' },
    { color: 'from-cyan-500 to-cyan-600', icon: '✨', label: '1.00 GC' },
    { color: 'from-yellow-500 to-yellow-600', icon: '💫', label: 'BONUS' },
  ];

  // Random rotation when spinning
  const getRandomRotation = () => {
    return Math.floor(Math.random() * 360) + 720; // At least 2 full rotations
  };

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;

    // Trigger spin animation
    if (wheelRef.current) {
      const randomRotation = getRandomRotation();
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`;
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      // Call parent callback after animation
      setTimeout(() => {
        onSpin();
      }, 4000);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-2 border-primary/20 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Daily Spin Wheel
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </CardTitle>
          <CardDescription>Win SC and GC coins daily! (Once per 24 hours)</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Spin Wheel */}
          <div className="flex flex-col items-center">
            {/* Pointer */}
            <div className="relative z-10 mb-2">
              <div className="absolute left-1/2 transform -translate-x-1/2 -top-3">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-yellow-400"></div>
              </div>
            </div>

            {/* Wheel Container */}
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {/* Wheel itself */}
              <div
                ref={wheelRef}
                className="absolute inset-0 rounded-full shadow-2xl overflow-hidden"
                style={{
                  transform: 'rotate(0deg)',
                  transition: isSpinning ? 'none' : 'transform 0.3s ease-out'
                }}
              >
                {/* Create pie segments */}
                {segments.map((segment, index) => {
                  const angle = (index * 360) / segments.length;
                  const nextAngle = ((index + 1) * 360) / segments.length;

                  return (
                    <div
                      key={index}
                      className={`absolute w-full h-full bg-gradient-to-r ${segment.color}`}
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * (Math.PI / 180))}% ${50 + 50 * Math.sin((angle - 90) * (Math.PI / 180))}%, ${50 + 50 * Math.cos((nextAngle - 90) * (Math.PI / 180))}% ${50 + 50 * Math.sin((nextAngle - 90) * (Math.PI / 180))}%)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <div
                        className="absolute w-full h-full flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          transform: `rotate(${angle + (360 / segments.length) / 2}deg) translateY(-90px)`
                        }}
                      >
                        <span className="text-xl">{segment.icon}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Center circle */}
                <div className="absolute inset-0 rounded-full border-4 border-white"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-spin" />
                </div>
              </div>

              {/* Alternative simple wheel (easier animation) */}
              {/* Using CSS for segments */}
              <div className="absolute inset-0 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <svg
                  viewBox="0 0 200 200"
                  className="absolute inset-0 w-full h-full"
                  style={{
                    transform: isSpinning ? 'none' : 'none',
                    transition: isSpinning ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  {segments.map((segment, index) => {
                    const angle = (index * 360) / segments.length;
                    const startAngle = (angle * Math.PI) / 180;
                    const endAngle = (((index + 1) * 360) / segments.length * Math.PI) / 180;

                    const startX = 100 + 100 * Math.cos(startAngle - Math.PI / 2);
                    const startY = 100 + 100 * Math.sin(startAngle - Math.PI / 2);
                    const endX = 100 + 100 * Math.cos(endAngle - Math.PI / 2);
                    const endY = 100 + 100 * Math.sin(endAngle - Math.PI / 2);

                    const largeArc = 360 / segments.length > 180 ? 1 : 0;

                    return (
                      <path
                        key={index}
                        d={`M 100 100 L ${startX} ${startY} A 100 100 0 ${largeArc} 1 ${endX} ${endY} Z`}
                        fill={`url(#grad${index})`}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                  <defs>
                    {segments.map((segment, index) => {
                      const colors = segment.color.split(' ');
                      const startColor = colors[1];
                      const endColor = colors[3];

                      return (
                        <linearGradient
                          key={`grad${index}`}
                          id={`grad${index}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor={startColor} />
                          <stop offset="100%" stopColor={endColor} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Last Reward Display */}
          {lastReward && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-400 mb-2">Last Reward</p>
              <p className="text-2xl font-bold text-white">
                {lastReward.sc.toFixed(2)} <span className="text-blue-400">SC</span> + {lastReward.gc.toFixed(2)} <span className="text-yellow-400">GC</span>
              </p>
            </div>
          )}

          {/* Time Until Next Spin */}
          <div className="text-center">
            {canSpin ? (
              <div className="text-green-400 font-semibold">✓ Ready to spin!</div>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-400">Next spin in:</p>
                <p className="text-2xl font-bold text-yellow-400">{formatTime(timeUntilNextSpin)}</p>
              </div>
            )}
          </div>

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={!canSpin || isSpinning}
            className={cn(
              'w-full h-14 text-lg font-bold relative overflow-hidden',
              canSpin && !isSpinning
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white animate-pulse'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span>
                Spinning...
                <span className="animate-spin">⚡</span>
              </span>
            ) : canSpin ? (
              <span className="flex items-center justify-center gap-2">
                Tap to Spin
                <ArrowRight className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Come back later
              </span>
            )}
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div className="text-center">
              <p className="text-sm text-slate-400">Total Spins</p>
              <p className="text-2xl font-bold text-primary">{totalSpins}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400">Status</p>
              <p className={cn('text-2xl font-bold', canSpin ? 'text-green-400' : 'text-yellow-400')}>
                {canSpin ? '✓ Ready' : '⏱ Wait'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
