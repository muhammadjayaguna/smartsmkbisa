import React from 'react';
import SipoinSidebar from '@/components/sipoin/SipoinSidebar';
import SipoinHeader from '@/components/sipoin/SipoinHeader';

export default function SipoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <SipoinSidebar />
      <div className="flex-1 flex flex-col ml-64 h-full overflow-hidden relative bg-slate-50">
        <SipoinHeader title="Sistem Informasi Poin Siswa" />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
