// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Users, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { getLocalDateString } from '@/lib/utils';

interface RombelAbsensi {
  rombelId: string;
  namaRombel: string;
  totalSiswa: number;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
}

export default function RekapAbsenKelasPage() {
  const [loading, setLoading] = useState(false);
  const [tanggal, setTanggal] = useState(getLocalDateString());
  const [rekapData, setRekapData] = useState<RombelAbsensi[]>([]);
  const [totalStats, setTotalStats] = useState({ siswa: 0, hadir: 0, izin: 0, sakit: 0, alfa: 0, belumAbsen: 0 });

  const fetchRekap = async () => {
    setLoading(true);
    try {
      // 1. Get all rombel
      const { data: rombelList, error: rombelError } = await supabase
        .from('rombel')
        .select('id, nama_rombel')
        .order('nama_rombel');

      if (rombelError) throw rombelError;
      if (!rombelList || rombelList.length === 0) {
        setRekapData([]);
        setLoading(false);
        return;
      }

      // 2. Get all siswa counts per rombel
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('id, rombel_id');

      const siswaByRombel = new Map<string, string[]>();
      (siswaData || []).forEach(s => {
        if (s.rombel_id) {
          if (!siswaByRombel.has(s.rombel_id)) siswaByRombel.set(s.rombel_id, []);
          siswaByRombel.get(s.rombel_id)!.push(s.id);
        }
      });

      // 3. Get absensi for the selected date
      const { data: absensiData } = await supabase
        .from('absensi')
        .select('siswa_id, status')
        .eq('tanggal', tanggal);

      const absensiMap = new Map<string, string>();
      (absensiData || []).forEach(a => {
        if (a.siswa_id) absensiMap.set(a.siswa_id, (a.status || 'hadir').toLowerCase());
      });

      // 4. Build rekap per rombel
      let totSiswa = 0, totHadir = 0, totIzin = 0, totSakit = 0, totAlfa = 0, totBelum = 0;

      const rekap: RombelAbsensi[] = rombelList.map(rombel => {
        const siswaIds = siswaByRombel.get(rombel.id) || [];
        let hadir = 0, izin = 0, sakit = 0, alfa = 0;

        siswaIds.forEach(sid => {
          const status = absensiMap.get(sid);
          if (status === 'hadir') hadir++;
          else if (status === 'izin') izin++;
          else if (status === 'sakit') sakit++;
          else if (status === 'alfa' || status === 'alpha') alfa++;
        });

        const absenTotal = hadir + izin + sakit + alfa;
        const belum = siswaIds.length - absenTotal;

        totSiswa += siswaIds.length;
        totHadir += hadir;
        totIzin += izin;
        totSakit += sakit;
        totAlfa += alfa;
        totBelum += belum;

        return {
          rombelId: rombel.id,
          namaRombel: rombel.nama_rombel,
          totalSiswa: siswaIds.length,
          hadir,
          izin,
          sakit,
          alfa,
        };
      });

      // Filter out rombel with 0 students
      setRekapData(rekap.filter(r => r.totalSiswa > 0));
      setTotalStats({ siswa: totSiswa, hadir: totHadir, izin: totIzin, sakit: totSakit, alfa: totAlfa, belumAbsen: totBelum });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRekap(); }, []);

  const getPersentase = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600"><UserCheck className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Rekap Absensi Siswa</h2><p className="text-xs text-slate-500">Ringkasan kehadiran seluruh kelas</p></div>
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <Label className="text-xs font-bold text-slate-600">Pilih Tanggal</Label>
              <Input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={fetchRekap} disabled={loading} className="bg-sky-600 hover:bg-sky-700 w-full sm:w-auto">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
              {loading ? 'Memuat...' : 'Tampilkan Rekap'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {rekapData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Siswa', value: totalStats.siswa, color: 'text-slate-700', bg: 'bg-slate-50' },
            { label: 'Hadir', value: totalStats.hadir, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Izin', value: totalStats.izin, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Sakit', value: totalStats.sakit, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Alfa', value: totalStats.alfa, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm rounded-2xl">
              <CardContent className={`p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-class Cards */}
      {rekapData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rekapData.map(r => {
            const pctHadir = getPersentase(r.hadir, r.totalSiswa);
            return (
              <Card key={r.rombelId} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <div className="bg-sky-50 border-b border-sky-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-sm text-sky-800">{r.namaRombel}</h4>
                  </div>
                  <span className="text-xs text-sky-600 font-bold">{r.totalSiswa} siswa</span>
                </div>
                <CardContent className="p-5">
                  {/* Progress bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Kehadiran</span>
                    <span className={`text-sm font-bold ${pctHadir >= 80 ? 'text-green-600' : pctHadir >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pctHadir}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full transition-all ${pctHadir >= 80 ? 'bg-green-500' : pctHadir >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pctHadir}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-600">{r.hadir}</p>
                      <p className="text-[10px] text-slate-400">Hadir</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{r.izin}</p>
                      <p className="text-[10px] text-slate-400">Izin</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{r.sakit}</p>
                      <p className="text-[10px] text-slate-400">Sakit</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{r.alfa}</p>
                      <p className="text-[10px] text-slate-400">Alfa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !loading ? (
        <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200/50">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <UserCheck className="w-16 h-16 text-sky-300 mb-4" />
            <h3 className="font-bold text-xl text-sky-700 mb-2">Belum Ada Data</h3>
            <p className="text-sm text-slate-500 max-w-md">Pilih tanggal dan klik "Tampilkan Rekap" untuk melihat data kehadiran siswa seluruh kelas.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
