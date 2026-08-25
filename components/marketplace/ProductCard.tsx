"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Share2 } from 'lucide-react';
import { useWishlist } from '@/contexts/marketplace/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  seller_id?: string;
  seller_name?: string;
  seller_avatar?: string | null;
  major?: string;
  rating?: number;
  sold?: number;
  is_verified?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const ProductCard = ({ id, title, price, image_url, category, seller_id, seller_name, seller_avatar, major, rating = 0, sold = 0, is_verified = false }: ProductCardProps) => {
  const { isWished, toggle } = useWishlist();
  const { user } = useAuth();
  const router = useRouter();
  const wished = isWished(id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Masuk terlebih dahulu untuk menyimpan ke wishlist');
      return;
    }
    await toggle(id);
    toast.success(wished ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist ❤️');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/products/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Cek ${title} di SMK Marketplace!`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link berhasil disalin!');
    }
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    if (!seller_id) return;
    e.preventDefault();
    e.stopPropagation();
    router.push(`/seller/${seller_id}`);
  };

  return (
    <Link href={`/products/${id}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Action buttons */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:opacity-100">
        <button
          onClick={handleWishlist}
          className={`rounded-full p-2 shadow-sm backdrop-blur-md transition-all ${
            wished
              ? 'bg-destructive/10 text-destructive'
              : 'bg-black/20 text-white hover:text-destructive hover:bg-black/40'
          }`}
          title={wished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          <Heart size={16} className={wished ? 'fill-current' : ''} />
        </button>
        <button
          onClick={handleShare}
          className="rounded-full p-2 shadow-sm backdrop-blur-md bg-black/20 text-white hover:text-primary hover:bg-black/40 transition-all"
          title="Bagikan"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="aspect-square overflow-hidden bg-secondary/50 relative">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/30">
            <span className="text-4xl text-muted-foreground/50">📦</span>
          </div>
        )}
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="p-3">
        <h3 className="mb-1.5 text-xs text-foreground font-medium line-clamp-2 leading-snug min-h-[2.25rem] group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mb-2 text-sm font-extrabold text-primary tracking-tight">
          {formatPrice(price)}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star size={10} className="fill-warning text-warning" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            </div>
          )}
          {rating > 0 && <span className="opacity-30">|</span>}
          <span>{sold} terjual</span>
        </div>
        {(seller_name || major) && (
          <div
            onClick={handleSellerClick}
            className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group/seller"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary overflow-hidden ring-1 ring-primary/20 transition-all group-hover/seller:ring-primary/50">
              {seller_avatar ? (
                <img src={seller_avatar} alt={seller_name || ''} className="h-full w-full object-cover" />
              ) : (
                (seller_name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex items-center gap-1 truncate">
              <span className="truncate font-medium group-hover/seller:text-primary transition-colors">{seller_name || major}</span>
              {is_verified && (
                <div className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[6px] text-white shadow-sm" title="Verified Seller">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
