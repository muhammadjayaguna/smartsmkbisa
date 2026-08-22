'use client';
import React, { useState } from 'react';
import { PeminjamanRuangan } from './PeminjamanRuanganTable';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, subMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RuanganCalendarProps {
  data: PeminjamanRuangan[] | undefined;
  onDateClick: (dateStr: string) => void;
  onEventClick: (item: PeminjamanRuangan) => void;
}

export default function RuanganCalendar({ data = [], onDateClick, onEventClick }: RuanganCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStarts: 1 }); // Start Monday
  const endDate = endOfWeek(monthEnd, { weekStarts: 1 });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Generate days
  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const getEventsForDay = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return data.filter(item => item.tanggal_peminjaman === formattedDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8">
            Hari Ini
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekDays.map(wd => (
          <div key={wd} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 bg-slate-200 gap-px border-b border-slate-200">
        {days.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, monthStart);
          const isToday = isSameDay(date, new Date());
          const dayEvents = getEventsForDay(date);

          return (
            <div 
              key={i} 
              onClick={() => onDateClick(format(date, 'yyyy-MM-dd'))}
              className={`min-h-[120px] bg-white p-2 transition-colors cursor-pointer hover:bg-slate-50
                ${!isCurrentMonth ? 'opacity-50 bg-slate-50' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}
                `}>
                  {format(date, 'd')}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayEvents.map(event => {
                  let bgColor = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                  if (event.status === 'Disetujui') bgColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                  if (event.status === 'Ditolak') bgColor = 'bg-red-100 text-red-700 border-red-200';

                  return (
                    <div 
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className={`text-[10px] leading-tight p-1.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity font-medium ${bgColor}`}
                      title={`${event.nama_ruangan} (Jam ${event.mulai_jam}-${event.sampai_jam})`}
                    >
                      <span className="font-bold mr-1">J{event.mulai_jam}-{event.sampai_jam}</span>
                      {event.nama_ruangan}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
