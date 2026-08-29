// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Download, Camera, Calendar } from 'lucide-react';
import ExportButtons from '@/components/reports/ExportButtons';
import { format } from 'date-fns';

interface GuruAbsensiData {
  id: string;
  guru_nama: string;
  guru_email: string;
  tanggal: string;
  status: string | null;
  waktu_absen: string | null;
  foto_url: string | null;
  keterangan: string | null;
}

const GuruAbsensiReport = () => {
  const [reportData, setReportData] = useState<GuruAbsensiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tanggal_dari: '',
    tanggal_sampai: ''
  });

  useEffect(() => {
    // Set default to current month Mondays
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilters({
      tanggal_dari: format(firstDay, 'yyyy-MM-dd'),
      tanggal_sampai: format(lastDay, 'yyyy-MM-dd')
    });
  }, []);

  const fetchGuruAbsensiData = async () => {
    if (!filters.tanggal_dari || !filters.tanggal_sampai) {
      toast({
        title: "Error",
        description: "Pilih rentang tanggal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('absensi_guru')
        .select(`
          id,
          tanggal,
          status,
          waktu_absen,
          foto_url,
          keterangan,
          jenis_absensi,
          users:guru_id (
            nama,
            email
          )
        `)
        .eq('jenis_absensi', 'mengajar')
        .gte('tanggal', filters.tanggal_dari)
        .lte('tanggal', filters.tanggal_sampai)
        .order('tanggal', { ascending: false });

      if (error) throw error;

      const processedData: GuruAbsensiData[] = data?.map((item: {
        id: string;
        tanggal: string;
        status: string | null;
        waktu_absen: string | null;
        foto_url: string | null;
        keterangan: string | null;
        users: { nama: string; email: string } | any
      }) => ({
        id: item.id,
        guru_nama: item.users?.nama || '',
        guru_email: item.users?.email || '',
        tanggal: item.tanggal,
        status: item.status || '',
        waktu_absen: item.waktu_absen || '',
        foto_url: item.foto_url,
        keterangan: item.keterangan || ''
      })) || [];

      setReportData(processedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data laporan absensi guru mengajar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Nama Guru', 'Email', 'Tanggal', 'Status', 'Waktu Absen', 'Keterangan'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.guru_nama,
        row.guru_email,
        row.tanggal,
        row.status,
        new Date(row.waktu_absen).toLocaleString('id-ID'),
        row.keterangan
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_absensi_guru_mengajar_${filters.tanggal_dari}_${filters.tanggal_sampai}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: "Laporan absensi guru mengajar berhasil diekspor",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-6 w-6" />
            <span>Filter Laporan Absensi Guru Mengajar</span>
          </CardTitle>
          <CardDescription>Filter laporan absensi mengajar guru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="guru_tanggal_dari">Tanggal Dari</Label>
              <Input
                type="date"
                id="guru_tanggal_dari"
                value={filters.tanggal_dari}
                onChange={(e) => setFilters({ ...filters, tanggal_dari: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="guru_tanggal_sampai">Tanggal Sampai</Label>
              <Input
                type="date"
                id="guru_tanggal_sampai"
                value={filters.tanggal_sampai}
                onChange={(e) => setFilters({ ...filters, tanggal_sampai: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchGuruAbsensiData}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Memuat...' : 'Tampilkan Laporan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-6 w-6" />
                <span>Data Absensi Mengajar Guru</span>
              </CardTitle>
              <CardDescription>
                {reportData.length > 0 ? `Menampilkan ${reportData.length} record` : 'Belum ada data'}
              </CardDescription>
            </div>
            <ExportButtons
              title="Laporan Absensi Mengajar Guru"
              headers={['Nama Guru', 'Email', 'Tanggal', 'Status', 'Waktu Absen', 'Keterangan']}
              rows={reportData.map(row => [
                row.guru_nama, row.guru_email,
                new Date(row.tanggal).toLocaleDateString('id-ID'),
                row.status,
                row.waktu_absen ? new Date(row.waktu_absen).toLocaleString('id-ID') : '-',
                row.keterangan || '-'
              ])}
              fileName={`laporan_absensi_guru_${filters.tanggal_dari}_${filters.tanggal_sampai}`}
              disabled={reportData.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent>
          {reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Guru</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu Absen</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.guru_nama}</TableCell>
                      <TableCell>{row.guru_email}</TableCell>
                      <TableCell>{new Date(row.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'hadir' ? 'bg-green-100 text-green-800' :
                            row.status === 'izin' ? 'bg-yellow-100 text-yellow-800' :
                              row.status === 'sakit' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.waktu_absen ? new Date(row.waktu_absen).toLocaleString('id-ID') : '-'}
                      </TableCell>
                      <TableCell>
                        {row.foto_url ? (
                          <a
                            href={row.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Lihat</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell>{row.keterangan || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data</h3>
              <p className="text-gray-500">Pilih filter dan klik "Tampilkan Laporan" untuk melihat data absensi guru mengajar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuruAbsensiReport;
