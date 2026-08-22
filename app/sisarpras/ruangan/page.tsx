'use client';
import React from 'react';
import { Map } from 'lucide-react';
import RuanganTable from '@/components/sisarpras/RuanganTable';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

export default function RuanganPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageBreadcrumb currentPage="Data Ruangan" className="mb-2" />
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Master Data Ruangan</h2>
          <p className="text-xs text-slate-500">Kelola informasi seluruh ruangan, laboratorium, dan kelas di sekolah</p>
        </div>
      </div>
      
      <RuanganTable />
    </div>
  );
}
