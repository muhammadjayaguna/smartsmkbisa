// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, TrendingUp, AlertCircle, BookOpen, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NilaiRecord {
  id: string;
  tanggal: string;
  mata_pelajaran: string;
  jenis_penilaian: string;
  materi_topik: string;
  nilai: number;
}

interface MapelSummary {
  mata_pelajaran: string;
  rataRata: number;
  jumlahTugas: number;
  nilaiTertinggi: number;
  nilaiTerendah: number;
}

export default function NilaiSayaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [siswaId, setSiswaId] = useState<string | null>(null);
  const [siswaName, setSiswaName] = useState('');
  const [rombelName, setRombelName] = useState('');
  const [records, setRecords] = useState<NilaiRecord[]>([]);
  const [mapelSummaries, setMapelSummaries] = useState<MapelSummary[]>([]);

  const findSiswaId = useCallback(async () => {
    if (!user) return;
    try {
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('id, nama, rombel:rombel_id(nama_rombel)')
        .eq('email', user.email)
        .maybeSingle();

      if (siswaData) {
        setSiswaId(siswaData.id);
        setSiswaName(siswaData.nama);
        setRombelName(siswaData.rombel?.nama_rombel || '-');
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [user]);

  const fetchNilai = useCallback(async () => {
    if (!siswaId) return;
    try {
      const { data, error } = await supabase
        .from('buku_nilai')
        .select('id, tanggal, mata_pelajaran, jenis_penilaian, materi_topik, nilai')
        .eq('siswa_id', siswaId)
        .order('tanggal', { ascending: false });

      if (error) throw error;

      const nilaiRecords: NilaiRecord[] = data || [];
      setRecords(nilaiRecords);

      // Group by mata_pelajaran for summary
      const mapelMap = new Map<string, number[]>();
      nilaiRecords.forEach(r => {
        if (!mapelMap.has(r.mata_pelajaran)) {
          mapelMap.set(r.mata_pelajaran, []);
        }
        mapelMap.get(r.mata_pelajaran)!.push(r.nilai);
      });

      const summaries: MapelSummary[] = Array.from(mapelMap.entries()).map(([mapel, nilaiArr]) => ({
        mata_pelajaran: mapel,
        rataRata: Math.round(nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length),
        jumlahTugas: nilaiArr.length,
        nilaiTertinggi: Math.max(...nilaiArr),
        nilaiTerendah: Math.min(...nilaiArr),
      }));

      // Sort by rata-rata descending
      summaries.sort((a, b) => b.rataRata - a.rataRata);
      setMapelSummaries(summaries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siswaId]);

  useEffect(() => { findSiswaId(); }, [findSiswaId]);
  useEffect(() => { if (siswaId) fetchNilai(); }, [siswaId, fetchNilai]);

  const getRataRataColor = (nilai: number) => {
    if (nilai >= 85) return 'text-emerald-600';
    if (nilai >= 75) return 'text-blue-600';
    if (nilai >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRataRataBg = (nilai: number) => {
    if (nilai >= 85) return 'bg-emerald-50';
    if (nilai >= 75) return 'bg-blue-50';
    if (nilai >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const totalRataRata = mapelSummaries.length > 0
    ? Math.round(mapelSummaries.reduce((a, b) => a + b.rataRata, 0) / mapelSummaries.length)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!siswaId) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Star className="w-7 h-7" /> Nilai Saya
          </h2>
          <p className="text-amber-100 text-sm mt-1">Pantau perkembangan akademik Anda</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-amber-800 text-sm">Akun Belum Terhubung</h4>
            <p className="text-xs text-amber-600 mt-1">Email Anda belum terhubung dengan data siswa. Hubungi admin untuk menghubungkan akun Anda.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Star className="w-7 h-7" /> Nilai Saya
        </h2>
        <p className="text-amber-100 text-sm mt-1">{siswaName} — {rombelName}</p>
      </div>

      {/* Rata-rata Keseluruhan */}
      {mapelSummaries.length > 0 && (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-600">Rata-rata Keseluruhan</p>
              <p className="text-xs text-slate-400 mt-1">Dari {mapelSummaries.length} mata pelajaran · {records.length} penilaian</p>
            </div>
            <div className={`text-4xl font-extrabold ${getRataRataColor(totalRataRata)}`}>
              {totalRataRata}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per Mapel Cards */}
      {mapelSummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapelSummaries.map((mapel) => (
            <Card key={mapel.mata_pelajaran} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${getRataRataBg(mapel.rataRata)} flex items-center justify-center`}>
                    <BookOpen className={`w-5 h-5 ${getRataRataColor(mapel.rataRata)}`} />
                  </div>
                  <p className={`text-2xl font-extrabold ${getRataRataColor(mapel.rataRata)}`}>{mapel.rataRata}</p>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{mapel.mata_pelajaran}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{mapel.jumlahTugas} tugas</span>
                  <span>·</span>
                  <span>↑ {mapel.nilaiTertinggi}</span>
                  <span>·</span>
                  <span>↓ {mapel.nilaiTerendah}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-600 mb-2">Belum Ada Data Nilai</h3>
            <p className="text-sm text-slate-400">Nilai akan muncul setelah guru pengampu menginput penilaian.</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Riwayat */}
      {records.length > 0 && (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Riwayat Penilaian
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 20).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">
                        {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{r.mata_pelajaran}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.jenis_penilaian}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{r.materi_topik || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold text-lg ${getRataRataColor(r.nilai)}`}>{r.nilai}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
