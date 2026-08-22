'use client';
import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DaftarSiswaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><Users className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Daftar Siswa (Wali Kelas)</h2><p className="text-xs text-slate-500">Data profil siswa bimbingan wali kelas</p></div>
      </div>
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <Users className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="font-bold text-xl text-slate-700 mb-2">Segera Hadir</h3>
          <p className="text-sm text-slate-500 max-w-md">Halaman ini khusus untuk Guru yang menjabat sebagai Wali Kelas untuk mengelola data siswa di kelasnya.</p>
        </CardContent>
      </Card>
    </div>
  );
}
