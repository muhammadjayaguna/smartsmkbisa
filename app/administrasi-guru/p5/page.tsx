'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Sprout, Sparkles, ChevronDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function P5Page() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [p5List, setP5List] = useState<any[]>([]);
  const [selectedTema, setSelectedTema] = useState('');

  const temaList = [
    'Gaya Hidup Berkelanjutan',
    'Kearifan Lokal',
    'Bhinneka Tunggal Ika',
    'Bangunlah Jiwa dan Raganya',
    'Suara Demokrasi',
    'Rekayasa dan Teknologi',
    'Kewirausahaan',
    'Kebekerjaan'
  ];

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      const { data } = await supabase.from('modul_p5').select('*').eq('guru_id', uid).order('created_at', { ascending: false });
      if (data) setP5List(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateP5 = async () => {
    if (!selectedTema) return toast({ title: '⚠️ Pilih Tema P5 terlebih dahulu', variant: 'destructive' });

    setGenerating(true);
    try {
      const uid = user?.db_id || user?.id;
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_p5',
          tema: selectedTema
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal generate AI');

      const aiData = result.data;
      
      const { error } = await supabase.from('modul_p5').insert({
        guru_id: uid,
        tema: selectedTema,
        topik: aiData.topik || 'Proyek P5',
        dimensi_1: aiData.dimensi_1 || '',
        dimensi_2: aiData.dimensi_2 || '',
        tahap_pengenalan: aiData.tahap_pengenalan || '',
        tahap_kontekstualisasi: aiData.tahap_kontekstualisasi || '',
        tahap_aksi: aiData.tahap_aksi || '',
        tahap_refleksi: aiData.tahap_refleksi || ''
      });

      if (error) throw error;
      toast({ title: '✅ Modul P5 berhasil di-generate!' });
      fetchData();
      setSelectedTema('');
    } catch (err: any) {
      console.error(err);
      toast({ title: '❌ Gagal men-generate', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteP5 = async (id: string) => {
    if (!confirm('Hapus ide proyek P5 ini?')) return;
    try {
      const { error } = await supabase.from('modul_p5').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Proyek dihapus' });
      fetchData();
    } catch (err: any) { toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><Sprout className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Modul P5</h2><p className="text-xs text-slate-500">Rancangan Projek Penguatan Profil Pelajar Pancasila</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Cetak Modul P5
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50 no-print">
        <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-green-800 mb-1.5 block">Pilih Tema Proyek (Kemendikbud)</label>
            <div className="relative">
              <select 
                value={selectedTema} onChange={(e) => setSelectedTema(e.target.value)}
                className="w-full p-2.5 bg-white border border-green-200 rounded-lg text-sm appearance-none outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              >
                <option value="">-- Pilih Tema P5 --</option>
                {temaList.map(tema => <option key={tema} value={tema}>{tema}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-green-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-auto flex items-end h-full">
            <Button 
              onClick={handleGenerateP5} disabled={generating || !selectedTema}
              className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 h-[42px]"
            >
              {generating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Proyek (AI)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {p5List.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada Ide Proyek P5 yang dibuat.<br/>Pilih Tema di atas lalu klik Generate untuk mendapatkan ide.</p>
          </div>
        ) : (
          p5List.map((p5, idx) => (
            <Card key={p5.id} className="overflow-hidden border-slate-200">
              <div className="bg-gradient-to-r from-slate-100 to-white px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 font-bold text-xs px-2.5 py-1 rounded-md">{p5.tema}</span>
                  <h3 className="font-bold text-slate-800 text-lg">{p5.topik}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteP5(p5.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 no-print">Hapus</Button>
              </div>
              <CardContent className="p-5 space-y-5">
                <div className="flex gap-2">
                  <span className="bg-blue-50 text-blue-700 font-medium text-xs px-2.5 py-1 rounded-full border border-blue-100">Dimensi 1: {p5.dimensi_1}</span>
                  <span className="bg-purple-50 text-purple-700 font-medium text-xs px-2.5 py-1 rounded-full border border-purple-100">Dimensi 2: {p5.dimensi_2}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                    <h5 className="font-bold text-sky-800 text-sm mb-2">1. Tahap Pengenalan</h5>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p5.tahap_pengenalan}</p>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <h5 className="font-bold text-amber-800 text-sm mb-2">2. Tahap Kontekstualisasi</h5>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p5.tahap_kontekstualisasi}</p>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h5 className="font-bold text-emerald-800 text-sm mb-2">3. Tahap Aksi Nyata</h5>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p5.tahap_aksi}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <h5 className="font-bold text-indigo-800 text-sm mb-2">4. Tahap Refleksi</h5>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p5.tahap_refleksi}</p>
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
