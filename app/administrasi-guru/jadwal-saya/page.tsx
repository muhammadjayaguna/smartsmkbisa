// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface JadwalItem {
  hari: string;
  jam_mapel: string;
  mata_pelajaran: string;
  nama_guru: string;
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalSayaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [siswaId, setSiswaId] = useState<string | null>(null);
  const [siswaName, setSiswaName] = useState('');
  const [rombelName, setRombelName] = useState('');
  const [jadwalMap, setJadwalMap] = useState<Record<string, JadwalItem[]>>({});

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

  const fetchJadwal = useCallback(async () => {
    if (!rombelName || rombelName === '-') { setLoading(false); return; }
    try {
      // Reconstruct schedule from jurnal_mengajar entries for this class
      // Get recent 30 days of journals
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('jurnal_mengajar')
        .select('tanggal, jam_mapel, mata_pelajaran, nama_guru')
        .eq('kelas', rombelName)
        .gte('tanggal', thirtyDaysAgo.toISOString().split('T')[0])
        .order('tanggal', { ascending: false });

      if (error) throw error;

      // Extract day-of-week and deduplicate
      const scheduleMap = new Map<string, JadwalItem>();
      (data || []).forEach(j => {
        const date = new Date(j.tanggal);
        const dayIndex = date.getDay(); // 0=Sun, 1=Mon...
        const hariName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayIndex];
        const key = `${hariName}_${j.jam_mapel}_${j.mata_pelajaran}`;
        
        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, {
            hari: hariName,
            jam_mapel: j.jam_mapel,
            mata_pelajaran: j.mata_pelajaran,
            nama_guru: j.nama_guru,
          });
        }
      });

      // Group by hari
      const grouped: Record<string, JadwalItem[]> = {};
      Array.from(scheduleMap.values()).forEach(item => {
        if (!grouped[item.hari]) grouped[item.hari] = [];
        grouped[item.hari].push(item);
      });

      // Sort each day's items by jam_mapel
      Object.keys(grouped).forEach(hari => {
        grouped[hari].sort((a, b) => a.jam_mapel.localeCompare(b.jam_mapel));
      });

      setJadwalMap(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rombelName]);

  useEffect(() => { findSiswaId(); }, [findSiswaId]);
  useEffect(() => { if (siswaId) fetchJadwal(); }, [siswaId, fetchJadwal]);

  const hariColors: Record<string, string> = {
    'Senin': 'bg-blue-50 border-blue-200 text-blue-700',
    'Selasa': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'Rabu': 'bg-purple-50 border-purple-200 text-purple-700',
    'Kamis': 'bg-amber-50 border-amber-200 text-amber-700',
    'Jumat': 'bg-rose-50 border-rose-200 text-rose-700',
    'Sabtu': 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!siswaId) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="w-7 h-7" /> Jadwal Pelajaran
          </h2>
          <p className="text-blue-100 text-sm mt-1">Jadwal mingguan dan informasi guru pengampu</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-amber-800 text-sm">Akun Belum Terhubung</h4>
            <p className="text-xs text-amber-600 mt-1">Email Anda belum terhubung dengan data siswa.</p>
          </div>
        </div>
      </div>
    );
  }

  const hasJadwal = Object.keys(jadwalMap).length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Calendar className="w-7 h-7" /> Jadwal Pelajaran
        </h2>
        <p className="text-blue-100 text-sm mt-1">{siswaName} — {rombelName}</p>
      </div>

      {!hasJadwal ? (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-blue-200 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-600 mb-2">Belum Ada Jadwal</h3>
            <p className="text-sm text-slate-400">Jadwal akan otomatis dibentuk setelah guru mengisi jurnal mengajar untuk kelas Anda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {HARI_ORDER.filter(h => jadwalMap[h]).map(hari => (
            <Card key={hari} className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <div className={`px-5 py-3 border-b ${hariColors[hari] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <h3 className="font-bold text-sm">{hari}</h3>
              </div>
              <CardContent className="p-0">
                {jadwalMap[hari].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 px-5 py-3 ${idx < jadwalMap[hari].length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="w-16 shrink-0">
                      <Badge variant="outline" className="text-xs font-mono">{item.jam_mapel}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800">{item.mata_pelajaran}</p>
                      <p className="text-xs text-slate-400">{item.nama_guru}</p>
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
          * Jadwal ini direkonstruksi otomatis dari data jurnal mengajar guru selama 30 hari terakhir.
        </p>
      )}
    </div>
  );
}
