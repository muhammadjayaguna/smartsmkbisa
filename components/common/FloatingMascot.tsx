'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings, Activity, Briefcase, Award, Package } from 'lucide-react';

const FloatingMascot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Daftar path di mana maskot sebaiknya disembunyikan
  const hiddenPaths = ['/auth-login'];
  
  useEffect(() => {
    // Beri delay sedikit saat muncul
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return (
    <Sheet>
      <div 
        className={`fixed bottom-20 md:bottom-4 right-4 z-50 transition-all duration-1000 ease-in-out pointer-events-none
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <SheetTrigger asChild>
          <div className="relative w-24 h-32 md:w-32 md:h-40 pointer-events-auto cursor-pointer group drop-shadow-2xl hover:scale-110 transition-transform duration-300">
            {/* Tooltip Chat Bubble (Muncul saat hover) */}
            <div className="absolute -top-12 right-12 md:-left-16 w-40 bg-white text-slate-800 text-xs font-medium p-2 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 z-10 border border-slate-100 text-center">
              Kenali Fitur Aplikasi!
              {/* Segitiga panah chat bubble */}
              <div className="absolute -bottom-2 right-4 md:left-24 w-4 h-4 bg-white transform rotate-45 border-r border-b border-slate-100"></div>
            </div>
            <Image 
              src="/animasi/SMA_ketawa_loop.gif" // Menggunakan karakter SMA ketawa loop
              alt="Asisten SMK" 
              fill 
              className="object-contain object-bottom drop-shadow-xl"
              unoptimized
            />
          </div>
        </SheetTrigger>
      </div>

      <SheetContent side="right" className="w-[90vw] sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b text-left">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">👋</span> Panduan Smart SMK
          </SheetTitle>
          <SheetDescription className="text-left">
            Berikut adalah penjelasan fitur-fitur yang ada di aplikasi ini:
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex gap-4">
            <div className="mt-1 bg-teal-100 p-2.5 rounded-xl text-teal-600 h-fit">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Sisminjar (Administrasi Guru)</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">Sistem administrasi mengajar untuk mengelola Capaian Pembelajaran, ATP, Modul Ajar, hingga Presensi dan Jurnal Harian.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 bg-indigo-100 p-2.5 rounded-xl text-indigo-600 h-fit">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">SiSarpras (Sarana & Prasarana)</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">Sistem informasi manajemen sarana dan prasarana. Memudahkan proses peminjaman ruangan dan barang inventaris sekolah.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 bg-emerald-100 p-2.5 rounded-xl text-emerald-600 h-fit">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">SiMagang (Prakerin)</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">Sistem informasi magang atau Praktik Kerja Lapangan (PKL) untuk memonitor kegiatan siswa di dunia industri.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 bg-amber-100 p-2.5 rounded-xl text-amber-600 h-fit">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">SiPoin (Kesiswaan)</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">Pencatatan poin prestasi dan pelanggaran siswa secara real-time untuk pembinaan karakter yang lebih baik.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 bg-pink-100 p-2.5 rounded-xl text-pink-600 h-fit">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">SMKmart (Marketplace)</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">Pusat jual beli karya siswa dan produk unit produksi sekolah (Teaching Factory).</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FloatingMascot;
