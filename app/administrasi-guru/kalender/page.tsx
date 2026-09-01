'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Info, AlertCircle, Printer } from 'lucide-react';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';
import { Button } from '@/components/ui/button';

// Helper to generate calendar matrix
const generateCalendar = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let weeks = [];
  let currentWeek = [];
  
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

const monthsData = [
  {
    name: 'Juli', year: 2026, month: 6,
    events: [
      { dates: [13], desc: 'Hari Pertama Masuk Sekolah/Awal Tahun Ajaran Baru', highlight: 'blue' },
      { dates: [13, 14, 15, 16, 17], desc: 'Masa Pengenalan Lingkungan Sekolah (MPLS)', highlight: 'blue' },
      { dates: [20, 21, 22, 23, 24], desc: 'Asesmen Diagnostik Kelas X', highlight: 'blue' }
    ]
  },
  {
    name: 'Agustus', year: 2026, month: 7,
    events: [
      { dates: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], desc: 'Bimbingan Lanjut Kepala Satuan Pendidikan dari Pendidik', highlight: 'blue' },
      { dates: [14], desc: 'Peringatan Hari Pramuka ke-65 (Upacara)', highlight: 'blue' },
      { dates: [17], desc: 'Peringatan Proklamasi Kemerdekaan RI ke-71 (Upacara)', highlight: 'red' },
      { dates: [20, 21], desc: 'Rangkaian Peringatan HUT SMKN 1 Banjarmasin yang ke-72', highlight: 'red' },
      { dates: [18, 20, 22], desc: 'Pemilu Pengurus OSIS', highlight: 'blue' },
      { dates: [26], desc: 'Peringatan Maulid Nabi Muhammad SAW 1447 H (Libur)', highlight: 'red' }
    ]
  },
  {
    name: 'September', year: 2026, month: 8,
    events: []
  },
  {
    name: 'Oktober', year: 2026, month: 9,
    events: [
      { dates: [5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24], desc: 'Lomba Keahlian Siswa SMK (LKS SMK)', highlight: 'blue' },
      { dates: [24, 25, 26, 27, 28, 29, 30], desc: 'Pelaksanaan Asesmen Tengah Semester Ganjil', highlight: 'blue' },
      { dates: [28], desc: 'Peringatan Hari Sumpah Pemuda ke-98 (Upacara)', highlight: 'blue' }
    ]
  },
  {
    name: 'November', year: 2026, month: 10,
    events: [
      { dates: [10], desc: 'Peringatan Hari Pahlawan (Upacara)', highlight: 'blue' },
      { dates: [25], desc: 'Peringatan Hari Guru Nasional (Upacara)', highlight: 'red' }
    ]
  },
  {
    name: 'Desember', year: 2026, month: 11,
    events: [
      { dates: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], desc: 'Asesmen Sumatif Ganjil', highlight: 'blue' },
      { dates: [18], desc: 'Pembagian Laporan Hasil Belajar (LHB) Semester Ganjil', highlight: 'blue' },
      { dates: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], desc: 'Libur Semester Ganjil (2 Pekan)', highlight: 'red' },
      { dates: [25], desc: 'Hari Raya Natal (Libur)', highlight: 'red' }
    ]
  },
  {
    name: 'Januari', year: 2027, month: 0,
    events: [
      { dates: [1], desc: 'Tahun Baru Masehi (Libur)', highlight: 'red' },
      { dates: [4], desc: 'Awal Semester Genap', highlight: 'blue' },
      { dates: [20], desc: 'Isra Miraj Nabi Muhammad SAW 1448 H (Libur)', highlight: 'red' }
    ]
  },
  {
    name: 'Februari', year: 2027, month: 1,
    events: [
      { dates: [7], desc: 'Tahun Baru Imlek 2577 (Libur)', highlight: 'red' },
      { dates: [10, 11, 12, 13], desc: 'Libur Awal Ramadhan (Libur)', highlight: 'red' }
    ]
  },
  {
    name: 'Maret', year: 2027, month: 2,
    events: [
      { dates: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13], desc: 'Libur Sekitar Hari Raya Idul Fitri 1447 H (Libur)', highlight: 'red' },
      { dates: [9], desc: 'Hari Raya Nyepi (Libur)', highlight: 'red' },
      { dates: [10], desc: 'Libur Hari Raya Idul Fitri 1447 H (Libur)', highlight: 'red' },
      { dates: [10, 11], desc: 'Libur Setelah Hari Raya Idul Fitri 1447 H (Libur)', highlight: 'red' },
      { dates: [26], desc: 'Jumat Agung (Libur)', highlight: 'red' },
      { dates: [30, 31], desc: 'Uji Kompetensi Keahlian (UKK)', highlight: 'blue' }
    ]
  },
  {
    name: 'April', year: 2027, month: 3,
    events: [
      { dates: [5, 6, 7, 8, 9, 12, 13, 14, 15, 16], desc: 'Asesmen Sumatif Semester Genap Kelas XII', highlight: 'blue' }
    ]
  },
  {
    name: 'Mei', year: 2027, month: 4,
    events: [
      { dates: [1], desc: 'Hari Buruh (Libur)', highlight: 'red' },
      { dates: [2], desc: 'Hari Pendidikan Nasional (Upacara)', highlight: 'blue' },
      { dates: [6], desc: 'Pengumuman Kelulusan', highlight: 'blue' },
      { dates: [8], desc: 'Awal Tahun Hijriah Baru 1449 H (Libur)', highlight: 'red' },
      { dates: [18], desc: 'Kenaikan Isa Almasih (Libur)', highlight: 'red' },
      { dates: [17], desc: 'Hari Raya Waisak 2571 (Libur)', highlight: 'red' },
      { dates: [20], desc: 'Hari Kebangkitan Nasional (Upacara)', highlight: 'blue' }
    ]
  },
  {
    name: 'Juni', year: 2027, month: 5,
    events: [
      { dates: [1], desc: 'Hari Lahir Pancasila (Libur)', highlight: 'red' },
      { dates: [7, 8, 9, 10, 11, 14, 15, 16, 17, 18], desc: 'Asesmen Sumatif Semester Genap Kelas X dan XI', highlight: 'blue' },
      { dates: [26], desc: 'Tahun Baru Islam 1449 H (Libur)', highlight: 'red' },
      { dates: [18], desc: 'Pembagian Laporan Hasil Belajar (LHB) Semester Genap', highlight: 'blue' },
      { dates: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], desc: 'Libur Semester Genap', highlight: 'red' }
    ]
  }
];

const initialRME = {
  gasal: [
    { id: 'juli', month: 'Juli 2026', total: 5, tdkEfektif: 2, keterangan: 'Libur Smt Genap, MPLS' },
    { id: 'agustus', month: 'Agustus 2026', total: 4, tdkEfektif: 0, keterangan: '' },
    { id: 'september', month: 'September 2026', total: 5, tdkEfektif: 0, keterangan: '' },
    { id: 'oktober', month: 'Oktober 2026', total: 4, tdkEfektif: 0, keterangan: '' },
    { id: 'november', month: 'November 2026', total: 4, tdkEfektif: 1, keterangan: 'Tes Kemampuan Akademik' },
    { id: 'desember', month: 'Desember 2026', total: 5, tdkEfektif: 4, keterangan: 'Sumatif Ganjil, LHB, Libur S' },
  ],
  genap: [
    { id: 'januari', month: 'Januari 2027', total: 4, tdkEfektif: 0, keterangan: '' },
    { id: 'februari', month: 'Februari 2027', total: 4, tdkEfektif: 1, keterangan: 'Libur Awal Ramadhan' },
    { id: 'maret', month: 'Maret 2027', total: 5, tdkEfektif: 2, keterangan: 'Libur Ramadhan & Idul Fitri' },
    { id: 'april', month: 'April 2027', total: 4, tdkEfektif: 0, keterangan: '' },
    { id: 'mei', month: 'Mei 2027', total: 4, tdkEfektif: 0, keterangan: '' },
    { id: 'juni', month: 'Juni 2027', total: 5, tdkEfektif: 4, keterangan: 'Sumatif Genap, LHB, Libur S' },
  ]
};

export default function KalenderPendidikanPage() {
  const [activeTab, setActiveTab] = useState<'visual' | 'efektif'>('visual');
  const [rmeData, setRmeData] = useState(initialRME);

  useEffect(() => {
    const saved = localStorage.getItem('smartsmkbisa_rme_data');
    if (saved) {
      try {
        setRmeData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const updateRME = (semester: 'gasal' | 'genap', id: string, field: string, value: string | number) => {
    const newData = { ...rmeData };
    const month = newData[semester].find(m => m.id === id);
    if (month) {
      month[field as keyof typeof month] = value as never;
      setRmeData(newData);
      localStorage.setItem('smartsmkbisa_rme_data', JSON.stringify(newData));
    }
  };

  const resetRME = () => {
    setRmeData(initialRME);
    localStorage.removeItem('smartsmkbisa_rme_data');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print-container print:max-w-none print:w-full bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Kalender Pendidikan 2026/2027</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
            <Printer className="w-4 h-4 mr-2" /> Cetak Kalender
          </Button>
        </div>
      </div>

      <div className="hidden print:block w-full mb-6 text-center">
        <KopSurat />
        <h3 className="font-bold text-xl uppercase underline underline-offset-4 decoration-2 text-black mt-6">
          {activeTab === 'visual' ? 'KALENDER PENDIDIKAN' : 'RINCIAN MINGGU EFEKTIF'}
        </h3>
        <h4 className="font-bold text-sm uppercase mt-1 text-black">Tahun Ajaran 2026/2027</h4>
      </div>

      <div className="flex flex-wrap items-center gap-2 no-print bg-slate-100/50 p-2 rounded-xl w-max">
        <Button 
          onClick={() => setActiveTab('visual')}
          className={`${activeTab === 'visual' ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'} rounded-lg h-9 px-6 text-sm font-bold`}
        >Kalender Visual</Button>
        <Button 
          onClick={() => setActiveTab('efektif')}
          className={`${activeTab === 'efektif' ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'} rounded-lg h-9 px-6 text-sm font-bold`}
        >Minggu Efektif</Button>
      </div>

      {activeTab === 'visual' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        {monthsData.map((month) => {
          const weeks = generateCalendar(month.year, month.month);
          
          return (
            <div key={month.name} className="bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden print-card-reset print:break-inside-avoid">
              <div className="text-center font-bold text-indigo-700 py-4 text-[15px]">
                {month.name} {month.year}
              </div>
              <div className="px-5 pb-5">
                <table className="w-full text-center border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead>
                    <tr>
                      {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                        <th key={d} className={`border border-slate-200 py-2 text-xs font-bold ${i === 0 ? 'text-red-500' : 'text-slate-700'}`}>
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, wIdx) => (
                      <tr key={wIdx}>
                        {week.map((day, dIdx) => {
                          const isSunday = dIdx === 0;
                          
                          let bgClass = 'bg-white';
                          let textClass = isSunday ? 'text-red-500' : 'text-slate-700';
                          let isHighlight = false;

                          if (day) {
                            month.events.forEach(event => {
                              if (event.dates.includes(day)) {
                                if (event.highlight === 'blue') {
                                  bgClass = 'bg-blue-50 border-blue-200';
                                  textClass = 'text-blue-700 font-bold';
                                } else if (event.highlight === 'red') {
                                  bgClass = 'bg-red-50 border-red-200';
                                  textClass = 'text-red-700 font-bold';
                                }
                                isHighlight = true;
                              }
                            });
                          }
                          
                          return (
                            <td key={dIdx} className={`border border-slate-200 py-2.5 text-xs ${bgClass} ${isHighlight ? 'relative z-10' : ''}`}>
                              <span className={`${textClass}`}>{day || ''}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {month.events.length > 0 && (
                  <div className="mt-4 space-y-1.5 px-1">
                    {month.events.map((event, idx) => {
                      const datesStr = event.dates.length > 1 
                        ? (event.dates.length === 2 ? `${event.dates[0]}, ${event.dates[1]}` : `${event.dates[0]} - ${event.dates[event.dates.length-1]}`)
                        : event.dates[0];
                        
                      return (
                        <div key={idx} className="text-[10px] leading-tight text-slate-700 flex items-start gap-1">
                          <span className={`font-bold whitespace-nowrap ${event.highlight === 'blue' ? 'text-blue-600' : 'text-red-600'}`}>
                            {datesStr} {month.name} {month.year}:
                          </span>
                          <span>{event.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-slate-500 leading-relaxed no-print">
            Berikut adalah perhitungan Rincian Minggu Efektif (RME) berdasarkan kalender akademik. 
            Anda bisa mengedit angka <strong className="text-slate-700">Total Minggu</strong>, <strong className="text-slate-700">Minggu Tidak Efektif</strong>, 
            dan <strong className="text-slate-700">Keterangan</strong> langsung di tabel untuk menyesuaikan dengan kondisi nyata sekolah Anda. 
            Nilai akan tersimpan otomatis. <button onClick={resetRME} className="text-blue-500 hover:underline cursor-pointer">Reset ke nilai bawaan</button>
          </p>
          
          {(['gasal', 'genap'] as const).map((semester) => (
            <div key={semester} className="bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden print-card-reset print:break-inside-avoid">
              <div className="px-6 py-4">
                <h3 className="font-bold text-indigo-500 text-lg">Semester {semester === 'gasal' ? 'Gasal' : 'Genap'}</h3>
              </div>
              <div className="px-6 pb-6 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-200/50">
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bulan</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-28">Jml. Minggu</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-32">Tdk Efektif</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-28">Efektif</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rmeData[semester].map((row) => {
                      const efektif = (Number(row.total) || 0) - (Number(row.tdkEfektif) || 0);
                      return (
                        <tr key={row.id} className="border-b border-slate-200/60 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-sm text-slate-700">{row.month}</td>
                          <td className="py-3 px-4 text-center">
                            <input 
                              type="number" min="0" max="6" 
                              value={row.total}
                              onChange={(e) => updateRME(semester, row.id, 'total', e.target.value)}
                              className="w-16 h-8 text-center bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all no-print print:hidden"
                            />
                            <span className="hidden print:inline text-sm text-slate-700">{row.total}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input 
                              type="number" min="0" max="6" 
                              value={row.tdkEfektif}
                              onChange={(e) => updateRME(semester, row.id, 'tdkEfektif', e.target.value)}
                              className="w-16 h-8 text-center bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all no-print print:hidden"
                            />
                            <span className="hidden print:inline text-sm text-slate-700">{row.tdkEfektif}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-bold text-indigo-600">
                            {efektif}
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              value={row.keterangan}
                              placeholder="Keterangan..."
                              onChange={(e) => updateRME(semester, row.id, 'keterangan', e.target.value)}
                              className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all no-print print:hidden"
                            />
                            <span className="hidden print:inline text-sm text-slate-700">{row.keterangan}</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100/50">
                      <td className="py-4 px-4 text-sm font-bold text-slate-800">JUMLAH</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        {rmeData[semester].reduce((acc, row) => acc + (Number(row.total) || 0), 0)}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        {rmeData[semester].reduce((acc, row) => acc + (Number(row.tdkEfektif) || 0), 0)}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-indigo-600">
                        {rmeData[semester].reduce((acc, row) => acc + ((Number(row.total) || 0) - (Number(row.tdkEfektif) || 0)), 0)}
                      </td>
                      <td className="py-4 px-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
