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
        // Get profile - works for both player and admin tokens
        const response = await auth.getProfile();
        setUser(response.data);
        setIsAdmin(response.data.isAdmin || response.data.role === 'admin');
        console.log('[AuthContext] ✓ User authenticated on mount:', response.data.username);
      } catch (error: any) {
        // Not logged in or token invalid
        if (error.status === 401) {
          console.debug('[AuthContext] No session found (user not logged in)');
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
    // Try admin logout first if admin, otherwise use player logout
    if (isAdmin) {
      auth.adminLogout().catch(() => auth.logout().catch(console.error));
    } else {
      auth.logout().catch(console.error);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.adminLogin(email, password);
      setIsAdmin(true);

      // Set user profile if the admin has an associated player account
      if (response.playerProfile) {
        setUser(response.playerProfile);
        console.log('[AuthContext] ✓ Admin logged in with player profile:', response.playerProfile.username);
      } else {
        // Admin-only account (no player profile)
        // Create a minimal user object for the admin
        setUser({
          id: 0,
          username: 'admin',
          name: 'Administrator',
          email: email,
          gc_balance: 0,
          sc_balance: 0,
          status: 'active',
          kyc_level: 'admin',
          kyc_verified: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          role: 'admin',
          isAdmin: true
        });
        console.log('[AuthContext] ✓ Admin logged in (admin-only account)');
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
