import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlayerProfile } from '@shared/api';
import { auth } from './api';
import { io } from 'socket.io-client';

interface AuthContextType {
  user: PlayerProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  adminLogin: (email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Socket connection for real-time balance updates
  useEffect(() => {
    if (user) {
      const socket = io(); // Connect to same host

      socket.on(`wallet:${user.id}`, (data: any) => {
        console.log('[Socket] Received wallet update:', data);
        setUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            gc_balance: data.goldCoins !== undefined ? data.goldCoins : prev.gc_balance,
            sc_balance: data.sweepsCoins !== undefined ? data.sweepsCoins : prev.sc_balance,
          };
        });
      });

      socket.on('wallet:update', (data: any) => {
        // Fallback or global update
        if (data.userId === user.id || !data.userId) {
          setUser(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              gc_balance: data.goldCoins !== undefined ? data.goldCoins : prev.gc_balance,
              sc_balance: data.sweepsCoins !== undefined ? data.sweepsCoins : prev.sc_balance,
            };
          });
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?.id]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await auth.getProfile();
        setUser(response.data);
        setIsAdmin(response.data.isAdmin || response.data.role === 'admin');
        console.log('[AuthContext] ✓ User authenticated on mount:', response.data.username);
      } catch (error: any) {
        // Not logged in or token invalid - this is expected behavior
        if (error.status === 401) {
          console.debug('[AuthContext] No session found on mount (user not logged in)');
        } else {
          console.error('[AuthContext] Auth check failed:', error.message || error);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.login(username, password);
      setUser(response.data.player);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (username: string, name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.register(username, name, email, password);
      setUser(response.data.player);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    auth.logout().catch(console.error);
  };

  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.adminLogin(email, password);
      setIsAdmin(true);

      // If sitewide admin is recognized (has player profile), set user profile too
      if (response.playerProfile) {
        setUser(response.playerProfile);
      } else {
        // Just call getProfile to refresh state
        try {
          const profileResponse = await auth.getProfile();
          setUser(profileResponse.data);
          setIsAdmin(true);
} catch (e) { console.error('Failed to refresh profile after admin login:', e); }
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await auth.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAdmin,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    adminLogin,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
