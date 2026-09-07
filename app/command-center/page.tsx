'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2, Activity, ShieldCheck, Box, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function CommandCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // States for data
  const [poinData, setPoinData] = useState<any[]>([]);
  const [sarprasData, setSarprasData] = useState<any[]>([]);
  const [magangStats, setMagangStats] = useState({ active: 0, dudika: 0 });
  const [trxStats, setTrxStats] = useState({ total: 0, sum: 0 });

  useEffect(() => {
    // Optionally check if user is admin, but since it's a demo, we let anyone see it
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // 1. Fetch SiPoin (Aggregate Positif vs Negatif)
      const { data: poin } = await supabase.from('poin_siswa').select('jenis, poin');
      let pos = 0, neg = 0;
      if (poin) {
        poin.forEach(p => {
          if (p.jenis === 'positif') pos += p.poin;
          else if (p.jenis === 'negatif') neg += p.poin;
        });
      }
      setPoinData([
        { name: 'Prestasi (Positif)', value: pos, color: '#10b981' },
        { name: 'Pelanggaran (Negatif)', value: neg, color: '#ef4444' }
      ]);

      // 2. Fetch SiSarpras (Kondisi Aset)
      const { data: sarpras } = await supabase.from('inventaris_barang').select('kondisi, jumlah');
      let baik = 0, ringan = 0, berat = 0;
      if (sarpras) {
        sarpras.forEach(s => {
          if (s.kondisi === 'Baik') baik += s.jumlah;
          else if (s.kondisi === 'Rusak Ringan') ringan += s.jumlah;
          else if (s.kondisi === 'Rusak Berat') berat += s.jumlah;
        });
      }
      setSarprasData([
        { name: 'Baik', jumlah: baik, color: '#10b981' },
        { name: 'Rusak Ringan', jumlah: ringan, color: '#f59e0b' },
        { name: 'Rusak Berat', jumlah: berat, color: '#ef4444' }
      ]);

      // 3. Fetch SiMagang
      const { count: countSiswa } = await supabase.from('siswa_magang').select('*', { count: 'exact', head: true });
      const { count: countDudika } = await supabase.from('dudika').select('*', { count: 'exact', head: true });
      setMagangStats({ active: countSiswa || 0, dudika: countDudika || 0 });

      // 4. Fetch Marketplace (Transactions)
      const { data: txData } = await supabase.from('transactions').select('amount');
      let txSum = 0;
      if (txData) {
        txData.forEach(t => txSum += (t.amount || 0));
      }
      setTrxStats({ total: txData?.length || 0, sum: txSum });

    } catch (err) {
      console.error("Error fetching command center data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
        <p className="font-mono uppercase tracking-widest text-sm">INITIALIZING COMMAND CENTER...</p>
      </div>
    );
  }

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8 overflow-x-hidden relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-widest uppercase">Live System Analytics</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Executive Command Center</h1>
            <p className="text-slate-400 mt-1">Pantauan terpadu ekosistem Smart SMK Bisa.</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-xs text-slate-300">SYSTEM ONLINE</span>
          </div>
        </header>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-400">Total Transaksi Ekonomi</p>
                  <p className="text-2xl font-bold text-white">{formatIDR(trxStats.sum)}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-400">
                <span>Dari {trxStats.total} transaksi (Marketplace)</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-400">Kesehatan Aset Sarpras</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round((sarprasData.find(s => s.name === 'Baik')?.jumlah || 0) / Math.max(1, sarprasData.reduce((a,b)=>a+b.jumlah,0)) * 100)}%
                  </p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <Box className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-indigo-400">
                <span>Total {sarprasData.reduce((a,b)=>a+b.jumlah,0)} unit terdata</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-400">Iklim Kedisiplinan</p>
                  <p className="text-2xl font-bold text-white">
                    {(poinData.find(p=>p.name === 'Prestasi (Positif)')?.value || 0)} Poin
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-blue-400">
                <span>Total poin prestasi sekolah</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-400">Sebaran Magang</p>
                  <p className="text-2xl font-bold text-white">{magangStats.active} Siswa</p>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                  <Users className="w-5 h-5 text-cyan-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-cyan-400">
                <span>Tersebar di {magangStats.dudika} Industri</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Karakter & Kedisiplinan (SiPoin) */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Analisis Karakter SiPoin
              </CardTitle>
              <CardDescription className="text-slate-400">Perbandingan total poin prestasi dan pelanggaran.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {poinData.reduce((a,b) => a+b.value, 0) > 0 ? (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={poinData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {poinData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 opacity-50" />
                  Belum ada data poin dicatat.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kondisi Inventaris (SiSarpras) */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-400" />
                Distribusi Kondisi Aset
              </CardTitle>
              <CardDescription className="text-slate-400">Kesehatan fasilitas dan barang milik sekolah.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
              {sarprasData.reduce((a,b)=>a+b.jumlah,0) > 0 ? (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sarprasData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: '#1e293b'}} 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                      />
                      <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                        {sarprasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 opacity-50" />
                  Belum ada data inventaris dicatat.
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
