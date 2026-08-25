"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Wrench, Palette, BarChart3, ShoppingBag, Briefcase, GraduationCap, BookOpen, Users, Award } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import ProductCard from '@/components/marketplace/ProductCard';
import ProductCardSkeleton from '@/components/marketplace/ProductCardSkeleton';
import HeroBanner from '@/components/marketplace/HeroBanner';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

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

const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'dummy-1',
    title: 'Jasa Install Ulang Windows 11 & Office (Lengkap)',
    price: 50000,
    image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=80',
    category: 'Jasa',
    rating: 4.8,
    sold: 12,
    seller_id: 'dummy-seller-1',
    profiles: { full_name: 'Budi Santoso', major: 'TKJ', avatar_url: null, is_verified: true },
  },
  {
    id: 'dummy-2',
    title: 'Desain Logo Profesional untuk UMKM & Sekolah',
    price: 150000,
    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80',
    category: 'Jasa',
    rating: 5.0,
    sold: 8,
    seller_id: 'dummy-seller-2',
    profiles: { full_name: 'Siti Aminah', major: 'Multimedia', avatar_url: null, is_verified: true },
  },
  {
    id: 'dummy-3',
    title: 'Buku Catatan Praktikum Akuntansi Ringkas',
    price: 35000,
    image_url: 'https://images.unsplash.com/photo-1544716278-e513176f20b5?w=500&q=80',
    category: 'Barang',
    rating: 4.5,
    sold: 25,
    seller_id: 'dummy-seller-3',
    profiles: { full_name: 'Dewi Lestari', major: 'Akuntansi', avatar_url: null, is_verified: false },
  },
  {
    id: 'dummy-4',
    title: 'Jasa Ketik Dokumen Cepat & Rapih',
    price: 10000,
    image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&q=80',
    category: 'Jasa',
    rating: 4.9,
    sold: 40,
    seller_id: 'dummy-seller-4',
    profiles: { full_name: 'Agus Pratama', major: 'Perkantoran', avatar_url: null, is_verified: true },
  },
  {
    id: 'dummy-5',
    title: 'Kabel LAN Cat 6 Custom (Harga per Meter)',
    price: 5000,
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=80',
    category: 'Barang',
    rating: 4.7,
    sold: 110,
    seller_id: 'dummy-seller-1',
    profiles: { full_name: 'Budi Santoso', major: 'TKJ', avatar_url: null, is_verified: true },
  },
];

const Index = () => {
  const [products, setProducts] = useState<Product[]>(DUMMY_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, image_url, category, rating, sold, seller_id, profiles(full_name:nama)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    let normalized: Product[] = [];
    if (data && data.length > 0) {
      normalized = (data as any[]).map((p) => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        return { ...p, profiles: profile ?? null };
      });
    }
    
    // Always show dummy products for demonstration purposes if DB is empty, or append them
    setProducts(normalized.length > 0 ? [...normalized, ...DUMMY_PRODUCTS] : DUMMY_PRODUCTS);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-4 pb-2 md:pt-6">
        <PageBreadcrumb currentPage="Marketplace" />
      </div>

      {/* Hero Banner */}
      <HeroBanner />

      {/* Trust bar */}
      <section className="bg-card shadow-sm relative z-10">
        <div className="container py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TRUST_ITEMS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-secondary/50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20">
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Icons */}
      <section className="mt-4 bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground text-center">Jelajahi Jurusan & Kategori</h2>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-7">
            {CATEGORIES.map(({ icon: Icon, label, desc }) => (
              <Link key={label}
                href={['Barang', 'Jasa'].includes(label) ? `/products?category=${label}` : `/products?major=${label}`}
                className="group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 dark:hover:bg-secondary/80"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-md">
                  <Icon size={24} />
                </div>
                <span className="text-xs font-bold text-foreground text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      <section className="mt-6">
        <div className="container py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 shadow-md shadow-red-500/20">
                <Zap size={16} className="text-white animate-flash-pulse" />
                <span className="text-sm font-black text-white uppercase tracking-widest">Flash Sale</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground hidden sm:block">Berakhir dalam 02:45:10</span>
            </div>
            <Link href="/products" className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
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
      <section className="mt-6 mb-12">
        <div className="container py-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-black text-foreground">Produk Terbaru</h2>
            <Link href="/products" className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
              Lihat Semua <ArrowRight size={14} />
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
      <section className="bg-gradient-to-br from-primary via-primary to-blue-700 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
        
        <div className="container relative z-10 py-16 text-center">
          <h2 className="font-display text-2xl font-black text-white md:text-3xl drop-shadow-md">
            Punya Keahlian? Mulai Berjualan!
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/90 md:text-base font-medium leading-relaxed">
            Siswa SMKN 1 Banjarmasin bisa membuka toko gratis dan menjual produk atau jasa langsung di platform ini. Bangun portofolio dan dapatkan penghasilan!
          </p>
          <Link href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-accent-foreground shadow-xl transition-all hover:bg-accent/90 hover:scale-105 active:scale-95 hover:shadow-accent/40"
          >
            Buka Toko Gratis Sekarang <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
