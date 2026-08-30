import React from 'react';
import SintesaSidebar from '@/components/administrasi-guru/SintesaSidebar';
import SintesaHeader from '@/components/administrasi-guru/SintesaHeader';
import { SisminjarProvider } from '@/components/administrasi-guru/SisminjarContext';
import { WaliProvider } from '@/components/administrasi-guru/WaliContext';

export default function AdministrasiGuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SisminjarProvider>
      <WaliProvider>
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
          {/* Sidebar */}
          <SintesaSidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col ml-64 print:ml-0 h-full print:h-auto overflow-hidden print:overflow-visible relative bg-slate-50 print:bg-white">
            <SintesaHeader title="Administrasi Guru" />
            
            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto print:overflow-visible scroll-smooth">
              <div className="p-4 md:p-8 print:p-0 animate-in fade-in duration-500 max-w-[1600px] print:max-w-none mx-auto print:mx-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </WaliProvider>
    </SisminjarProvider>
  );
}
