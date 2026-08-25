"use client";
import { useSearchParams } from '@/hooks/marketplace/use-router-dom';
import { useEffect, useState, useCallback } from 'react';

import { SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import ProductCard from '@/components/marketplace/ProductCard';
import ProductFilter from '@/components/marketplace/ProductFilter';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'popular', label: 'Terpopuler' },
  { value: 'rating', label: 'Rating Tertinggi' },
];

interface Product {
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

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [gridCols, setGridCols] = useState<'grid' | 'list'>('grid');

  const query = searchParams.get('q') || '';
  const major = searchParams.get('major') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('products')
      .select('id, title, price, image_url, category, rating, sold, seller_id, profiles(full_name:nama)')
      .eq('is_active', true);

    if (query) q = q.ilike('title', `%${query}%`);
    if (category) q = q.eq('category', category);
    if (minPrice) q = q.gte('price', Number(minPrice));
    if (maxPrice) q = q.lte('price', Number(maxPrice));
    if (minRating) q = q.gte('rating', Number(minRating));

    if (sort === 'price_asc') q = q.order('price', { ascending: true });
    else if (sort === 'price_desc') q = q.order('price', { ascending: false });
    else if (sort === 'popular') q = q.order('sold', { ascending: false });
    else if (sort === 'rating') q = q.order('rating', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    q = q.limit(50);
    const { data } = await q;

    let normalized = ((data as any[]) || []).map((p) => {
      const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return { ...p, profiles: profile ?? null };
    });

    if (major) {
      normalized = normalized.filter((p) => p.profiles?.major === major);
    }

    setProducts(normalized);
    setLoading(false);
  }, [query, major, category, sort, minPrice, maxPrice, minRating]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const resetFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    setSearchParams(params);
  };

  const activeFilterTags = [
    major && { key: 'major', label: major },
    category && { key: 'category', label: category },
    minPrice && { key: 'minPrice', label: `Min Rp${Number(minPrice).toLocaleString('id-ID')}` },
    maxPrice && { key: 'maxPrice', label: `Max Rp${Number(maxPrice).toLocaleString('id-ID')}` },
    minRating && { key: 'minRating', label: `⭐ ${minRating}+` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-sm font-bold text-foreground">
                {query ? `Hasil pencarian "${query}"` : 'Semua Produk'}
              </h1>
              {!loading && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {products.length} produk ditemukan
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle - desktop */}
              <div className="hidden items-center rounded-sm border border-border md:flex">
                <button
                  onClick={() => setGridCols('grid')}
                  className={`p-1.5 ${gridCols === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setGridCols('list')}
                  className={`p-1.5 ${gridCols === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List size={14} />
                </button>
              </div>
              {/* Mobile filter button */}
              <button
                onClick={() => setShowFilter(true)}
                className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs text-foreground md:hidden"
              >
                <SlidersHorizontal size={14} />
                Filter
                {activeFilterTags.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterTags.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sort tabs */}
          <div className="mt-2 flex gap-4 overflow-x-auto">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter('sort', opt.value)}
                className={`whitespace-nowrap border-b-2 pb-2 text-xs transition-colors ${
                  sort === opt.value
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="flex gap-4">
          {/* Sidebar filter - Desktop */}
          <aside className="hidden md:block">
            <ProductFilter
              major={major}
              category={category}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
              onFilterChange={setFilter}
              onReset={resetFilters}
            />
          </aside>

          {/* Mobile filter overlay */}
          {showFilter && (
            <div className="md:hidden">
              <ProductFilter
                major={major}
                category={category}
                minPrice={minPrice}
                maxPrice={maxPrice}
                minRating={minRating}
                onFilterChange={setFilter}
                onReset={resetFilters}
                onClose={() => setShowFilter(false)}
                isMobile
              />
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1">
            {/* Active filter tags */}
            {activeFilterTags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {activeFilterTags.map((tag) => (
                  <span
                    key={tag.key}
                    className="flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    {tag.label}
                    <button onClick={() => setFilter(tag.key, '')}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={resetFilters}
                  className="rounded-sm px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Hapus Semua
                </button>
              </div>
            )}

            {loading ? (
              <div className={
                gridCols === 'grid'
                  ? 'grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'space-y-2'
              }>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-sm border border-border">
                    <div className={gridCols === 'grid' ? 'aspect-square bg-muted' : 'h-24 bg-muted'} />
                    <div className="space-y-1.5 p-2">
                      <div className="h-3 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center">
                <span className="mb-3 block text-4xl">🔍</span>
                <p className="text-sm font-medium text-foreground">Tidak ada produk ditemukan</p>
                <p className="mt-1 text-xs text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
                {activeFilterTags.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="mt-3 rounded-sm bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className={
                gridCols === 'grid'
                  ? 'grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'space-y-2'
              }>
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
                  />
                ))}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Menampilkan {products.length} produk
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
