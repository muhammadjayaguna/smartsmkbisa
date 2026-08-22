// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, MapPin, Clock, Search, Eye, Calendar, ArrowLeft, Download, LogIn, LogOut } from 'lucide-react';
import ExportButtons from '@/components/reports/ExportButtons';
import { useRouter } from 'next/navigation';

import { useUserRole } from '@/hooks/useUserRole';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

interface AbsensiData {
  id: string;
  tanggal: string;
  waktu_absen: string;
  foto_url: string;
  lokasi_lat: number;
  lokasi_lng: number;
  alamat_lokasi: string;
  keterangan: string;
  status: string;
  jenis_absensi: string;
  siswa: {
    nama: string;
    nisn: string;
  };
}

const DataAbsensiSiswaMagang = () => {
  const router = useRouter();
  const { role, isSiswa } = useUserRole();
  const [absensiData, setAbsensiData] = useState<AbsensiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [selectedAbsensi, setSelectedAbsensi] = useState<AbsensiData | null>(null);
  const [activeTab, setActiveTab] = useState('masuk');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDetail = (item: AbsensiData) => {
    setSelectedAbsensi(item);
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchAbsensiData();
  }, []);

  const fetchAbsensiData = async () => {
    try {
      const { data, error } = await supabase
        .from('absensi_siswa_magang')
        .select(`
          *,
          siswa:siswa_id (
            nama,
            nisn
          )
        `)
        .order('waktu_absen', { ascending: false });

      if (error) throw error;
      setAbsensiData(data || []);
    } catch (error: any) {
      console.error('Error fetching absensi data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data absensi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = absensiData.filter((item) => {
    const matchesSearch = item.siswa?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.siswa?.nisn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesJenis = item.jenis_absensi === activeTab;
    const matchesTanggal = !filterTanggal || item.tanggal === filterTanggal;
    
    return matchesSearch && matchesStatus && matchesJenis && matchesTanggal;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
      case 'terlambat':
        return <Badge className="bg-yellow-100 text-yellow-800">Terlambat</Badge>;
      case 'sakit':
        return <Badge className="bg-blue-100 text-blue-800">Sakit</Badge>;
      case 'izin':
        return <Badge className="bg-purple-100 text-purple-800">Izin</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'masuk':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Masuk</Badge>;
      case 'pulang':
        return <Badge variant="outline" className="text-green-600 border-green-600">Pulang</Badge>;
      default:
        return <Badge variant="outline">{jenis}</Badge>;
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
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
      'Nama Siswa', 
      'NISN', 
      'Tanggal', 
      'Waktu Absensi', 
      'Jenis Absensi', 
      'Status', 
      'Lokasi',
      'Keterangan'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        `"${row.siswa?.nama || 'N/A'}"`,
        `"${row.siswa?.nisn || 'N/A'}"`,
        new Date(row.tanggal).toLocaleDateString('id-ID'),
        new Date(row.waktu_absen).toLocaleTimeString('id-ID'),
        `"${row.jenis_absensi}"`,
        `"${row.status}"`,
        `"${row.alamat_lokasi || ''}"`,
        `"${row.keterangan || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data_absensi_siswa_magang_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: "Data absensi berhasil diekspor",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <PageBreadcrumb currentPage="Data Absensi Siswa Magang" className="mb-4" />

          <div className="mb-8">
            <Card className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Data Absensi Siswa Magang</h1>
                    <p className="text-teal-100 text-lg">Lihat riwayat absensi siswa magang dengan foto dan lokasi</p>
                  </div>
                  <Camera className="h-16 w-16 text-teal-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Masuk/Pulang */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="masuk" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Absensi Masuk
              </TabsTrigger>
              <TabsTrigger value="pulang" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Absensi Pulang
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Data</CardTitle>
              <CardDescription>Filter data absensi berdasarkan kriteria tertentu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cari Siswa</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nama atau NISN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="hadir">Hadir</SelectItem>
                      <SelectItem value="terlambat">Terlambat</SelectItem>
                      <SelectItem value="sakit">Sakit</SelectItem>
                      <SelectItem value="izin">Izin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal</label>
                  <Input
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Riwayat Absensi</CardTitle>
                  <CardDescription>
                    Menampilkan {filteredData.length} dari {absensiData.length} data absensi
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <ExportButtons
                    title={`Data Absensi Siswa Magang - ${activeTab === 'masuk' ? 'Masuk' : 'Pulang'}`}
                    headers={['Nama Siswa', 'NISN', 'Tanggal', 'Waktu Absensi', 'Jenis Absensi', 'Status', 'Lokasi', 'Keterangan']}
                    rows={filteredData.map(row => [
                      row.siswa?.nama || 'N/A',
                      row.siswa?.nisn || 'N/A',
                      new Date(row.tanggal).toLocaleDateString('id-ID'),
                      new Date(row.waktu_absen).toLocaleTimeString('id-ID'),
                      row.jenis_absensi,
                      row.status,
                      row.alamat_lokasi || '-',
                      row.keterangan || '-'
                    ])}
                    fileName={`data_absensi_siswa_magang_${activeTab}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}`}
                    disabled={filteredData.length === 0}
                  />
                  {!isSiswa && (
                    <Button onClick={fetchAbsensiData} variant="outline">
                      Refresh Data
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Memuat data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Tanggal & Waktu</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.siswa?.nama || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{item.siswa?.nisn || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(item.tanggal).toLocaleDateString('id-ID')}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {new Date(item.waktu_absen).toLocaleTimeString('id-ID')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getJenisBadge(item.jenis_absensi)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openGoogleMaps(item.lokasi_lat, item.lokasi_lng)}
                              className="flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              Lihat
                            </Button>
                          </TableCell>
                          <TableCell>
                            {/* Hide detail button for siswa on masuk tab */}
                            {!(isSiswa && activeTab === 'masuk') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenDetail(item)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detail
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredData.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Tidak ada data absensi yang ditemukan</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Dialog - moved outside table to prevent removeChild errors */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-teal-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-teal-700">Detail Absensi</DialogTitle>
          </DialogHeader>
          {selectedAbsensi && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-600">Nama Siswa</label>
                  <p className="font-bold text-gray-800 text-lg">{selectedAbsensi.siswa?.nama}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-600">NISN</label>
                  <p className="font-bold text-gray-800 text-lg">{selectedAbsensi.siswa?.nisn}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-600">Tanggal</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    <p className="font-medium text-gray-700">{new Date(selectedAbsensi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-600">Waktu</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-teal-500" />
                    <p className="font-medium text-gray-700">{new Date(selectedAbsensi.waktu_absen).toLocaleTimeString('id-ID')}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-600">Jenis Absensi</label>
                  <div className="mt-1">{getJenisBadge(selectedAbsensi.jenis_absensi)}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedAbsensi.status)}</div>
                </div>
              </div>
              
              {selectedAbsensi.foto_url && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-teal-500" />
                      Foto Absensi
                    </label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                      onClick={() => window.open(selectedAbsensi.foto_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat Foto Penuh
                    </Button>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-xl border-2 border-teal-100 bg-black/5 flex items-center justify-center min-h-[200px]">
                    <img
                      src={selectedAbsensi.foto_url}
                      alt="Foto Absensi"
                      className="max-w-full max-h-[500px] w-auto h-auto object-contain transition-transform hover:scale-[1.02] duration-300"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-500" />
                  Lokasi Presensi
                </label>
                <div className="mt-1 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-gray-100/50">
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{selectedAbsensi.alamat_lokasi}</p>
                  <div className="flex items-center">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openGoogleMaps(selectedAbsensi.lokasi_lat, selectedAbsensi.lokasi_lng)}
                      className="bg-teal-600 hover:bg-teal-700 shadow-md transition-all active:scale-95"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Buka di Google Maps
                    </Button>
                  </div>
                </div>
              </div>
              
              {selectedAbsensi.keterangan && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-500" />
                    {selectedAbsensi.jenis_absensi === 'pulang' ? 'Kegiatan Magang' : 'Keterangan'}
                  </label>
                  <div className="mt-1 p-4 bg-teal-50/30 rounded-xl border border-teal-100 italic text-gray-700 text-sm leading-relaxed">
                    "{selectedAbsensi.keterangan}"
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataAbsensiSiswaMagang;