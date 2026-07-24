'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';

interface UserProfile {
  id: number | string;
  name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_country: string;
  gender: string;
  dob: string;
  image: string | null;
  is_verified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (token: string, phone?: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load initial auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      // Fetch fresh profile
      fetchProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchProfile(authToken?: string) {
    try {
      const profileData = await api.get<{ data: UserProfile }>(ENDPOINTS.PROFILE_ME);
      const profile = profileData?.data || profileData;
      setUser(profile as UserProfile);
    } catch {
      // If profile fetch fails with 401, token is invalid
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback((newToken: string, phone?: string) => {
    localStorage.setItem('access_token', newToken);
    if (phone) {
      localStorage.setItem('phone', phone);
    }
    setToken(newToken);
    setIsAuthenticated(true);
    fetchProfile(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.AUTH_LOGOUT);
    } catch {
      // Proceed with local logout even if API fails
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('phone');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, []);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login,
        logout,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // ponytail: SSR/prerender no-op so static export doesn't crash; throws in-browser to catch a missing provider.
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, isLoading: true, user: null, token: null, login: () => {}, logout: async () => {}, refreshProfile: async () => {}, updateUser: () => {} };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
