'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FileEdit, Sparkles, BookOpen, ChevronDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import PrintHeader from '@/components/common/PrintHeader';

export default function ModulAjarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [atpList, setAtpList] = useState<any[]>([]);
  const [modulList, setModulList] = useState<any[]>([]);
  const [selectedTp, setSelectedTp] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      const { data: atpData } = await supabase.from('atp').select('*').eq('guru_id', uid).order('urutan', { ascending: true });
      if (atpData) setAtpList(atpData);
      
      const { data: maData } = await supabase.from('modul_ajar').select('*').eq('guru_id', uid).order('created_at', { ascending: false });
      if (maData) setModulList(maData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateMA = async () => {
    if (!activeMapel) return toast({ title: '⚠️ Pilih atau Buat Mata Pelajaran terlebih dahulu', variant: 'destructive' });
    if (!selectedTp) return toast({ title: '⚠️ Pilih Tujuan Pembelajaran (TP) terlebih dahulu', variant: 'destructive' });
    const tp = atpList.find(t => t.kode === selectedTp);
    if (!tp) return;

    setGenerating(true);
    try {
      const uid = user?.db_id || user?.id;
      
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_ma',
          mataPelajaran: activeMapel.mata_pelajaran,
          fase: activeMapel.fase || 'Fase E',
          tp_kode: tp.kode,
          tujuan: tp.tujuan
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal generate AI');

      const aiData = result.data;
      
      const { error } = await supabase.from('modul_ajar').insert({
        guru_id: uid,
        tp_kode: tp.kode,
        judul: aiData.judul || 'Modul Pembelajaran',
        pemahaman_bermakna: aiData.pemahaman_bermakna || '',
        pertanyaan_pemantik: aiData.pertanyaan_pemantik || '',
        kegiatan_pendahuluan: aiData.kegiatan_pendahuluan || '',
        kegiatan_inti: aiData.kegiatan_inti || '',
        kegiatan_penutup: aiData.kegiatan_penutup || '',
        asesmen_jenis: aiData.asesmen_jenis || '',
        asesmen_deskripsi: aiData.asesmen_deskripsi || ''
      });

      if (error) throw error;
      toast({ title: '✅ Modul Ajar berhasil di-generate!' });
      fetchData();
      setSelectedTp('');
    } catch (err: any) {
      console.error(err);
      toast({ title: '❌ Gagal men-generate', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteModul = async (id: string) => {
    if (!confirm('Hapus modul ajar ini?')) return;
    try {
      const { error } = await supabase.from('modul_ajar').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Modul dihapus' });
      fetchData();
    } catch (err: any) { toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' }); }
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><FileEdit className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Modul Ajar (RPP)</h2><p className="text-xs text-slate-500">Rancangan pembelajaran per Tujuan Pembelajaran</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Cetak MA
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/50 no-print">
        <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-orange-800 mb-1.5 block">Pilih Tujuan Pembelajaran (Dari ATP)</label>
            <div className="relative">
              <select 
                value={selectedTp} onChange={(e) => setSelectedTp(e.target.value)}
                className="w-full p-2.5 bg-white border border-orange-200 rounded-lg text-sm appearance-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">-- Pilih Tujuan Pembelajaran --</option>
                {atpList.map(tp => <option key={tp.id} value={tp.kode}>[{tp.kode}] {tp.tujuan.substring(0, 80)}...</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-orange-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-auto flex items-end h-full">
            <Button 
              onClick={handleGenerateMA} disabled={generating || !selectedTp}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 h-[42px]"
            >
              {generating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Modul (AI)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {modulList.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada Modul Ajar yang dibuat.<br/>Pilih TP di atas lalu klik Generate untuk membuat secara otomatis.</p>
          </div>
        ) : (
          modulList.map((ma, idx) => (
            <Card key={ma.id} className="overflow-hidden border-slate-200 print-card-reset break-inside-avoid print:mb-12 print:break-after-page">
              <div className="bg-gradient-to-r from-slate-100 to-white px-5 py-3 border-b border-slate-200 flex justify-between items-center no-print">
                <div className="flex items-center gap-3">
                  <span className="bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-md">{ma.tp_kode}</span>
                  <h3 className="font-bold text-slate-800 text-lg">{ma.judul}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteModul(ma.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 no-print">Hapus</Button>
              </div>
              <CardContent className="p-5 print:p-0 space-y-5">
                <PrintHeader title={`MODUL AJAR (${ma.tp_kode})`} />
                <div className="hidden print-only mb-6 text-center -mt-4">
                  <h3 className="font-bold text-xl uppercase">{ma.judul}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pemahaman Bermakna</h4>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{ma.pemahaman_bermakna}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pertanyaan Pemantik</h4>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{ma.pertanyaan_pemantik}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Asesmen ({ma.asesmen_jenis})</h4>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{ma.asesmen_deskripsi}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Langkah Kegiatan Pembelajaran</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <h5 className="font-bold text-emerald-800 text-xs mb-2">1. Pendahuluan</h5>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{ma.kegiatan_pendahuluan}</p>
                    </div>
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <h5 className="font-bold text-blue-800 text-xs mb-2">2. Kegiatan Inti</h5>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{ma.kegiatan_inti}</p>
                    </div>
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      <h5 className="font-bold text-amber-800 text-xs mb-2">3. Penutup</h5>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{ma.kegiatan_penutup}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
