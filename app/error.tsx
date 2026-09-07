'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home, Wrench } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Terjadi kesalahan pada sistem:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />

      {/* Animated Character */}
      <div className="relative z-10 w-48 h-56 md:w-64 md:h-72 mb-4 animate-[bounce_3s_ease-in-out_infinite]">
        <Image 
          src="/animasi/menggaruk-kepala-6.webp" 
          alt="Karakter Menggaruk Kepala (Error)" 
          fill 
          className="object-contain object-bottom"
          unoptimized
        />
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner transform -translate-y-12 -mb-8 border-4 border-white">
          <Wrench className="w-7 h-7" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tight">
          Waduh! Fitur dalam Perbaikan 🛠️
        </h1>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          Maaf banget ya, sepertinya fitur ini sedang mengalami sedikit kendala atau dalam masa *maintenance*. Tim ahli bongkar-pasang kami sedang bekerja secepat kilat untuk memperbaikinya! ⚡
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => reset()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200/50 h-11 px-6 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Coba Sekali Lagi
          </Button>
          <Button 
            onClick={() => router.push('/')} 
            variant="outline"
            className="rounded-xl hover:bg-slate-50 border-slate-200 text-slate-600 h-11 px-6 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
      
      <div className="mt-8 relative z-10 text-xs text-slate-400 font-mono bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        Kode Gangguan: <span className="font-bold text-slate-500">{error.digest || 'SYSTEM_MAINTENANCE'}</span>
      </div>
    </div>
  );
}
