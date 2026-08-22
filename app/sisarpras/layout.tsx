import React from 'react';
import SisarprasSidebar from '@/components/sisarpras/SisarprasSidebar';
import SisarprasHeader from '@/components/sisarpras/SisarprasHeader';

export default function SisarprasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <SisarprasSidebar />
      <div className="flex-1 flex flex-col ml-64 h-full overflow-hidden relative bg-slate-50">
        <SisarprasHeader title="Manajemen Sarana Prasarana" />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
