import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface BettingUIProps {
  currentBet: number;
  onBetChange: (bet: number) => void;
  onSpin: () => void;
  isSpinning: boolean;
  maxBet: number;
  balance: number;
}

const QUICK_BET_OPTIONS = [0.1, 0.25, 0.5, 1, 2, 5];

const BettingUI: React.FC<BettingUIProps> = ({
  currentBet,
  onBetChange,
  onSpin,
  isSpinning,
  maxBet,
  balance,
}) => {
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const canSpin = balance >= currentBet && !isSpinning;

  const handleQuickBet = (amount: number) => {
    onBetChange(Math.min(amount, maxBet));
  };

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onBetChange(value);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.currentTarget.value);
    onBetChange(value);
  };

  return (
    <div className="w-full max-w-2xl bg-gradient-to-b from-purple-900/40 to-black/40 border-2 border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
      {/* Bet Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-purple-300 mb-3">
          Select Bet Amount (Max: {maxBet} SC)
        </label>

        {/* Quick Bet Buttons */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {QUICK_BET_OPTIONS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickBet(amount)}
              disabled={isSpinning}
              className={cn(
                'py-2 px-2 rounded-lg font-semibold text-sm transition-all duration-200 border-2',
                currentBet === amount
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-black/30 border-cyan-500/30 text-cyan-300 hover:border-cyan-500 hover:bg-black/50',
                isSpinning && 'opacity-50 cursor-not-allowed'
              )}
            >
              {amount === maxBet ? 'MAX' : amount}
            </button>
          ))}
        </div>

        {/* Bet Slider */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.1"
            max={maxBet}
            step="0.1"
            value={currentBet}
            onChange={handleSliderChange}
            disabled={isSpinning}
            className="flex-1 h-2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <input
            type="number"
            min="0.1"
            max={maxBet}
            step="0.1"
            value={currentBet.toFixed(2)}
            onChange={handleBetInputChange}
            disabled={isSpinning}
            className="w-20 px-3 py-2 bg-black/50 border border-cyan-500/50 rounded-lg text-cyan-300 font-semibold text-center focus:outline-none focus:border-cyan-400"
          />
          <span className="text-cyan-400 font-semibold">SC</span>
        </div>
      </div>

      {/* Spin Controls */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Main Spin Button */}
        <button
          onClick={onSpin}
          disabled={!canSpin}
          className={cn(
            'col-span-2 py-4 px-6 rounded-xl font-black text-2xl transition-all duration-200 border-2 shadow-xl transform',
            canSpin
              ? 'bg-gradient-to-br from-cyan-500 via-purple-500 to-cyan-500 border-cyan-300 text-white hover:scale-105 active:scale-95 shadow-cyan-500/50'
              : 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-500 text-gray-400 cursor-not-allowed',
            isSpinning && 'animate-pulse'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-6 h-6" />
            {isSpinning ? 'SPINNING...' : 'SPIN'}
            <Zap className="w-6 h-6" />
          </div>
        </button>

        {/* Auto Spin Toggle */}
        <button
          onClick={() => setIsAutoSpinning(!isAutoSpinning)}
          disabled={isSpinning}
          className={cn(
            'py-2 px-4 rounded-lg font-semibold text-sm transition-all border-2',
            isAutoSpinning
              ? 'bg-purple-600 border-purple-400 text-white'
              : 'bg-black/30 border-purple-500/30 text-purple-300 hover:border-purple-500'
          )}
        >
          {isAutoSpinning ? 'Auto: ON' : 'Auto: OFF'}
        </button>

        {/* Balance Check */}
        <div
          className={cn(
            'py-2 px-4 rounded-lg font-semibold text-sm text-center border-2',
            balance >= currentBet
              ? 'bg-green-900/30 border-green-500/30 text-green-400'
              : 'bg-red-900/30 border-red-500/30 text-red-400'
          )}
        >
          {balance >= currentBet ? '✓ Funds Ready' : '✗ Insufficient Balance'}
        </div>
      </div>

      {/* Info Text */}
      <div className="text-xs text-gray-400 text-center">
        Current Bet: <span className="text-cyan-300 font-semibold">{currentBet.toFixed(2)} SC</span> | Win Cap:{' '}
        <span className="text-green-300 font-semibold">10 SC</span> | Your Balance:{' '}
        <span className="text-yellow-300 font-semibold">{balance.toFixed(2)} SC</span>
      </div>
    </div>
  );
};

export default BettingUI;
