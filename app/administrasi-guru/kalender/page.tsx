'use client';

import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function KalenderPendidikanPage() {
  const tahun = new Date().getFullYear();
  
  const months = [
    { name: 'Juli', days: 31, start: 0 },
    { name: 'Agustus', days: 31, start: 3 },
    { name: 'September', days: 30, start: 6 },
    { name: 'Oktober', days: 31, start: 1 },
    { name: 'November', days: 30, start: 4 },
    { name: 'Desember', days: 31, start: 6 },
    { name: 'Januari', days: 31, start: 2 },
    { name: 'Februari', days: 28, start: 5 },
    { name: 'Maret', days: 31, start: 5 },
    { name: 'April', days: 30, start: 1 },
    { name: 'Mei', days: 31, start: 3 },
    { name: 'Juni', days: 30, start: 6 },
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Simple fixed holiday data
  const holidays: { [key: string]: string } = {
    'Agustus-17': 'HUT RI',
    'Desember-25': 'Natal',
    'Januari-1': 'Tahun Baru',
    'Mei-1': 'Hari Buruh',
    'Juni-1': 'Hari Lahir Pancasila',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Kalender Pendidikan</h2>
          <p className="text-xs text-slate-500">Tahun Ajaran {tahun}/{tahun + 1}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400"></div> Hari Efektif</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400"></div> Libur Nasional</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-300"></div> Weekend</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-400"></div> Hari Ini</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {months.map((month, mIdx) => {
          const monthYear = mIdx < 6 ? tahun : tahun + 1;
          const today = new Date();
          const isCurrentMonth = today.getMonth() === (mIdx < 6 ? mIdx + 6 : mIdx - 6) && today.getFullYear() === monthYear;
          
          return (
            <Card key={month.name} className={`overflow-hidden ${isCurrentMonth ? 'ring-2 ring-blue-400' : ''}`}>
              <div className={`px-4 py-2 text-center font-bold text-sm ${mIdx < 6 ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800' : 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800'}`}>
                {month.name} {monthYear}
              </div>
              <CardContent className="p-3">
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {dayNames.map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>
                  ))}
                  {/* Empty cells for start offset */}
                  {Array.from({ length: month.start }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-1"></div>
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: month.days }).map((_, dayIdx) => {
                    const day = dayIdx + 1;
                    const dayOfWeek = (month.start + dayIdx) % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const holidayKey = `${month.name}-${day}`;
                    const isHoliday = holidays[holidayKey];
                    const isToday = isCurrentMonth && today.getDate() === day;

                    let bgClass = 'bg-emerald-50 text-emerald-700'; // Hari efektif
                    if (isWeekend) bgClass = 'bg-slate-100 text-slate-400';
                    if (isHoliday) bgClass = 'bg-red-100 text-red-600 font-bold';
                    if (isToday) bgClass = 'bg-blue-500 text-white font-bold ring-2 ring-blue-300';

                    return (
                      <div key={day} className={`py-1 text-[11px] rounded ${bgClass}`} title={isHoliday || ''}>
                        {day}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
