import React from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onMuteChange: (isMuted: boolean) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, isMuted, onMuteChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-purple-900 to-black border-4 border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-500/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-cyan-400" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Sound Settings */}
          <div>
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Sound</h3>
            <div className="flex items-center justify-between bg-black/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Volume2 className="w-6 h-6 text-cyan-400" />
                )}
                <span className="text-gray-300 font-semibold">Game Audio</span>
              </div>
              <button
                onClick={() => onMuteChange(!isMuted)}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold transition-all',
                  isMuted
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                {isMuted ? 'Muted' : 'Unmuted'}
              </button>
            </div>
          </div>

          {/* Game Rules */}
          <div>
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Game Rules</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-4">
                <p className="font-semibold text-cyan-400 mb-2">💰 Maximum Bet per Spin</p>
                <p>5 SC - Hard limit that cannot be exceeded</p>
              </div>
              <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-4">
                <p className="font-semibold text-yellow-400 mb-2">🏆 Maximum Win per Spin</p>
                <p>10 SC - Automatic cap applied to all wins</p>
              </div>
              <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-4">
                <p className="font-semibold text-green-400 mb-2">⚡ Coin Up Bonus</p>
                <p>Match 3 coins on middle row to trigger bonus round with extra respins</p>
              </div>
            </div>
          </div>

          {/* Game Information */}
          <div>
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Information</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <p>
                <span className="text-cyan-300 font-semibold">Version:</span> 1.0.0
              </p>
              <p>
                <span className="text-cyan-300 font-semibold">Provider:</span> CoinKrazy Games
              </p>
              <p>
                <span className="text-cyan-300 font-semibold">Currency:</span> SC (Sweepstakes Coins)
              </p>
              <p className="text-gray-500 mt-4">
                For responsible gaming support, please contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/30 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
