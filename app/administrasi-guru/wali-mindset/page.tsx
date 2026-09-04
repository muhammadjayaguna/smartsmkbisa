'use client';

import React from 'react';
import { Brain, Heart, Search, Target, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWali } from '@/components/administrasi-guru/WaliContext';

export default function WaliMindsetPage() {
  const { activeRombel } = useWali();
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl tracking-tight">Pemetaan Pola Pikir (Mindset) {activeRombel ? `- ${activeRombel.nama_rombel}` : ''}</h2>
            <p className="text-sm text-violet-100 font-medium">Asesmen non-kognitif, gaya belajar, dan minat bakat siswa binaan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Gaya Belajar (Learning Style)</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">Peta persebaran gaya belajar Visual, Auditori, dan Kinestetik pada siswa di kelas Anda.</p>
            <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">Mulai Asesmen</Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Growth vs Fixed Mindset</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">Tes psikologi ringan untuk mengetahui kecenderungan pola pikir siswa saat menghadapi tantangan.</p>
            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">Mulai Asesmen</Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Kesejahteraan Emosional</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">Pantau tingkat stress, motivasi belajar, dan dukungan keluarga dari siswa binaan.</p>
            <Button variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50">Mulai Asesmen</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
        <CardContent className="p-12 text-center">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="font-bold text-slate-700 text-lg">Modul Pemetaan Psikologis Segera Hadir</h4>
          <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
            SiAjar akan segera menghadirkan fitur asesmen psikologi otomatis bekerja sama dengan instrumen bimbingan konseling tersertifikasi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
