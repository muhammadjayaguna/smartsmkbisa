'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Save, LifeBuoy, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLocalDateString } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ProgramRemedialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [loading, setLoading] = useState(true);
  
  const [kkm, setKkm] = useState(75);
  const [lowScores, setLowScores] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Form state per buku_nilai_id
  const [remedialData, setRemedialData] = useState<Record<string, { nilai_sesudah: string | number, bentuk: string }>>({});

  const fetchData = useCallback(async () => {
    if (!user || !activeMapel) {
      setLoading(false);
      return;
    }
    try {
      const uid = user.db_id || user.id;
      const userKkm = Number(activeMapel.kkm) || 75;
      setKkm(userKkm);
      
      // Get all buku_nilai under KKM, include remedial data if exists
      const { data: nilaiData } = await supabase.from('buku_nilai')
        .select(`
          id, tanggal, mata_pelajaran, jenis_penilaian, materi_topik, nilai,
          rombel (nama_rombel),
          siswa (id, nama),
          program_remedial (id, nilai_sesudah, bentuk_remedial, tanggal_remedial)
        `)
        .eq('guru_id', uid)
        .ilike('mata_pelajaran', activeMapel.mata_pelajaran) // use ilike for case-insensitive match
        .lt('nilai', userKkm)
        .order('tanggal', { ascending: false });
        
      if (nilaiData) {
        setLowScores(nilaiData);
        // Initialize form data for non-remediated items
        const initialForm: Record<string, any> = {};
        nilaiData.forEach((item: any) => {
          if (!item.program_remedial || item.program_remedial.length === 0) {
            initialForm[item.id] = { nilai_sesudah: '', bentuk: 'Tugas Tambahan' };
          }
        });
        setRemedialData(initialForm);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!contextLoading) {
      fetchData();
    }
  }, [fetchData, contextLoading, activeMapel]);

  const handleFormChange = (id: string, field: string, val: string | number) => {
    setRemedialData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
  };

  const handleSaveRemedial = async (bukuNilaiId: string, siswaId: string, nilaiSebelum: number) => {
    const data = remedialData[bukuNilaiId];
    if (!data || data.nilai_sesudah === '') return toast({ title: 'Masukkan nilai hasil remedial!', variant: 'destructive' });
    
    setIsSubmitting(bukuNilaiId);
    try {
      const uid = user?.db_id || user?.id;
      const { error } = await supabase.from('program_remedial').insert({
        buku_nilai_id: bukuNilaiId,
        guru_id: uid,
        siswa_id: siswaId,
        nilai_sebelum: nilaiSebelum,
        nilai_sesudah: parseInt(data.nilai_sesudah as string),
        bentuk_remedial: data.bentuk,
        tanggal_remedial: getLocalDateString()
      });
      if (error) throw error;
      
      toast({ title: '✅ Remedial berhasil disimpan!' });
      fetchData(); // reload
    } catch (error: any) {
      toast({ title: '❌ Gagal menyimpan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(null);
    }
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const isRemedialCompleted = (pr: any) => {
    if (!pr) return false;
    if (Array.isArray(pr)) return pr.length > 0;
    return Object.keys(pr).length > 0;
  };

  const getRemedialObj = (pr: any) => {
    if (!pr) return null;
    return Array.isArray(pr) ? pr[0] : pr;
  };

  const belumRemedial = lowScores.filter(item => !isRemedialCompleted(item.program_remedial));
  const sudahRemedial = lowScores.filter(item => isRemedialCompleted(item.program_remedial));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600"><LifeBuoy className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Program Remedial</h2><p className="text-xs text-slate-500">Tindak lanjut nilai di bawah KKM ({kkm})</p></div>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-bold border border-red-100 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> {belumRemedial.length} Siswa butuh remedial
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Belum Remedial */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 border-b pb-2 flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Perlu Tindak Lanjut
          </h3>
          
          {belumRemedial.length === 0 ? (
            <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
              Tidak ada siswa yang nilai-nya di bawah KKM. Kinerja yang luar biasa! 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {belumRemedial.map((item) => (
                <Card key={item.id} className="border-red-200 shadow-sm overflow-hidden border-l-4 border-l-red-500">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-red-800">{item.rombel?.nama_rombel} - {item.mata_pelajaran}</span>
                    <span className="text-red-500">{item.tanggal}</span>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{item.siswa?.nama}</h4>
                        <p className="text-sm text-slate-500">{item.jenis_penilaian} {item.materi_topik ? `(${item.materi_topik})` : ''}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-400 uppercase">Nilai</div>
                        <div className="text-2xl font-black text-red-600">{item.nilai}</div>
                      </div>
                    </div>
                    
                    {remedialData[item.id] && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Bentuk Remedial</label>
                            <Input 
                              className="h-8 text-xs" 
                              value={remedialData[item.id].bentuk} 
                              onChange={e => handleFormChange(item.id, 'bentuk', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nilai Paska-Remedial</label>
                            <Input 
                              type="number" min="0" max="100" className="h-8 text-xs font-bold text-emerald-600 focus-visible:ring-emerald-500" placeholder="0 - 100"
                              value={remedialData[item.id].nilai_sesudah} 
                              onChange={e => handleFormChange(item.id, 'nilai_sesudah', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleSaveRemedial(item.id, item.siswa.id, item.nilai)}
                          disabled={isSubmitting === item.id || !remedialData[item.id].nilai_sesudah}
                          className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isSubmitting === item.id ? 'Menyimpan...' : 'Simpan Remedial'} <Check className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Sudah Remedial */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 border-b pb-2 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Selesai Diremedial
          </h3>
          
          {sudahRemedial.length === 0 ? (
            <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
              Belum ada riwayat remedial yang diselesaikan.
            </div>
          ) : (
            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
              {sudahRemedial.map((item) => {
                const rem = getRemedialObj(item.program_remedial);
                if (!rem) return null;
                
                return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center shadow-sm group">
                    <div>
                      <h4 className="font-bold text-slate-700">{item.siswa?.nama}</h4>
                      <p className="text-[11px] text-slate-500">{item.jenis_penilaian} - Kelas {item.rombel?.nama_rombel}</p>
                      <div className="mt-2 text-[10px] text-emerald-600 font-medium flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {rem.bentuk_remedial} ({rem.tanggal_remedial})
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-300 line-through">{item.nilai}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-2xl font-black text-emerald-500">{rem.nilai_sesudah}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async () => {
                          if (!confirm('Batalkan status remedial ini?')) return;
                          try {
                            await supabase.from('program_remedial').delete().eq('id', rem.id);
                            toast({ title: 'Status remedial dibatalkan' });
                            fetchData();
                          } catch (e: any) {
                            toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
                          }
                        }}
                        title="Batalkan / Edit Remedial"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
