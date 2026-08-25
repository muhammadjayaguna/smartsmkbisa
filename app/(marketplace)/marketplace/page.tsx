"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Wrench, Palette, BarChart3, ShoppingBag, Briefcase, GraduationCap, BookOpen, Users, Award } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import ProductCard from '@/components/marketplace/ProductCard';
import ProductCardSkeleton from '@/components/marketplace/ProductCardSkeleton';
import HeroBanner from '@/components/marketplace/HeroBanner';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  rating: number;
  sold: number;
  seller_id: string;
  profiles?: { full_name: string; major: string; avatar_url: string | null; is_verified: boolean } | null;
}

const CATEGORIES = [
  { icon: Wrench, label: 'TKJ', desc: 'Teknik Komputer' },
  { icon: Palette, label: 'Multimedia', desc: 'Desain & Media' },
  { icon: BarChart3, label: 'Akuntansi', desc: 'Keuangan' },
  { icon: ShoppingBag, label: 'Pemasaran', desc: 'Marketing' },
  { icon: Briefcase, label: 'Perkantoran', desc: 'Administrasi' },
  { icon: GraduationCap, label: 'Barang', desc: 'Produk Fisik' },
  { icon: Zap, label: 'Jasa', desc: 'Layanan' },
];

const TRUST_ITEMS = [
  { icon: BookOpen, label: 'Berbasis Kurikulum', desc: 'Produk sesuai kompetensi keahlian' },
  { icon: Users, label: 'Komunitas Sekolah', desc: 'Dibuat oleh siswa-siswi terbaik' },
  { icon: Award, label: 'Kualitas Terjamin', desc: 'Dibimbing langsung oleh guru' },
];

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, title, price, image_url, category, rating, sold, seller_id, profiles(full_name:nama)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    const normalized = ((data as any[]) || []).map((p) => {
      const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return { ...p, profiles: profile ?? null };
    });

    setProducts(normalized);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="container py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRUST_ITEMS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Icons */}
      <section className="border-b border-border bg-card">
        <div className="container py-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Jelajahi Jurusan</h2>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {CATEGORIES.map(({ icon: Icon, label, desc }) => (
              <Link key={label}
                href={['Barang', 'Jasa'].includes(label) ? `/products?category=${label}` : `/products?major=${label}`}
                className="group flex flex-col items-center gap-1.5 rounded-lg py-3 transition-colors hover:bg-secondary"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-medium text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      <section className="mt-2 bg-card">
        <div className="container py-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5">
                <Zap size={14} className="text-primary-foreground animate-flash-pulse" />
                <span className="text-xs font-bold text-primary-foreground uppercase tracking-wide">Flash Sale</span>
              </div>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Lihat Semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[150px] shrink-0 md:w-[170px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              products.slice(0, 10).map((product) => (
                <div key={product.id} className="w-[150px] shrink-0 md:w-[170px]">
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
                    is_verified={product.profiles?.is_verified}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mt-2 bg-card">
        <div className="container py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-foreground">Produk Terbaru</h2>
            <Link href="/products" className="text-xs font-medium text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
              <span className="mb-3 block text-4xl">📦</span>
              <p className="text-sm font-medium text-foreground">Belum ada produk</p>
              <p className="mt-1 text-xs text-muted-foreground">Jadilah yang pertama berjualan di marketplace sekolah!</p>
              <Link href="/register"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Daftar Sekarang <ArrowRight size={14} />
              </Link>
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
                  seller_id={product.seller_id}
                  seller_name={product.profiles?.full_name}
                  seller_avatar={product.profiles?.avatar_url}
                  major={product.profiles?.major}
                  rating={product.rating}
                  sold={product.sold}
                  is_verified={product.profiles?.is_verified}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="container py-10 text-center">
          <h2 className="font-display text-lg font-bold text-primary-foreground md:text-xl">
            Punya Keahlian? Mulai Berjualan!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-primary-foreground/70 md:text-sm">
            Siswa SMKN 1 Banjarmasin bisa membuka toko gratis dan menjual produk atau jasa langsung di platform ini.
          </p>
          <Link href="/register"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Daftar Gratis <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
