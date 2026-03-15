/**
 * BaseGameLayout Component
 * Provides consistent header, balance display, and content area for all games
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Coins, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BaseGameLayoutProps {
  gameName: string;
  gameDescription?: string;
  balance: number;
  userId?: string;
  username?: string;
  onClose?: () => void;
  onSettings?: () => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showSettings?: boolean;
  variant?: 'full' | 'modal' | 'embedded';
}

export const BaseGameLayout: React.FC<BaseGameLayoutProps> = ({
  gameName,
  gameDescription,
  balance,
  userId,
  username,
  onClose,
  onSettings,
  children,
  className,
  headerClassName,
  contentClassName,
  showSettings = true,
  variant = 'full',
}) => {
  const isModal = variant === 'modal';
  const isEmbedded = variant === 'embedded';

  return (
    <div
      className={cn(
        'flex flex-col',
        isModal ? 'fixed inset-0 z-50 bg-slate-950' : 'min-h-screen bg-gradient-to-b from-slate-950 to-slate-900',
        className
      )}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'sticky top-0 z-40 border-b border-slate-800',
          isModal || isEmbedded
            ? 'bg-slate-900/95 backdrop-blur-md'
            : 'bg-gradient-to-b from-slate-900 to-slate-900/50 backdrop-blur-md',
          headerClassName
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          {/* Left: Game Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black uppercase text-white truncate">
              {gameName}
            </h1>
            {gameDescription && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-1">
                {gameDescription}
              </p>
            )}
          </div>

          {/* Center: Balance (hidden on very small screens) */}
          <div className="hidden sm:flex items-center gap-4 px-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50"
            >
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-black text-white tabular-nums">
                {balance.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-yellow-500">SC</span>
            </motion.div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {showSettings && onSettings && (
              <Button
                onClick={onSettings}
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}

            {onClose && !isEmbedded && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Balance (shown on small screens) */}
        {!isEmbedded && (
          <div className="sm:hidden px-4 py-2 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Balance</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-black text-white">{balance.toFixed(2)}</span>
                <span className="text-xs font-bold text-yellow-500">SC</span>
              </div>
            </div>
          </div>
        )}
      </motion.header>

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 overflow-y-auto',
          isModal || isEmbedded
            ? 'px-0 py-0'
            : 'px-4 sm:px-6 py-8',
          contentClassName
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
