'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';
import { Target, Plus, Trash2, Save, Edit3, Printer, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface KKTPItem {
  id?: string;
  guru_id?: string;
  tp_kode: string;
  tujuan: string;
  kriteria_tercapai: string;
  kriteria_berkembang: string;
  kriteria_mulai: string;
  kriteria_belum: string;
  urutan: number;
}

export default function KKTPPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [kktpList, setKktpList] = useState<KKTPItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<KKTPItem | null>(null);
  const [newItem, setNewItem] = useState<KKTPItem>({
    tp_kode: '', tujuan: '', kriteria_tercapai: '', kriteria_berkembang: '', kriteria_mulai: '', kriteria_belum: '', urutan: 0
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!user) return;
    if (!activeMapel) return toast({ title: '⚠️ Pilih atau Buat Mata Pelajaran terlebih dahulu', variant: 'destructive' });
    
    setGenerating(true);
    toast({ title: '🤖 Mengambil data ATP...', description: 'Mohon tunggu sebentar.' });
    
    try {
      const uid = user.db_id || user.id;
      // 1. Ambil ATP
      const { data: atpData, error: atpError } = await supabase.from('atp').select('*').eq('guru_id', uid).order('urutan', { ascending: true });
      
      if (atpError) throw atpError;
      if (!atpData || atpData.length === 0) {
        toast({ title: '⚠️ Belum ada ATP', description: 'Buat Tujuan Pembelajaran (ATP) terlebih dahulu di menu ATP.', variant: 'destructive' });
        setGenerating(false);
        return;
      }

      if (kktpList.length > 0) {
        if (!confirm('⚠️ Generate AI akan MENGGANTI seluruh KKTP yang sudah ada.\\n\\nLanjutkan?')) {
          setGenerating(false);
          return;
        }
      }

      // 2. Panggil API AI secara bertahap (chunking) untuk mencegah Cloudflare 524 Timeout
      const chunkSize = 3;
      let allNewKktp: any[] = [];
      let currentIndex = 0;

      for (let i = 0; i < atpData.length; i += chunkSize) {
        const chunk = atpData.slice(i, i + chunkSize);
        toast({ title: `🤖 Sedang men-generate KKTP (${i+1}-${Math.min(i+chunkSize, atpData.length)} dari ${atpData.length})...`, description: 'Mohon tunggu.' });
        
        const res = await fetch('/api/generate-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_kktp',
            mataPelajaran: activeMapel?.mata_pelajaran || 'Mata Pelajaran',
            fase: activeMapel?.fase || 'Fase E (Kelas 10)',
            jenjang: activeMapel?.jenjang_sekolah || 'SMK',
            atpList: chunk
          }),
        });
        
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.error || `Gagal generate KKTP pada batch ${i+1}`);

        const aiData = result.data;
        if (!aiData || !aiData.kktp || !Array.isArray(aiData.kktp)) throw new Error('Format output AI tidak valid pada batch tertentu');

        const mappedChunk = aiData.kktp.map((item: any) => {
          currentIndex++;
          return {
            guru_id: uid,
            tp_kode: item.tp_kode,
            tujuan: atpData.find(a => a.kode === item.tp_kode)?.tujuan || item.tujuan || '',
            kriteria_tercapai: item.kriteria_tercapai,
            kriteria_berkembang: item.kriteria_berkembang,
            kriteria_mulai: item.kriteria_mulai,
            kriteria_belum: item.kriteria_belum,
            urutan: currentIndex
          };
        });

        allNewKktp = [...allNewKktp, ...mappedChunk];
      }

      // 3. Hapus KKTP lama
      await supabase.from('kktp').delete().eq('guru_id', uid);

      // 4. Insert KKTP baru
      const { error: insertError } = await supabase.from('kktp').insert(allNewKktp);
      if (insertError) throw insertError;

      toast({ title: '✅ Berhasil!', description: 'KKTP berhasil di-generate menggunakan AI.' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Gagal generate', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      // const { data: pgData } = await supabase.from('pengaturan_guru').select('*').eq('guru_id', uid).maybeSingle();
      // if (pgData) setPengaturan(pgData);

      const { data } = await supabase.from('kktp').select('*').eq('guru_id', uid).order('urutan', { ascending: true });
      if (data) setKktpList(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!user || !newItem.tp_kode || !newItem.tujuan) {
      toast({ title: 'Kode TP dan Tujuan wajib diisi!', variant: 'destructive' }); return;
    }
    try {
      const uid = user.db_id || user.id;
      await supabase.from('kktp').insert({ ...newItem, guru_id: uid, urutan: kktpList.length + 1 });
      toast({ title: `KKTP ${newItem.tp_kode} berhasil ditambahkan!` });
      setNewItem({ tp_kode: '', tujuan: '', kriteria_tercapai: '', kriteria_berkembang: '', kriteria_mulai: '', kriteria_belum: '', urutan: 0 });
      setShowAddForm(false);
      fetchData();
    } catch (err) { toast({ title: 'Gagal menambahkan', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item KKTP ini?')) return;
    await supabase.from('kktp').delete().eq('id', id);
    toast({ title: 'Berhasil dihapus' }); fetchData();
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;
    await supabase.from('kktp').update({
      tp_kode: editForm.tp_kode, tujuan: editForm.tujuan,
      kriteria_tercapai: editForm.kriteria_tercapai, kriteria_berkembang: editForm.kriteria_berkembang,
      kriteria_mulai: editForm.kriteria_mulai, kriteria_belum: editForm.kriteria_belum,
    }).eq('id', editingId);
    toast({ title: 'Berhasil diperbarui!' }); setEditingId(null); setEditForm(null); fetchData();
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const mataPelajaran = activeMapel?.mata_pelajaran || 'Mata Pelajaran';
  const kkm = activeMapel?.kkm || 75;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print:pt-[1cm] print:pb-[1cm] print:px-[1.5cm]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)</h2>
            <p className="text-xs text-slate-500">{mataPelajaran} · KKM: {kkm}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateAI} disabled={generating} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md disabled:opacity-70">
            {generating ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate KKTP (AI)</>
            )}
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Cetak KKTP
          </Button>
        </div>
      </div>

      {/* KKM Badge */}
      <Card className="bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200/50 no-print">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-700">Kriteria Ketuntasan Minimal (KKM)</p>
            <p className="text-xs text-slate-500">Nilai KKM yang berlaku untuk mata pelajaran ini</p>
          </div>
          <div className="bg-rose-600 text-white text-2xl font-extrabold w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
            {kkm}
          </div>
        </CardContent>
      </Card>

      {/* Add Button */}
      <div className="flex justify-end no-print">
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'destructive' : 'outline'}>
          {showAddForm ? 'Tutup Form' : <><Plus className="w-4 h-4 mr-1" /> Tambah KKTP</>}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-dashed border-2 border-rose-300 bg-rose-50/30">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-bold text-sm text-rose-700">Tambah KKTP Baru</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs font-bold text-slate-500">Kode TP *</Label><Input value={newItem.tp_kode} onChange={e => setNewItem({ ...newItem, tp_kode: e.target.value })} placeholder="TP1" className="bg-white" /></div>
              <div className="space-y-1"><Label className="text-xs font-bold text-slate-500">Tujuan Pembelajaran *</Label><Input value={newItem.tujuan} onChange={e => setNewItem({ ...newItem, tujuan: e.target.value })} placeholder="Deskripsi tujuan..." className="bg-white" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs font-bold text-emerald-600">✅ Tercapai</Label><Textarea value={newItem.kriteria_tercapai} onChange={e => setNewItem({ ...newItem, kriteria_tercapai: e.target.value })} className="bg-white min-h-[50px]" placeholder="Kriteria jika tercapai..." /></div>
              <div className="space-y-1"><Label className="text-xs font-bold text-blue-600">📈 Berkembang</Label><Textarea value={newItem.kriteria_berkembang} onChange={e => setNewItem({ ...newItem, kriteria_berkembang: e.target.value })} className="bg-white min-h-[50px]" placeholder="Kriteria jika berkembang..." /></div>
              <div className="space-y-1"><Label className="text-xs font-bold text-amber-600">🔄 Mulai Berkembang</Label><Textarea value={newItem.kriteria_mulai} onChange={e => setNewItem({ ...newItem, kriteria_mulai: e.target.value })} className="bg-white min-h-[50px]" placeholder="Kriteria jika mulai berkembang..." /></div>
              <div className="space-y-1"><Label className="text-xs font-bold text-red-600">⚠️ Belum Berkembang</Label><Textarea value={newItem.kriteria_belum} onChange={e => setNewItem({ ...newItem, kriteria_belum: e.target.value })} className="bg-white min-h-[50px]" placeholder="Kriteria jika belum berkembang..." /></div>
            </div>
            <div className="flex justify-end"><Button onClick={handleAdd} className="bg-rose-500 hover:bg-rose-600 text-white"><Plus className="w-4 h-4 mr-1" /> Simpan</Button></div>
          </CardContent>
        </Card>
      )}

      {/* KKTP Cards (Web View) */}
      {kktpList.length === 0 ? (
        <Card className="bg-slate-50 no-print"><CardContent className="p-12 flex flex-col items-center text-center">
          <Target className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700">Belum ada KKTP</h4>
          <p className="text-sm text-slate-500 mt-1">Tambahkan kriteria ketercapaian untuk setiap tujuan pembelajaran</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4 no-print">
          {kktpList.map((item) => (
            <Card key={item.id} className="border-slate-200/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{item.tp_kode}</span>
                    <span className="font-bold text-sm text-slate-700">{item.tujuan}</span>
                  </div>
                  <div className="flex gap-1 no-print">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id!); setEditForm({ ...item }); }} className="h-7 w-7 p-0 text-slate-400 hover:text-blue-500"><Edit3 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id!)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                {editingId === item.id && editForm ? (
                  <div className="p-4 space-y-3 bg-blue-50/30">
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={editForm.tp_kode} onChange={e => setEditForm({ ...editForm, tp_kode: e.target.value })} placeholder="Kode" />
                      <Input value={editForm.tujuan} onChange={e => setEditForm({ ...editForm, tujuan: e.target.value })} placeholder="Tujuan" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Textarea value={editForm.kriteria_tercapai} onChange={e => setEditForm({ ...editForm, kriteria_tercapai: e.target.value })} placeholder="Tercapai" className="min-h-[50px]" />
                      <Textarea value={editForm.kriteria_berkembang} onChange={e => setEditForm({ ...editForm, kriteria_berkembang: e.target.value })} placeholder="Berkembang" className="min-h-[50px]" />
                      <Textarea value={editForm.kriteria_mulai} onChange={e => setEditForm({ ...editForm, kriteria_mulai: e.target.value })} placeholder="Mulai" className="min-h-[50px]" />
                      <Textarea value={editForm.kriteria_belum} onChange={e => setEditForm({ ...editForm, kriteria_belum: e.target.value })} placeholder="Belum" className="min-h-[50px]" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}>Batal</Button>
                      <Button size="sm" onClick={handleSaveEdit} className="bg-blue-500 text-white"><Save className="w-4 h-4 mr-1" /> Simpan</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
                    <div className="p-4 bg-emerald-50/50">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">✅ Tercapai</p>
                      <p className="text-xs text-slate-600">{item.kriteria_tercapai || '-'}</p>
                    </div>
                    <div className="p-4 bg-blue-50/50">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">📈 Berkembang</p>
                      <p className="text-xs text-slate-600">{item.kriteria_berkembang || '-'}</p>
                    </div>
                    <div className="p-4 bg-amber-50/50">
                      <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">🔄 Mulai Berkembang</p>
                      <p className="text-xs text-slate-600">{item.kriteria_mulai || '-'}</p>
                    </div>
                    <div className="p-4 bg-red-50/50">
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">⚠️ Belum Berkembang</p>
                      <p className="text-xs text-slate-600">{item.kriteria_belum || '-'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KKTP Print Table (Print View) */}
      {kktpList.length > 0 && (
        <div className="hidden print:block w-full text-sm" style={{ pageBreakInside: 'auto', breakInside: 'auto' }}>
          <KopSurat />
          <div className="pb-4 pt-2 text-center">
            <h2 className="text-xl font-bold uppercase underline pb-2">Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</h2>
            <p className="text-sm font-medium">Mata Pelajaran: {mataPelajaran}</p>
          </div>
          <table className="w-full border-collapse print-table table-fixed" style={{ pageBreakInside: 'auto', breakInside: 'auto' }}>
            <thead>
              <tr className="hidden print:table-row print:border-transparent print:border-none">
                <td colSpan={5} style={{ height: '1.5cm' }} className="print:border-none print:border-transparent bg-white"></td>
              </tr>
              <tr className="bg-gray-100 print:border-black">
                <th className="p-3 border border-black font-bold text-center align-middle w-1/5 break-words">Tujuan Pembelajaran</th>
                <th className="p-3 border border-black font-bold text-center align-middle w-1/5 break-words">Tercapai</th>
                <th className="p-3 border border-black font-bold text-center align-middle w-1/5 break-words">Berkembang</th>
                <th className="p-3 border border-black font-bold text-center align-middle w-1/5 break-words">Mulai Berkembang</th>
                <th className="p-3 border border-black font-bold text-center align-middle w-1/5 break-words">Belum Berkembang</th>
              </tr>
            </thead>
            <tbody style={{ pageBreakInside: 'auto', breakInside: 'auto' }}>
              {kktpList.map((item) => (
                <tr key={item.id} className="border border-black">
                  <td className="p-3 border border-black align-top break-words whitespace-normal">
                    <span className="font-bold block mb-1">{item.tp_kode}</span>
                    {item.tujuan}
                  </td>
                  <td className="p-3 border border-black align-top text-xs leading-relaxed break-words whitespace-normal">{item.kriteria_tercapai || '-'}</td>
                  <td className="p-3 border border-black align-top text-xs leading-relaxed break-words whitespace-normal">{item.kriteria_berkembang || '-'}</td>
                  <td className="p-3 border border-black align-top text-xs leading-relaxed break-words whitespace-normal">{item.kriteria_mulai || '-'}</td>
                  <td className="p-3 border border-black align-top text-xs leading-relaxed break-words whitespace-normal">{item.kriteria_belum || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="hidden print:table-footer-group print:border-none print:border-transparent">
              <tr className="print:border-none print:border-transparent">
                <td colSpan={5} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
