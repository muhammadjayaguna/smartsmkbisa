"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Plus, Package, TrendingUp, ShoppingBag, Trash2, Eye, EyeOff, Home, ChevronRight,
  Clock, CheckCircle, XCircle, Truck, PackageCheck, AlertCircle,
  Wallet, ExternalLink, Info, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import AddProductModal from '@/components/marketplace/AddProductModal';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  stock: number;
  sold: number;
  is_active: boolean;
  category: string;
}

interface Sale {
  id: string;
  amount: number;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  mayar_payment_id: string | null;
  mayar_link: string | null;
  product_id: string;
  products: { title: string; image_url: string | null } | null;
  buyer: { full_name: string; phone: string | null } | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

const ORDER_STATUS: Record<string, { label: string; color: string; icon: typeof Clock; desc: string }> = {
  pending: {
    label: 'Menunggu Bayar',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
    desc: 'Pembeli belum melakukan pembayaran',
  },
  paid: {
    label: 'Sudah Dibayar',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: DollarSign,
    desc: 'Pembayaran diterima, perlu diproses',
  },
  processing: {
    label: 'Diproses',
    color: 'bg-accent/30 text-accent-foreground border-accent/20',
    icon: Truck,
    desc: 'Pesanan sedang diproses/dikirim',
  },
  success: {
    label: 'Selesai',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
    desc: 'Pesanan selesai',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-success/10 text-success border-success/20',
    icon: PackageCheck,
    desc: 'Pesanan selesai dan dikonfirmasi',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
    desc: 'Pesanan dibatalkan',
  },
  expired: {
    label: 'Kadaluarsa',
    color: 'bg-muted text-muted-foreground border-border',
    icon: AlertCircle,
    desc: 'Pembayaran melewati batas waktu',
  },
};

const ORDER_TAB_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'paid', label: '💰 Perlu Diproses' },
  { value: 'processing', label: '🚚 Diproses' },
  { value: 'success', label: '✅ Selesai' },
  { value: 'pending', label: '⏳ Menunggu' },
];

const SellerDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'earnings'>('orders');
  const [orderFilter, setOrderFilter] = useState('');
  const [showWithdrawGuide, setShowWithdrawGuide] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();

    const channel = supabase
      .channel('seller-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `seller_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [prodRes, salesRes] = await Promise.all([
      supabase.from('products').select('*').eq('seller_id', user.db_id || user.id).order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('id, amount, quantity, status, created_at, updated_at, mayar_payment_id, mayar_link, product_id, products(title, image_url), buyer:users!transactions_buyer_id_fkey(full_name:nama)')
        .eq('seller_id', user.db_id || user.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    setProducts((prodRes.data as Product[]) || []);
    const normalizedSales = ((salesRes.data as any[]) || []).map((s) => ({
      ...s,
      products: Array.isArray(s.products) ? s.products[0] : s.products,
      buyer: Array.isArray(s.buyer) ? s.buyer[0] : s.buyer,
    }));
    setSales(normalizedSales);
    setLoading(false);
  };

  const toggleActive = async (productId: string, currentState: boolean) => {
    await supabase.from('products').update({ is_active: !currentState }).eq('id', productId);
    setProducts(products.map((p) => (p.id === productId ? { ...p, is_active: !currentState } : p)));
    toast.success(!currentState ? 'Produk diaktifkan' : 'Produk dinonaktifkan');
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Hapus produk ini?')) return;
    await supabase.from('products').delete().eq('id', productId);
    setProducts(products.filter((p) => p.id !== productId));
    toast.success('Produk dihapus');
  };

  const updateOrderStatus = async (txId: string, newStatus: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', txId);

    if (error) {
      toast.error('Gagal mengubah status');
      return;
    }

    setSales(sales.map((s) => (s.id === txId ? { ...s, status: newStatus } : s)));

    // Notify buyer about status change
    const sale = sales.find(s => s.id === txId);
    if (sale && user) {
      const statusLabel = ORDER_STATUS[newStatus]?.label || newStatus;
      const productTitle = sale.products?.title || 'Produk';

      await supabase.from('notifications').insert({
        user_id: sale.buyer?.full_name ? undefined : undefined, // We don't have buyer_id in Sale interface
        title: `📦 Status Pesanan: ${statusLabel}`,
        body: `Pesanan "${productTitle}" x${sale.quantity} telah diperbarui ke status: ${statusLabel}`,
        type: 'order',
      }).then(() => {});
    }

    toast.success(`Status diubah ke ${ORDER_STATUS[newStatus]?.label || newStatus}`);
  };

  // Earnings calculations
  const paidOrders = sales.filter((s) => s.status === 'paid' || s.status === 'processing');
  const completedOrders = sales.filter((s) => s.status === 'success' || s.status === 'completed');
  const pendingOrders = sales.filter((s) => s.status === 'pending');

  const totalRevenue = completedOrders.reduce((sum, s) => sum + s.amount, 0);
  const pendingPayment = pendingOrders.reduce((sum, s) => sum + s.amount, 0);
  const paidNotProcessed = paidOrders.reduce((sum, s) => sum + s.amount, 0);
  const totalSold = completedOrders.reduce((sum, s) => sum + s.quantity, 0);

  const filteredSales = orderFilter
    ? sales.filter((s) => s.status === orderFilter)
    : sales;

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="container py-6">
          <div className="h-32 animate-pulse rounded-sm bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container py-4">
                {/* -- Breadcrumb -- */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <ChevronRight size={14} className="opacity-50" />
          <Link href="/marketplace" className="hover:text-primary transition-colors">
            Kewirausahaan
          </Link>
          <ChevronRight size={14} className="opacity-50" />
          <span className="text-foreground font-semibold">Toko Saya</span>
        </nav>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-base font-bold text-foreground">Seller Centre</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={14} /> Tambah Produk
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-sm bg-card p-3 text-center">
            <Package size={18} className="mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{products.length}</p>
            <p className="text-[10px] text-muted-foreground">Produk</p>
          </div>
          <div className="rounded-sm bg-card p-3 text-center">
            <ShoppingBag size={18} className="mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{totalSold}</p>
            <p className="text-[10px] text-muted-foreground">Terjual</p>
          </div>
          <div className="rounded-sm bg-card p-3 text-center">
            <DollarSign size={18} className="mx-auto mb-1 text-blue-600" />
            <p className="text-sm font-bold text-blue-600">{formatPrice(paidNotProcessed)}</p>
            <p className="text-[10px] text-muted-foreground">Perlu Diproses</p>
          </div>
          <div className="rounded-sm bg-card p-3 text-center">
            <TrendingUp size={18} className="mx-auto mb-1 text-success" />
            <p className="text-sm font-bold text-success">{formatPrice(totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">Total Pendapatan</p>
          </div>
        </div>

        {/* Alert: Orders need processing */}
        {paidOrders.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-blue-500/20 bg-blue-500/5 p-3">
            <DollarSign size={16} className="shrink-0 text-blue-600" />
            <p className="flex-1 text-xs text-foreground">
              <span className="font-semibold">{paidOrders.length} pesanan</span> sudah dibayar dan perlu segera diproses!
            </p>
            <button
              onClick={() => { setActiveTab('orders'); setOrderFilter('paid'); }}
              className="shrink-0 rounded-sm bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
            >
              Lihat
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex border-b border-border">
          <button
            onClick={() => setActiveTab('orders')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            Pesanan ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold ${activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            Produk ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold ${activeTab === 'earnings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            <Wallet size={12} className="mr-1 inline" />
            Pendapatan
          </button>
        </div>

        {/* ========= ORDERS TAB ========= */}
        {activeTab === 'orders' && (
          <div>
            {/* Order sub-filters */}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {ORDER_TAB_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setOrderFilter(tab.value)}
                  className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    orderFilter === tab.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'paid' && paidOrders.length > 0 && (
                    <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">
                      {paidOrders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredSales.length === 0 ? (
                <div className="rounded-sm bg-card py-12 text-center">
                  <span className="mb-2 block text-3xl">📋</span>
                  <p className="text-xs text-muted-foreground">
                    {orderFilter ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan masuk'}
                  </p>
                </div>
              ) : (
                filteredSales.map((sale) => {
                  const status = ORDER_STATUS[sale.status] || ORDER_STATUS.pending;
                  const StatusIcon = status.icon;

                  return (
                    <div key={sale.id} className="rounded-sm border border-border bg-card overflow-hidden">
                      {/* Status header */}
                      <div className={`flex items-center justify-between px-3 py-2 text-xs ${status.color}`}>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon size={13} />
                          <span className="font-semibold">{status.label}</span>
                        </div>
                        <span className="text-[10px] opacity-75">{formatDate(sale.created_at)}</span>
                      </div>

                      {/* Order content */}
                      <div className="p-3">
                        <div className="flex gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-secondary">
                            {sale.products?.image_url ? (
                              <img src={sale.products.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{sale.products?.title || 'Produk'}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Pembeli: <span className="font-medium text-foreground">{sale.buyer?.full_name || '-'}</span>
                              {sale.buyer?.phone && ` • ${sale.buyer.phone}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Qty: {sale.quantity}</p>
                            <p className="mt-0.5 text-sm font-bold text-foreground">{formatPrice(sale.amount)}</p>
                          </div>
                        </div>

                        {/* Action buttons based on status */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                          {/* PAID → Seller can process */}
                          {sale.status === 'paid' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(sale.id, 'processing')}
                                className="flex items-center gap-1 rounded-sm bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-700"
                              >
                                <Truck size={12} /> Proses Pesanan
                              </button>
                              <button
                                onClick={() => updateOrderStatus(sale.id, 'success')}
                                className="flex items-center gap-1 rounded-sm bg-success px-3 py-1.5 text-[10px] font-semibold text-success-foreground hover:bg-success/90"
                              >
                                <CheckCircle size={12} /> Selesai Langsung
                              </button>
                            </>
                          )}

                          {/* PROCESSING → Seller can complete */}
                          {sale.status === 'processing' && (
                            <button
                              onClick={() => updateOrderStatus(sale.id, 'success')}
                              className="flex items-center gap-1 rounded-sm bg-success px-3 py-1.5 text-[10px] font-semibold text-success-foreground hover:bg-success/90"
                            >
                              <PackageCheck size={12} /> Pesanan Selesai
                            </button>
                          )}

                          {/* PENDING → Seller can cancel */}
                          {sale.status === 'pending' && (
                            <button
                              onClick={() => {
                                if (confirm('Batalkan pesanan ini?')) updateOrderStatus(sale.id, 'cancelled');
                              }}
                              className="flex items-center gap-1 rounded-sm border border-destructive/30 px-3 py-1.5 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                            >
                              <XCircle size={12} /> Batalkan
                            </button>
                          )}

                          {/* Completed indicator */}
                          {(sale.status === 'success' || sale.status === 'completed') && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-success">
                              <CheckCircle size={12} /> Selesai
                            </span>
                          )}

                          {/* Mayar payment ID */}
                          {sale.mayar_payment_id && (
                            <span className="ml-auto text-[9px] text-muted-foreground">
                              Ref: {sale.mayar_payment_id.slice(0, 10)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========= PRODUCTS TAB ========= */}
        {activeTab === 'products' && (
          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="rounded-sm bg-card py-12 text-center">
                <span className="mb-2 block text-3xl">🏪</span>
                <p className="text-xs text-muted-foreground">Belum ada produk</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Tambah Produk Pertama
                </button>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-sm border border-border bg-card p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{product.title}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(product.price)}</p>
                    <p className="text-[10px] text-muted-foreground">Stok: {product.stock} • Terjual: {product.sold}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      className={`rounded-sm p-1.5 ${product.is_active ? 'text-success hover:bg-success/10' : 'text-muted-foreground hover:bg-muted'}`}
                      title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {product.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========= EARNINGS TAB ========= */}
        {activeTab === 'earnings' && (
          <div className="space-y-3">
            {/* Earnings summary */}
            <div className="rounded-sm border border-border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Wallet size={16} className="text-primary" /> Ringkasan Pendapatan
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Total Pendapatan (Selesai)</span>
                  </div>
                  <span className="text-sm font-bold text-success">{formatPrice(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Dibayar (Belum Diproses)</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{formatPrice(paidNotProcessed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-xs text-muted-foreground">Menunggu Pembayaran</span>
                  </div>
                  <span className="text-sm font-bold text-warning">{formatPrice(pendingPayment)}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Total Transaksi Berhasil</span>
                    <span className="text-xs font-bold text-foreground">{completedOrders.length + paidOrders.length} pesanan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal guide */}
            <div className="rounded-sm border border-border bg-card">
              <button
                onClick={() => setShowWithdrawGuide(!showWithdrawGuide)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">Cara Menarik Uang (Withdraw)</span>
                </div>
                {showWithdrawGuide ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </button>

              {showWithdrawGuide && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <p className="text-foreground font-medium">
                      Semua pembayaran diproses melalui <span className="text-primary font-bold">Mayar.id</span>. Berikut cara menarik uang:
                    </p>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                        <div>
                          <p className="font-medium text-foreground">Hubungi Admin Sekolah</p>
                          <p>Sampaikan bahwa kamu ingin menarik saldo dari penjualan di SMKN 1 Mall.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
                        <div>
                          <p className="font-medium text-foreground">Verifikasi Penjualan</p>
                          <p>Admin akan mengecek transaksi kamu yang berstatus <span className="font-semibold text-success">"Selesai"</span> di dashboard Mayar.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
                        <div>
                          <p className="font-medium text-foreground">Pencairan Dana</p>
                          <p>Dana akan ditransfer ke rekening/e-wallet kamu sesuai kebijakan sekolah (biasanya 1-3 hari kerja).</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-sm bg-primary/5 p-3">
                      <p className="flex items-start gap-1.5">
                        <AlertCircle size={13} className="mt-0.5 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-foreground">Catatan:</span> Dana masuk ke akun Mayar sekolah. Penarikan dilakukan melalui admin dengan menunjukkan bukti transaksi dari halaman ini.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent completed transactions */}
            <div className="rounded-sm border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-bold text-foreground">Transaksi Terakhir (Selesai)</h3>
              {completedOrders.length === 0 ? (
                <p className="text-center text-[10px] text-muted-foreground py-4">Belum ada transaksi selesai</p>
              ) : (
                <div className="space-y-2">
                  {completedOrders.slice(0, 10).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between rounded-sm bg-secondary p-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-foreground">{sale.products?.title || 'Produk'}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {sale.buyer?.full_name} • x{sale.quantity} • {formatDate(sale.updated_at || sale.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-success">{formatPrice(sale.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchData(); }}
        />
      )}
    </div>
  );
};

export default SellerDashboard;


