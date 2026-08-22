'use client';
import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function JadwalPelajaranPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><CalendarClock className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Jadwal Pelajaran</h2><p className="text-xs text-slate-500">Jadwal mengajar mingguan</p></div>
      </div>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <CalendarClock className="w-16 h-16 text-blue-300 mb-4" />
          <h3 className="font-bold text-xl text-blue-700 mb-2">Segera Hadir</h3>
          <p className="text-sm text-slate-500 max-w-md">Jadwal mengajar akan otomatis ditarik dari sistem akademik sekolah sehingga Anda dapat melihatnya secara praktis di halaman ini.</p>
        </CardContent>
      </Card>
    </div>
  );
}
