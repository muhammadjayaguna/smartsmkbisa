'use client';
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import PengadaanTable from '@/components/sisarpras/PengadaanTable';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

export default function PengadaanPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageBreadcrumb items={[{ label: 'SiSarpras', path: '/sisarpras' }]} currentPage="Pengajuan Pengadaan" className="mb-2" />
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Pengajuan Pengadaan Barang</h2>
          <p className="text-xs text-slate-500">Ajukan kebutuhan fasilitas atau bahan praktik baru</p>
        </div>
      </div>
      
      <PengadaanTable />
    </div>
  );
}
