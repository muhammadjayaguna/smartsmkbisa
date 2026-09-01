'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ClipboardList, Sparkles, ChevronDown, Trash2, Printer, Plus } from 'lucide-react';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

// Simple Markdown Renderer
const MarkdownRenderer = ({ content }: { content: any }) => {
  if (!content) return null;
  
  let safeContent = '';
  if (typeof content === 'string') {
    safeContent = content;
  } else if (Array.isArray(content)) {
    safeContent = content.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n\n');
  } else if (typeof content === 'object') {
    safeContent = JSON.stringify(content, null, 2);
  } else {
    safeContent = String(content);
  }

  const lines = safeContent.split('\n');
  return (
    <div className="text-slate-700 text-sm leading-relaxed">
      {lines.map((line, i) => {
        let html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        if (html.startsWith('- ')) {
          return <li key={i} className="ml-6 list-disc mb-1" dangerouslySetInnerHTML={{__html: html.substring(2)}} />;
        }
        if (html.match(/^\d+\.\s/)) {
          return <li key={i} className="ml-6 list-decimal mb-1" dangerouslySetInnerHTML={{__html: html.replace(/^\d+\.\s/, '')}} />;
        }
        if (html.startsWith('### ')) return <h3 key={i} className="font-bold text-lg mt-4 mb-2 text-slate-800" dangerouslySetInnerHTML={{__html: html.substring(4)}} />;
        if (html.startsWith('## ')) return <h2 key={i} className="font-bold text-xl mt-5 mb-3 text-violet-700 border-b pb-2" dangerouslySetInnerHTML={{__html: html.substring(3)}} />;
        if (html.startsWith('# ')) return <h1 key={i} className="font-black text-2xl mt-6 mb-4 text-violet-900" dangerouslySetInnerHTML={{__html: html.substring(2)}} />;
        
        if (html.trim() === '') return <div key={i} className="h-2"></div>;
        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{__html: html}} />;
      })}
    </div>
  );
};

export default function AsesmenPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [atpList, setAtpList] = useState<any[]>([]);
  const [asesmenList, setAsesmenList] = useState<any[]>([]);
  const [selectedTp, setSelectedTp] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      const { data: atpData } = await supabase.from('atp').select('*').eq('guru_id', uid).order('urutan', { ascending: true });
      if (atpData) setAtpList(atpData);
      
      const { data: asmData } = await supabase.from('asesmen').select('*').eq('guru_id', uid).order('created_at', { ascending: false });
      if (asmData) setAsesmenList(asmData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateAsesmen = async () => {
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
          action: 'generate_asesmen',
          mataPelajaran: activeMapel.mata_pelajaran,
          fase: activeMapel.fase || 'Fase E',
          tp_kode: tp.kode,
          tujuan: tp.tujuan
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal generate AI');

      const aiData = result.data;
      
      // Ensure all fields are strings before saving to DB
      const safeString = (val: any) => {
        if (typeof val === 'string') return val;
        if (!val) return '';
        if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join('\n');
        return JSON.stringify(val);
      };

      const { error } = await supabase.from('asesmen').insert({
        guru_id: uid,
        tp_kode: tp.kode,
        jenis: safeString(aiData.jenis) || 'Penilaian Tertulis',
        kisi_kisi: safeString(aiData.kisi_kisi) || '',
        rubrik_4: safeString(aiData.rubrik_4) || '',
        rubrik_3: safeString(aiData.rubrik_3) || '',
        rubrik_2: safeString(aiData.rubrik_2) || '',
        rubrik_1: safeString(aiData.rubrik_1) || '',
        soal_evaluasi: safeString(aiData.soal_evaluasi) || ''
      });

      if (error) throw error;
      toast({ title: '✅ Instrumen Asesmen berhasil di-generate!' });
      fetchData();
      setSelectedTp('');
    } catch (err: any) {
      console.error(err);
      toast({ title: '❌ Gagal men-generate', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteAsesmen = async (id: string) => {
    if (!confirm('Hapus instrumen asesmen ini?')) return;
    try {
      const { error } = await supabase.from('asesmen').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Asesmen dihapus' });
      fetchData();
    } catch (err: any) { toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' }); }
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print-container print:max-w-none print:w-full">
      <div className="hidden print:block w-full">
        <KopSurat />
        <div className="pb-4 pt-2 text-center">
          <h2 className="text-xl font-bold uppercase underline pb-2">Instrumen Asesmen</h2>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600"><ClipboardList className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Instrumen Asesmen</h2><p className="text-xs text-slate-500">Kisi-kisi, rubrik, dan soal evaluasi pembelajaran</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Cetak Asesmen
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50 no-print">
        <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-violet-800 mb-1.5 block">Pilih Tujuan Pembelajaran (Dari ATP)</label>
            <div className="relative">
              <select 
                value={selectedTp} onChange={(e) => setSelectedTp(e.target.value)}
                className="w-full p-2.5 bg-white border border-violet-200 rounded-lg text-sm appearance-none outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">-- Pilih Tujuan Pembelajaran --</option>
                {atpList.map(tp => <option key={tp.id} value={tp.kode}>[{tp.kode}] {tp.tujuan.substring(0, 80)}...</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-violet-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-auto flex items-end h-full">
            <Button 
              onClick={handleGenerateAsesmen} disabled={generating || !selectedTp}
              className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 h-[42px]"
            >
              {generating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Asesmen (AI)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {asesmenList.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada Instrumen Asesmen yang dibuat.<br/>Pilih TP di atas lalu klik Generate untuk membuat secara otomatis.</p>
          </div>
        ) : (
          asesmenList.map((asm, idx) => (
            <Card key={asm.id} className="overflow-hidden border-slate-200 print:break-inside-avoid print:shadow-none print:border-black print:mb-8">
              <div className="bg-gradient-to-r from-slate-100 to-white px-5 py-3 border-b border-slate-200 flex justify-between items-center print:bg-none print:border-black print:border-b-2">
                <div className="flex items-center gap-3">
                  <span className="bg-violet-100 text-violet-700 font-bold text-xs px-2.5 py-1 rounded-md print:border print:border-black">{asm.tp_kode}</span>
                  <h3 className="font-bold text-slate-800 text-lg">{asm.jenis}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteAsesmen(asm.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 no-print">Hapus</Button>
              </div>
              <CardContent className="p-5 space-y-5 print:p-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 print:text-black">Kisi-Kisi Asesmen</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:border-none print:p-0">
                    <MarkdownRenderer content={asm.kisi_kisi} />
                  </div>
                </div>
                
                <div className="print:break-inside-avoid">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 print:text-black">Rubrik Penilaian</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 print:border-black print:bg-white">
                      <div className="font-bold text-emerald-700 mb-1 flex justify-between print:text-black"><span>Sangat Baik</span><span>(4)</span></div>
                      <p className="text-xs text-slate-600 print:text-black">{asm.rubrik_4}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 print:border-black print:bg-white">
                      <div className="font-bold text-blue-700 mb-1 flex justify-between print:text-black"><span>Baik</span><span>(3)</span></div>
                      <p className="text-xs text-slate-600 print:text-black">{asm.rubrik_3}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 print:border-black print:bg-white">
                      <div className="font-bold text-amber-700 mb-1 flex justify-between print:text-black"><span>Cukup</span><span>(2)</span></div>
                      <p className="text-xs text-slate-600 print:text-black">{asm.rubrik_2}</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 print:border-black print:bg-white">
                      <div className="font-bold text-red-700 mb-1 flex justify-between print:text-black"><span>Kurang</span><span>(1)</span></div>
                      <p className="text-xs text-slate-600 print:text-black">{asm.rubrik_1}</p>
                    </div>
                  </div>
                </div>

                <div className="print:break-before-auto">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 print:text-black print:mt-4">Soal Evaluasi / Tugas</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:border-none print:p-0">
                    <MarkdownRenderer content={asm.soal_evaluasi} />
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
