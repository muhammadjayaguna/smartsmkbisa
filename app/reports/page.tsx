'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Camera, BookOpen } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import AbsensiSiswaReport from '@/components/reports/AbsensiSiswaReport';
import GuruAbsensiReport from '@/components/reports/GuruAbsensiReport';
import JurnalMengajarReport from '@/components/reports/JurnalMengajarReport';

const Reports = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <PageBreadcrumb currentPage="Laporan Absensi" className="mb-4" />
            
            <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
              <CardContent className="p-4 md:p-6">
                <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Laporan Absensi</h1>
                <p className="text-blue-100 text-sm md:text-base">Laporan kehadiran siswa dan guru SMK Negeri 1 Banjarmasin</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="siswa" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="siswa" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 text-xs md:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Absensi Siswa</span>
                <span className="sm:hidden">Siswa</span>
              </TabsTrigger>
              <TabsTrigger value="guru" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 text-xs md:text-sm">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Absensi Guru Apel</span>
                <span className="sm:hidden">Guru</span>
              </TabsTrigger>
              <TabsTrigger value="jurnal" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 text-xs md:text-sm">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Jurnal Mengajar</span>
                <span className="sm:hidden">Jurnal</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="siswa" className="space-y-6">
              <AbsensiSiswaReport />
            </TabsContent>

            <TabsContent value="guru">
              <GuruAbsensiReport />
            </TabsContent>

            <TabsContent value="jurnal">
              <JurnalMengajarReport />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
