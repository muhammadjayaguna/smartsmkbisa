'use client';
import React from 'react';
import { Wrench } from 'lucide-react';
import LaporanKerusakanTable from '@/components/sisarpras/LaporanKerusakanTable';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

export default function LaporanKerusakanPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageBreadcrumb items={[{ label: 'SiSarpras', path: '/sisarpras' }]} currentPage="Lapor Kerusakan" className="mb-2" />
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Laporan Kerusakan (Ticketing)</h2>
          <p className="text-xs text-slate-500">Laporkan kerusakan aset atau fasilitas agar segera ditangani</p>
        </div>
      </div>
      
      <LaporanKerusakanTable />
    </div>
  );
}
