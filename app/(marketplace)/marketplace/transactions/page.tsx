"use client";
import { useSearchParams } from '@/hooks/marketplace/use-router-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { ExternalLink, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Star } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/marketplace/use-toast';
import ReviewForm from '@/components/marketplace/ReviewForm';

interface Transaction {
  id: string;
  amount: number;
  quantity: number;
  status: string;
  mayar_link: string | null;
  mayar_payment_id: string | null;
  created_at: string;
  updated_at: string;
  product_id: string;
  products: { id: string; title: string; image_url: string | null } | null;
  seller: { full_name: string; major: string | null } | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  pending: { label: 'Menunggu Pembayaran', style: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  paid: { label: 'Sudah Dibayar', style: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle },
  processing: { label: 'Sedang Diproses', style: 'bg-accent/20 text-accent-foreground border-accent/20', icon: Clock },
  success: { label: 'Selesai', style: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  completed: { label: 'Selesai', style: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', style: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  failed: { label: 'Gagal', style: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  expired: { label: 'Kadaluarsa', style: 'bg-muted text-muted-foreground border-border', icon: AlertCircle },
};

const TAB_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'success', label: 'Berhasil' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const Transactions = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());
  const [openReviewTxId, setOpenReviewTxId] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTransactions();
    fetchUserReviews();

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const oldStatus = (payload.old as any)?.status;
          const newStatus = updated.status;

          if (oldStatus !== newStatus) {
            const config = STATUS_CONFIG[newStatus] || STATUS_CONFIG.pending;
            toast({
              title: '🔔 Status Pembayaran Berubah',
              description: `Transaksi diperbarui menjadi: ${config.label}`,
              variant: newStatus === 'success' || newStatus === 'paid' ? 'default' : 'destructive',
            });
          }

          setTransactions((prev) =>
            prev.map((tx) => (tx.id === updated.id ? { ...tx, ...updated } : tx))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, statusFilter]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);

    let q = supabase
      .from('transactions')
      .select('id, amount, quantity, status, mayar_link, mayar_payment_id, created_at, updated_at, product_id, products(id, title, image_url), seller:profiles!transactions_seller_id_fkey(full_name:nama)')
      .eq('buyer_id', user.db_id || user.id)
      .order('created_at', { ascending: false });

    if (statusFilter) q = q.eq('status', statusFilter);

    const { data } = await q;

    const normalized = ((data as any[]) || []).map((tx) => ({
      ...tx,
      products: Array.isArray(tx.products) ? tx.products[0] : tx.products,
      seller: Array.isArray(tx.seller) ? tx.seller[0] : tx.seller,
    }));

    setTransactions(normalized);
    setLoading(false);
  };

  const fetchUserReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('user_id', user.db_id || user.id);

    if (data) {
      setReviewedProducts(new Set(data.map((r) => r.product_id)));
    }
  };

  const handleReviewSubmitted = (productId: string) => {
    setReviewedProducts((prev) => new Set([...prev, productId]));
    setOpenReviewTxId(null);
  };

  const setFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    setSearchParams(params);
  };

  const isCompleted = (status: string) => status === 'success' || status === 'completed';

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-3">
          <h1 className="font-display text-sm font-bold text-foreground">Riwayat Transaksi</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {!loading && `${transactions.length} transaksi`}
          </p>

          <div className="mt-2 flex gap-4 overflow-x-auto">
            {TAB_FILTERS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`whitespace-nowrap border-b-2 pb-2 text-xs transition-colors ${
                  statusFilter === tab.value
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-sm border border-border bg-card p-4">
                <div className="flex gap-3">
                  <div className="h-16 w-16 rounded-sm bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-sm bg-card py-16 text-center">
            <span className="mb-3 block text-4xl">📋</span>
            <p className="text-sm font-medium text-foreground">Belum ada transaksi</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {statusFilter ? 'Tidak ada transaksi dengan status ini' : 'Mulai belanja untuk melihat riwayat transaksi'}
            </p>
            <Link href="/products"
              className="mt-3 inline-block rounded-sm bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const config = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const completed = isCompleted(tx.status);
              const alreadyReviewed = reviewedProducts.has(tx.product_id);
              const showReviewForm = openReviewTxId === tx.id && !alreadyReviewed;

              return (
                <div key={tx.id} className="rounded-sm border border-border bg-card">
                  {/* Status header */}
                  <div className={`flex items-center justify-between border-b px-4 py-2 ${config.style} border-current/10`}>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon size={14} />
                      <span className="text-xs font-semibold">{config.label}</span>
                    </div>
                    <span className="text-[10px] opacity-80">{formatDate(tx.created_at)}</span>
                  </div>

                  {/* Product info */}
                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary">
                        {tx.products?.image_url ? (
                          <img src={tx.products.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${tx.products?.id}`}
                          className="text-xs font-medium text-foreground hover:text-primary line-clamp-2"
                        >
                          {tx.products?.title || 'Produk'}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          x{tx.quantity} • Penjual: {tx.seller?.full_name || '-'}
                          {tx.seller?.major && ` (${tx.seller.major})`}
                        </p>
                        <p className="mt-1 text-sm font-bold text-foreground">{formatPrice(tx.amount)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {tx.mayar_link && tx.status === 'pending' && (
                        <a
                          href={tx.mayar_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <ExternalLink size={12} />
                          Bayar Sekarang
                        </a>
                      )}

                      {tx.mayar_link && tx.status !== 'pending' && (
                        <a
                          href={tx.mayar_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink size={12} />
                          Lihat Invoice
                        </a>
                      )}

                      {/* Review button for completed transactions */}
                      {completed && !alreadyReviewed && (
                        <button
                          onClick={() => setOpenReviewTxId(openReviewTxId === tx.id ? null : tx.id)}
                          className="flex items-center gap-1.5 rounded-sm border border-warning/50 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-warning/20"
                        >
                          <Star size={12} />
                          Beri Ulasan
                        </button>
                      )}

                      {completed && alreadyReviewed && (
                        <span className="flex items-center gap-1 text-[10px] text-success">
                          <CheckCircle size={12} />
                          Sudah diulas
                        </span>
                      )}

                      {tx.mayar_payment_id && (
                        <span className="text-[10px] text-muted-foreground">
                          ID: {tx.mayar_payment_id.slice(0, 12)}...
                        </span>
                      )}

                      <Link href={`/products/${tx.products?.id}`}
                        className="ml-auto flex items-center gap-0.5 text-xs text-primary hover:underline"
                      >
                        Lihat Produk <ChevronRight size={12} />
                      </Link>
                    </div>

                    {/* Review form */}
                    {showReviewForm && user && (
                      <ReviewForm
                        productId={tx.product_id}
                        userId={user.id}
                        productTitle={tx.products?.title || 'Produk'}
                        onReviewSubmitted={() => handleReviewSubmitted(tx.product_id)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
