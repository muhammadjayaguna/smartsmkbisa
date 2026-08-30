'use client';

import React from 'react';
import { User, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SisarprasHeaderProps {
  title: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  waka_sarpras: 'Waka Sarpras',
  teknisi: 'Teknisi',
  guru: 'Guru',
  siswa: 'Siswa',
  kepala_sekolah: 'Kepala Sekolah',
};

export default function SisarprasHeader({ title }: SisarprasHeaderProps) {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const pathname = usePathname() || '';

  const getPageInfo = () => {
    if (pathname.includes('/inventaris')) return { group: 'Inventaris & Aset', title: 'Data Barang' };
    if (pathname.includes('/ruangan')) return { group: 'Inventaris & Aset', title: 'Data Ruangan' };
    if (pathname.includes('/peminjaman-barang')) return { group: 'Peminjaman', title: 'Peminjaman Barang' };
    if (pathname.includes('/peminjaman-ruangan')) return { group: 'Peminjaman', title: 'Peminjaman Ruangan' };
    if (pathname.includes('/lapor-kerusakan')) return { group: 'Maintenance', title: role === 'teknisi' ? 'Kelola Laporan Kerusakan' : 'Lapor Kerusakan' };
    if (pathname.includes('/pengadaan')) return { group: 'Pengadaan', title: 'Pengajuan Barang' };
    return { group: 'Utama', title: 'Dashboard' };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30 h-16 flex items-center justify-between px-6 no-print">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center text-[10px] text-slate-400 font-semibold mb-0.5 space-x-1 tracking-wide uppercase">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Dasbor</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/sisarpras" className="hover:text-indigo-600 transition-colors">SiSarpras</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-indigo-600">{pageInfo.group}</span>
          </div>
          <h1 className="font-semibold text-slate-800 text-sm md:text-base">{pageInfo.title}</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-800">{user.nama || user.email}</p>
              <p className="text-xs text-indigo-500 font-medium">{roleLabels[role || ''] || 'Pengguna'}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <button 
              onClick={() => signOut()}
              className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link href="/auth" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
