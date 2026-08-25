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
      className="group relative block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/20 hover:shadow-sm"
    >
      {/* Action buttons */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button
          onClick={handleWishlist}
          className={`rounded-full p-1.5 shadow-sm backdrop-blur-sm transition-all ${
            wished
              ? 'bg-destructive/10 text-destructive'
              : 'bg-card/70 text-muted-foreground hover:text-destructive hover:bg-card/90'
          }`}
          title={wished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          <Heart size={16} className={wished ? 'fill-current' : ''} />
        </button>
        <button
          onClick={handleShare}
          className="rounded-full p-1.5 shadow-sm backdrop-blur-sm bg-card/70 text-muted-foreground hover:text-primary hover:bg-card/90 transition-all"
          title="Bagikan"
        >
          <Share2 size={14} />
        </button>
      </div>

      <div className="aspect-square overflow-hidden bg-secondary">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="text-3xl text-muted-foreground">📦</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="mb-1.5 text-xs text-foreground line-clamp-2 leading-snug min-h-[2.25rem]">
          {title}
        </h3>
        <p className="mb-1.5 text-sm font-bold text-primary">
          {formatPrice(price)}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {rating > 0 && (
            <>
              <Star size={10} className="fill-warning text-warning" />
              <span>{rating.toFixed(1)}</span>
              <span className="mx-0.5 opacity-40">·</span>
            </>
          )}
          <span>{sold} terjual</span>
        </div>
        {(seller_name || major) && (
          <div
            onClick={handleSellerClick}
            className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground overflow-hidden">
              {seller_avatar ? (
                <img src={seller_avatar} alt={seller_name || ''} className="h-full w-full object-cover" />
              ) : (
                (seller_name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex items-center gap-0.5 truncate">
              <span className="truncate">{seller_name || major}</span>
              {is_verified && (
                <div className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[6px] text-white" title="Verified Seller">
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
