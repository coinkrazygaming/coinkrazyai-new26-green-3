import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Mail, Copy, Check, X, Share2, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

interface SocialSharePopupProps {
  isOpen: boolean;
  winAmount: number;
  gameName: string;
  gameId?: number;
  primaryColor?: string;
  onClose: () => void;
  onShare?: (platform: string, message: string) => Promise<void>;
}

export const SocialSharePopup: React.FC<SocialSharePopupProps> = ({
  isOpen,
  winAmount,
  gameName,
  gameId,
  primaryColor,
  onClose,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const brandPrimary = primaryColor || '#39FF14';

  const shareMessage = `🎉 I just won ${winAmount} SC playing ${gameName} on CoinKrazy Social Casino! 🎰 Join me and win big! 💰 https://coinkrazy.io/?ref=social`;

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2] hover:bg-[#1877F2]/90',
      url: `https://www.facebook.com/sharer/sharer.php?u=https://coinkrazy.io&quote=${encodeURIComponent(shareMessage)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2] hover:bg-[#1DA1F2]/90',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-[#EA4335] hover:bg-[#EA4335]/90',
      url: `mailto:?subject=Check out CoinKrazy!&body=${encodeURIComponent(shareMessage)}`
    }
  ];

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    toast.success('Share message copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: string, url: string) => {
    setIsSharing(true);

    try {
      // Record the share via API
      await apiCall('/social/share', {
        method: 'POST',
        body: JSON.stringify({
          platform,
          message: shareMessage,
          winAmount,
          gameName,
          gameId
        })
      });

      if (onShare) {
        await onShare(platform, shareMessage);
      }

      // Open share URL
      window.open(url, '_blank', 'width=600,height=400');
      toast.success(`Shared to ${platform}!`);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md border-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-2xl"
        style={{ borderColor: `${brandPrimary}44` }}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div
                className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border-2 animate-pulse"
                style={{ borderColor: `${brandPrimary}88`, backgroundColor: `${brandPrimary}22` }}
              >
                <Trophy className="w-10 h-10" style={{ color: brandPrimary }} />
              </div>
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
            SHARE THE GLORY!
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">
            Show off your <span style={{ color: brandPrimary }}>{winAmount} SC</span> win at {gameName}!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Share Message Preview */}
          <div className="bg-slate-900 border-2 border-white/5 rounded-2xl p-4 relative group">
            <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-white/5 rounded">
              Your Victory Message
            </div>
            <p className="text-sm font-medium leading-relaxed italic text-slate-300 pt-2">
              "{shareMessage}"
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyMessage}
              className="absolute top-2 right-2 h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/5"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Social Platforms */}
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform.name, platform.url)}
                  disabled={isSharing}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 border border-transparent',
                    platform.color,
                    'text-white font-black italic uppercase text-[10px] tracking-tight shadow-xl',
                    'hover:scale-105 active:scale-95',
                    isSharing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span>{platform.name}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-black italic uppercase text-xs text-slate-500 hover:text-white hover:bg-white/5 border border-white/5"
              onClick={onClose}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1 text-white font-black italic uppercase text-xs rounded-xl shadow-xl h-12"
              style={{ backgroundColor: brandPrimary, boxShadow: `0 10px 20px -5px ${brandPrimary}44` }}
              onClick={onClose}
            >
              Continue Winning
            </Button>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic pt-2">
            <Share2 className="w-3 h-3" />
            <span>Sharing boosts your LuckyAI Score!</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
