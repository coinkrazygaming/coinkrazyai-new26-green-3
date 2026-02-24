import React from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WinModalProps {
  isOpen: boolean;
  winAmount: number;
  onClaim: () => void;
  onShare: (platform: string) => void;
}

const WinModal: React.FC<WinModalProps> = ({ isOpen, winAmount, onClaim, onShare }) => {
  if (!isOpen) return null;

  const shareOptions = [
    { id: 'twitter', label: '𝕏 Twitter', icon: '🐦', color: 'from-blue-500 to-blue-600' },
    { id: 'facebook', label: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700' },
    { id: 'copy', label: 'Copy Text', icon: '📋', color: 'from-gray-500 to-gray-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-purple-900 to-black border-4 border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-500/50 overflow-hidden animate-in fade-in duration-300">
        {/* Confetti effect (optional animation) */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: Math.random(),
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-12 text-center">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-4 animate-pulse">
            🎉 CONGRATULATIONS! 🎉
          </h2>

          {/* Win Message */}
          <p className="text-lg text-gray-300 mb-8">
            You just won
          </p>

          {/* Win Amount */}
          <div className="mb-8">
            <div className="inline-block bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl px-8 py-6 shadow-2xl shadow-orange-500/50">
              <div className="text-6xl md:text-7xl font-black text-white drop-shadow-lg">
                {winAmount.toFixed(2)}
              </div>
              <div className="text-2xl font-bold text-yellow-100 mt-2">SC</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Claim Button */}
            <button
              onClick={onClaim}
              className="col-span-1 md:col-span-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black text-lg py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl shadow-green-500/50 flex items-center justify-center gap-3"
            >
              <Check className="w-6 h-6" />
              Claim & Continue Playing
            </button>
          </div>

          {/* Share Section */}
          <div className="bg-black/50 rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Big Win!
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onShare(option.id)}
                  className={cn(
                    'bg-gradient-to-br',
                    option.color,
                    'hover:shadow-lg hover:shadow-current text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm'
                  )}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Share Text Preview */}
            <div className="bg-black/50 rounded-lg p-4 text-left text-xs text-gray-400 border border-gray-600">
              <p className="text-yellow-300 font-semibold mb-2">Preview:</p>
              <p className="text-gray-300">
                Just hit a massive {winAmount.toFixed(2)} SC win on CoinKrazy-CoinUp! 🔥⚡ The
                lightning is striking on PlayCoinKrazy.com! Come chase your own wins! #CoinKrazy
                #CoinUp #BigWin
              </p>
            </div>
          </div>

          {/* Close hint */}
          <p className="text-xs text-gray-500 mt-6">
            Modal will close after claiming or sharing
          </p>
        </div>

        {/* Lightning effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-t from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};

export default WinModal;
