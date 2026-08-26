import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Users, GraduationCap, UserCheck, FileText, Calendar, Settings, Camera, Database, BookOpen, Megaphone, Package, Bot, Map, DoorOpen, Activity, Briefcase, Award } from 'lucide-react';
import PemberitahuanSection from '@/components/pemberitahuan/PemberitahuanSection';
import { getLocalDateString } from '@/lib/utils';

interface Stats {
  totalRombel: number;
  totalSiswa: number;
  absensiHariIni: number;
}

let statsCache: { data: Stats; timestamp: number } | null = null;
const STATS_CACHE_DURATION = 2 * 60 * 1000;

const Dashboard = () => {
  const router = useRouter();
  const { isAdmin, role, loading: roleLoading } = useUserRole();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalRombel: 0,
    totalSiswa: 0,
    absensiHariIni: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      if (statsCache && Date.now() - statsCache.timestamp < STATS_CACHE_DURATION) {
        setStats(statsCache.data);
        setLoading(false);
        return;
      }

      const [rombelResult, siswaResult, absensiResult] = await Promise.all([
        supabase.from('rombel').select('*', { count: 'exact', head: true }),
        supabase.from('siswa').select('*', { count: 'exact', head: true }),
        supabase
          .from('absensi')
          .select('*', { count: 'exact', head: true })
          .eq('tanggal', getLocalDateString())
      ]);

      const newStats = {
        totalRombel: rombelResult.count || 0,
        totalSiswa: siswaResult.count || 0,
        absensiHariIni: absensiResult.count || 0
      };

      statsCache = {
        data: newStats,
        timestamp: Date.now()
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (statsCache) {
        setStats(statsCache.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const adminMenuItems = useMemo(() => [

    {
      category: "Akademik & Operasional",
      items: [
        { title: 'Sisminjar', description: 'Sistem Administrasi Mengajar', icon: Settings, color: 'from-teal-500 to-emerald-600', path: '/administrasi-guru' },
      ]
    },
    {
      category: "SARPRAS",
      items: [
        { title: 'SiSarpras', description: 'Dashboard Sarana & Prasarana', icon: Activity, color: 'from-indigo-500 to-purple-600', path: '/sisarpras' },
      ]
    },
    {
      category: "Prakerin",
      items: [
        { title: 'SiMagang', description: 'Sistem Informasi Magang / Prakerin', icon: Briefcase, color: 'from-teal-500 to-emerald-600', path: '/simagang' }
      ]
    },
    {
      category: "Kesiswaan",
      items: [
        { title: 'SiPoin', description: 'Pencatatan Poin Prestasi & Pelanggaran', icon: Award, color: 'from-amber-500 to-orange-600', path: '/sipoin' },
      ]
    },
    {
      category: "Kewirausahaan",
      items: [
        { title: 'SMKmart', description: 'Pusat jual beli karya siswa & produk sekolah', icon: Package, color: 'from-pink-500 to-rose-600', path: '/marketplace' },
        { title: 'Admin SMKmart', description: 'Kelola data toko dan produk', icon: Settings, color: 'from-slate-600 to-slate-800', path: '/admin/marketplace' }
      ]
    },
    {
      category: "Administrasi Sistem",
      items: [
        { title: 'Manajemen Rombel', description: 'Kelola data rombel dan kelas', icon: GraduationCap, color: 'from-green-500 to-green-600', path: '/manage-rombel' },
        { title: 'Manajemen Siswa', description: 'Kelola data siswa', icon: Users, color: 'from-orange-500 to-orange-600', path: '/manage-siswa' },
        { title: 'Manajemen Pengguna', description: 'Kelola data pengguna sistem', icon: Settings, color: 'from-indigo-500 to-indigo-600', path: '/manage-users' },
        { title: 'Manajemen Pemberitahuan', description: 'Kelola pengumuman untuk semua pengguna', icon: Megaphone, color: 'from-purple-500 to-pink-600', path: '/manage-pemberitahuan' },
      ]
    },
    {
      category: "Asisten Cerdas",
      items: [
        { title: 'AI Chat Admin', description: 'Tanya jawab data dengan asisten AI', icon: Bot, color: 'from-blue-600 to-indigo-700', path: '/admin/chat' }
      ]
    }
  ], []);

  const guruMenuItems = useMemo(() => [

    {
      category: "Akademik & Operasional",
      items: [
        { title: 'Sisminjar', description: 'Sistem Administrasi Mengajar', icon: Settings, color: 'from-teal-500 to-emerald-600', path: '/administrasi-guru' },
      ]
    },
    {
      category: "SARPRAS",
      items: [
        { title: 'SiSarpras', description: 'Dashboard Sarana & Prasarana', icon: Activity, color: 'from-indigo-500 to-purple-600', path: '/sisarpras' },
      ]
    },
    {
      category: "Prakerin",
      items: [
        { title: 'SiMagang', description: 'Sistem Informasi Magang / Prakerin', icon: Briefcase, color: 'from-teal-500 to-emerald-600', path: '/simagang' }
      ]
    },
    {
      category: "Kesiswaan",
      items: [
        { title: 'SiPoin', description: 'Pencatatan Poin Prestasi & Pelanggaran', icon: Award, color: 'from-amber-500 to-orange-600', path: '/sipoin' },
      ]
    },
    {
      category: "Kewirausahaan",
      items: [
        { title: 'SMKmart', description: 'Pusat jual beli karya siswa & produk sekolah', icon: Package, color: 'from-pink-500 to-rose-600', path: '/marketplace' }
      ]
    }
  ], []);

  const siswaMenuItems = useMemo(() => [
    {
      category: "Prakerin",
      items: [
        { title: 'SiMagang', description: 'Sistem Informasi Magang / Prakerin', icon: Briefcase, color: 'from-teal-500 to-emerald-600', path: '/simagang' }
      ]
    },
    {
      category: "SARPRAS",
      items: [
        { title: 'SiSarpras', description: 'Dashboard Sarana & Prasarana', icon: Activity, color: 'from-indigo-500 to-purple-600', path: '/sisarpras' },
      ]
    },
    {
      category: "Kesiswaan",
      items: [
        { title: 'SiPoin', description: 'Lihat Poin Prestasi & Pelanggaran Saya', icon: Award, color: 'from-amber-500 to-orange-600', path: '/sipoin' },
      ]
    },
    {
      category: "Kewirausahaan",
      items: [
        { title: 'SMKmart', description: 'Pusat jual beli karya siswa & produk sekolah', icon: Package, color: 'from-pink-500 to-rose-600', path: '/marketplace' }
      ]
    }
  ], []);

  const currentMenuItems = useMemo(() => {
    if (isAdmin) return adminMenuItems;
    if (role === 'siswa') return siswaMenuItems;
    return guruMenuItems;
  }, [isAdmin, role, adminMenuItems, guruMenuItems, siswaMenuItems]);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-0 relative">
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-teal-600 via-emerald-700 to-teal-800 z-0 rounded-b-[40px] shadow-lg overflow-hidden">
        {/* Decorative background removed for performance */}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 pt-8 md:pt-12 relative z-10">
        <div className="mb-8 md:mb-10 relative">
          <div className="flex items-start justify-between">
            <div className="text-white space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                Selamat Datang, {role === 'admin' ? 'Administrator' : role === 'siswa' ? 'Siswa' : 'Guru'}
              </h1>
              <p className="text-blue-100 text-sm md:text-lg font-medium opacity-90">
                SMK Negeri 1 Banjarmasin
              </p>
              <div className="inline-flex items-center mt-3 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs md:text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2 opacity-80" />
                <span>{currentDate}</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl">
                <img
                  src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png"
                  alt="Logo SMKN 1 Banjarmasin"
                  className="h-20 w-20 bg-white rounded-xl p-2 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
           <PemberitahuanSection />
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">Total Rombel</CardTitle>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-2xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.totalRombel}</div>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden md:block">Kelas terdaftar aktif</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">Total Siswa</CardTitle>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-2xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.totalSiswa}</div>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden md:block">Siswa terdaftar aktif</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">Absen Hari Ini</CardTitle>
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-2xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.absensiHariIni}</div>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden md:block">Kehadiran tercatat</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Menu Utama</h2>
            <p className="text-sm text-slate-500 mt-1">Pilih layanan yang ingin Anda akses</p>
          </div>
        </div>

        <div className="space-y-8 md:space-y-12">
          {currentMenuItems.map((categoryGroup, catIdx) => (
            <div key={catIdx}>
              <h3 className="text-lg md:text-xl font-bold text-slate-700 mb-4 flex items-center">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
                {categoryGroup.category}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {categoryGroup.items.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(item.path)}
                    className="group relative bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                    
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg shadow-${item.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    
                    <h4 className="text-base md:text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h4>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
                      Akses Fitur <span className="ml-2">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
