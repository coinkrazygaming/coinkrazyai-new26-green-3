'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/lib/auth-context';
import { ChevronLeft, HelpCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const CoinKrazy4EgyptPots = () => {
  const { wallet, refreshWallet } = useWallet();
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  // Expose wallet functions to the game iframe
  useEffect(() => {
    const setupGameBridge = () => {
      // Make these functions available globally for the embedded game
      (window as any).getPlayerSCBalance = () => {
        return wallet?.sweepsCoins || 0;
      };

      (window as any).recordGameTransaction = async (transaction: any) => {
        console.log('Game transaction recorded:', transaction);
        // Refresh wallet after transactions
        setTimeout(() => refreshWallet(), 500);
      };

      (window as any).getPlayerReferralLink = () => {
        return `${window.location.origin}/?ref=${user?.id}`;
      };
    };

    setupGameBridge();
  }, [wallet, user, refreshWallet]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-900 to-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-amber-600 bg-black/50">
        <div className="flex items-center gap-3">
          <ChevronLeft
            className="w-6 h-6 text-amber-400 cursor-pointer hover:text-amber-300"
            onClick={() => window.history.back()}
          />
          <h1 className="text-2xl font-bold text-amber-400">🏛️ CoinKrazy-4EgyptPots 🏛️</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-amber-400 text-sm">Balance</p>
            <p className="text-2xl font-bold text-green-400">{wallet?.sweepsCoins.toFixed(2) || '0.00'} SC</p>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 transition"
          >
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4">
        <iframe
          src="/games/coinkrazy-4egypt-pots.html"
          className="w-full max-w-6xl h-screen max-h-[800px] border-4 border-amber-600 rounded-lg"
          title="CoinKrazy-4EgyptPots"
          allow="autoplay"
        />
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-gradient-to-b from-amber-400 to-yellow-400 rounded-xl p-8 max-w-2xl w-full">
            <h2 className="text-3xl font-bold text-black mb-4">🏛️ How to Play</h2>
            
            <div className="text-black space-y-4 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-2">⚙️ Game Basics</h3>
                <p>5×3 reel grid with 20 fixed paylines. Spin and match symbols from left to right to win!</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">💎 Premium Symbols</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>👑 Wild (Pharaoh Mask): 0.5× – 10× coins</li>
                  <li>👸 Golden Queen: 7.5× coins</li>
                  <li>👁️ Eye of Horus: 5× coins</li>
                  <li>🪲 Scarab Beetle: 5× coins</li>
                  <li>☥️ Ankh Cross: 5× coins</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">🎁 Special Features</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>💰 Bonus Coins:</strong> Collect 6+ to trigger Hold & Win</li>
                  <li><strong>⚱️ Four Pots:</strong> Fill meters to unlock feature bonuses</li>
                  <li><strong>🔄 Hold & Win:</strong> 3 respins with sticky bonus symbols</li>
                  <li><strong>🚀 Pot Features:</strong> Boost, Collect, Multi, Jackpot</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">💰 Payouts</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Max Win: 10 SC per spin</li>
                  <li>Adjustable bets: 0.01 – 10.00 SC</li>
                  <li>Auto-record to your wallet</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">📊 Specifications</h3>
                <p>20 Fixed Paylines | RTP: 96.3% | Provider: CoinKrazy Studios</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinKrazy4EgyptPots;
