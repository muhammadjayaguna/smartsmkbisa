// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, BookOpen, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface JadwalItem {
  hari: string;
  jam_mapel: string;
  mata_pelajaran: string;
  kelas: string;
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalPelajaranPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jadwalMap, setJadwalMap] = useState<Record<string, JadwalItem[]>>({});
  const [totalKelas, setTotalKelas] = useState(0);
  const [totalMapel, setTotalMapel] = useState(0);

  const fetchJadwal = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('jurnal_mengajar')
        .select('tanggal, jam_mapel, mata_pelajaran, kelas')
        .eq('guru_id', uid)
        .gte('tanggal', thirtyDaysAgo.toISOString().split('T')[0])
        .order('tanggal', { ascending: false });

      if (error) throw error;

      // Deduplicate to form a weekly schedule
      const scheduleMap = new Map<string, JadwalItem>();
      const kelasSet = new Set<string>();
      const mapelSet = new Set<string>();

      (data || []).forEach(j => {
        const date = new Date(j.tanggal);
        const dayIndex = date.getDay();
        const hariName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayIndex];
        const key = `${hariName}_${j.jam_mapel}_${j.kelas}`;

        kelasSet.add(j.kelas);
        mapelSet.add(j.mata_pelajaran);

        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, {
            hari: hariName,
            jam_mapel: j.jam_mapel,
            mata_pelajaran: j.mata_pelajaran,
            kelas: j.kelas,
          });
        }
      });

      setTotalKelas(kelasSet.size);
      setTotalMapel(mapelSet.size);

      // Group by hari
      const grouped: Record<string, JadwalItem[]> = {};
      Array.from(scheduleMap.values()).forEach(item => {
        if (!grouped[item.hari]) grouped[item.hari] = [];
        grouped[item.hari].push(item);
      });

      Object.keys(grouped).forEach(hari => {
        grouped[hari].sort((a, b) => a.jam_mapel.localeCompare(b.jam_mapel));
      });

      setJadwalMap(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

  const hariColors: Record<string, string> = {
    'Senin': 'bg-blue-50 border-blue-200 text-blue-700',
    'Selasa': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'Rabu': 'bg-purple-50 border-purple-200 text-purple-700',
    'Kamis': 'bg-amber-50 border-amber-200 text-amber-700',
    'Jumat': 'bg-rose-50 border-rose-200 text-rose-700',
    'Sabtu': 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  const hasJadwal = Object.keys(jadwalMap).length > 0;

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><CalendarClock className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Jadwal Mengajar</h2><p className="text-xs text-slate-500">Jadwal mengajar mingguan Anda</p></div>
      </div>

      {/* Stats */}
      {hasJadwal && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-blue-600">{Object.keys(jadwalMap).length}</p>
              <p className="text-xs text-slate-500 mt-1">Hari Aktif</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">{totalKelas}</p>
              <p className="text-xs text-slate-500 mt-1">Kelas Diajar</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-purple-600">{totalMapel}</p>
              <p className="text-xs text-slate-500 mt-1">Mata Pelajaran</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasJadwal ? (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <CalendarClock className="w-16 h-16 text-blue-300 mb-4" />
            <h3 className="font-bold text-xl text-blue-700 mb-2">Belum Ada Jadwal</h3>
            <p className="text-sm text-slate-500 max-w-md">Jadwal mengajar akan otomatis terbentuk setelah Anda mengisi jurnal mengajar. Mulailah mengisi jurnal untuk memunculkan jadwal Anda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {HARI_ORDER.filter(h => jadwalMap[h]).map(hari => (
            <Card key={hari} className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <div className={`px-5 py-3 border-b ${hariColors[hari] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <h3 className="font-bold text-sm">{hari}</h3>
                <p className="text-xs opacity-70">{jadwalMap[hari].length} sesi</p>
              </div>
              <CardContent className="p-0">
                {jadwalMap[hari].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 px-5 py-3 ${idx < jadwalMap[hari].length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="w-16 shrink-0">
                      <Badge variant="outline" className="text-xs font-mono">{item.jam_mapel}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800">{item.mata_pelajaran}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {item.kelas}
                      </p>
                    </div>
                    <BookOpen className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasJadwal && (
        <p className="text-xs text-slate-400 text-center">
          * Jadwal ini direkonstruksi dari data jurnal mengajar Anda selama 30 hari terakhir.
        </p>
      )}
    </div>
  );
}
