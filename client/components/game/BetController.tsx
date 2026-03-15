/**
 * BetController Component
 * Unified betting UI for all game types
 * Features: bet input, quick buttons, slider, validation feedback
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BetControllerProps {
  betAmount: number;
  onBetChange: (bet: number) => void;
  onSpin: () => void;

  minBet: number;
  maxBet: number;
  quickBets?: number[];

  isSpinning?: boolean;
  isDisabled?: boolean;
  balance: number;

  // Optional customization
  label?: string;
  showSlider?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export const BetController: React.FC<BetControllerProps> = ({
  betAmount,
  onBetChange,
  onSpin,
  minBet,
  maxBet,
  quickBets = [0.1, 0.5, 1, 5],
  isSpinning = false,
  isDisabled = false,
  balance,
  label = 'Bet Amount',
  showSlider = true,
  buttonSize = 'md',
  variant = 'default',
}) => {
  const [error, setError] = useState<string>();

  // Validate bet amount
  useEffect(() => {
    if (betAmount < minBet) {
      setError(`Min: ${minBet.toFixed(2)} SC`);
    } else if (betAmount > maxBet) {
      setError(`Max: ${maxBet.toFixed(2)} SC`);
    } else if (balance < betAmount) {
      setError('Insufficient balance');
    } else {
      setError(undefined);
    }
  }, [betAmount, minBet, maxBet, balance]);

  const canSpin = !error && !isSpinning && !isDisabled;

  const handleBetChange = (value: number) => {
    const rounded = Math.round(value * 100) / 100; // 2 decimal places
    const clamped = Math.max(minBet, Math.min(maxBet, rounded));
    onBetChange(clamped);
  };

  const adjustBet = (amount: number) => {
    handleBetChange(betAmount + amount);
  };

  // Compact variant for mobile/embedded
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={minBet}
              max={maxBet}
              step={0.01}
              value={betAmount}
              onChange={(e) => handleBetChange(parseFloat(e.target.value) || minBet)}
              disabled={isSpinning || isDisabled}
              className="h-8 text-sm font-bold text-white bg-slate-800 border-slate-700"
            />
            <span className="text-xs font-bold text-yellow-500 whitespace-nowrap">SC</span>
          </div>
          {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
        </div>

        <Button
          onClick={onSpin}
          disabled={!canSpin}
          className={cn(
            'h-12 rounded-lg font-bold uppercase text-sm flex items-center gap-1 shrink-0',
            canSpin
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
              : 'bg-slate-700 text-slate-400'
          )}
        >
          {isSpinning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">SPINNING</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">SPIN</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  // Default full variant
  return (
    <div className="space-y-4 bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-slate-400">{label}</p>
          <p className="text-xs text-slate-500">
            {minBet.toFixed(2)} - {maxBet.toFixed(2)} SC
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400 font-semibold">Balance</p>
          <p className="text-2xl font-black text-white">{balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Bet Amount Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => adjustBet(-0.1)}
            disabled={isSpinning || isDisabled || betAmount <= minBet}
            className="h-10 w-10 border-slate-700 bg-slate-800 hover:bg-slate-700"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>

          <Input
            type="number"
            min={minBet}
            max={maxBet}
            step={0.01}
            value={betAmount}
            onChange={(e) => handleBetChange(parseFloat(e.target.value) || minBet)}
            disabled={isSpinning || isDisabled}
            className="h-12 text-center text-2xl font-black bg-slate-800 border-slate-700 text-white"
          />

          <Button
            size="icon"
            variant="outline"
            onClick={() => adjustBet(0.1)}
            disabled={isSpinning || isDisabled || betAmount >= maxBet}
            className="h-10 w-10 border-slate-700 bg-slate-800 hover:bg-slate-700"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>

        {/* Slider */}
        {showSlider && (
          <Slider
            value={[betAmount]}
            onValueChange={(value) => handleBetChange(value[0])}
            min={minBet}
            max={maxBet}
            step={0.01}
            disabled={isSpinning || isDisabled}
            className="w-full"
          />
        )}

        {/* Error/Status Message */}
        {error && <p className="text-sm text-red-400 font-semibold">{error}</p>}
      </div>

      {/* Quick Bet Buttons */}
      {quickBets.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {quickBets.map((amount) => (
            <Button
              key={amount}
              variant={betAmount === amount ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBetChange(amount)}
              disabled={isSpinning || isDisabled || amount > balance}
              className={cn(
                'text-xs font-bold',
                betAmount === amount
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
              )}
            >
              ${amount.toFixed(2)}
            </Button>
          ))}
        </div>
      )}

      {/* Max Bet Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBetChange(maxBet)}
        disabled={isSpinning || isDisabled || maxBet > balance}
        className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold"
      >
        MAX ({maxBet.toFixed(2)} SC)
      </Button>

      {/* Spin Button */}
      <Button
        onClick={onSpin}
        disabled={!canSpin}
        className={cn(
          'w-full h-14 font-bold uppercase text-lg rounded-xl',
          canSpin
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        )}
      >
        {isSpinning ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            SPINNING...
          </>
        ) : (
          `SPIN (${betAmount.toFixed(2)} SC)`
        )}
      </Button>
    </div>
  );
};
