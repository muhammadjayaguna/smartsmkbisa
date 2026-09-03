'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const FloatingMascot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Daftar path di mana maskot sebaiknya disembunyikan
  const hiddenPaths = ['/auth-login'];
  // Karena dashboard (page.tsx yang menggunakan /) sudah punya maskot, kita mungkin mau menyembunyikannya di sana juga
  // Tapi untuk saat ini kita tampilkan di mana-mana kecuali auth-login.
  
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
    <div 
      className={`fixed bottom-20 md:bottom-4 right-4 z-50 transition-all duration-1000 ease-in-out pointer-events-none
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
    >
      <div className="relative w-24 h-32 md:w-32 md:h-40 pointer-events-auto cursor-pointer group drop-shadow-2xl hover:scale-110 transition-transform duration-300">
        {/* Tooltip Chat Bubble (Muncul saat hover) */}
        <div className="absolute -top-12 right-12 md:-left-16 w-32 bg-white text-slate-800 text-xs font-medium p-2 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 z-10 border border-slate-100">
          Butuh bantuan?
          {/* Segitiga panah chat bubble */}
          <div className="absolute -bottom-2 right-4 md:left-20 w-4 h-4 bg-white transform rotate-45 border-r border-b border-slate-100"></div>
        </div>
        <Image 
          src="/animasi/SMA_ketawa_loop.gif" // Menggunakan karakter SMA ketawa loop
          alt="Asisten SMK" 
          fill 
          className="object-contain object-bottom drop-shadow-xl"
          unoptimized
        />
      </div>
    </div>
  );
};

export default FloatingMascot;
