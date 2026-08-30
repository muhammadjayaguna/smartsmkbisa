import React from 'react';

interface PrintHeaderProps {
  title?: string;
}

export default function PrintHeader({ title }: PrintHeaderProps) {
  return (
    <div className="hidden print-only mb-6 border-b-2 border-black pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder - You can replace this with an actual img later */}
          <div className="w-16 h-16 border-2 border-black flex items-center justify-center rounded-full font-bold text-xl">
            SMK
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-black m-0 leading-tight">
              PEMERINTAH PROVINSI KALIMANTAN SELATAN
            </h1>
            <h2 className="text-lg font-bold uppercase tracking-widest text-black m-0 leading-tight">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h2>
            <h3 className="text-2xl font-black uppercase text-black m-0 mt-1 leading-none">
              SMK NEGERI 1 BANJARMASIN
            </h3>
            <p className="text-xs text-black mt-1 m-0">
              Jalan Mulawarman No.45, Teluk Dalam, Kec. Banjarmasin Tengah, Kota Banjarmasin
            </p>
          </div>
        </div>
      </div>
      
      {title && (
        <div className="text-center mt-6 mb-2">
          <h4 className="text-lg font-bold uppercase text-black underline underline-offset-4 decoration-2">
            {title}
          </h4>
        </div>
      )}
    </div>
  );
}
