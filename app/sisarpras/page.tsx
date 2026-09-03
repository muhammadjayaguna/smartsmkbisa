'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Package, DoorOpen, Wrench, ShoppingCart, Loader2, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
export default function SisarprasDashboard() {
  const { role } = useUserRole();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['sisarpras-dashboard-stats'],
    queryFn: async () => {
      // Fetch totals
      const { count: totalInventaris } = await supabase.from('inventaris_barang').select('*', { count: 'exact', head: true });
      const { count: totalRuangan } = await supabase.from('peminjaman_ruangan').select('*', { count: 'exact', head: true }).eq('status', 'Disetujui');
      const { count: totalKerusakan } = await supabase.from('laporan_kerusakan').select('*', { count: 'exact', head: true }).in('status', ['Menunggu', 'Diproses']);
      const { count: totalPengajuan } = await supabase.from('pengajuan_pengadaan').select('*', { count: 'exact', head: true }).eq('status', 'Menunggu Kajur');
      
      // Fetch data for charts
      const { data: inventaris } = await supabase.from('inventaris_barang').select('kondisi, kategori');
      
      // Aggregate kondisi
      const kondisiCount = { 'Baik': 0, 'Rusak Ringan': 0, 'Rusak Berat': 0 };
      // Aggregate kategori
      const kategoriCount: Record<string, number> = {};

      if (inventaris) {
        inventaris.forEach(item => {
          if(item.kondisi === 'Baik') kondisiCount['Baik']++;
          else if(item.kondisi === 'Rusak Ringan') kondisiCount['Rusak Ringan']++;
          else if(item.kondisi === 'Rusak Berat') kondisiCount['Rusak Berat']++;

          const kat = item.kategori || 'Lainnya';
          kategoriCount[kat] = (kategoriCount[kat] || 0) + 1;
        });
      }

      const kondisiChart = [
        { name: 'Baik', value: kondisiCount['Baik'], color: '#10b981' }, // emerald-500
        { name: 'Rusak Ringan', value: kondisiCount['Rusak Ringan'], color: '#f59e0b' }, // amber-500
        { name: 'Rusak Berat', value: kondisiCount['Rusak Berat'], color: '#ef4444' }, // red-500
      ].filter(item => item.value > 0);

      const kategoriChart = Object.keys(kategoriCount).map(k => ({
        name: k,
        total: kategoriCount[k]
      })).sort((a,b) => b.total - a.total).slice(0, 5); // top 5

      return {
        totalInventaris: totalInventaris || 0,
        totalRuangan: totalRuangan || 0,
        totalKerusakan: totalKerusakan || 0,
        totalPengajuan: totalPengajuan || 0,
        kondisiChart,
        kategoriChart
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Beranda SiSarpras" className="mb-2" />
      
      {/* Role-aware banner */}
      {role === 'siswa' ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden h-40">
          <Image src="/animasi/13_BACKGROUND_RUANGAN.webp" alt="Ruangan" fill className="object-cover opacity-30 mix-blend-overlay z-0" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold">Hai, {user?.nama || 'Siswa'}! 👋</h2>
            <p className="text-blue-50 text-sm mt-1">Pinjam barang, booking ruangan, atau laporkan kerusakan fasilitas sekolah.</p>
            <div className="mt-3 inline-flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">🎓 Siswa</div>
          </div>
          
          <div className="absolute right-4 -bottom-4 w-32 h-40 z-10 drop-shadow-xl">
            <Image src="/animasi/SMA_LK2.webp" alt="Siswa" fill className="object-contain object-bottom" unoptimized />
          </div>
        </div>
      ) : role === 'teknisi' ? (
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden h-40">
          <Image src="/animasi/13_BACKGROUND_RUANGAN.webp" alt="Ruangan" fill className="object-cover opacity-30 mix-blend-overlay z-0" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold">Panel Teknisi 🔧</h2>
            <p className="text-cyan-50 text-sm mt-1">Kelola laporan kerusakan dan maintenance fasilitas sekolah.</p>
            <div className="mt-3 inline-flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">🔧 Teknisi</div>
          </div>
          
          <div className="absolute right-0 bottom-0 w-32 h-40 md:w-48 md:h-56 z-10 animate-[float_4s_ease-in-out_infinite]">
            <Image src="/animasi/MENJELASKAN-BERDIRI-MENYAMPING8.webp" alt="Teknisi" fill className="object-contain object-bottom" unoptimized />
          </div>
        </div>
      ) : (role === 'admin' || role === 'waka_sarpras') ? (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold">{role === 'admin' ? 'Admin SiSarpras' : 'Waka Sarpras'} ⚙️</h2>
            <p className="text-slate-300 text-sm mt-1">Akses penuh ke manajemen inventaris, peminjaman, dan pengadaan.</p>
            <div className="mt-3 inline-flex items-center bg-red-500/20 px-3 py-1 rounded-full text-xs font-bold text-red-300 border border-red-500/20">{role === 'admin' ? '⚙️ Super Admin' : '🏫 Waka Sarpras'}</div>
          </div>
          <Activity className="w-20 h-20 text-white opacity-5 absolute right-6 top-2" />
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Dashboard SiSarpras</h2>
            <p className="text-xs text-slate-500">Pusat kendali fasilitas dan sarana prasarana sekolah</p>
          </div>
        </div>
      )}

      {/* Stats — filtered per role */}
      <div className={`grid grid-cols-1 ${role === 'siswa' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {role !== 'siswa' && (
          <Card className="border-slate-200/60 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Aset</p>
                <h3 className="text-2xl font-black text-slate-700">{stats?.totalInventaris}</h3>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ruang Terpakai</p>
              <h3 className="text-2xl font-black text-slate-700">{stats?.totalRuangan}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kerusakan Aktif</p>
              <h3 className="text-2xl font-black text-slate-700">{stats?.totalKerusakan}</h3>
            </div>
          </CardContent>
        </Card>
        {role !== 'siswa' && (
          <Card className="border-slate-200/60 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pengajuan Baru</p>
                <h3 className="text-2xl font-black text-slate-700">{stats?.totalPengajuan}</h3>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions for Siswa */}
      {role === 'siswa' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Pinjam Barang', desc: 'Ajukan peminjaman barang sekolah', path: '/sisarpras/peminjaman-barang', icon: Package, color: 'text-blue-600 bg-blue-50' },
            { title: 'Booking Ruangan', desc: 'Ajukan peminjaman ruangan', path: '/sisarpras/peminjaman-ruangan', icon: DoorOpen, color: 'text-indigo-600 bg-indigo-50' },
            { title: 'Lapor Kerusakan', desc: 'Laporkan fasilitas yang rusak', path: '/sisarpras/lapor-kerusakan', icon: Wrench, color: 'text-red-600 bg-red-50' },
          ].map((item) => (
            <Link key={item.path} href={item.path}>
              <Card className="border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl ${item.color.split(' ')[1]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 ${item.color.split(' ')[0]}`} />
                  </div>
                  <h3 className="font-bold text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                  <span className={`text-xs font-semibold ${item.color.split(' ')[0]} flex items-center gap-1`}>
                    Akses <ArrowRight className="w-3 h-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      {/* Charts — hidden for siswa */}
      {role !== 'siswa' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Kondisi Aset Inventaris</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {stats?.kondisiChart.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">Belum ada data</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.kondisiChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.kondisiChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Barang`, 'Jumlah']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Top 5 Kategori Aset Terbanyak</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.kategoriChart.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">Belum ada data</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.kategoriChart} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => [`${value} Barang`, 'Total']} />
                    <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
