"use client";
import { useLocation } from '@/hooks/marketplace/use-router-dom';
import Link from 'next/link';
import { Home, Search, ShoppingCart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/marketplace/supabase';

const NAV_ITEMS = [
  { icon: Home, label: 'Beranda', path: '/' },
  { icon: Search, label: 'Produk', path: '/products' },
  { icon: ShoppingCart, label: 'Keranjang', path: '/cart' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Akun', path: '/dashboard' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const [cart, msgs] = await Promise.all([
        supabase.from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', user.db_id || user.id),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
      ]);
      setCartCount(cart.count || 0);
      setUnreadMessages(msgs.count || 0);
    };
    fetchCounts();
  }, [user, location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden safe-area-bottom">
      <div className="flex h-14 items-center justify-around">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          const loginPath = !user && path !== '/' && path !== '/products' ? '/login' : path;
          const badge = path === '/cart' ? cartCount : path === '/chat' ? unreadMessages : 0;

          return (
            <Link key={path}
              href={loginPath}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
