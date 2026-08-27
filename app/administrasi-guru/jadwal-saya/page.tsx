'use client';

import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export default function JadwalSayaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Calendar className="w-7 h-7" /> Jadwal Pelajaran
        </h2>
        <p className="text-blue-100 text-sm mt-1">Jadwal mingguan dan informasi guru pengampu</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-blue-800 text-sm">Segera Hadir</h4>
          <p className="text-xs text-blue-600 mt-1">Fitur jadwal pelajaran sedang dalam pengembangan. Jadwal akan ditampilkan setelah data diinput oleh admin atau guru.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {DAYS.map((day) => (
          <Card key={day} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm">{day}</h3>
                <p className="text-xs text-slate-400">Belum ada jadwal</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
