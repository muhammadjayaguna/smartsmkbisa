// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Calendar, TrendingUp, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AbsensiRecord {
  id: string;
  tanggal: string;
  status: string | null;
  keterangan: string | null;
  jam_1: boolean | null;
  jam_2: boolean | null;
  jam_3: boolean | null;
  jam_4: boolean | null;
  jam_5: boolean | null;
  jam_6: boolean | null;
  jam_7: boolean | null;
  jam_8: boolean | null;
  jam_9: boolean | null;
  jam_10: boolean | null;
  jam_11: boolean | null;
  jam_12: boolean | null;
}

export default function AbsensiSayaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [siswaId, setSiswaId] = useState<string | null>(null);
  const [siswaName, setSiswaName] = useState('');
  const [rombelName, setRombelName] = useState('');
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [stats, setStats] = useState({ hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0 });
  const [showAll, setShowAll] = useState(false);

  const findSiswaId = useCallback(async () => {
    if (!user) return;
    try {
      // Find siswa record linked to this user's email
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

  const fetchAbsensi = useCallback(async () => {
    if (!siswaId) return;
    try {
      const { data, error } = await supabase
        .from('absensi')
        .select('*')
        .eq('siswa_id', siswaId)
        .order('tanggal', { ascending: false });

      if (error) throw error;

      const absensiRecords: AbsensiRecord[] = data || [];
      setRecords(absensiRecords);

      // Calculate stats
      let hadir = 0, izin = 0, sakit = 0, alfa = 0;
      absensiRecords.forEach(r => {
        const s = (r.status || '').toLowerCase();
        if (s === 'hadir') hadir++;
        else if (s === 'izin') izin++;
        else if (s === 'sakit') sakit++;
        else if (s === 'alfa' || s === 'alpha') alfa++;
      });
      setStats({ hadir, izin, sakit, alfa, total: absensiRecords.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siswaId]);

  useEffect(() => { findSiswaId(); }, [findSiswaId]);
  useEffect(() => { if (siswaId) fetchAbsensi(); }, [siswaId, fetchAbsensi]);

  const getStatusBadge = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'hadir') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Hadir</Badge>;
    if (s === 'izin') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Izin</Badge>;
    if (s === 'sakit') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sakit</Badge>;
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Alfa</Badge>;
  };

  const countJamHadir = (r: AbsensiRecord) => {
    let count = 0;
    for (let i = 1; i <= 12; i++) {
      if (r[`jam_${i}` as keyof AbsensiRecord]) count++;
    }
    return count;
  };

  const persentaseHadir = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0;
  const displayedRecords = showAll ? records : records.slice(0, 10);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!siswaId) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CheckSquare className="w-7 h-7" /> Absensi Saya
          </h2>
          <p className="text-emerald-100 text-sm mt-1">Rekap kehadiran dan persentase kehadiran Anda</p>
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
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <CheckSquare className="w-7 h-7" /> Absensi Saya
        </h2>
        <p className="text-emerald-100 text-sm mt-1">{siswaName} — {rombelName}</p>
      </div>

      {/* Persentase Kehadiran */}
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-600">Persentase Kehadiran</p>
            <p className="text-2xl font-extrabold text-emerald-600">{persentaseHadir}%</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${persentaseHadir >= 80 ? 'bg-emerald-500' : persentaseHadir >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${persentaseHadir}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Dari {stats.total} hari tercatat</p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hadir', value: stats.hadir, color: 'bg-green-50 text-green-600', icon: '✅' },
          { label: 'Izin', value: stats.izin, color: 'bg-amber-50 text-amber-600', icon: '📋' },
          { label: 'Sakit', value: stats.sakit, color: 'bg-blue-50 text-blue-600', icon: '🏥' },
          { label: 'Alfa', value: stats.alfa, color: 'bg-red-50 text-red-600', icon: '❌' },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5 text-center">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className={`text-3xl font-extrabold ${item.color.split(' ')[1]}`}>{item.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Riwayat Absensi */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Riwayat Absensi
            </h3>
            <p className="text-xs text-slate-400">{records.length} hari tercatat</p>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Belum ada data absensi</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Jam Hadir</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">
                          {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-bold text-slate-700">{countJamHadir(r)}</span>
                          <span className="text-xs text-slate-400">/12</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{r.keterangan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {records.length > 10 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
                    {showAll ? (
                      <><ChevronUp className="w-4 h-4 mr-1" /> Tampilkan Lebih Sedikit</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-1" /> Tampilkan Semua ({records.length} data)</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
