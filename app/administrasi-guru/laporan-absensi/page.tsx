'use client';

import React from 'react';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import GuruAbsensiReport from '@/components/reports/GuruAbsensiReport';

export default function LaporanAbsensiGuruPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Laporan Absensi Guru" className="mb-2" />
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Laporan Absensi Guru (Apel)</h1>
          <p className="text-slate-500 mt-1">Lihat dan ekspor data kehadiran guru.</p>
        </div>
        
        <GuruAbsensiReport />
      </div>
    </div>
  );
}
