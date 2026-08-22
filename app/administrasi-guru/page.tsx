'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Users, CheckSquare, Book, Edit3, Monitor, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdministrasiGuruDashboard() {
  const { user } = useAuth();
  const { activeMapel, loading } = useSisminjar();
  const [jurnalList, setJurnalList] = useState<any[]>([]);
  const [loadingJurnal, setLoadingJurnal] = useState(true);

  useEffect(() => {
    const fetchJurnal = async () => {
      if (!user || !activeMapel) {
        setLoadingJurnal(false);
        return;
      }
      try {
        const uid = user.db_id || user.id;
        const { data } = await supabase.from('jurnal_mengajar')
          .select('*')
          .eq('guru_id', uid)
          .eq('mata_pelajaran', activeMapel.mata_pelajaran)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (data) setJurnalList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingJurnal(false);
      }
    };
    fetchJurnal();
  }, [user, activeMapel]);

  if (loading) {
    return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  }

  const namaSekolah = activeMapel?.nama_sekolah || 'SMK Negeri 1';
  const mataPelajaran = activeMapel?.mata_pelajaran || 'Kurikulum Merdeka';
  const kkm = activeMapel?.kkm || 75;

  // Calculate current month journals count
  const currentMonth = new Date().getMonth();
  const journalsThisMonth = jurnalList.filter(j => {
    if (!j.created_at) return false;
    const date = new Date(j.created_at);
    return date.getMonth() === currentMonth;
  }).length;
  // If we had more than 3, we would need to query the count from DB.
  // We'll just show the count from the fetched limit 3 for now, or fetch count properly.

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 rounded-3xl p-8 border-0 shadow-lg shadow-teal-900/10 flex items-center justify-between relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-12 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{namaSekolah}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs text-teal-50">
              Guru: <span className="font-bold text-white">{user?.nama || 'Guru'}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs text-teal-50">
              TA: <span className="font-bold text-white">2026/2027</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs text-teal-50">
              Mapel: <span className="font-bold text-white">{mataPelajaran}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs text-teal-50">
              KKM: <span className="font-bold text-white">{kkm}</span>
            </div>
            <div className="bg-amber-400/90 backdrop-blur-md text-amber-950 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              Kode: GURU-YC8OH
            </div>
          </div>
        </div>
        <Monitor className="w-24 h-24 text-white opacity-10 absolute right-8" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-white border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">108</p>
              <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">Total Siswa Terdaftar<br/><span className="text-slate-400 font-normal">Siswa di semua kelas aktif</span></p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <CheckSquare className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">0 <span className="text-lg text-slate-500 font-medium">kelas</span></p>
              <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">Absensi Hari Ini<br/><span className="text-slate-400 font-normal">Kelas diinput hari ini</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Book className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{jurnalList.length > 0 ? (jurnalList.length >= 3 ? '3+' : jurnalList.length) : '0'} <span className="text-lg text-slate-500 font-medium">temu</span></p>
              <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">Jurnal Mengajar<br/><span className="text-slate-400 font-normal">Tercatat untuk mapel ini</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Edit3 className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">0</p>
              <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">Total Nilai Terinput<br/><span className="text-slate-400 font-normal">Data penilaian siswa</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Book className="w-4 h-4" />
              </div>
              Jurnal Terbaru
            </div>
            <Link href="/administrasi-guru/jurnal">
              <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </h3>
          
          {loadingJurnal ? (
             <div className="flex justify-center p-10 bg-white rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
          ) : jurnalList.length === 0 ? (
            <div className="bg-white border-0 shadow-sm rounded-2xl p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200 hover:border-teal-300 transition-colors group">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Book className="w-8 h-8 text-slate-300 group-hover:text-teal-400 transition-colors" />
              </div>
              <h4 className="font-bold text-slate-700 text-lg">Belum ada jurnal mengajar</h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">Catat aktivitas mengajar harian Anda di sini</p>
              <Link href="/administrasi-guru/jurnal">
                <Button className="bg-teal-600 hover:bg-teal-700">Buat Jurnal Baru</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jurnalList.map((jurnal) => (
                <Card key={jurnal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">Kls {jurnal.kelas}</span>
                        <span className="text-xs text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> Jam {jurnal.jam_mapel}</span>
                        <span className="text-xs text-slate-400 font-medium">({jurnal.tanggal})</span>
                      </div>
                      <h4 className="font-bold text-slate-800 mt-1 line-clamp-1">{jurnal.materi}</h4>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100">Izin: {jurnal.siswa_izin?.length || 0}</span>
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">Skt: {jurnal.siswa_sakit?.length || 0}</span>
                      <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded border border-red-100">Alf: {jurnal.siswa_alfa?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-0 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
            <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-base">
              <div className="bg-white/10 p-1.5 rounded-md backdrop-blur-sm">
                <span className="text-lg">📚</span>
              </div>
              Info Kurikulum
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mata Pelajaran</span>
                <span className="font-medium text-white">{mataPelajaran}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Fase</span>
                <span className="font-medium text-white">{activeMapel?.fase || 'Fase E (Kelas 10)'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Capaian & ATP</span>
                <span className="font-medium text-white">4 Elemen • 13 TP • 258 JP</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tema P5</span>
                <span className="font-medium text-emerald-300">Informatika dan Teknologi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
