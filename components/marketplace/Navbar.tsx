"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, LogOut, Menu, X, MessageCircle, Store, Bot, Sun, Moon, Heart, Bell, ShieldCheck } from 'lucide-react';
import SearchAutocomplete from '@/components/marketplace/SearchAutocomplete';
import { useWishlist } from '@/contexts/marketplace/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/lib/marketplace/supabase';
import { toast } from '@/hooks/marketplace/use-toast';
import { notify, requestNotificationPermission } from '@/lib/marketplace/notifications';
import logo from '@/assets/logo.png';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count: wishlistCount } = useWishlist();
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (user) {
      fetchCartCount();
      fetchUnreadMessages();
      fetchUnreadNotifs();
      requestNotificationPermission();

      const channel = supabase
        .channel('global-tx-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transactions',
            filter: `buyer_id=eq.${user.id}`,
          },
          (payload) => {
            const newStatus = (payload.new as any).status;
            const oldStatus = (payload.old as any)?.status;
            if (oldStatus !== newStatus) {
              const labels: Record<string, string> = {
                success: '✅ Pembayaran berhasil!',
                paid: '✅ Pembayaran diterima!',
                cancelled: '❌ Pembayaran dibatalkan',
                failed: '❌ Pembayaran gagal',
                expired: '⏰ Pembayaran kadaluarsa',
              };
              const title = labels[newStatus] || '🔔 Status transaksi berubah';
              const desc = 'Klik untuk melihat detail transaksi';
              toast({ title, description: desc });
              notify(title, desc);
              saveNotification(title, desc, newStatus === 'success' || newStatus === 'paid' ? 'success' : 'error');
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `seller_id=eq.${user.id}`,
          },
          async (payload) => {
            const tx = payload.new as any;
            const { data: product } = await supabase
              .from('products')
              .select('title')
              .eq('id', tx.product_id)
              .single();
            const title = '🛒 Pesanan baru masuk!';
            const desc = `${product?.title || 'Produk'} — Rp${Number(tx.amount).toLocaleString('id-ID')}`;
            toast({ title, description: desc });
            notify(title, desc);
            saveNotification(title, desc, 'order');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchCartCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.db_id || user.id);
    setCartCount(count || 0);
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    setUnreadMessages(count || 0);
  };

  const fetchUnreadNotifs = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.db_id || user.id)
      .eq('is_read', false);
    setUnreadNotifs(count || 0);
  };

  const saveNotification = async (title: string, body: string, type: string = 'info') => {
    if (!user) return;
    await supabase.from('notifications').insert({ user_id: user.db_id || user.id, title, body, type });
    setUnreadNotifs((prev) => prev + 1);
  };

  // Search is now handled by SearchAutocomplete component

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      {/* Top bar - hidden on mobile */}
      <div className="hidden bg-primary sm:block">
        <div className="container flex h-8 items-center justify-between text-[11px] text-primary-foreground/80">
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 sm:flex">
              🎓 Platform Kewirausahaan SMK Negeri 1 Banjarmasin
            </span>
            <Link href="/community" className="flex items-center gap-1 hover:text-primary-foreground font-medium">
              <User size={11} />
              Komunitas
            </Link>
            <Link href="/seller/dashboard" className="flex items-center gap-1 hover:text-primary-foreground">
              <Store size={11} />
              Seller Centre
            </Link>
            <Link href="/ai" className="flex items-center gap-1 hover:text-primary-foreground">
              <Bot size={11} />
              AI Assistant
            </Link>
            {user && isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 font-bold text-accent hover:text-white transition-colors">
                <ShieldCheck size={11} />
                Admin Panel
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={handleSignOut} className="flex items-center gap-1 hover:text-primary-foreground">
                <LogOut size={11} /> Keluar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/register" className="hover:text-primary-foreground">Daftar</Link>
                <span className="opacity-40">|</span>
                <Link href="/login" className="hover:text-primary-foreground">Masuk</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="container flex h-12 items-center gap-3 sm:h-14 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img src={logo} alt="SMKmart SMKN 1" className="h-9 w-9 rounded-lg object-cover" />
          <div className="hidden lg:block">
            <span className="font-display text-base font-bold text-foreground leading-tight">SMKN 1 Mall</span>
            <span className="block text-[10px] text-muted-foreground leading-tight">Banjarmasin</span>
          </div>
        </Link>

        {/* Search with autocomplete */}
        <SearchAutocomplete />

        {/* Right icons - hidden on mobile, bottom nav handles navigation */}
        <div className="flex items-center gap-1">
          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              <Link href="/notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <Bell size={20} />
                {unreadNotifs > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </span>
                )}
              </Link>
              <Link href="/chat" className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <MessageCircle size={20} />
                {unreadMessages > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/wishlist" className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            </div>
          )}
          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link href={user ? '/dashboard' : '/login'}
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground sm:block"
          >
            <User size={20} />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 md:hidden animate-fade-in">
          {['Semua Produk', 'TKJ', 'Multimedia', 'Akuntansi', 'Pemasaran', 'Perkantoran'].map((m) => (
            <Link key={m}
              href={m === 'Semua Produk' ? '/products' : `/products?major=${m}`}
              onClick={() => setMobileOpen(false)}
              className="block border-b border-border py-3 text-sm text-muted-foreground hover:text-foreground last:border-0"
            >
              {m}
            </Link>
          ))}
          <Link href="/community" onClick={() => setMobileOpen(false)} className="block border-b border-border py-3 text-sm font-semibold text-primary">Komunitas Belajar</Link>
          {user && (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block border-b border-border py-3 text-sm text-muted-foreground">Dashboard</Link>
              <Link href="/seller/dashboard" onClick={() => setMobileOpen(false)} className="block border-b border-border py-3 text-sm text-muted-foreground">Seller Centre</Link>
              <Link href="/cart" onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-muted-foreground">Keranjang ({cartCount})</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
