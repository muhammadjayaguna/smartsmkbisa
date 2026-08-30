import React from 'react';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';

export function KopSurat() {
  const { appSettings } = useSisminjar();

  if (!appSettings?.url_kop_surat) {
    return null;
  }

  return (
    <div className="w-full pb-6 hidden print:block border-b-2 border-black">
      <img src={appSettings.url_kop_surat} alt="Kop Surat" className="w-full h-auto max-h-[150px] object-contain" />
    </div>
  );
}
