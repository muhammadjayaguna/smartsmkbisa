'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Database, Map, Briefcase, Users, Loader2, FileCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { getLocalDateString } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import EarlyWarningSystem from '@/components/simagang/EarlyWarningSystem';
import Image from 'next/image';

export default function SimagangDashboard() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['simagang-dashboard-stats'],
    queryFn: async () => {
      // Fetch totals
      const { count: totalDudika } = await supabase.from('dudika').select('*', { count: 'exact', head: true });
      const { count: absensiHariIni } = await supabase
        .from('absensi_siswa_magang')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', getLocalDateString());

      return {
        totalDudika: totalDudika || 0,
        absensiHariIni: absensiHariIni || 0,
      };
    }
  });

  const prakerinMenus = [
    { title: 'Pengajuan Magang', description: 'Pengajuan dan persetujuan tempat magang siswa', icon: FileCheck, color: 'from-amber-500 to-amber-600', path: '/simagang/pengajuan' },
    { title: 'Absensi Siswa Magang', description: 'Absensi siswa magang dengan foto & lokasi', icon: Camera, color: 'from-teal-500 to-teal-600', path: '/simagang/absensi' },
    { title: 'Laporan Siswa Magang', description: 'Lihat dan ekspor laporan absensi siswa magang', icon: Database, color: 'from-cyan-500 to-cyan-600', path: '/simagang/laporan' },
    { title: 'Peta DUDIKA', description: 'Sebaran lokasi industri tempat magang', icon: Map, color: 'from-blue-400 to-blue-500', path: '/simagang/peta-dudika' },
  ];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Beranda SiMagang" className="mb-2" />
      
      <EarlyWarningSystem />

      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden h-40 shadow-sm border border-slate-200/60">
        <Image src="/animasi/BACKGROUND_JEMBATAN_TINGGI.webp" alt="Background Jembatan" fill className="object-cover opacity-30 mix-blend-overlay z-0" />
        <div className="relative z-10 flex items-center h-full gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-2xl text-white">Dashboard SiMagang</h2>
            <p className="text-teal-50 text-sm mt-1">Pusat kendali Praktik Kerja Lapangan / Prakerin</p>
          </div>
        </div>
        
        {/* Animated Character */}
        <div className="absolute right-0 bottom-0 w-32 h-40 md:w-48 md:h-56 z-10 animate-[float_4s_ease-in-out_infinite]">
          <Image src="/animasi/Melambai-6.webp" alt="Melambai" fill className="object-contain object-bottom" unoptimized />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Mitra DUDIKA', value: stats?.totalDudika, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'Absensi Hari Ini', value: stats?.absensiHariIni, icon: Users, color: 'text-teal-500', bg: 'bg-teal-50' }
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-700">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
          <span className="w-1.5 h-6 bg-teal-600 rounded-full mr-3"></span>
          Prakerin
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {prakerinMenus.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.path)}
              className="group relative bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              
              <h4 className="text-base md:text-lg font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors line-clamp-1">{item.title}</h4>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-2">{item.description}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
                Akses Fitur <span className="ml-2">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
