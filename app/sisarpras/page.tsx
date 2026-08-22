'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Package, DoorOpen, Wrench, ShoppingCart, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

export default function SisarprasDashboard() {
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
      
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Dashboard SiSarpras</h2>
          <p className="text-xs text-slate-500">Pusat kendali fasilitas dan sarana prasarana sekolah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Aset', value: stats?.totalInventaris, icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { title: 'Ruang Terpakai', value: stats?.totalRuangan, icon: DoorOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { title: 'Kerusakan Aktif', value: stats?.totalKerusakan, icon: Wrench, color: 'text-red-500', bg: 'bg-red-50' },
          { title: 'Pengajuan Baru', value: stats?.totalPengajuan, icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50' }
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
    </div>
  );
}
