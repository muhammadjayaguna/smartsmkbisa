import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, UserCheck, FileText, Settings, User, MessageSquare } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const MobileNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, role } = useUserRole();
  const { unreadCounts } = useDirectMessages(null);

  const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { icon: Home, label: 'Beranda', path: '/' },
    ];

    if (role === 'siswa') {
      return [
        ...baseItems,
        { icon: UserCheck, label: 'Absensi', path: '/simagang/absensi' },
        { icon: FileText, label: 'Riwayat', path: '/simagang/laporan' },
      ];
    }

    if (isAdmin) {
      return [
        ...baseItems,
        { icon: UserCheck, label: 'Absensi', path: '/rombel' },
        { icon: FileText, label: 'Laporan', path: '/reports' },
        { icon: Settings, label: 'Kelola', path: '/manage-users' },
      ];
    }

    // Guru
    return [
      ...baseItems,
      { icon: UserCheck, label: 'Absensi', path: '/rombel' },
      { icon: FileText, label: 'Laporan', path: '/reports' },
    ];
  };

  const navItems = getNavItems();

    return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom p-4">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
                isActive 
                  ? "text-blue-600" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-blue-50/50 rounded-xl m-1 -z-10 animate-in fade-in zoom-in duration-300" />
              )}
              <div className="relative">
                <item.icon className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-300",
                  isActive ? "scale-110 drop-shadow-md" : "scale-100"
                )} />
                {item.label === 'Chat' && totalUnread > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] bg-red-500 text-white border-2 border-white"
                  >
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isActive ? "font-bold tracking-wide" : ""
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavbar;
