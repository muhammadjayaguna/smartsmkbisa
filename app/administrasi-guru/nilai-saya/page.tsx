'use client';

import React from 'react';
import { Star, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function NilaiSayaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Star className="w-7 h-7" /> Nilai Saya
        </h2>
        <p className="text-amber-100 text-sm mt-1">Pantau perkembangan akademik Anda di seluruh mata pelajaran</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-amber-800 text-sm">Segera Hadir</h4>
          <p className="text-xs text-amber-600 mt-1">Fitur ini sedang dalam tahap pengembangan. Nilai Anda akan muncul setelah guru pengampu menginput data penilaian.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Matematika', 'Bahasa Indonesia', 'Informatika'].map((mapel, i) => (
          <Card key={i} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{mapel}</h3>
              <p className="text-2xl font-extrabold text-slate-300 mt-2">—</p>
              <p className="text-[10px] text-slate-400 mt-1">Belum ada data</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
