"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface WishlistContextType {
  wishlistIds: Set<string>;
  toggle: (productId: string) => Promise<void>;
  isWished: (productId: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: new Set(),
  toggle: async () => {},
  isWished: () => false,
  count: 0,
});

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlistIds(new Set()); return; }
    const { data } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.db_id || user.id);
    setWishlistIds(new Set((data || []).map(w => w.product_id)));
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggle = useCallback(async (productId: string) => {
    if (!user) return;
    const isCurrentlyWished = wishlistIds.has(productId);

    // Optimistic update
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyWished) next.delete(productId);
      else next.add(productId);
      return next;
    });

    if (isCurrentlyWished) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.db_id || user.id)
        .eq('product_id', productId);
    } else {
      await supabase
        .from('wishlists')
        .insert({ user_id: user.db_id || user.id, product_id: productId });
    }
  }, [user, wishlistIds]);

  const isWished = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle, isWished, count: wishlistIds.size }}>
      {children}
    </WishlistContext.Provider>
  );
};
