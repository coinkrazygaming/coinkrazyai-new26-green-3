import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface SpinWheelData {
  canSpin: boolean;
  nextAvailableAt: string | null;
  lastReward: {
    sc: number;
    gc: number;
    claimedAt: string;
  } | null;
  totalSpins: number;
}

interface ClaimRewardResponse {
  success: boolean;
  data?: {
    rewardSC: number;
    rewardGC: number;
    nextAvailableAt: string;
    claimedAt: string;
  };
  error?: string;
  timeRemainingMs?: number;
}

export const useSpinWheel = () => {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [wheelData, setWheelData] = useState<SpinWheelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastReward, setLastReward] = useState<{ sc: number; gc: number } | null>(null);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState<number | null>(null);

  // Fetch spin wheel status
  const fetchWheelStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/spin-wheel/status', {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to fetch spin wheel status');
        return;
      }

      const result: { success: boolean; data: SpinWheelData } = await response.json();
      if (result.success) {
        setWheelData(result.data);

        // Calculate time until next spin
        if (result.data.nextAvailableAt && !result.data.canSpin) {
          const nextTime = new Date(result.data.nextAvailableAt).getTime();
          const now = Date.now();
          const remaining = Math.max(0, nextTime - now);
          setTimeUntilNextSpin(remaining);
        } else {
          setTimeUntilNextSpin(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch spin wheel status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Claim reward from spin
  const claimReward = async () => {
    if (!wheelData?.canSpin) {
      toast.error('You can spin again later');
      return;
    }

    try {
      setIsSpinning(true);
      const response = await fetch('/api/spin-wheel/claim', {
        method: 'POST',
        credentials: 'include'
      });

      const result: ClaimRewardResponse = await response.json();

      if (!response.ok) {
        const timeRemaining = result.timeRemainingMs;
        if (timeRemaining) {
          const hours = Math.ceil(timeRemaining / (1000 * 60 * 60));
          toast.error(`Come back in ${hours}h for your next spin!`);
        } else {
          toast.error(result.error || 'Failed to claim reward');
        }
        setIsSpinning(false);
        return;
      }

      if (result.success && result.data) {
        const { rewardSC, rewardGC, nextAvailableAt } = result.data;
        setLastReward({ sc: rewardSC, gc: rewardGC });
        
        // Show success toast
        toast.success(`🎉 You won ${rewardSC.toFixed(2)} SC and ${rewardGC.toFixed(2)} GC!`);

        // Refresh profile to update wallet
        await refreshProfile();

        // Update wheel data
        setWheelData({
          canSpin: false,
          nextAvailableAt,
          lastReward: {
            sc: rewardSC,
            gc: rewardGC,
            claimedAt: new Date().toISOString()
          },
          totalSpins: (wheelData.totalSpins || 0) + 1
        });

        // Set countdown timer
        const nextTime = new Date(nextAvailableAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, nextTime - now);
        setTimeUntilNextSpin(remaining);
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      toast.error('An error occurred while spinning');
    } finally {
      setIsSpinning(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWheelStatus();
    }
  }, [isAuthenticated, user?.id]);

  // Countdown timer for next spin
  useEffect(() => {
    if (!timeUntilNextSpin || timeUntilNextSpin <= 0) return;

    const timer = setInterval(() => {
      setTimeUntilNextSpin(prev => {
        if (!prev || prev <= 1000) {
          // Refresh when ready
          fetchWheelStatus();
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeUntilNextSpin]);

  const formatTimeRemaining = (ms: number | null): string => {
    if (!ms || ms <= 0) return 'Ready!';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return {
    wheelData,
    isLoading,
    isSpinning,
    showModal,
    setShowModal,
    lastReward,
    claimReward,
    timeUntilNextSpin,
    formatTimeRemaining,
    fetchWheelStatus
  };
};
