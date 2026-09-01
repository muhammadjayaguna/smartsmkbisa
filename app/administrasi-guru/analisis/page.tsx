'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { FlaskConical, TrendingUp, TrendingDown, Award, AlertCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';
import { Badge } from '@/components/ui/badge';

interface SiswaScore {
  siswa_id: string;
  nama_siswa: string;
  rombel_id: string;
  nama_rombel: string;
  total_nilai: number;
  count_nilai: number;
  rata_rata: number;
}

export default function AnalisisKompetensiPage() {
  const { user } = useAuth();
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [loading, setLoading] = useState(true);
  
  const [kkm, setKkm] = useState(75);
  const [bukuNilai, setBukuNilai] = useState<any[]>([]);
  const [rombelFilter, setRombelFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    if (!user || !activeMapel) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = user.db_id || user.id;
      const userKkm = Number(activeMapel.kkm) || 75;
      setKkm(userKkm);
      
      const { data } = await supabase.from('buku_nilai')
        .select(`
          id, nilai,
          rombel (id, nama_rombel),
          siswa (id, nama)
        `)
        .eq('guru_id', uid)
        .ilike('mata_pelajaran', activeMapel.mata_pelajaran);
        
      if (data) {
        setBukuNilai(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, activeMapel]);

  useEffect(() => {
    if (!contextLoading) fetchData();
  }, [fetchData, contextLoading, activeMapel]);

  // Proses data
  const { groupedScores, rombelOptions, stats } = useMemo(() => {
    const studentMap: Record<string, SiswaScore> = {};
    const rombelSet = new Map<string, string>(); // id -> nama
    
    bukuNilai.forEach(item => {
      if (!item.siswa || !item.rombel) return;
      const sId = item.siswa.id;
      const rId = item.rombel.id;
      
      rombelSet.set(rId, item.rombel.nama_rombel);
      
      if (!studentMap[sId]) {
        studentMap[sId] = {
          siswa_id: sId,
          nama_siswa: item.siswa.nama,
          rombel_id: rId,
          nama_rombel: item.rombel.nama_rombel,
          total_nilai: 0,
          count_nilai: 0,
          rata_rata: 0
        };
      }
      
      studentMap[sId].total_nilai += item.nilai;
      studentMap[sId].count_nilai += 1;
    });
    
    const allScores = Object.values(studentMap).map(s => {
      s.rata_rata = Math.round(s.total_nilai / s.count_nilai);
      return s;
    });
    
    // Sort by name
    allScores.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));
    
    const rOptions = Array.from(rombelSet.entries()).map(([id, nama]) => ({ id, nama }));
    
    // Calculate global stats
    let classAverage = 0;
    let highest = 0;
    let lowest = 100;
    
    if (allScores.length > 0) {
      const sum = allScores.reduce((acc, curr) => acc + curr.rata_rata, 0);
      classAverage = Math.round(sum / allScores.length);
      highest = Math.max(...allScores.map(s => s.rata_rata));
      lowest = Math.min(...allScores.map(s => s.rata_rata));
    } else {
      lowest = 0;
    }

    return { 
      groupedScores: allScores, 
      rombelOptions: rOptions.sort((a, b) => a.nama.localeCompare(b.nama)),
      stats: { average: classAverage, highest, lowest, total: allScores.length }
    };
  }, [bukuNilai]);

  const filteredScores = useMemo(() => {
    if (rombelFilter === 'all') return groupedScores;
    return groupedScores.filter(s => s.rombel_id === rombelFilter);
  }, [groupedScores, rombelFilter]);

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;

  if (!activeMapel) {
    return (
      <div className="flex justify-center p-10">
        <div className="text-center p-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 max-w-md">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-4" />
          Silakan pilih atau buat Mata Pelajaran terlebih dahulu dari menu di sudut kanan atas.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print-container print:max-w-none print:w-full">
      <div className="hidden print:block w-full">
        <KopSurat />
        <div className="pb-4 pt-2 text-center">
          <h2 className="text-xl font-bold uppercase underline pb-2">Analisis Kompetensi</h2>
        </div>
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Analisis Kompetensi</h2>
            <p className="text-xs text-slate-500">Ketercapaian kompetensi {activeMapel.mata_pelajaran}</p>
          </div>
        </div>
        
        {rombelOptions.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button onClick={() => window.print()} variant="outline" className="border-slate-300 no-print">
              <Printer className="w-4 h-4 mr-2" /> Cetak
            </Button>
            <div className="w-full md:w-64">
              <Select value={rombelFilter} onValueChange={setRombelFilter}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {rombelOptions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {stats.total === 0 ? (
        <Card className="bg-slate-50 border-dashed border-slate-300">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <FlaskConical className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-600 mb-2">Belum Ada Data Nilai</h3>
            <p className="text-sm text-slate-500 max-w-md">Data Analisis Kompetensi akan otomatis terisi setelah Anda menginputkan nilai tugas atau ulangan harian siswa.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <Card className="border-slate-200/60 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center h-full">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1">Rata-Rata Kelas</span>
                <span className="text-3xl font-black text-slate-800 flex items-center">
                  {stats.average} 
                  {stats.average >= kkm ? <TrendingUp className="w-5 h-5 ml-2 text-emerald-500" /> : <TrendingDown className="w-5 h-5 ml-2 text-red-500" />}
                </span>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center h-full">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1">Nilai Tertinggi</span>
                <span className="text-3xl font-black text-teal-600 flex items-center">
                  {stats.highest} <Award className="w-5 h-5 ml-2 text-amber-500" />
                </span>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center h-full">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1">Nilai Terendah</span>
                <span className="text-3xl font-black text-red-600 flex items-center">
                  {stats.lowest}
                </span>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center h-full">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1">Batas KKM</span>
                <span className="text-3xl font-black text-indigo-600">
                  {kkm}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Nama Siswa</th>
                    <th className="px-6 py-4 text-center">Kelas</th>
                    <th className="px-6 py-4 text-center">Rata-Rata Nilai</th>
                    <th className="px-6 py-4">Ketercapaian Kompetensi (KKM: {kkm})</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScores.map((siswa, idx) => {
                    const tuntas = siswa.rata_rata >= kkm;
                    const percentage = Math.min(100, Math.max(0, (siswa.rata_rata / 100) * 100));
                    
                    return (
                      <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{siswa.nama_siswa}</td>
                        <td className="px-6 py-4 text-center text-slate-500">{siswa.nama_rombel}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-lg ${tuntas ? 'text-emerald-600' : 'text-red-600'}`}>
                            {siswa.rata_rata}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 relative overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full ${tuntas ? 'bg-teal-500' : 'bg-red-400'}`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                            {/* Marker KKM */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10" 
                              style={{ left: `${kkm}%` }}
                              title={`Batas KKM: ${kkm}`}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {tuntas ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Tuntas</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Perlu Bimbingan</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredScores.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Tidak ada data yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
