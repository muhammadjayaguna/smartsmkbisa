'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, History, BarChart3, Award, TrendingUp, TrendingDown, Users, Loader2, ThumbsUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export default function SipoinDashboard() {
  const router = useRouter();
  const { role, isSiswa, loading: roleLoading } = useUserRole();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['sipoin-dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [totalPositif, totalNegatif, hariIniPositif, hariIniNegatif] = await Promise.all([
        supabase.from('poin_siswa').select('poin', { count: 'exact' }).eq('jenis', 'positif'),
        supabase.from('poin_siswa').select('poin', { count: 'exact' }).eq('jenis', 'negatif'),
        supabase.from('poin_siswa').select('poin', { count: 'exact' }).eq('jenis', 'positif').eq('tanggal', today),
        supabase.from('poin_siswa').select('poin', { count: 'exact' }).eq('jenis', 'negatif').eq('tanggal', today),
      ]);

      // Top 5 berprestasi (poin positif tertinggi)
      const { data: topPositif } = await supabase.rpc('get_top_poin_siswa', { jenis_filter: 'positif', limit_count: 5 }).select('*');

      // Top 5 bermasalah (poin negatif tertinggi)
      const { data: topNegatif } = await supabase.rpc('get_top_poin_siswa', { jenis_filter: 'negatif', limit_count: 5 }).select('*');

      return {
        totalPositif: totalPositif.count || 0,
        totalNegatif: totalNegatif.count || 0,
        hariIniPositif: hariIniPositif.count || 0,
        hariIniNegatif: hariIniNegatif.count || 0,
        topPositif: topPositif || [],
        topNegatif: topNegatif || [],
      };
    }
  });

  const menuItems = [
    ...(isSiswa ? [] : [{ title: 'Catat Poin Baru', description: 'Tambahkan poin prestasi atau pelanggaran', icon: PlusCircle, color: 'from-amber-500 to-amber-600', path: '/sipoin/catat' }]),
    { title: 'Riwayat Poin', description: 'Lihat seluruh riwayat pencatatan poin', icon: History, color: 'from-blue-500 to-blue-600', path: '/sipoin/riwayat' },
    ...(isSiswa ? [] : [{ title: 'Rekap Per Siswa', description: 'Rangkuman saldo poin seluruh siswa', icon: BarChart3, color: 'from-emerald-500 to-emerald-600', path: '/sipoin/rekap' }]),
  ];

  if (isLoading || roleLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Beranda SiPoin" className="mb-2" />

      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white relative h-40 shadow-sm border border-slate-200/60">
        <div className="absolute inset-0 overflow-hidden rounded-2xl z-0">
          <Image src="/animasi/5_BACKGROUND_TAMAN_DAN_KOTA.webp" alt="Taman dan Kota" fill className="object-cover opacity-20 mix-blend-overlay" />
        </div>
        
        <div className="relative z-10 flex items-center h-full gap-4 p-6">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-2xl text-white">Dashboard SiPoin</h2>
            <p className="text-amber-50 text-sm mt-1">Sistem Pencatatan Poin Prestasi & Pelanggaran Siswa</p>
          </div>
        </div>
        
        <div className="absolute right-4 -bottom-0 w-32 h-48 md:w-40 md:h-52 z-10 drop-shadow-xl animate-[float_4s_ease-in-out_infinite]">
          <Image src="/animasi/SMA_LK2.webp" alt="Siswa Disiplin" fill className="object-contain object-bottom" unoptimized />
        </div>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Prestasi', value: stats?.totalPositif, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Total Pelanggaran', value: stats?.totalNegatif, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
          { title: 'Prestasi Hari Ini', value: stats?.hariIniPositif, icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'Pelanggaran Hari Ini', value: stats?.hariIniNegatif, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-xl font-black text-slate-700">{stat.value ?? 0}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menu Navigasi */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
          <span className="w-1.5 h-6 bg-amber-500 rounded-full mr-3"></span>
          Fitur SiPoin
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.path)}
              className="group relative bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              
              <h4 className="text-base md:text-lg font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors line-clamp-1">{item.title}</h4>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-2">{item.description}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
                Akses Fitur <span className="ml-2">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
