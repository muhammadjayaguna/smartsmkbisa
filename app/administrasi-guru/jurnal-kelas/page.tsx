// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookMarked, Calendar, Search, User, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface JurnalRecord {
  id: string;
  tanggal: string;
  nama_guru: string;
  mata_pelajaran: string;
  jam_mapel: string;
  kelas: string;
  materi: string;
  siswa_izin: string[] | null;
  siswa_sakit: string[] | null;
  siswa_alfa: string[] | null;
}

export default function JurnalKelasPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [waliKelas, setWaliKelas] = useState<string | null>(null);
  const [rombelName, setRombelName] = useState('');
  const [jurnalList, setJurnalList] = useState<JurnalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [guruCount, setGuruCount] = useState(0);

  const findWaliKelas = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      // Find user's name
      const { data: userData } = await supabase
        .from('users')
        .select('nama')
        .eq('id', uid)
        .maybeSingle();

      if (!userData) { setLoading(false); return; }

      // Find rombel where this user is wali_kelas
      const { data: rombelData } = await supabase
        .from('rombel')
        .select('id, nama_rombel, wali_kelas')
        .ilike('wali_kelas', `%${userData.nama}%`)
        .maybeSingle();

      if (rombelData) {
        setWaliKelas(rombelData.id);
        setRombelName(rombelData.nama_rombel);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [user]);

  const fetchJurnal = useCallback(async () => {
    if (!rombelName) return;
    try {
      const { data, error } = await supabase
        .from('jurnal_mengajar')
        .select('*')
        .eq('kelas', rombelName)
        .order('tanggal', { ascending: false })
        .limit(100);

      if (error) throw error;

      setJurnalList(data || []);
      // Count unique teachers
      const guruSet = new Set((data || []).map(j => j.nama_guru));
      setGuruCount(guruSet.size);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rombelName]);

  useEffect(() => { findWaliKelas(); }, [findWaliKelas]);
  useEffect(() => { if (waliKelas) fetchJurnal(); }, [waliKelas, fetchJurnal]);

  const filteredJurnal = jurnalList.filter(j => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return j.nama_guru.toLowerCase().includes(q) ||
           j.mata_pelajaran.toLowerCase().includes(q) ||
           j.materi.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!waliKelas) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><BookMarked className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Jurnal Kelas (Wali Kelas)</h2><p className="text-xs text-slate-500">Catatan harian kelas</p></div>
        </div>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <BookMarked className="w-16 h-16 text-emerald-300 mb-4" />
            <h3 className="font-bold text-xl text-emerald-700 mb-2">Anda Belum Terdaftar Sebagai Wali Kelas</h3>
            <p className="text-sm text-slate-500 max-w-md">Halaman ini hanya dapat diakses oleh wali kelas. Pastikan nama Anda sudah terdaftar sebagai wali kelas di data Rombel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><BookMarked className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Jurnal Kelas — {rombelName}</h2><p className="text-xs text-slate-500">Catatan mengajar seluruh guru di kelas Anda</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-600">{jurnalList.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Jurnal</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-blue-600">{guruCount}</p>
            <p className="text-xs text-slate-500 mt-1">Guru Mengajar</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-purple-600">
              {new Set(jurnalList.map(j => j.mata_pelajaran)).size}
            </p>
            <p className="text-xs text-slate-500 mt-1">Mata Pelajaran</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Cari guru, mapel, atau materi..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          {filteredJurnal.length === 0 ? (
            <div className="text-center py-8">
              <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Belum ada jurnal mengajar untuk kelas ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Guru</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead className="text-center">Absensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJurnal.map((j) => {
                    const izin = j.siswa_izin?.length || 0;
                    const sakit = j.siswa_sakit?.length || 0;
                    const alfa = j.siswa_alfa?.length || 0;
                    return (
                      <TableRow key={j.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{j.nama_guru}</TableCell>
                        <TableCell className="text-sm">{j.mata_pelajaran}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">{j.jam_mapel}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{j.materi}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            {izin > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">I:{izin}</Badge>}
                            {sakit > 0 && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">S:{sakit}</Badge>}
                            {alfa > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100">A:{alfa}</Badge>}
                            {izin === 0 && sakit === 0 && alfa === 0 && <span className="text-slate-300">—</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
