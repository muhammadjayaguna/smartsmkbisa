'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, DoorOpen, Wrench, ShoppingCart, Activity, Map } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { group: 'UTAMA', items: [
    { name: 'Dashboard', path: '/sisarpras', icon: LayoutDashboard },
  ]},
  { group: 'INVENTARIS & ASET', items: [
    { name: 'Data Barang', path: '/sisarpras/inventaris', icon: Package },
    { name: 'Data Ruangan', path: '/sisarpras/ruangan', icon: Map },
  ]},
  { group: 'PEMINJAMAN', items: [
    { name: 'Peminjaman Barang', path: '/sisarpras/peminjaman-barang', icon: Package },
    { name: 'Peminjaman Ruangan', path: '/sisarpras/peminjaman-ruangan', icon: DoorOpen },
  ]},
  { group: 'MAINTENANCE', items: [
    { name: 'Lapor Kerusakan', path: '/sisarpras/lapor-kerusakan', icon: Wrench },
  ]},
  { group: 'PENGADAAN', items: [
    { name: 'Pengajuan Barang', path: '/sisarpras/pengadaan', icon: ShoppingCart },
  ]}
];

export default function SisarprasSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col no-print border-r border-slate-800 shadow-xl z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 bg-slate-950/30 sticky top-0 z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-black text-xl text-white tracking-tight">SiSarpras</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Manajemen Aset</p>
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
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                
                return (
                  <li key={itemIdx}>
                    <Link href={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                          : 'hover:bg-slate-800 hover:text-slate-100'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-indigo-400'}`} />
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
