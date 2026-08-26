"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/lib/marketplace/supabase';
import {
  Users,
  Store,
  ShoppingBag,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  LayoutDashboard,
  PackageSearch,
  Eye,
  EyeOff,
  Trash2,
  TrendingUp,
  DollarSign,
  Star,
  MessageCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  Ban,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────

type TabKey = 'overview' | 'users' | 'products' | 'transactions' | 'reviews' | 'reports';

interface DashboardStats {
  totalUsers: number;
  verifiedSellers: number;
  totalProducts: number;
  activeProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  totalReviews: number;
  avgRating: number;
}

interface UserRow {
  id: string;
  full_name: string;
  major: string | null;
  class_name: string | null;
  is_verified: boolean;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface ProductRow {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
  sold: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  seller_id: string;
  profiles?: { full_name: string } | null;
}

interface TransactionRow {
  id: string;
  amount: number;
  quantity: number;
  status: string;
  created_at: string;
  buyer: { full_name: string } | null;
  seller: { full_name: string } | null;
  product: { title: string } | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: { full_name: string } | null;
  product: { title: string } | null;
}

interface ReportRow {
  id: string;
  reason: string;
  description: string;
  status: string;
  admin_notes: string;
  created_at: string;
  reporter: { full_name: string } | null;
  reported_user: { full_name: string } | null;
  product: { title: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    paid: 'bg-blue-500/10 text-blue-600',
    success: 'bg-green-500/10 text-green-600',
    completed: 'bg-green-500/10 text-green-600',
    cancelled: 'bg-red-500/10 text-red-600',
    failed: 'bg-red-500/10 text-red-600',
    expired: 'bg-gray-500/10 text-gray-500',
  };
  return map[s] || 'bg-gray-500/10 text-gray-500';
};

const reportStatusColor = (s: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    reviewing: 'bg-blue-500/10 text-blue-600',
    resolved: 'bg-green-500/10 text-green-600',
    dismissed: 'bg-gray-500/10 text-gray-500',
  };
  return map[s] || 'bg-gray-500/10 text-gray-500';
};

const Avatar = ({ url, name }: { url: string | null; name: string }) => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden">
    {url ? (
      <img src={url} alt="" className="h-full w-full object-cover" />
    ) : (
      (name || '?').charAt(0).toUpperCase()
    )}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  // auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
      toast.error('Akses ditolak: Anda bukan administrator');
    }
  }, [isAdmin, authLoading, router]);

  // fetch data when tab changes
  useEffect(() => {
    if (isAdmin) fetchTabData(tab);
  }, [isAdmin, tab]);

  // ── Data fetchers ──────────────────────────────────────────────────

  const fetchTabData = async (t: TabKey) => {
    setLoading(true);
    try {
      if (t === 'overview') await fetchStats();
      if (t === 'users') await fetchUsers();
      if (t === 'products') await fetchProducts();
      if (t === 'transactions') await fetchTransactions();
      if (t === 'reviews') await fetchReviews();
      if (t === 'reports') await fetchReports();
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const [profilesRes, productsRes, activeProductsRes, txRes, revenueRes, reviewsRes] =
      await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('transactions').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount').in('status', ['success', 'completed']),
        supabase.from('reviews').select('rating'),
      ]);

    const verified = (profilesRes.data || []).filter((p) => p.is_verified).length;
    const revenue = (revenueRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
    const ratings = (reviewsRes.data || []).map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    setStats({
      totalUsers: profilesRes.count || 0,
      verifiedSellers: verified,
      totalProducts: productsRes.count || 0,
      activeProducts: activeProductsRes.count || 0,
      totalTransactions: txRes.count || 0,
      totalRevenue: revenue,
      totalReviews: ratings.length,
      avgRating: Math.round(avg * 10) / 10,
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name:nama, role, created_at')
      .order('created_at', { ascending: false });
    setUsers((data as UserRow[]) || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, title, price, category, image_url, stock, sold, rating, is_active, created_at, seller_id, profiles:users(full_name:nama)')
      .order('created_at', { ascending: false });

    const normalized = ((data as any[]) || []).map((p) => {
      const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return { ...p, profiles: profile ?? null };
    });
    setProducts(normalized);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, quantity, status, created_at, buyer:users!transactions_buyer_id_fkey(full_name:nama), seller:users!transactions_seller_id_fkey(full_name:nama), product:products!transactions_product_id_fkey(title)')
      .order('created_at', { ascending: false })
      .limit(100);

    const normalized = ((data as any[]) || []).map((t) => ({
      ...t,
      buyer: Array.isArray(t.buyer) ? t.buyer[0] : t.buyer,
      seller: Array.isArray(t.seller) ? t.seller[0] : t.seller,
      product: Array.isArray(t.product) ? t.product[0] : t.product,
    }));
    setTransactions(normalized);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user:users!reviews_user_id_fkey(full_name:nama), product:products!reviews_product_id_fkey(title)')
      .order('created_at', { ascending: false })
      .limit(100);

    const normalized = ((data as any[]) || []).map((r) => ({
      ...r,
      user: Array.isArray(r.user) ? r.user[0] : r.user,
      product: Array.isArray(r.product) ? r.product[0] : r.product,
    }));
    setReviews(normalized);
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, reason, description, status, admin_notes, created_at, reporter:users!reports_reporter_id_fkey(full_name:nama), reported_user:users!reports_reported_user_id_fkey(full_name:nama), product:products!reports_product_id_fkey(title)')
      .order('created_at', { ascending: false })
      .limit(100);

    const normalized = ((data as any[]) || []).map((r) => ({
      ...r,
      reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
      reported_user: Array.isArray(r.reported_user) ? r.reported_user[0] : r.reported_user,
      product: Array.isArray(r.product) ? r.product[0] : r.product,
    }));
    setReports(normalized);
  };

  // ── Actions ────────────────────────────────────────────────────────

  const toggleVerification = async (id: string, current: boolean) => {
    const { error } = await supabase.from('users').update({ is_verified: !current }).eq('id', id);
    if (error) return toast.error('Gagal memperbarui verifikasi');
    toast.success(current ? 'Verifikasi dicabut' : 'Penjual diverifikasi ✓');
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_verified: !current } : u)));
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (error) return toast.error('Gagal mengubah status produk');
    toast.success(current ? 'Produk dinonaktifkan' : 'Produk diaktifkan kembali');
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)));
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) return toast.error('Gagal menghapus review');
    toast.success('Review dihapus');
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const updateReportStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return toast.error('Gagal memperbarui status laporan');
    toast.success(`Status laporan diubah ke "${status}"`);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const deleteReport = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus laporan ini?')) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) return toast.error('Gagal menghapus laporan');
    toast.success('Laporan dihapus');
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus akun "${name}"? Semua data (produk, transaksi, chat) akan ikut terhapus.`)) return;
    // Delete profile first (cascades to products, transactions, etc.)
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return toast.error('Gagal menghapus pengguna: ' + error.message);
    toast.success(`Akun "${name}" berhasil dihapus`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // ── Filtered data ──────────────────────────────────────────────────

  const q = searchQ.toLowerCase();
  const filteredUsers = users.filter(
    (u) => u.full_name?.toLowerCase().includes(q) || u.major?.toLowerCase().includes(q) || u.class_name?.toLowerCase().includes(q)
  );
  const filteredProducts = products.filter(
    (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.profiles?.full_name?.toLowerCase().includes(q)
  );
  const filteredTransactions = transactions.filter(
    (t) => t.status.toLowerCase().includes(q) || t.buyer?.full_name?.toLowerCase().includes(q) || t.seller?.full_name?.toLowerCase().includes(q) || t.product?.title?.toLowerCase().includes(q)
  );
  const filteredReviews = reviews.filter(
    (r) => r.comment.toLowerCase().includes(q) || r.user?.full_name?.toLowerCase().includes(q) || r.product?.title?.toLowerCase().includes(q)
  );
  const filteredReports = reports.filter(
    (r) => r.reason.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.reporter?.full_name?.toLowerCase().includes(q) || r.reported_user?.full_name?.toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
  );

  // ── Tab config ─────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { key: 'users', label: 'Pengguna', icon: Users },
    { key: 'products', label: 'Produk', icon: ShoppingBag },
    { key: 'transactions', label: 'Transaksi', icon: DollarSign },
    { key: 'reviews', label: 'Ulasan', icon: Star },
    { key: 'reports', label: 'Laporan', icon: Flag },
  ];

  // ── Loading state ──────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Memuat Dashboard Admin...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-secondary pb-16">
      <div className="container py-6">
        {/* ── Header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-full bg-card p-2 text-muted-foreground shadow-sm transition-all hover:bg-primary hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Kelola marketplace SMKN 1 Banjarmasin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-blue-600">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Super Admin</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-card p-1 shadow-sm scrollbar-hide">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearchQ(''); }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Search + Refresh (non-overview) ── */}
        {tab !== 'overview' && (
          <div className="mb-5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Cari berdasarkan nama, kategori, status..."
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => fetchTabData(tab)}
              className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        {/* ── Tab Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Memuat data…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ════════ OVERVIEW ════════ */}
            {tab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: 'Total User', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Verified Seller', value: stats.verifiedSellers, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Produk Aktif', value: `${stats.activeProducts} / ${stats.totalProducts}`, icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { label: 'Total Transaksi', value: stats.totalTransactions, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                        <item.icon size={18} />
                      </div>
                      <p className="text-xl font-bold text-foreground">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                {/* Revenue + reviews summary */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-green-600">
                      <DollarSign size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Total Pendapatan</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Dari {stats.totalTransactions} transaksi</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-yellow-500">
                      <Star size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Rating Rata-rata</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stats.avgRating} <span className="text-base text-muted-foreground">/ 5</span></p>
                    <p className="text-xs text-muted-foreground">Dari {stats.totalReviews} ulasan</p>
                  </div>
                </div>
                {/* Quick navigation cards */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { label: 'Kelola Pengguna', desc: 'Verifikasi & atur user', icon: Users, tab: 'users' as TabKey },
                    { label: 'Moderasi Produk', desc: 'Aktifkan/nonaktifkan', icon: PackageSearch, tab: 'products' as TabKey },
                    { label: 'Monitor Transaksi', desc: 'Lihat semua transaksi', icon: DollarSign, tab: 'transactions' as TabKey },
                    { label: 'Moderasi Ulasan', desc: 'Hapus review spam', icon: MessageCircle, tab: 'reviews' as TabKey },
                  ].map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setTab(c.tab)}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <c.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.label}</p>
                        <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ════════ USERS ════════ */}
            {tab === 'users' && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/50 px-5 py-3">
                  <p className="text-xs text-muted-foreground">{filteredUsers.length} pengguna ditemukan</p>
                </div>
                <div className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada pengguna ditemukan</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar url={u.avatar_url} name={u.full_name} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-foreground">{u.full_name || '(Tanpa Nama)'}</p>
                              {u.is_verified && (
                                <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                              )}
                              {u.role === 'admin' && (
                                <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">ADMIN</span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {[u.major, u.class_name].filter(Boolean).join(' · ') || 'Belum diisi'} · {formatDate(u.created_at)}
                            </p>
                          </div>
                        </div>
                        {u.role !== 'admin' && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => toggleVerification(u.id, u.is_verified)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                u.is_verified
                                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                  : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }`}
                            >
                              {u.is_verified ? <><XCircle size={13} /> Cabut</> : <><CheckCircle size={13} /> Verifikasi</>}
                            </button>
                            <button
                              onClick={() => deleteUser(u.id, u.full_name)}
                              className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-all hover:bg-red-500/20"
                              title="Hapus Pengguna"
                            >
                              <Trash2 size={13} /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════ PRODUCTS ════════ */}
            {tab === 'products' && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/50 px-5 py-3">
                  <p className="text-xs text-muted-foreground">{filteredProducts.length} produk ditemukan</p>
                </div>
                <div className="divide-y divide-border">
                  {filteredProducts.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada produk ditemukan</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ShoppingBag size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                              {!p.is_active && (
                                <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-500">NONAKTIF</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {p.profiles?.full_name || 'Unknown'} · {p.category} · Stok: {p.stock} · Terjual: {p.sold} · ⭐ {p.rating}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-sm font-bold text-foreground sm:block">{formatPrice(p.price)}</span>
                          <button
                            onClick={() => toggleProductActive(p.id, p.is_active)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                              p.is_active
                                ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                                : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                            }`}
                            title={p.is_active ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                          >
                            {p.is_active ? <><EyeOff size={13} /> Nonaktifkan</> : <><Eye size={13} /> Aktifkan</>}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════ TRANSACTIONS ════════ */}
            {tab === 'transactions' && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/50 px-5 py-3">
                  <p className="text-xs text-muted-foreground">{filteredTransactions.length} transaksi ditemukan</p>
                </div>
                <div className="divide-y divide-border">
                  {filteredTransactions.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada transaksi ditemukan</p>
                  ) : (
                    filteredTransactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{t.product?.title || 'Produk dihapus'}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {t.buyer?.full_name || '?'} → {t.seller?.full_name || '?'} · {t.quantity}x · {formatDate(t.created_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-sm font-bold text-foreground sm:block">{formatPrice(t.amount)}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusColor(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════ REVIEWS ════════ */}
            {tab === 'reviews' && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/50 px-5 py-3">
                  <p className="text-xs text-muted-foreground">{filteredReviews.length} ulasan ditemukan</p>
                </div>
                <div className="divide-y divide-border">
                  {filteredReviews.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada ulasan ditemukan</p>
                  ) : (
                    filteredReviews.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{r.user?.full_name || 'Anonim'}</p>
                            <div className="flex items-center gap-0.5 text-yellow-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={10} fill={i < r.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {r.product?.title || 'Produk dihapus'} — "{r.comment || '(tanpa komentar)'}" · {formatDate(r.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteReview(r.id)}
                          className="flex shrink-0 items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/20"
                          title="Hapus Review"
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════ REPORTS ════════ */}
            {tab === 'reports' && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/50 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{filteredReports.length} laporan ditemukan</p>
                  <div className="flex items-center gap-1.5">
                    {['pending', 'reviewing', 'resolved', 'dismissed'].map((s) => {
                      const count = reports.filter((r) => r.status === s).length;
                      return (
                        <button
                          key={s}
                          onClick={() => setSearchQ(s)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${reportStatusColor(s)}`}
                        >
                          {s} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {filteredReports.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada laporan ditemukan</p>
                  ) : (
                    filteredReports.map((r) => (
                      <div key={r.id} className="px-5 py-4 transition-colors hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${reportStatusColor(r.status)}`}>
                                {r.status}
                              </span>
                              <span className="text-xs font-bold text-foreground">{r.reason}</span>
                            </div>
                            <p className="text-xs text-foreground mb-1">{r.description}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Pelapor: <span className="font-medium">{r.reporter?.full_name || '?'}</span>
                              {r.reported_user && <> · Dilaporkan: <span className="font-medium">{r.reported_user.full_name}</span></>}
                              {r.product && <> · Produk: <span className="font-medium">{r.product.title}</span></>}
                              {' '}· {formatDate(r.created_at)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {r.status === 'pending' && (
                              <button
                                onClick={() => updateReportStatus(r.id, 'reviewing')}
                                className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-500/20"
                              >
                                <Eye size={13} /> Tinjau
                              </button>
                            )}
                            {(r.status === 'pending' || r.status === 'reviewing') && (
                              <>
                                <button
                                  onClick={() => updateReportStatus(r.id, 'resolved')}
                                  className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500/20"
                                >
                                  <CheckCircle size={13} /> Selesai
                                </button>
                                <button
                                  onClick={() => updateReportStatus(r.id, 'dismissed')}
                                  className="flex items-center gap-1 rounded-lg bg-gray-500/10 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-500/20"
                                >
                                  <XCircle size={13} /> Tolak
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteReport(r.id)}
                              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20"
                              title="Hapus Laporan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
