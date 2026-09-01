'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';
import { BookOpen, Sparkles, Save, Printer, Loader2, ChevronDown, AlignLeft, Layers, PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        if (html.startsWith('## ')) return <h2 key={i} className="font-bold text-xl mt-5 mb-3 text-indigo-700 border-b pb-2" dangerouslySetInnerHTML={{__html: html.substring(3)}} />;
        if (html.startsWith('# ')) return <h1 key={i} className="font-black text-2xl mt-6 mb-4 text-indigo-900" dangerouslySetInnerHTML={{__html: html.substring(2)}} />;
        
        if (html.trim() === '') return <div key={i} className="h-2"></div>;
        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{__html: html}} />;
      })}
    </div>
  );
};

export default function BahanAjarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Data Master
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    mata_pelajaran: '',
    fase_kelas: '',
    topik: '',
    gaya_bahasa: 'Baku dan akademis'
  });
  const [tpList, setTpList] = useState<string[]>([]);

  // Result State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id;
      if (!uid) return;
      
      // Update form data from active Mapel
      if (activeMapel) {
        setFormData(prev => ({
          ...prev,
          mata_pelajaran: activeMapel.mata_pelajaran || '',
          fase_kelas: activeMapel.fase || ''
        }));
        
        // Fetch TP Elements for this Mapel
        const { data: tpData } = await supabase.from('atp').select('tujuan').eq('pengaturan_guru_id', activeMapel.id).order('urutan', { ascending: true });
        if (tpData) setTpList(tpData.map(c => c.tujuan));
      } else {
        setTpList([]);
      }

      // Get History
      const { data: histData } = await supabase.from('bahan_ajar')
        .select('*')
        .eq('guru_id', uid)
        .order('created_at', { ascending: false });
      
      if (histData) setHistoryList(histData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user, activeMapel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMapel) return toast({ title: '⚠️ Pilih atau Buat Mata Pelajaran terlebih dahulu', variant: 'destructive' });
    if (!formData.topik) return toast({ title: 'Topik harus diisi!', variant: 'destructive' });
    
    setIsGenerating(true);
    setGeneratedData(null);
    try {
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_bahan',
          mataPelajaran: formData.mata_pelajaran,
          fase: formData.fase_kelas,
          topik: formData.topik,
          gayaBahasa: formData.gaya_bahasa
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal generate AI');

      setGeneratedData(result.data);
      toast({ title: '✨ Bahan Ajar Berhasil Dibuat!' });
    } catch (error: any) {
      toast({ title: '❌ Generate Gagal', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedData) return;
    setIsSaving(true);
    try {
      const uid = user?.db_id;
      if (!uid) throw new Error("ID Pengguna tidak valid. Silakan muat ulang halaman.");
      
      // Susun konten markdown dari JSON AI (Array of Slides)
      let fullContent = '';
      if (generatedData.slides && Array.isArray(generatedData.slides)) {
        fullContent = generatedData.slides.map((s: any, i: number) => `## Slide ${i+1}: ${s.judul_slide}\n\n${s.konten_markdown}`).join('\n\n---\n\n');
      } else {
        fullContent = generatedData.konten_materi || 'Tidak ada konten';
      }
      
      const { error } = await supabase.from('bahan_ajar').insert({
        guru_id: uid,
        mata_pelajaran: formData.mata_pelajaran,
        fase_kelas: formData.fase_kelas,
        topik: formData.topik,
        gaya_bahasa: formData.gaya_bahasa,
        konten_materi: fullContent
      });
      
      if (error) throw error;
      toast({ title: '✅ Tersimpan ke Database!' });
      fetchData(); // reload history
    } catch (error: any) {
      toast({ title: '❌ Gagal Menyimpan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromHistory = (item: any) => {
    setFormData({
      mata_pelajaran: item.mata_pelajaran,
      fase_kelas: item.fase_kelas || '',
      topik: item.topik,
      gaya_bahasa: item.gaya_bahasa || 'Baku dan akademis'
    });
    // Parse the full content back to the view
    // Since it's saved as a big markdown text with "---" separators, we can split it to preview it as slides
    const rawContent = item.konten_materi || '';
    const splitted = rawContent.split('\n\n---\n\n');
    const mockSlides = splitted.map((text: string, idx: number) => {
      return {
        judul_slide: `Slide ${idx+1}`,
        konten_markdown: text
      };
    });

    setGeneratedData({
      slides: mockSlides
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 print-container print:max-w-none print:w-full">
      <div className="hidden print:block w-full">
        <KopSurat />
        <div className="pb-4 pt-2 text-center">
          <h2 className="text-xl font-bold uppercase underline pb-2">Bahan Ajar</h2>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><BookOpen className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Bahan Ajar AI</h2><p className="text-xs text-slate-500">Generator materi cerdas terpersonalisasi</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form & Config */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <Card className="border-indigo-100 shadow-md">
            <div className="bg-indigo-50/50 px-5 py-4 border-b border-indigo-100 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-indigo-800 text-sm">Konfigurasi Materi</h3>
            </div>
            <CardContent className="p-5">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                  <Input required value={formData.mata_pelajaran} onChange={e => setFormData({...formData, mata_pelajaran: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fase / Kelas</label>
                  <Input required value={formData.fase_kelas} onChange={e => setFormData({...formData, fase_kelas: e.target.value})} placeholder="Cth: Fase E (Kelas 10)" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Topik / Judul Materi (Dari Tujuan Pembelajaran)</label>
                  <Select 
                    value={formData.topik} 
                    onValueChange={val => setFormData({...formData, topik: val})}
                  >
                    <SelectTrigger className="border-indigo-200 focus-visible:ring-indigo-500">
                      <SelectValue placeholder="Pilih Topik / Tujuan Pembelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {tpList.length === 0 && !formData.topik && (
                        <SelectItem value="-" disabled>Belum ada TP (Buat di menu Tujuan Pembelajaran)</SelectItem>
                      )}
                      {Array.from(new Set([...tpList, formData.topik].filter(Boolean))).map((t, idx) => (
                        <SelectItem key={idx} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Gaya Bahasa AI</label>
                  <Select value={formData.gaya_bahasa} onValueChange={val => setFormData({...formData, gaya_bahasa: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baku dan akademis">Baku & Akademis (Resmi)</SelectItem>
                      <SelectItem value="Santai dan komunikatif (Cocok untuk SMK)">Santai & Komunikatif</SelectItem>
                      <SelectItem value="Bercerita / Storytelling">Bercerita (Storytelling)</SelectItem>
                      <SelectItem value="Penuh Analogi sederhana">Penuh Analogi Sederhana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11">
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang Menulis...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Bahan Ajar</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Riwayat */}
          <Card className="border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-600 text-sm">Riwayat Koleksi Anda</h3>
            </div>
            <CardContent className="p-0">
              {historyList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Belum ada bahan ajar yang disimpan.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {historyList.map(item => (
                    <div key={item.id} onClick={() => loadFromHistory(item)} className="p-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                      <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{item.topik}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>{item.fase_kelas}</span>
                        <span>{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: View Area */}
        <div className="lg:col-span-8">
          <Card className="min-h-[500px] border-slate-200 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:min-h-0">
            {/* Toolbar Area */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center no-print">
              <div className="flex items-center gap-2 text-slate-500">
                <AlignLeft className="w-4 h-4" /> <span className="text-xs font-semibold uppercase tracking-wider">Preview Dokumen</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!generatedData}>
                  <Printer className="w-4 h-4 mr-2" /> Cetak PDF
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={!generatedData || isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                </Button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 md:p-12 print:p-0 bg-white">
              {!generatedData && !isGenerating ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-300">
                  <Layers className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm font-medium">Bahan Ajar akan tampil di sini</p>
                  <p className="text-xs mt-2 text-center max-w-sm">Isi form di samping dan klik Generate untuk membiarkan AI menulis materi pelajaran yang interaktif untuk Anda.</p>
                </div>
              ) : isGenerating ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-indigo-400">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                  <p className="text-sm font-bold animate-pulse">AI sedang merangkai kata demi kata...</p>
                </div>
              ) : (
                <div className="print:text-black">
                  {/* Header Dokumen */}
                  <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase">{formData.topik || 'BAHAN AJAR / LKPD'}</h1>
                    <div className="flex justify-center items-center gap-4 text-sm font-medium text-slate-600">
                      <span>Mata Pelajaran: {formData.mata_pelajaran}</span>
                      <span>•</span>
                      <span>{formData.fase_kelas}</span>
                    </div>
                  </div>

                  {/* Render Slides */}
                  <div className="space-y-12">
                    {generatedData.slides && Array.isArray(generatedData.slides) ? (
                      generatedData.slides.map((slide: any, idx: number) => (
                        <div key={idx} className="slide-card bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-b print:border-slate-800 print:rounded-none print:break-inside-avoid">
                          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-100 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm mr-3">{idx + 1}</span>
                            {slide.judul_slide}
                          </h2>
                          <div className="prose prose-slate max-w-none prose-h3:text-lg prose-h3:mt-0 prose-p:leading-relaxed prose-li:my-1">
                            <MarkdownRenderer content={slide.konten_markdown} />
                          </div>
                        </div>
                      ))
                    ) : (
                       <div className="prose prose-slate max-w-none"><MarkdownRenderer content={generatedData.konten_materi || ''} /></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
