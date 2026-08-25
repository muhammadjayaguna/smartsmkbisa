"use client";

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Star, RotateCcw } from 'lucide-react';
import PriceRangeSlider from '@/components/marketplace/PriceRangeSlider';

const MAJORS = ['TKJ', 'Multimedia', 'Akuntansi', 'Pemasaran', 'Perkantoran'];
const CATEGORIES = ['Barang', 'Jasa'];
const PRICE_RANGES = [
  { label: 'Semua Harga', min: 0, max: 0 },
  { label: 'Di bawah Rp10.000', min: 0, max: 10000 },
  { label: 'Rp10.000 - Rp50.000', min: 10000, max: 50000 },
  { label: 'Rp50.000 - Rp100.000', min: 50000, max: 100000 },
  { label: 'Rp100.000 - Rp500.000', min: 100000, max: 500000 },
  { label: 'Di atas Rp500.000', min: 500000, max: 0 },
];
const RATING_OPTIONS = [4, 3, 2, 1];

interface ProductFilterProps {
  major: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

const ProductFilter = ({
  major,
  category,
  minPrice,
  maxPrice,
  minRating,
  onFilterChange,
  onReset,
  onClose,
  isMobile = false,
}: ProductFilterProps) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    major: true,
    price: true,
    rating: true,
  });

  const [customMin, setCustomMin] = useState(minPrice);
  const [customMax, setCustomMax] = useState(maxPrice);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilters = [major, category, minPrice, maxPrice, minRating].filter(Boolean).length;

  const selectedPriceRange = PRICE_RANGES.find(
    (r) => String(r.min) === (minPrice || '0') && String(r.max) === (maxPrice || '0')
  );

  const handlePriceRange = (min: number, max: number) => {
    if (min === 0 && max === 0) {
      onFilterChange('minPrice', '');
      onFilterChange('maxPrice', '');
      setCustomMin('');
      setCustomMax('');
    } else {
      onFilterChange('minPrice', min > 0 ? String(min) : '');
      onFilterChange('maxPrice', max > 0 ? String(max) : '');
      setCustomMin(min > 0 ? String(min) : '');
      setCustomMax(max > 0 ? String(max) : '');
    }
  };

  const handleCustomPrice = () => {
    onFilterChange('minPrice', customMin);
    onFilterChange('maxPrice', customMax);
  };

  const handleReset = () => {
    setCustomMin('');
    setCustomMax('');
    onReset();
  };

  return (
    <div className={`${isMobile ? 'fixed inset-0 z-50 overflow-y-auto bg-card' : 'w-52 shrink-0'}`}>
      {/* Mobile header */}
      {isMobile && (
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <h2 className="font-display text-sm font-bold text-foreground">Filter Produk</h2>
          <button onClick={onClose} className="rounded-sm p-1 hover:bg-secondary">
            <X size={20} className="text-foreground" />
          </button>
        </div>
      )}

      <div className={isMobile ? 'p-4' : ''}>
        {/* Active filters count + reset */}
        {activeFilters > 0 && (
          <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-3'}`}>
            <span className="text-xs text-muted-foreground">
              {activeFilters} filter aktif
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>
        )}

        {/* Category section */}
        <FilterSection
          title="Kategori"
          expanded={expandedSections.category}
          onToggle={() => toggleSection('category')}
          isMobile={isMobile}
        >
          <div className="space-y-0.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onFilterChange('category', c === category ? '' : c);
                  if (isMobile) onClose?.();
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-xs transition-colors ${
                  c === category
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    c === category
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  }`}
                >
                  {c === category && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {c}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Major section */}
        <FilterSection
          title="Jurusan"
          expanded={expandedSections.major}
          onToggle={() => toggleSection('major')}
          isMobile={isMobile}
        >
          <div className="space-y-0.5">
            {MAJORS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  onFilterChange('major', m === major ? '' : m);
                  if (isMobile) onClose?.();
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-xs transition-colors ${
                  m === major
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    m === major
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  }`}
                >
                  {m === major && <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </span>
                {m}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price section */}
        <FilterSection
          title="Harga"
          expanded={expandedSections.price}
          onToggle={() => toggleSection('price')}
          isMobile={isMobile}
        >
          {/* Price range slider */}
          <div className="px-1.5 mb-3">
            <PriceRangeSlider
              min={0}
              max={500000}
              valueMin={Number(customMin) || 0}
              valueMax={Number(customMax) || 500000}
              onChange={(newMin, newMax) => {
                setCustomMin(newMin > 0 ? String(newMin) : '');
                setCustomMax(newMax < 500000 ? String(newMax) : '');
                onFilterChange('minPrice', newMin > 0 ? String(newMin) : '');
                onFilterChange('maxPrice', newMax < 500000 ? String(newMax) : '');
              }}
            />
          </div>

          {/* Quick price ranges */}
          <div className="space-y-0.5">
            {PRICE_RANGES.map((range) => {
              const isSelected =
                (range.min === 0 && range.max === 0 && !minPrice && !maxPrice) ||
                (selectedPriceRange === range && (minPrice || maxPrice));
              return (
                <button
                  key={range.label}
                  onClick={() => handlePriceRange(range.min, range.max)}
                  className={`block w-full rounded-sm px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Custom price input */}
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Rentang Harga Custom
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-full rounded-sm border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <input
                type="number"
                placeholder="Max"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="w-full rounded-sm border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={handleCustomPrice}
              className="mt-1.5 w-full rounded-sm bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Terapkan
            </button>
          </div>
        </FilterSection>

        {/* Rating section */}
        <FilterSection
          title="Rating"
          expanded={expandedSections.rating}
          onToggle={() => toggleSection('rating')}
          isMobile={isMobile}
        >
          <div className="space-y-0.5">
            {RATING_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onFilterChange('minRating', String(r) === minRating ? '' : String(r));
                  if (isMobile) onClose?.();
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-xs transition-colors ${
                  String(r) === minRating
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < r ? 'fill-warning text-warning' : 'text-border'}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">ke atas</span>
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Mobile apply button */}
      {isMobile && (
        <div className="sticky bottom-0 border-t border-border bg-card p-4">
          <button
            onClick={onClose}
            className="w-full rounded-sm bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Tampilkan Hasil
          </button>
        </div>
      )}
    </div>
  );
};

/* Collapsible section wrapper */
const FilterSection = ({
  title,
  expanded,
  onToggle,
  isMobile,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
  children: React.ReactNode;
}) => (
  <div className={`rounded-sm border border-border bg-card ${isMobile ? 'mb-3' : 'mb-2'}`}>
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-3 py-2.5"
    >
      <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</h3>
      {expanded ? (
        <ChevronUp size={14} className="text-muted-foreground" />
      ) : (
        <ChevronDown size={14} className="text-muted-foreground" />
      )}
    </button>
    {expanded && <div className="px-1.5 pb-2.5">{children}</div>}
  </div>
);

export default ProductFilter;
