'use client';
import React from 'react';
import { UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RekapAbsenKelasPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600"><UserCheck className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Rekap Absensi (Wali Kelas)</h2><p className="text-xs text-slate-500">Rekap kehadiran siswa per kelas</p></div>
      </div>
      <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200/50">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <UserCheck className="w-16 h-16 text-sky-300 mb-4" />
          <h3 className="font-bold text-xl text-sky-700 mb-2">Segera Hadir</h3>
          <p className="text-sm text-slate-500 max-w-md">Laporan rekapitulasi kehadiran siswa (Hadir, Sakit, Izin, Alpha) yang diakumulasi secara otomatis untuk keperluan evaluasi Wali Kelas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
