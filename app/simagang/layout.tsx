import React from 'react';
import SimagangSidebar from '@/components/simagang/SimagangSidebar';
import SimagangHeader from '@/components/simagang/SimagangHeader';

export default function SimagangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <SimagangSidebar />
      <div className="flex-1 flex flex-col ml-64 h-full overflow-hidden relative bg-slate-50">
        <SimagangHeader title="Sistem Informasi Magang (Prakerin)" />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
