'use client';
import React from 'react';
import { BookMarked } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function JurnalKelasPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><BookMarked className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Jurnal Kelas (Wali Kelas)</h2><p className="text-xs text-slate-500">Catatan harian kelas dan pembinaan</p></div>
      </div>
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <BookMarked className="w-16 h-16 text-emerald-300 mb-4" />
          <h3 className="font-bold text-xl text-emerald-700 mb-2">Segera Hadir</h3>
          <p className="text-sm text-slate-500 max-w-md">Wali kelas dapat memantau jurnal mengajar dari seluruh guru yang masuk ke kelasnya dalam satu halaman terpusat.</p>
        </CardContent>
      </Card>
    </div>
  );
}
