"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useWishlist } from '@/contexts/marketplace/WishlistContext';
import ProductCard from '@/components/marketplace/ProductCard';

interface WishlistProduct {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  rating: number;
  sold: number;
  seller_id: string;
  profiles?: { full_name: string; major: string; avatar_url: string | null } | null;
}

const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistIds, toggle } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || wishlistIds.size === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const ids = Array.from(wishlistIds);
      const { data } = await supabase
        .from('products')
        .select('id, title, price, image_url, category, rating, sold, seller_id, profiles(full_name:nama)')
        .in('id', ids)
        .eq('is_active', true);

      const normalized = ((data as any[]) || []).map((p) => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        return { ...p, profiles: profile ?? null };
      });
      setProducts(normalized);
      setLoading(false);
    };
    fetchProducts();
  }, [user, wishlistIds]);

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <Heart size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-lg font-bold text-foreground mb-2">Wishlist</h1>
          <p className="text-sm text-muted-foreground mb-4">Masuk untuk menyimpan produk favoritmu</p>
          <Link href="/login" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-primary fill-primary" />
            <h1 className="font-display text-base font-bold text-foreground">Wishlist Saya</h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {products.length} produk disimpan
          </p>
        </div>
      </div>

      <div className="container py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border">
                <div className="aspect-square bg-muted" />
                <div className="space-y-1.5 p-2.5">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Heart size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Wishlist masih kosong</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Klik ikon ❤️ pada produk untuk menambahkan ke wishlist
            </p>
            <Link href="/products"
              className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  image_url={product.image_url}
                  category={product.category}
                  seller_id={product.seller_id}
                  seller_name={product.profiles?.full_name}
                  seller_avatar={product.profiles?.avatar_url}
                  major={product.profiles?.major}
                  rating={product.rating}
                  sold={product.sold}
                />
                <button
                  onClick={(e) => { e.preventDefault(); toggle(product.id); }}
                  className="absolute right-2 top-2 z-10 rounded-full bg-card/80 p-1.5 text-destructive shadow-sm backdrop-blur-sm hover:bg-card transition-colors"
                  title="Hapus dari wishlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
