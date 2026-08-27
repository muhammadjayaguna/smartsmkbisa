'use client';

import React, { useEffect, useState } from 'react';
import { BarChart2, Users, Book, FileCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

export default function LaporanSekolahPage() {
  const [stats, setStats] = useState({ totalSiswa: 0, totalGuru: 0, totalJurnal: 0, totalMapel: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siswaRes, guruRes, jurnalRes, mapelRes] = await Promise.all([
          supabase.from('siswa').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'guru'),
          supabase.from('jurnal_mengajar').select('id', { count: 'exact', head: true }),
          supabase.from('pengaturan_guru').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalSiswa: siswaRes.count || 0,
          totalGuru: guruRes.count || 0,
          totalJurnal: jurnalRes.count || 0,
          totalMapel: mapelRes.count || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <BarChart2 className="w-7 h-7" /> Laporan Sekolah
        </h2>
        <p className="text-rose-100 text-sm mt-1">Rekap data akademik, kehadiran, dan performa seluruh sekolah</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Siswa', value: stats.totalSiswa, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Guru', value: stats.totalGuru, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Total Jurnal', value: stats.totalJurnal, icon: Book, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Konfigurasi Mapel', value: stats.totalMapel, icon: FileCheck, color: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5 text-center">
              <div className={`w-12 h-12 rounded-xl ${item.color.split(' ')[1]} flex items-center justify-center mx-auto mb-3`}>
                <item.icon className={`w-6 h-6 ${item.color.split(' ')[0]}`} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{loading ? '...' : item.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-rose-800 text-sm">Fitur Lanjutan Segera Hadir</h4>
          <p className="text-xs text-rose-600 mt-1">Grafik perbandingan antar kelas, ekspor laporan PDF, dan analisis tren kehadiran akan segera tersedia di update mendatang.</p>
        </div>
      </div>
    </div>
  );
}
