import React from 'react';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-purple-900 to-black border-4 border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-500/50 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            How to Play
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-cyan-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Getting Started */}
          <section>
            <h3 className="text-xl font-bold text-cyan-300 mb-3">⚡ Getting Started</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>
                <span className="text-green-400 font-semibold">1. Select Your Bet:</span> Use the bet
                controls to choose how much SC you want to wager. Minimum: 0.10 SC, Maximum: 5 SC
              </p>
              <p>
                <span className="text-green-400 font-semibold">2. Click SPIN:</span> Press the large
                glowing SPIN button to start the reels spinning
              </p>
              <p>
                <span className="text-green-400 font-semibold">3. Win or Lose:</span> The reels will
                stop spinning, and you'll find out if you've won!
              </p>
            </div>
          </section>

          {/* Winning Rules */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3">🏆 Winning Rules</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 font-semibold mb-1">Middle Row Match (3 Coins)</p>
                <p className="text-gray-300">
                  Match 3 identical coin symbols in the middle row to trigger the Coin UP bonus round.
                  You'll get 3 respins with coin collection and potential multipliers!
                </p>
              </div>
              <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 font-semibold mb-1">Diagonal Wins</p>
                <p className="text-gray-300">
                  Match 3 identical coins diagonally for a win worth 1.5x your bet amount
                </p>
              </div>
              <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 font-semibold mb-1">Coin UP Bonus (Special Symbol)</p>
                <p className="text-gray-300">
                  Land the special Coin UP symbol to unlock bonus respins and potential bonus coins
                </p>
              </div>
            </div>
          </section>

          {/* Symbol Values */}
          <section>
            <h3 className="text-xl font-bold text-purple-300 mb-3">💎 Symbol Values</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-black/50 border border-purple-500/30 rounded-lg p-3 text-gray-300">
                <p className="text-yellow-400 font-semibold">💰 0.10 - 0.50 SC</p>
                <p className="text-xs text-gray-400">Common coins</p>
              </div>
              <div className="bg-black/50 border border-purple-500/30 rounded-lg p-3 text-gray-300">
                <p className="text-blue-400 font-semibold">🪙 1 - 2 SC</p>
                <p className="text-xs text-gray-400">Rare coins</p>
              </div>
              <div className="bg-black/50 border border-purple-500/30 rounded-lg p-3 text-gray-300">
                <p className="text-purple-400 font-semibold">⭐ 5 - 10 SC</p>
                <p className="text-xs text-gray-400">Epic coins</p>
              </div>
              <div className="bg-black/50 border border-purple-500/30 rounded-lg p-3 text-gray-300">
                <p className="text-red-400 font-semibold">👑 20 - 100 SC</p>
                <p className="text-xs text-gray-400">Legendary coins</p>
              </div>
            </div>
          </section>

          {/* Important Rules */}
          <section>
            <h3 className="text-xl font-bold text-red-300 mb-3">⚠️ Important Rules</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <span className="text-red-400 font-bold">Max Bet:</span>
                <span>You can never bet more than 5 SC per spin. The betting interface will automatically cap any bet at this limit.</span>
              </div>
              <div className="flex items-start gap-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <span className="text-red-400 font-bold">Max Win:</span>
                <span>
                  Even if your win calculation results in more than 10 SC, it will automatically be
                  capped at 10 SC. This is a hard limit applied to every single spin.
                </span>
              </div>
              <div className="flex items-start gap-3 bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <span className="text-green-400 font-bold">Currency:</span>
                <span>CoinKrazy-CoinUp uses only SC (Sweepstakes Coins). No other currencies are accepted.</span>
              </div>
            </div>
          </section>

          {/* Win Modal */}
          <section>
            <h3 className="text-xl font-bold text-cyan-300 mb-3">🎉 When You Win</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                When you land a winning combination, a celebration modal will appear showing your
                winnings. You have two options:
              </p>
              <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-3">
                <p className="text-green-400 font-semibold mb-1">💚 Claim & Continue Playing</p>
                <p className="text-gray-300">
                  Immediately credits your win to your SC wallet and returns you to the game to
                  continue spinning
                </p>
              </div>
              <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-3">
                <p className="text-blue-400 font-semibold mb-1">📤 Share Your Win!</p>
                <p className="text-gray-300">
                  Share your big win on social media (Twitter, Facebook, Instagram) with your friends.
                  The share text will be pre-filled with your win amount and game details.
                </p>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xl font-bold text-emerald-300 mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Start with small bets to get a feel for the game</li>
              <li>The middle row is the key to triggering Coin UP bonuses</li>
              <li>Keep an eye on your balance and bet responsibly</li>
              <li>Bigger symbol values = bigger payouts but rarer drops</li>
              <li>Remember: 10 SC is the maximum you can win in a single spin</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/30 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayModal;
