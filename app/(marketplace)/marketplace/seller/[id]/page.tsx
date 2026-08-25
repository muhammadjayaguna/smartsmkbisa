"use client";
import { useParams } from '@/hooks/marketplace/use-router-dom';
import { useEffect, useState } from 'react';

import { MessageCircle, Star, Package, Calendar, MapPin, Flag } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import ProductCard from '@/components/marketplace/ProductCard';
import ProductCardSkeleton from '@/components/marketplace/ProductCardSkeleton';
import ReportModal from '@/components/marketplace/ReportModal';

interface SellerData {
  id: string;
  full_name: string;
  major: string | null;
  class_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  rating: number;
  sold: number;
}

const SellerProfile = () => {
  const { sellerId } = useParams();
  const { user } = useAuth();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalSold: 0, avgRating: 0 });
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (sellerId) {
      fetchSellerData();
    }
  }, [sellerId]);

  const fetchSellerData = async () => {
    setLoading(true);

    const [profileRes, productsRes, transactionsRes, reviewsRes] = await Promise.all([
      supabase.from('users').select('id, full_name:nama, created_at').eq('id', sellerId!).single(),
      supabase.from('products').select('id, title, price, image_url, category, rating, sold, seller:profiles!products_seller_id_fkey()').eq('seller_id', sellerId!).eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('transactions').select('quantity').eq('seller_id', sellerId!).in('status', ['success', 'completed']),
      supabase.from('reviews').select('rating').in('product_id', (await supabase.from('products').select('id').eq('seller_id', sellerId!)).data?.map(p => p.id) || []),
    ]);

    if (profileRes.data) setSeller(profileRes.data);

    const prods = (productsRes.data as Product[]) || [];
    setProducts(prods);

    const totalSold = (transactionsRes.data as { quantity: number }[])?.reduce((s, t) => s + (t.quantity || 0), 0) || 0;
    const ratingsArray = (reviewsRes.data as { rating: number }[]) || [];
    const avgRating = ratingsArray.length > 0 ? ratingsArray.reduce((s, r) => s + r.rating, 0) / ratingsArray.length : 0;

    setStats({ totalProducts: prods.length, totalSold, avgRating });
    setLoading(false);
  };

  const joinDate = seller ? new Date(seller.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="container py-6">
          <div className="mb-6 animate-pulse rounded-lg bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <span className="mb-3 block text-4xl">😕</span>
          <p className="text-sm text-muted-foreground">Penjual tidak ditemukan</p>
          <Link href="/products" className="mt-3 inline-block text-sm text-primary hover:underline">
            Kembali ke produk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container py-4">
        {/* Breadcrumb */}
        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">Beranda</Link>
          <span>/</span>
          <span className="text-foreground">{seller.full_name}</span>
        </div>

        {/* Seller Card */}
        <div className="mb-4 rounded-lg bg-card border border-border">
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt={seller.full_name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    seller.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-bold text-foreground md:text-lg">{seller.full_name}</h1>
                    {seller.is_verified && (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white" title="Verified Seller">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                  {seller.major && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      <span>{seller.major}</span>
                      {seller.class_name && <span>· {seller.class_name}</span>}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar size={11} />
                    <span>Bergabung {joinDate}</span>
                  </div>
                </div>
              </div>

              {user && user.id !== seller.id && (
                <>
                  <Link href={`/chat?to=${seller.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    <MessageCircle size={14} />
                    Chat Penjual
                  </Link>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Flag size={14} />
                    Laporkan
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 border-t border-border">
            <div className="p-3 text-center">
              <p className="text-base font-bold text-foreground md:text-lg">{stats.totalProducts}</p>
              <p className="text-[10px] text-muted-foreground">Produk</p>
            </div>
            <div className="border-x border-border p-3 text-center">
              <p className="text-base font-bold text-foreground md:text-lg">{stats.totalSold}</p>
              <p className="text-[10px] text-muted-foreground">Terjual</p>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star size={14} className="fill-warning text-warning" />
                <p className="text-base font-bold text-foreground md:text-lg">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-lg bg-card border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Semua Produk ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mb-2 block text-3xl">📦</span>
              <p className="text-sm text-muted-foreground">Belum ada produk yang dijual</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  image_url={product.image_url}
                  category={product.category}
                  seller_id={seller.id}
                  seller_name={seller.full_name}
                  seller_avatar={seller.avatar_url}
                  major={seller.major || undefined}
                  rating={product.rating}
                  sold={product.sold}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={seller.id}
        reportedUserName={seller.full_name}
      />
    </div>
  );
};

export default SellerProfile;
