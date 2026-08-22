// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Download, Calendar, BookOpen, ChevronUp, ChevronDown, Printer } from 'lucide-react';
import ExportButtons from '@/components/reports/ExportButtons';
import { format } from 'date-fns';

interface JurnalMengajarData {
  id: string;
  nama_guru: string;
  mata_pelajaran: string;
  kelas: string;
  tanggal: string;
  jam_mapel: string;
  materi: string;
  alamat_lokasi: string | null;
  siswa_izin: string[] | null;
  siswa_sakit: string[] | null;
  siswa_alfa: string[];
  foto_kegiatan_url: string | null;
  created_at: string;
}

type SortField = 'tanggal' | 'nama_guru' | 'mata_pelajaran' | 'kelas' | 'jam_mapel';
type SortDirection = 'asc' | 'desc';

const JurnalMengajarReport = () => {
  const [reportData, setReportData] = useState<JurnalMengajarData[]>([]);
  const [filteredData, setFilteredData] = useState<JurnalMengajarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState({
    tanggal_dari: '',
    tanggal_sampai: '',
    nama_guru: '',
    mata_pelajaran: '',
    kelas: ''
  });

  useEffect(() => {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilters(prev => ({
      ...prev,
      tanggal_dari: format(firstDay, 'yyyy-MM-dd'),
      tanggal_sampai: format(lastDay, 'yyyy-MM-dd')
    }));
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [reportData, filters, sortField, sortDirection]);

  const fetchJurnalMengajarData = async () => {
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
        .from('jurnal_mengajar')
        .select('*')
        .gte('tanggal', filters.tanggal_dari)
        .lte('tanggal', filters.tanggal_sampai)
        .order('tanggal', { ascending: false });

      if (error) throw error;

      setReportData(data || []);
    } catch (error) {
      console.error('Error fetching jurnal mengajar data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data jurnal mengajar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...reportData];

    // Apply text filters
    if (filters.nama_guru) {
      filtered = filtered.filter(item =>
        item.nama_guru.toLowerCase().includes(filters.nama_guru.toLowerCase())
      );
    }
    if (filters.mata_pelajaran) {
      filtered = filtered.filter(item =>
        item.mata_pelajaran.toLowerCase().includes(filters.mata_pelajaran.toLowerCase())
      );
    }
    if (filters.kelas) {
      filtered = filtered.filter(item =>
        item.kelas.toLowerCase().includes(filters.kelas.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === 'tanggal') {
        const aTime = new Date(a[sortField]).getTime();
        const bTime = new Date(b[sortField]).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      } else {
        const aValue = a[sortField]?.toString().toLowerCase() || '';
        const bValue = b[sortField]?.toString().toLowerCase() || '';

        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
    });

    setFilteredData(filtered);
  }, [reportData, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Tanggal',
      'Nama Guru',
      'Mata Pelajaran',
      'Kelas',
      'Jam Mapel',
      'Materi',
      'Lokasi',
      'Siswa Izin',
      'Siswa Sakit',
      'Siswa Alfa'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        new Date(row.tanggal).toLocaleDateString('id-ID'),
        `"${row.nama_guru}"`,
        `"${row.mata_pelajaran}"`,
        `"${row.kelas}"`,
        `"${row.jam_mapel}"`,
        `"${row.materi.replace(/"/g, '""')}"`,
        `"${row.alamat_lokasi || ''}"`,
        `"${row.siswa_izin?.join('; ') || ''}"`,
        `"${row.siswa_sakit?.join('; ') || ''}"`,
        `"${row.siswa_alfa?.join('; ') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_jurnal_mengajar_${filters.tanggal_dari}_${filters.tanggal_sampai}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: "Laporan jurnal mengajar berhasil diekspor",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <span>Filter Laporan Jurnal Mengajar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            <div>
              <Label htmlFor="tanggal_dari">Tanggal Dari</Label>
              <Input
                type="date"
                id="tanggal_dari"
                value={filters.tanggal_dari}
                onChange={(e) => setFilters({ ...filters, tanggal_dari: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tanggal_sampai">Tanggal Sampai</Label>
              <Input
                type="date"
                id="tanggal_sampai"
                value={filters.tanggal_sampai}
                onChange={(e) => setFilters({ ...filters, tanggal_sampai: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nama_guru">Nama Guru</Label>
              <Input
                id="nama_guru"
                placeholder="Filter nama guru..."
                value={filters.nama_guru}
                onChange={(e) => setFilters({ ...filters, nama_guru: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
              <Input
                id="mata_pelajaran"
                placeholder="Filter mata pelajaran..."
                value={filters.mata_pelajaran}
                onChange={(e) => setFilters({ ...filters, mata_pelajaran: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="kelas">Kelas</Label>
              <Input
                id="kelas"
                placeholder="Filter kelas..."
                value={filters.kelas}
                onChange={(e) => setFilters({ ...filters, kelas: e.target.value })}
              />
            </div>
          </div>
          <Button
            onClick={fetchJurnalMengajarData}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Memuat...' : 'Tampilkan Laporan'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span>Data Jurnal Mengajar</span>
              </CardTitle>
              <CardDescription>
                {filteredData.length > 0 ? `Menampilkan ${filteredData.length} dari ${reportData.length} record` : 'Belum ada data'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 no-print">
              <Button variant="outline" onClick={() => window.print()} disabled={filteredData.length === 0} className="flex items-center space-x-2">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Cetak</span>
              </Button>
              <ExportButtons
                title="Laporan Jurnal Mengajar"
                headers={['Tanggal', 'Nama Guru', 'Mata Pelajaran', 'Kelas', 'Jam Mapel', 'Materi', 'Lokasi', 'Siswa Izin', 'Siswa Sakit', 'Siswa Alfa']}
                rows={filteredData.map(row => [
                  new Date(row.tanggal).toLocaleDateString('id-ID'),
                  row.nama_guru, row.mata_pelajaran, row.kelas, row.jam_mapel,
                  row.materi, row.alamat_lokasi || '-',
                  Array.isArray(row.siswa_izin) ? row.siswa_izin.join('; ') : String(row.siswa_izin || '-').replace(/[{}]/g, ''),
                  Array.isArray(row.siswa_sakit) ? row.siswa_sakit.join('; ') : String(row.siswa_sakit || '-').replace(/[{}]/g, ''),
                  Array.isArray(row.siswa_alfa) ? row.siswa_alfa.join('; ') : String(row.siswa_alfa || '-').replace(/[{}]/g, '')
                ])}
                fileName={`laporan_jurnal_mengajar_${filters.tanggal_dari}_${filters.tanggal_sampai}`}
                disabled={filteredData.length === 0}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('tanggal')}
                        className="h-auto p-0 font-medium hover:bg-transparent flex items-center space-x-1"
                      >
                        <span>Tanggal</span>
                        {getSortIcon('tanggal')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('nama_guru')}
                        className="h-auto p-0 font-medium hover:bg-transparent flex items-center space-x-1"
                      >
                        <span>Nama Guru</span>
                        {getSortIcon('nama_guru')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('mata_pelajaran')}
                        className="h-auto p-0 font-medium hover:bg-transparent flex items-center space-x-1"
                      >
                        <span>Mata Pelajaran</span>
                        {getSortIcon('mata_pelajaran')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('kelas')}
                        className="h-auto p-0 font-medium hover:bg-transparent flex items-center space-x-1"
                      >
                        <span>Kelas</span>
                        {getSortIcon('kelas')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('jam_mapel')}
                        className="h-auto p-0 font-medium hover:bg-transparent flex items-center space-x-1"
                      >
                        <span>Jam Mapel</span>
                        {getSortIcon('jam_mapel')}
                      </Button>
                    </TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead className="text-center">Siswa Bermasalah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {new Date(row.tanggal).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>{row.nama_guru}</TableCell>
                      <TableCell>{row.mata_pelajaran}</TableCell>
                      <TableCell>{row.kelas}</TableCell>
                      <TableCell>{row.jam_mapel}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={row.materi}>
                          {row.materi}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={row.alamat_lokasi || ''}>
                          {row.alamat_lokasi || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1 text-xs">
                          {row.siswa_izin && row.siswa_izin.length > 0 && (
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Izin: {row.siswa_izin.length}
                            </div>
                          )}
                          {row.siswa_sakit && row.siswa_sakit.length > 0 && (
                            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Sakit: {row.siswa_sakit.length}
                            </div>
                          )}
                          {row.siswa_alfa && row.siswa_alfa.length > 0 && (
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              Alfa: {row.siswa_alfa.length}
                            </div>
                          )}
                          {(!row.siswa_izin || row.siswa_izin.length === 0) &&
                            (!row.siswa_sakit || row.siswa_sakit.length === 0) &&
                            (!row.siswa_alfa || row.siswa_alfa.length === 0) && (
                              <div className="text-green-600">-</div>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data</h3>
              <p className="text-gray-500">Pilih filter dan klik "Tampilkan Laporan" untuk melihat data jurnal mengajar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JurnalMengajarReport;
