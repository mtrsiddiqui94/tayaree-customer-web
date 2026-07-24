'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartCount: number;
  refreshCartCount: () => Promise<void>;
  incrementCount: () => void;
  decrementCount: () => void;
  setCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const result = await api.get<{ data: { count: number } }>(ENDPOINTS.CART_COUNT);
      setCartCount(result?.data?.count ?? 0);
    } catch {
      // Silently fail — cart count is non-critical
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  const incrementCount = useCallback(() => setCartCount(prev => prev + 1), []);
  const decrementCount = useCallback(() => setCartCount(prev => Math.max(0, prev - 1)), []);
  const setCount = useCallback((count: number) => setCartCount(count), []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, incrementCount, decrementCount, setCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // ponytail: SSR/prerender no-op so static export doesn't crash; throws in-browser to catch a missing provider.
    if (typeof window === 'undefined') {
      return { cartCount: 0, refreshCartCount: async () => {}, incrementCount: () => {}, decrementCount: () => {}, setCount: () => {} };
    }
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
