'use client';

import React from 'react';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AbsensiSayaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <CheckSquare className="w-7 h-7" /> Absensi Saya
        </h2>
        <p className="text-emerald-100 text-sm mt-1">Rekap kehadiran dan persentase kehadiran Anda</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-emerald-800 text-sm">Segera Hadir</h4>
          <p className="text-xs text-emerald-600 mt-1">Fitur rekap absensi sedang dalam pengembangan. Data kehadiran akan muncul setelah guru menginput absensi kelas.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hadir', value: '—', color: 'bg-green-50 text-green-600' },
          { label: 'Izin', value: '—', color: 'bg-amber-50 text-amber-600' },
          { label: 'Sakit', value: '—', color: 'bg-blue-50 text-blue-600' },
          { label: 'Alfa', value: '—', color: 'bg-red-50 text-red-600' },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-extrabold ${item.color.split(' ')[1]}`}>{item.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
