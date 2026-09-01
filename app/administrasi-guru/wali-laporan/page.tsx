'use client';

import React from 'react';
import { FileCheck, Download, Printer, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWali } from '@/components/administrasi-guru/WaliContext';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';

export default function WaliLaporanPage() {
  const { activeRombel } = useWali();
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print-container print:max-w-none print:w-full">
      <div className="hidden print:block w-full">
        <KopSurat />
        <div className="pb-4 pt-2 text-center">
          <h2 className="text-xl font-bold uppercase underline pb-2">Laporan Wali Kelas</h2>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Laporan & Evaluasi {activeRombel ? `- ${activeRombel.nama_rombel}` : ''}</h2>
            <p className="text-xs text-slate-500">Cetak rapor kepribadian dan laporan akhir wali kelas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200/60 shadow-sm col-span-1 bg-slate-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-800 mb-4 text-base">Filter Cetak</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Jenis Laporan</label>
                <select className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white">
                  <option>Laporan Bulanan Wali Kelas</option>
                  <option>Rapor Karakter / P5</option>
                  <option>Buku Induk Siswa</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Bulan / Periode</label>
                <select className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white">
                  <option>Agustus 2026</option>
                  <option>Semester Ganjil 2026/2027</option>
                </select>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4">
                <Filter className="w-4 h-4 mr-2" /> Tampilkan Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm md:col-span-2">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <FileCheck className="w-8 h-8 text-purple-300" />
            </div>
            <h4 className="font-bold text-slate-700 text-lg mb-2">Pratinjau Laporan (Segera Hadir)</h4>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Fitur pembuatan laporan PDF dan pencetakan sedang dalam tahap pengembangan. 
              Nantinya Anda dapat mencetak rekapitulasi kehadiran, nilai, dan pembinaan dalam satu klik.
            </p>
            <div className="flex gap-3">
              <Button disabled variant="outline" className="opacity-50">
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
              <Button disabled className="bg-purple-600 text-white opacity-50">
                <Download className="w-4 h-4 mr-2" /> Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
