'use client';
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import PengajuanSiswa from '@/components/simagang/PengajuanSiswa';
import PengajuanAdmin from '@/components/simagang/PengajuanAdmin';

export default function PengajuanMagangPage() {
  const { isSiswa, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Pengajuan Magang" className="mb-2" />
      
      {isSiswa ? <PengajuanSiswa /> : <PengajuanAdmin />}
    </div>
  );
}
