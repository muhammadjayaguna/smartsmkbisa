'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, Calendar } from 'lucide-react';
import ExportButtons from '@/components/reports/ExportButtons';
import { format } from 'date-fns';

interface AbsensiReport {
  siswa_id: string;
  siswa_nama: string;
  nisn: string;
  rombel_nama: string;
  tanggal: string;
  status: string;
  total_jam_hadir: number;
  keterangan: string;
}

interface Rombel {
  id: string;
  nama_rombel: string;
}

export default function AbsensiSiswaReport() {
  const [reportData, setReportData] = useState<AbsensiReport[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tanggal_dari: '',
    tanggal_sampai: '',
    rombel_id: ''
  });

  useEffect(() => {
    fetchRombelList();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFilters({
      tanggal_dari: format(firstDay, 'yyyy-MM-dd'),
      tanggal_sampai: format(lastDay, 'yyyy-MM-dd'),
      rombel_id: ''
    });
  }, []);

  const fetchRombelList = async () => {
    try {
      const { data, error } = await supabase
        .from('rombel')
        .select('*')
        .order('nama_rombel');

      if (error) throw error;
      setRombelList(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data rombel", variant: "destructive" });
    }
  };

  const fetchReportData = async () => {
    if (!filters.tanggal_dari || !filters.tanggal_sampai) {
      toast({ title: "Error", description: "Pilih rentang tanggal terlebih dahulu", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('absensi')
        .select(`
          siswa_id,
          tanggal,
          status,
          keterangan,
          jam_1, jam_2, jam_3, jam_4, jam_5, jam_6,
          jam_7, jam_8, jam_9, jam_10, jam_11, jam_12,
          siswa:siswa_id (
            nama,
            nisn,
            rombel:rombel_id (
              nama_rombel
            )
          )
        `)
        .gte('tanggal', filters.tanggal_dari)
        .lte('tanggal', filters.tanggal_sampai)
        .order('tanggal', { ascending: false });

      if (filters.rombel_id) {
        const { data: siswaInRombel } = await supabase
          .from('siswa')
          .select('id')
          .eq('rombel_id', filters.rombel_id);
        
        if (siswaInRombel && siswaInRombel.length > 0) {
          const siswaIds = siswaInRombel.map(s => s.id);
          query = query.in('siswa_id', siswaIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedData: AbsensiReport[] = data?.map((item: any) => {
        const totalJamHadir = [
          item.jam_1, item.jam_2, item.jam_3, item.jam_4,
          item.jam_5, item.jam_6, item.jam_7, item.jam_8,
          item.jam_9, item.jam_10, item.jam_11, item.jam_12
        ].filter(Boolean).length;

        return {
          siswa_id: item.siswa_id,
          siswa_nama: item.siswa?.nama || '',
          nisn: item.siswa?.nisn || '',
          rombel_nama: item.siswa?.rombel?.nama_rombel || '',
          tanggal: item.tanggal,
          status: item.status || '',
          total_jam_hadir: totalJamHadir,
          keterangan: item.keterangan || ''
        };
      }) || [];

      setReportData(processedData);
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      const errMsg = error?.message || '';
      const isNetwork = errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network');
      
      toast({
        title: "Error",
        description: isNetwork
          ? "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
          : "Gagal memuat data laporan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center space-x-2 text-base text-slate-800">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <span>Filter Laporan Siswa</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal_dari" className="text-sm font-medium">Tanggal Dari</Label>
              <Input
                type="date"
                id="tanggal_dari"
                value={filters.tanggal_dari}
                onChange={(e) => setFilters({...filters, tanggal_dari: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggal_sampai" className="text-sm font-medium">Tanggal Sampai</Label>
              <Input
                type="date"
                id="tanggal_sampai"
                value={filters.tanggal_sampai}
                onChange={(e) => setFilters({...filters, tanggal_sampai: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rombel" className="text-sm font-medium">Rombel (Opsional)</Label>
              <select
                id="rombel"
                value={filters.rombel_id}
                onChange={(e) => setFilters({...filters, rombel_id: e.target.value})}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Semua Rombel</option>
                {rombelList.map((rombel) => (
                  <option key={rombel.id} value={rombel.id}>
                    {rombel.nama_rombel}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchReportData}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? 'Memuat...' : 'Tampilkan Laporan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-base text-slate-800">
                <FileText className="h-5 w-5 text-blue-500" />
                <span>Data Absensi Siswa</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {reportData.length > 0 ? `Menampilkan ${reportData.length} record` : 'Belum ada data'}
              </CardDescription>
            </div>
            <ExportButtons
              title="Laporan Absensi Siswa"
              headers={['NISN', 'Nama Siswa', 'Rombel', 'Tanggal', 'Status', 'Total Jam Hadir', 'Keterangan']}
              rows={reportData.map(row => [
                row.nisn, row.siswa_nama, row.rombel_nama,
                new Date(row.tanggal).toLocaleDateString('id-ID'),
                row.status, `${row.total_jam_hadir}/12`, row.keterangan
              ])}
              fileName={`laporan_absensi_siswa_${filters.tanggal_dari}_${filters.tanggal_sampai}`}
              disabled={reportData.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>NISN</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Rombel</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Total Jam Hadir</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-600">{row.nisn}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{row.siswa_nama}</TableCell>
                      <TableCell>{row.rombel_nama}</TableCell>
                      <TableCell>{new Date(row.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          row.status === 'hadir' ? 'bg-emerald-100 text-emerald-800' :
                          row.status === 'izin' ? 'bg-amber-100 text-amber-800' :
                          row.status === 'sakit' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">{row.total_jam_hadir}/12</TableCell>
                      <TableCell className="text-slate-500 text-sm">{row.keterangan}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 mb-1">Belum Ada Data</h3>
              <p className="text-sm text-slate-500">Pilih filter dan klik "Tampilkan Laporan" untuk melihat data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
