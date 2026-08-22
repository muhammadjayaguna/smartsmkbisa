'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserCheck, Save, RefreshCw, AlertTriangle, Users, Check, FileText } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import AbsensiSiswaReport from '@/components/reports/AbsensiSiswaReport';

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

export default function AbsensiSiswaPage() {
  const router = useRouter();
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [selectedRombelId, setSelectedRombelId] = useState<string>('');
  
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensiData, setAbsensiData] = useState<Record<string, AbsensiData>>({});
  
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const today = getLocalDateString();

  useEffect(() => {
    fetchRombelList();
  }, []);

  useEffect(() => {
    if (selectedRombelId) {
      fetchSiswaData(selectedRombelId);
    } else {
      setSiswaList([]);
      setAbsensiData({});
    }
  }, [selectedRombelId]);

  useEffect(() => {
    if (siswaList.length > 0) {
      fetchAbsensiData();
    }
  }, [siswaList]);

  const fetchRombelList = async () => {
    try {
      const { data, error } = await supabase
        .from('rombel')
        .select('*')
        .order('nama_rombel');

      if (error) throw error;
      setRombelList(data || []);
      
      if (data && data.length > 0) {
        setSelectedRombelId(data[0].id);
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat daftar kelas", variant: "destructive" });
    } finally {
      setLoadingInit(false);
    }
  };

  const fetchSiswaData = async (rombelId: string) => {
    setLoadingData(true);
    try {
      const { data, error } = await Promise.race([
        supabase
        .from('siswa')
        .select('*')
        .eq('rombel_id', rombelId)
        .order('nama'),
        new Promise<{ data: any; error: any }>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout saat fetch siswa')), 15000)
        )
      ]) as { data: any; error: any };

      if (error) throw error;
      
      setSiswaList(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal memuat data siswa", variant: "destructive" });
      setLoadingData(false);
    }
  };

  const fetchAbsensiData = async () => {
    if (siswaList.length === 0) {
      setLoadingData(false);
      return;
    }
    
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
      
      data?.forEach((absen: any) => {
        existingAbsensi[absen.siswa_id] = {
          ...existingAbsensi[absen.siswa_id],
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
    } catch (error: any) {
      toast({ title: "Warning", description: "Gagal memuat absensi yang sudah ada. Menggunakan default.", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const updateAbsensi = (siswaId: string, field: keyof AbsensiData, value: any) => {
    setAbsensiData(prev => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId]),
        [field]: value
      }
    }));
  };

  const handleSaveAbsensi = async () => {
    if (Object.keys(absensiData).length === 0 || siswaList.length === 0) return;
    setSaving(true);
    
    try {
      const absensiRecords = siswaList.map(siswa => {
        const data = absensiData[siswa.id];
        return {
          siswa_id: siswa.id,
          tanggal: today,
          status: data?.status || 'hadir',
          jam_1: Boolean(data?.jam_1), jam_2: Boolean(data?.jam_2), jam_3: Boolean(data?.jam_3), jam_4: Boolean(data?.jam_4),
          jam_5: Boolean(data?.jam_5), jam_6: Boolean(data?.jam_6), jam_7: Boolean(data?.jam_7), jam_8: Boolean(data?.jam_8),
          jam_9: Boolean(data?.jam_9), jam_10: Boolean(data?.jam_10), jam_11: Boolean(data?.jam_11), jam_12: Boolean(data?.jam_12),
          keterangan: data?.keterangan?.trim() || null
        };
      });

      const batchSize = 10;
      for (let i = 0; i < absensiRecords.length; i += batchSize) {
        const batch = absensiRecords.slice(i, i + batchSize);
        const { error } = await supabase.from('absensi').upsert(batch, { onConflict: 'siswa_id,tanggal' });
        if (error) throw error;
      }

      toast({ title: "Berhasil", description: `Data absensi ${absensiRecords.length} siswa tersimpan` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal menyimpan data absensi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  const selectedRombelData = rombelList.find(r => r.id === selectedRombelId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Page */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Absensi Siswa</h2>
          <p className="text-xs text-slate-500">Kelola kehadiran harian dan lihat laporan absensi</p>
        </div>
      </div>

      <Tabs defaultValue="isi-kehadiran" className="space-y-4">
        <TabsList className="bg-white border border-slate-200/60 shadow-sm p-1 rounded-lg">
          <TabsTrigger value="isi-kehadiran" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-sm font-medium transition-all">
            <UserCheck className="w-4 h-4 mr-2" /> Isi Kehadiran Harian
          </TabsTrigger>
          <TabsTrigger value="laporan" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-sm font-medium transition-all">
            <FileText className="w-4 h-4 mr-2" /> Laporan & Rekap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="isi-kehadiran" className="space-y-4 outline-none">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
            <Select value={selectedRombelId} onValueChange={setSelectedRombelId}>
              <SelectTrigger className="w-full md:w-[250px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Pilih Kelas..." />
              </SelectTrigger>
              <SelectContent>
                {rombelList.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.nama_rombel}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={() => fetchAbsensiData()} variant="outline" size="sm" className="h-10 flex-1 md:flex-none border-slate-200" disabled={!selectedRombelId || loadingData}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button onClick={handleSaveAbsensi} disabled={saving || siswaList.length === 0} size="sm" className="h-10 flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </Button>
            </div>
          </div>

          {!selectedRombelId ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-medium">Pilih kelas (Rombel) terlebih dahulu</p>
              </CardContent>
            </Card>
          ) : loadingData ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="flex justify-center p-10 text-slate-500">Memuat data siswa dan absensi...</CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                      <UserCheck className="w-5 h-5 text-blue-500" /> Kelas {selectedRombelData?.nama_rombel}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      Total {siswaList.length} siswa | Tanggal: {today}
                      {Object.keys(absensiData).length > 0 && <span className="text-emerald-600 flex items-center text-xs"><Check className="w-3 h-3 mr-1" /> Siap</span>}
                    </CardDescription>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-slate-200 w-full md:w-auto">
                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2 flex-1 md:flex-none" onClick={() => {
                      siswaList.forEach(siswa => {
                        updateAbsensi(siswa.id, 'status', 'hadir');
                        for(let i=1; i<=12; i++) updateAbsensi(siswa.id, `jam_${i}` as keyof AbsensiData, true);
                      });
                    }}>Semua Hadir</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2 flex-1 md:flex-none" onClick={() => {
                      siswaList.forEach(siswa => {
                        for(let i=1; i<=12; i++) updateAbsensi(siswa.id, `jam_${i}` as keyof AbsensiData, true);
                      });
                    }}>Centang Semua Jam</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex-1 md:flex-none" onClick={() => {
                      siswaList.forEach(siswa => {
                        for(let i=1; i<=12; i++) updateAbsensi(siswa.id, `jam_${i}` as keyof AbsensiData, false);
                      });
                    }}>Hapus Centang</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {siswaList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-slate-50">
                    <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p>Belum ada siswa di kelas ini.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/manage-siswa')}>Kelola Siswa</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="w-10">No</TableHead>
                          <TableHead className="min-w-[150px]">Nama Siswa</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(jam => (
                            <TableHead key={jam} className="text-center text-[10px] w-8 px-1">J{jam}</TableHead>
                          ))}
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {siswaList.map((siswa, index) => (
                          <TableRow key={siswa.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-slate-500 font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-slate-800">{siswa.nama}</div>
                              <div className="text-[10px] text-slate-400">{siswa.nisn}</div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={absensiData[siswa.id]?.status || 'hadir'} 
                                onValueChange={(val) => updateAbsensi(siswa.id, 'status', val)}
                              >
                                <SelectTrigger className={`h-8 text-xs font-semibold ${
                                  absensiData[siswa.id]?.status === 'hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  absensiData[siswa.id]?.status === 'izin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  absensiData[siswa.id]?.status === 'sakit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hadir">Hadir</SelectItem>
                                  <SelectItem value="izin">Izin</SelectItem>
                                  <SelectItem value="sakit">Sakit</SelectItem>
                                  <SelectItem value="alpha">Alpha</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(jam => (
                              <TableCell key={jam} className="text-center px-1 border-l border-slate-100/50">
                                <Checkbox
                                  checked={Boolean(absensiData[siswa.id]?.[`jam_${jam}` as keyof AbsensiData]) || false}
                                  onCheckedChange={(checked) => updateAbsensi(siswa.id, `jam_${jam}` as keyof AbsensiData, checked)}
                                  disabled={absensiData[siswa.id]?.status !== 'hadir'}
                                  className={absensiData[siswa.id]?.status === 'hadir' ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500' : 'opacity-30'}
                                />
                              </TableCell>
                            ))}
                            <TableCell className="border-l border-slate-100/50">
                              <Input
                                value={absensiData[siswa.id]?.keterangan || ''}
                                onChange={(e) => updateAbsensi(siswa.id, 'keterangan', e.target.value)}
                                placeholder="Keterangan..."
                                className="h-8 text-xs bg-slate-50 border-slate-200"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="laporan" className="outline-none">
          <AbsensiSiswaReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
