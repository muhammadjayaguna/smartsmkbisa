"use client";
import { useParams } from '@/hooks/marketplace/use-router-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Star, Minus, Plus, ShoppingCart, MessageCircle, Store, Shield, Truck, Share2, Flag } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import ProductCard from '@/components/marketplace/ProductCard';
import ReportModal from '@/components/marketplace/ReportModal';

interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  rating: number;
  sold: number;
  profiles: { full_name: string; major: string; avatar_url: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, profiles(full_name:nama)')
      .eq('id', id)
      .single();

    if (data) {
      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      setProduct({ ...data, profiles: profile ?? null } as Product);
    }
    setLoading(false);

    // Fetch related products after we know the product
    if (data) {
      fetchRelatedProducts(data.category, data.id);
      fetchSellerProducts(data.seller_id, data.id);
    }
  };

  const fetchRelatedProducts = async (category: string, currentId: string) => {
    const { data } = await supabase
      .from('products')
      .select('id, title, price, image_url, category, rating, sold, seller_id, profiles(full_name:nama)')
      .eq('category', category)
      .eq('is_active', true)
      .neq('id', currentId)
      .order('sold', { ascending: false })
      .limit(10);

    const normalized = ((data as any[]) || []).map((p) => {
      const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return { ...p, profiles: profile ?? null };
    });
    setRelatedProducts(normalized);
  };

  const fetchSellerProducts = async (sellerId: string, currentId: string) => {
    const { data } = await supabase
      .from('products')
      .select('id, title, price, image_url, category, rating, sold, seller_id, profiles(full_name:nama)')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .neq('id', currentId)
      .order('created_at', { ascending: false })
      .limit(10);

    const normalized = ((data as any[]) || []).map((p) => {
      const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return { ...p, profiles: profile ?? null };
    });
    setSellerProducts(normalized);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles:users(full_name:nama:nama)')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    const normalized = ((data as any[]) || []).map((r) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return { ...r, profiles: profile ?? null };
    });
    setReviews(normalized);
  };

  const addToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product) return;
    setAdding(true);

    const { error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.db_id || user.id,
        product_id: product.id,
        quantity,
      }, { onConflict: 'user_id,product_id' });

    if (error) {
      toast.error('Gagal menambahkan ke keranjang');
    } else {
      toast.success('Berhasil ditambahkan ke keranjang!');
    }
    setAdding(false);
  };

  const buyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    await addToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="container py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-sm bg-muted" />
            <div className="space-y-3">
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-20 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <span className="mb-3 block text-4xl">😕</span>
          <p className="text-sm text-muted-foreground">Produk tidak ditemukan</p>
          <Link href="/products" className="mt-3 inline-block text-sm text-primary hover:underline">Kembali ke produk</Link>
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
          <Link href="/products" className="hover:text-primary">Produk</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
        </div>

        {/* Main content */}
        <div className="overflow-hidden rounded-sm bg-card">
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="aspect-square bg-secondary">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 md:p-6">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h1 className="text-base font-normal text-foreground md:text-lg">{product.title}</h1>
                <button
                  onClick={async () => {
                    const url = window.location.href;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: product.title, text: `Cek ${product.title} di SMK Marketplace!`, url });
                      } catch {}
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link berhasil disalin!');
                    }
                  }}
                  className="shrink-0 flex items-center justify-center rounded-sm p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                  title="Bagikan"
                >
                  <Share2 size={18} />
                </button>
              </div>

              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="fill-warning text-warning" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span>|</span>
                <span>{reviews.length} Penilaian</span>
                <span>|</span>
                <span>{product.sold} Terjual</span>
              </div>

              <div className="mb-4 rounded-sm bg-secondary p-3">
                <p className="font-display text-2xl font-bold text-primary">{formatPrice(product.price)}</p>
              </div>

              {/* Seller info */}
              <div className="mb-4 flex items-center gap-3 rounded-sm border border-border p-3">
                <Link href={`/seller/${product.seller_id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground hover:opacity-80 transition-opacity">
                  {product.profiles?.full_name?.charAt(0) || 'S'}
                </Link>
                <div className="flex-1">
                  <Link href={`/seller/${product.seller_id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {product.profiles?.full_name || 'Penjual'}
                  </Link>
                  <p className="text-xs text-muted-foreground">{product.profiles?.major}</p>
                </div>
                <Link href={`/seller/${product.seller_id}`}
                  className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Store size={14} /> Kunjungi
                </Link>
                {user && user.id !== product.seller_id && (
                  <Link href={`/chat?to=${product.seller_id}&product=${product.id}`}
                    className="flex items-center gap-1 rounded-sm border border-primary px-3 py-1.5 text-xs text-primary hover:bg-primary/5"
                  >
                    <MessageCircle size={14} /> Chat
                  </Link>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <p className="mb-2 text-xs text-muted-foreground">Jumlah</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-border hover:bg-secondary"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-border hover:bg-secondary"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                </div>
              </div>

              {/* Actions - hidden on mobile, shown as sticky bottom bar instead */}
              <div className="hidden gap-2 sm:flex">
                <button
                  onClick={addToCart}
                  disabled={adding || product.stock === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                >
                  <ShoppingCart size={16} />
                  Keranjang
                </button>
                <button
                  onClick={buyNow}
                  disabled={adding || product.stock === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Beli Sekarang
                </button>
              </div>

              {/* Guarantees */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield size={12} /> Jaminan Aman</span>
                  <span className="flex items-center gap-1"><Truck size={12} /> Pengiriman Cepat</span>
                  <span className="flex items-center gap-1"><Store size={12} /> {product.category}</span>
                </div>
                {user && user.id !== product.seller_id && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Flag size={12} /> Laporkan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-2 rounded-sm bg-card p-4">
          <h2 className="mb-3 border-b-2 border-primary pb-2 text-sm font-bold uppercase text-primary">Deskripsi Produk</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {product.description || 'Tidak ada deskripsi.'}
          </p>
        </div>

        {/* Reviews */}
        <div className="mt-2 rounded-sm bg-card p-4">
          <h2 className="mb-3 border-b-2 border-primary pb-2 text-sm font-bold uppercase text-primary">
            Penilaian ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Belum ada penilaian</p>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((review) => (
                <div key={review.id} className="py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{review.profiles?.full_name || 'Anonim'}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} className={i < review.rating ? 'fill-warning text-warning' : 'text-muted'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-foreground">{review.comment}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produk dari Penjual yang Sama */}
        {sellerProducts.length > 0 && (
          <div className="mt-2 rounded-sm bg-card p-4">
            <h2 className="mb-3 border-b-2 border-primary pb-2 text-sm font-bold uppercase text-primary">
              Produk Lain dari Penjual Ini
            </h2>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {sellerProducts.map((p) => (
                <div key={p.id} className="w-[140px] shrink-0 sm:w-[170px]">
                  <ProductCard
                    id={p.id}
                    title={p.title}
                    price={p.price}
                    image_url={p.image_url}
                    category={p.category}
                    seller_id={p.seller_id}
                    seller_name={p.profiles?.full_name}
                    seller_avatar={p.profiles?.avatar_url}
                    major={p.profiles?.major}
                    rating={p.rating}
                    sold={p.sold}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produk Serupa */}
        {relatedProducts.length > 0 && (
          <div className="mt-2 rounded-sm bg-card p-4">
            <h2 className="mb-3 border-b-2 border-primary pb-2 text-sm font-bold uppercase text-primary">
              Produk Serupa
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  price={p.price}
                  image_url={p.image_url}
                  category={p.category}
                  seller_id={p.seller_id}
                  seller_name={p.profiles?.full_name}
                  seller_avatar={p.profiles?.avatar_url}
                  major={p.profiles?.major}
                  rating={p.rating}
                  sold={p.sold}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-14 z-40 flex gap-2 border-t border-border bg-card px-4 py-2.5 sm:hidden safe-area-bottom">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground">Harga</span>
          <span className="font-display text-sm font-bold text-primary">{formatPrice(product.price)}</span>
        </div>
        <button
          onClick={addToCart}
          disabled={adding || product.stock === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary py-2 text-xs font-semibold text-primary disabled:opacity-50"
        >
          <ShoppingCart size={14} />
          Keranjang
        </button>
        <button
          onClick={buyNow}
          disabled={adding || product.stock === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          Beli Sekarang
        </button>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        productId={product.id}
        productTitle={product.title}
        reportedUserId={product.seller_id}
        reportedUserName={product.profiles?.full_name}
      />
    </div>
  );
};

export default ProductDetail;
