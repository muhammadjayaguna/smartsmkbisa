"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

import { Search, Clock, TrendingUp, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';

interface Suggestion {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
}

const POPULAR_SEARCHES = [
  'Jasa Desain Logo',
  'Install Laptop',
  'Flashdisk',
  'Edit Video',
  'Kabel UTP',
];

const MAX_HISTORY = 5;

const SearchAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('search-history') || '[]');
    } catch { return []; }
  });
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, title, price, image_url, category')
      .eq('is_active', true)
      .ilike('title', `%${q}%`)
      .order('sold', { ascending: false })
      .limit(6);
    setSuggestions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
    setSelectedIdx(-1);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  const saveHistory = (term: string) => {
    const updated = [term, ...history.filter(h => h !== term)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem('search-history', JSON.stringify(updated));
  };

  const doSearch = (term: string) => {
    if (!term.trim()) return;
    saveHistory(term.trim());
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(term.trim())}`);
  };

  const goToProduct = (id: string, title: string) => {
    saveHistory(title);
    setOpen(false);
    router.push(`/product/${id}`);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search-history');
  };

  const removeHistoryItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h !== term);
    setHistory(updated);
    localStorage.setItem('search-history', JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.length >= 2 ? suggestions : [];
    const totalItems = items.length + (query.length >= 2 ? 1 : 0); // +1 for "search all"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && selectedIdx < suggestions.length) {
        goToProduct(suggestions[selectedIdx].id, suggestions[selectedIdx].title);
      } else {
        doSearch(query);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && (query.length >= 2 || history.length > 0 || true);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cari produk atau jasa..."
          className="w-full rounded-lg border border-border bg-secondary py-2 pl-4 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute right-12 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
        <button
          onClick={() => doSearch(query)}
          className="absolute right-1 top-1 flex h-[calc(100%-0.5rem)] items-center justify-center rounded-md bg-primary px-3 text-primary-foreground hover:bg-primary/90"
        >
          <Search size={16} />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {/* Product suggestions */}
          {query.length >= 2 && (
            <>
              {loading ? (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Mencari...
                  </div>
                </div>
              ) : suggestions.length > 0 ? (
                <div>
                  <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Produk
                  </p>
                  {suggestions.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goToProduct(s.id, s.title)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        selectedIdx === i ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                    >
                      {s.image_url ? (
                        <img src={s.image_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          <HighlightMatch text={s.title} query={query} />
                        </p>
                        <p className="text-xs text-primary font-medium">
                          Rp{s.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {s.category}
                      </span>
                    </button>
                  ))}
                  {/* View all results */}
                  <button
                    onClick={() => doSearch(query)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-xs text-primary transition-colors ${
                      selectedIdx === suggestions.length ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                  >
                    <span>Lihat semua hasil untuk "<strong>{query}</strong>"</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Tidak ada produk untuk "<strong className="text-foreground">{query}</strong>"
                  </p>
                  <button
                    onClick={() => doSearch(query)}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Cari di semua produk →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Search history */}
          {query.length < 2 && history.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Riwayat Pencarian
                </p>
                <button onClick={clearHistory} className="text-[10px] text-primary hover:underline">
                  Hapus Semua
                </button>
              </div>
              {history.map((h) => (
                <button
                  key={h}
                  onClick={() => { setQuery(h); doSearch(h); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground hover:bg-accent/50"
                >
                  <Clock size={14} className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{h}</span>
                  <button
                    onClick={(e) => removeHistoryItem(h, e)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Popular searches */}
          {query.length < 2 && (
            <div>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pencarian Populer
              </p>
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setQuery(p); doSearch(p); }}
                    className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:border-primary/30 transition-colors"
                  >
                    <TrendingUp size={11} className="text-primary" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* Highlight matching text */
const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-primary">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
};

export default SearchAutocomplete;
