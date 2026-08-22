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
          <div className="flex-1 flex flex-col ml-64 h-full overflow-hidden relative bg-slate-50">
            <SintesaHeader title="Administrasi Guru" />
            
            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth">
              <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </WaliProvider>
    </SisminjarProvider>
  );
}
