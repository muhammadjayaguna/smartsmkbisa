'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, UserCheck, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { getLocalDateString } from '@/lib/utils';

interface Siswa {
  id: string;
  nama: string;
  nisn: string;
}

interface Rombel {
  id: string;
  nama_rombel: string;
  wali_kelas: string | null;
  tahun_ajaran: string | null;
}

interface AbsensiData {
  siswa_id: string;
  status: string;
  jam_1: boolean;
  jam_2: boolean;
  jam_3: boolean;
  jam_4: boolean;
  jam_5: boolean;
  jam_6: boolean;
  jam_7: boolean;
  jam_8: boolean;
  jam_9: boolean;
  jam_10: boolean;
  jam_11: boolean;
  jam_12: boolean;
  keterangan: string;
}

const RombelDetail = () => {
  const id = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "";
  const router = useRouter();
  const [rombel, setRombel] = useState<Rombel | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensiData, setAbsensiData] = useState<Record<string, AbsensiData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const today = getLocalDateString();

  useEffect(() => {
    if (id) {
      fetchRombelData();
      fetchSiswaData();
    }
  }, [id]);

  useEffect(() => {
    if (siswaList.length > 0) {
      fetchAbsensiData();
    }
  }, [siswaList]);
  const fetchRombelData = async () => {
    try {
      const { data, error } = await supabase
        .from('rombel')
        .select('*')
        .eq('id', id || '')
        .maybeSingle();

      if (error) throw error;
      setRombel(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data rombel",
        variant: "destructive",
      });
    }
  };

  const fetchSiswaData = async () => {
    try {
      const { data, error } = await Promise.race([
        supabase
        .from('siswa')
        .select('*')
        .eq('rombel_id', id || '')
        .order('nama'),
        new Promise<{ data: any; error: any }>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout saat fetch siswa')), 15000)
        )
      ]) as { data: any; error: any };

      if (error) throw error;
      
      setSiswaList(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada siswa dalam rombel ini. Silakan tambahkan siswa terlebih dahulu.",
        });
      }
    } catch (error: any) {
      let errorMessage = "Gagal memuat data siswa";
      if (error.message.includes('timeout')) {
        errorMessage = "Koneksi timeout saat memuat data siswa. Periksa koneksi internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAbsensiData = async () => {
    if (siswaList.length === 0) return;
    
    try {
      const { data, error } = await Promise.race([
        supabase
        .from('absensi')
        .select('*')
        .eq('tanggal', today)
        .in('siswa_id', siswaList.map(s => s.id)),
        new Promise<{ data: any; error: any }>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout saat fetch absensi')), 15000)
        )
      ]) as { data: any; error: any };

      if (error) throw error;
      
      const existingAbsensi: Record<string, AbsensiData> = {};
      
      // Initialize all students with default data first
      siswaList.forEach(siswa => {
        existingAbsensi[siswa.id] = {
          siswa_id: siswa.id,
          status: 'hadir',
          jam_1: true, jam_2: true, jam_3: true, jam_4: true,
          jam_5: true, jam_6: true, jam_7: true, jam_8: true,
          jam_9: true, jam_10: true, jam_11: true, jam_12: true,
          keterangan: ''
        };
      });
      
      // Override with existing data if available
      data?.forEach((absen: any) => {
        existingAbsensi[absen.siswa_id] = {
          siswa_id: absen.siswa_id,
          status: absen.status || 'hadir',
          jam_1: Boolean(absen.jam_1),
          jam_2: Boolean(absen.jam_2),
          jam_3: Boolean(absen.jam_3),
          jam_4: Boolean(absen.jam_4),
          jam_5: Boolean(absen.jam_5),
          jam_6: Boolean(absen.jam_6),
          jam_7: Boolean(absen.jam_7),
          jam_8: Boolean(absen.jam_8),
          jam_9: Boolean(absen.jam_9),
          jam_10: Boolean(absen.jam_10),
          jam_11: Boolean(absen.jam_11),
          jam_12: Boolean(absen.jam_12),
          keterangan: absen.keterangan || ''
        };
      });
      
      setAbsensiData(existingAbsensi);
    } catch (error) {
      
      // Initialize with default data even if fetch fails
      const defaultAbsensi: Record<string, AbsensiData> = {};
      siswaList.forEach(siswa => {
        defaultAbsensi[siswa.id] = {
          siswa_id: siswa.id,
          status: 'hadir',
          jam_1: true, jam_2: true, jam_3: true, jam_4: true,
          jam_5: true, jam_6: true, jam_7: true, jam_8: true,
          jam_9: true, jam_10: true, jam_11: true, jam_12: true,
          keterangan: ''
        };
      });
      setAbsensiData(defaultAbsensi);
      
      toast({
        title: "Warning",
        description: "Gagal memuat data absensi yang sudah ada. Menggunakan data default.",
        variant: "destructive",
      });
    }
  };

  const updateAbsensi = (siswaId: string, field: keyof AbsensiData, value: any) => {
    setAbsensiData(prev => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || {
          siswa_id: siswaId,
          status: 'hadir',
          jam_1: true, jam_2: true, jam_3: true, jam_4: true,
          jam_5: true, jam_6: true, jam_7: true, jam_8: true,
          jam_9: true, jam_10: true, jam_11: true, jam_12: true,
          keterangan: ''
        }),
        [field]: value
      }
    }));
  };

  const handleSaveAbsensi = async () => {
    // Validate that we have data to save
    if (Object.keys(absensiData).length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data absensi untuk disimpan",
        variant: "destructive",
      });
      return;
    }

    // Validate that we have students
    if (siswaList.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada siswa dalam rombel ini",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      // Prepare absensi records with better validation
      const absensiRecords = siswaList.map(siswa => {
        const data = absensiData[siswa.id];
        if (!data) {
          // Create default data if missing
          return {
            siswa_id: siswa.id,
            tanggal: today,
            status: 'hadir',
            jam_1: true, jam_2: true, jam_3: true, jam_4: true,
            jam_5: true, jam_6: true, jam_7: true, jam_8: true,
            jam_9: true, jam_10: true, jam_11: true, jam_12: true,
            keterangan: null
          };
        }
        
        return {
          siswa_id: siswa.id,
          tanggal: today,
          status: data.status || 'hadir',
          jam_1: Boolean(data.jam_1),
          jam_2: Boolean(data.jam_2),
          jam_3: Boolean(data.jam_3),
          jam_4: Boolean(data.jam_4),
          jam_5: Boolean(data.jam_5),
          jam_6: Boolean(data.jam_6),
          jam_7: Boolean(data.jam_7),
          jam_8: Boolean(data.jam_8),
          jam_9: Boolean(data.jam_9),
          jam_10: Boolean(data.jam_10),
          jam_11: Boolean(data.jam_11),
          jam_12: Boolean(data.jam_12),
          keterangan: data.keterangan?.trim() || null
        };
      });

      if (absensiRecords.length === 0) {
        throw new Error('Tidak ada data absensi yang valid untuk disimpan');
      }

      // Validate each record
      for (const record of absensiRecords) {
        if (!record.siswa_id) {
          throw new Error('ID siswa tidak valid');
        }
        if (!['hadir', 'izin', 'sakit', 'alpha'].includes(record.status)) {
          record.status = 'hadir'; // Set default status if invalid
        }
      }

      // Save in batches to avoid timeout
      const batchSize = 10;
      let totalSaved = 0;

      for (let i = 0; i < absensiRecords.length; i += batchSize) {
        const batch = absensiRecords.slice(i, i + batchSize);
        
        const { error } = await Promise.race([
          supabase
          .from('absensi')
          .upsert(batch, { 
            onConflict: 'siswa_id,tanggal',
            ignoreDuplicates: false 
          }),
          new Promise<{ error: any }>((_, reject) => 
            setTimeout(() => reject(new Error(`Database timeout pada batch ${Math.floor(i/batchSize) + 1}`)), 20000)
          )
        ]) as { error: any };

        if (error) {
          throw new Error(`Error pada batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        }

        totalSaved += batch.length;
        
        // Add small delay between batches
        if (i + batchSize < absensiRecords.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      toast({
        title: "Berhasil",
        description: `Data absensi ${totalSaved} siswa berhasil disimpan`,
      });
      
      // Refresh absensi data to show updated state
      await fetchAbsensiData();
    } catch (error: any) {
      let errorMessage = "Gagal menyimpan data absensi";
      if (error.message.includes('timeout')) {
        errorMessage = "Koneksi timeout. Periksa koneksi internet dan coba lagi.";
      } else if (error.message.includes('batch')) {
        errorMessage = error.message;
      } else if (error.code === '23503') {
        errorMessage = "Data siswa tidak valid atau sudah dihapus";
      } else if (error.code === '23505') {
        errorMessage = "Data absensi sudah ada untuk tanggal ini";
      } else if (error.code === '23502') {
        errorMessage = "Ada field wajib yang belum diisi";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!rombel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Rombel Tidak Ditemukan</h3>
            <Button onClick={() => router.push('/rombel')}>Kembali ke Daftar Rombel</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <PageBreadcrumb 
              items={[{ label: 'Absensi Siswa', path: '/rombel' }]}
              currentPage={rombel.nama_rombel}
              className="mb-4"
            />
            
            <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={fetchAbsensiData}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
                <Button
                  onClick={handleSaveAbsensi}
                  disabled={saving || siswaList.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                </Button>
              </div>
            </div>
            
            <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">Absensi {rombel.nama_rombel}</h1>
                <div className="flex items-center justify-between">
                  <p className="text-blue-100">Wali Kelas: {rombel.wali_kelas} | Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                  <div className="text-blue-100 text-sm">
                    Total Siswa: {siswaList.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-6 w-6" />
                <span>Daftar Absensi Siswa</span>
              </CardTitle>
              <CardDescription>
                Total {siswaList.length} siswa | Tanggal: {today}
                {Object.keys(absensiData).length > 0 && (
                  <span className="ml-2 text-green-600">
                    ✓ Data absensi siap
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick Actions */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Aksi Cepat</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      siswaList.forEach(siswa => {
                        updateAbsensi(siswa.id, 'status', 'hadir');
                        for (let i = 1; i <= 12; i++) {
                          updateAbsensi(siswa.id, `jam_${i}` as keyof AbsensiData, true);
                        }
                      });
                    }}
                  >
                    Semua Hadir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      siswaList.forEach(siswa => {
                        for (let i = 1; i <= 12; i++) {
                          updateAbsensi(siswa.id, `jam_${i}` as keyof AbsensiData, true);
                        }
                      });
                    }}
                  >
                    Centang Semua Jam
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      siswaList.forEach(siswa => {
                        for (let i = 1; i <= 12; i++) {
                          updateAbsensi(siswa.id, `jam_${i}` as keyof AbsensiData, false);
                        }
                      });
                    }}
                  >
                    Hapus Centang Semua
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center text-xs">Jam 1</TableHead>
                      <TableHead className="text-center text-xs">Jam 2</TableHead>
                      <TableHead className="text-center text-xs">Jam 3</TableHead>
                      <TableHead className="text-center text-xs">Jam 4</TableHead>
                      <TableHead className="text-center text-xs">Jam 5</TableHead>
                      <TableHead className="text-center text-xs">Jam 6</TableHead>
                      <TableHead className="text-center text-xs">Jam 7</TableHead>
                      <TableHead className="text-center text-xs">Jam 8</TableHead>
                      <TableHead className="text-center text-xs">Jam 9</TableHead>
                      <TableHead className="text-center text-xs">Jam 10</TableHead>
                      <TableHead className="text-center text-xs">Jam 11</TableHead>
                      <TableHead className="text-center text-xs">Jam 12</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siswaList.map((siswa) => (
                      <TableRow key={siswa.id}>
                        <TableCell className="font-medium">{siswa.nisn}</TableCell>
                        <TableCell>{siswa.nama}</TableCell>
                        <TableCell>
                          <select
                            value={absensiData[siswa.id]?.status || 'hadir'}
                            onChange={(e) => updateAbsensi(siswa.id, 'status', e.target.value)}
                            className="border rounded px-2 py-1 text-sm w-full"
                          >
                            <option value="hadir">Hadir</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                            <option value="alpha">Alpha</option>
                          </select>
                        </TableCell>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((jam) => (
                          <TableCell key={jam} className="text-center">
                            <Checkbox
                              checked={Boolean(absensiData[siswa.id]?.[`jam_${jam}` as keyof AbsensiData]) || false}
                              onCheckedChange={(checked) => 
                                updateAbsensi(siswa.id, `jam_${jam}` as keyof AbsensiData, checked)
                              }
                              disabled={absensiData[siswa.id]?.status !== 'hadir'}
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Input
                            value={absensiData[siswa.id]?.keterangan || ''}
                            onChange={(e) => updateAbsensi(siswa.id, 'keterangan', e.target.value)}
                            placeholder="Keterangan..."
                            className="text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {siswaList.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Siswa</h3>
                    <p className="text-gray-500 mb-4">Rombel ini belum memiliki siswa</p>
                    <Button 
                      onClick={() => router.push('/manage-siswa')}
                    >
                      Kelola Siswa
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Save Button at Bottom */}
              {siswaList.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveAbsensi}
                    disabled={saving}
                    size="lg"
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-5 w-5" />
                    <span>{saving ? 'Menyimpan...' : `Simpan Absensi ${siswaList.length} Siswa`}</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default RombelDetail;
