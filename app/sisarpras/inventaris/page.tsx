'use client';
import React from 'react';
import { Package } from 'lucide-react';
import InventarisTable from '@/components/sisarpras/InventarisTable';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

export default function InventarisPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageBreadcrumb items={[{ label: 'SiSarpras', path: '/sisarpras' }]} currentPage="Data Barang Inventaris" className="mb-2" />
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Data Inventaris Barang</h2>
          <p className="text-xs text-slate-500">Kelola seluruh aset dan barang milik sekolah</p>
        </div>
      </div>
      
      <InventarisTable />
    </div>
  );
}
