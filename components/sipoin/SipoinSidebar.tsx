'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, History, BarChart3, Award, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const allMenuItems = [
  { group: 'UTAMA', items: [
    { name: 'Dashboard', path: '/sipoin', icon: LayoutDashboard, roles: ['admin', 'guru', 'siswa'] },
  ]},
  { group: 'PENCATATAN', items: [
    { name: 'Catat Poin Baru', path: '/sipoin/catat', icon: PlusCircle, roles: ['admin', 'guru'] },
    { name: 'Riwayat Poin', path: '/sipoin/riwayat', icon: History, roles: ['admin', 'guru', 'siswa'] },
  ]},
  { group: 'ANALISIS', items: [
    { name: 'Rekap Per Siswa', path: '/sipoin/rekap', icon: BarChart3, roles: ['admin', 'guru'] },
  ]},
  { group: 'PENGATURAN', items: [
    { name: 'Master Data Poin', path: '/sipoin/master', icon: Database, roles: ['admin'] },
  ]}
];

export default function SipoinSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { role } = useUserRole();

  const menuItems = allMenuItems.map(group => ({
    ...group,
    items: group.items.filter(item => !role || item.roles.includes(role))
  })).filter(group => group.items.length > 0);

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col no-print border-r border-slate-800 shadow-xl z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 bg-slate-950/30 sticky top-0 z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-black text-xl text-white tracking-tight">SiPoin</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Poin Siswa</p>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-8">
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
              {group.group}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = item.path === '/sipoin' 
                  ? pathname === item.path
                  : pathname.startsWith(item.path);
                
                return (
                  <li key={itemIdx}>
                    <Link href={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20' 
                          : 'hover:bg-slate-800 hover:text-slate-100'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-amber-200' : 'text-slate-500 group-hover:text-amber-400'}`} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/50">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
          <LayoutDashboard className="w-4 h-4" />
          <span>Kembali ke Home</span>
        </Link>
      </div>
    </div>
  );
}
