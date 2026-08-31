'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Printer, Sparkles, FileText, Plus, Trash2, Save, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';
interface TujuanPembelajaran {
  id?: string;
  guru_id?: string;
  kode: string;
  tujuan: string;
  jp: number;
  semester: number;
  elemen_terkait: string;
  urutan: number;
}

export default function ATPPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [atpList, setAtpList] = useState<TujuanPembelajaran[]>([]);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TujuanPembelajaran | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTP, setNewTP] = useState<TujuanPembelajaran>({ kode: '', tujuan: '', jp: 8, semester: 1, elemen_terkait: '', urutan: 0 });
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [generateBatch, setGenerateBatch] = useState<string>('TP 1-4');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;

      const { data: pgData } = await supabase
        .from('pengaturan_guru')
        .select('*')
        .eq('guru_id', uid)
        .maybeSingle();
      if (pgData) setPengaturan(pgData);

      if (activeMapel) {
        const { data: atpData } = await supabase
          .from('atp')
          .select('*')
          .eq('pengaturan_guru_id', activeMapel.id)
          .order('urutan', { ascending: true });
        if (atpData) setAtpList(atpData);
      }
    } catch (err) {
      console.error('Error fetching ATP data', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeMapel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTP = async () => {
    if (!user || !newTP.kode || !newTP.tujuan) {
      toast({ title: 'Kode dan Tujuan wajib diisi!', variant: 'destructive' });
      return;
    }
    try {
      const uid = user.db_id || user.id;
      const { error } = await supabase.from('atp').insert({
        guru_id: uid,
        pengaturan_guru_id: activeMapel?.id,
        kode: newTP.kode,
        tujuan: newTP.tujuan,
        jp: newTP.jp,
        semester: newTP.semester,
        elemen_terkait: newTP.elemen_terkait,
        urutan: atpList.length + 1
      });
      if (error) throw error;
      toast({ title: `${newTP.kode} berhasil ditambahkan!` });
      setNewTP({ kode: '', tujuan: '', jp: 8, semester: 1, elemen_terkait: '', urutan: 0 });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal menambahkan', variant: 'destructive' });
    }
  };

  const handleDeleteTP = async (id: string) => {
    if (!confirm('Hapus tujuan pembelajaran ini?')) return;
    try {
      await supabase.from('atp').delete().eq('id', id);
      toast({ title: 'Berhasil dihapus' });
      fetchData();
    } catch (err) { toast({ title: 'Gagal menghapus', variant: 'destructive' }); }
  };

  const handleStartEdit = (tp: TujuanPembelajaran) => {
    setEditingId(tp.id || null);
    setEditForm({ ...tp });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;
    try {
      const { error } = await supabase.from('atp').update({
        kode: editForm.kode,
        tujuan: editForm.tujuan,
        jp: editForm.jp,
        semester: editForm.semester,
        elemen_terkait: editForm.elemen_terkait,
      }).eq('id', editingId);
      if (error) throw error;
      toast({ title: `${editForm.kode} berhasil diperbarui!` });
      setEditingId(null); setEditForm(null);
      fetchData();
    } catch (err) { toast({ title: 'Gagal memperbarui', variant: 'destructive' }); }
  };

  const handleGenerateAI = async () => {
    if (!user) return;
    if (!activeMapel) return toast({ title: '⚠️ Pilih atau Buat Mata Pelajaran terlebih dahulu', variant: 'destructive' });
    
    // We don't wipe everything anymore, we just append to the existing ATPs!
    // This allows generating 1-4, then 5-8, etc.

    setGenerating(true);
    toast({ title: `🤖 Sedang men-generate ATP (${generateBatch})...`, description: 'Mohon tunggu 15-30 detik.' });

    try {
      const uid = user.db_id || user.id;
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_atp',
          mataPelajaran: activeMapel?.mata_pelajaran || 'Informatika',
          fase: activeMapel?.fase || 'Fase E (Kelas 10)',
          jenjang: activeMapel?.jenjang_sekolah || 'SMK',
          batch: generateBatch,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal generate ATP');

      const aiData = result.data;
      if (aiData.alur && aiData.alur.length > 0) {
        // Find current max order to append properly
        const maxUrutan = atpList.length > 0 ? Math.max(...atpList.map(a => a.urutan || 0)) : 0;
        
        const insertData = aiData.alur.map((tp: any, idx: number) => ({
          guru_id: uid,
          pengaturan_guru_id: activeMapel.id,
          kode: String(tp.kode || `TP${maxUrutan + idx + 1}`),
          tujuan: String(tp.tujuan || ''),
          jp: parseInt(tp.jp) || 8,
          semester: parseInt(tp.semester) || (generateBatch.includes('1-4') ? 1 : (generateBatch.includes('9-12') ? 2 : 1)),
          elemen_terkait: String(tp.elemen_terkait || ''),
          urutan: maxUrutan + idx + 1,
        }));
        
        // Remove old TPs that might have the exact same kode if re-generating a batch
        const codesToDelete = insertData.map((d: any) => d.kode);
        if (codesToDelete.length > 0) {
          await supabase.from('atp').delete().eq('pengaturan_guru_id', activeMapel.id).in('kode', codesToDelete);
        }

        const { error } = await supabase.from('atp').insert(insertData);
        if (error) throw error;
      }
      toast({ title: '✅ ATP berhasil di-generate!', description: `${aiData.alur?.length || 0} tujuan pembelajaran dibuat oleh AI.` });
      fetchData();
    } catch (err: any) {
      console.error('Generate error:', err);
      console.log('Error details:', err.message, err.code, err.details, err.hint);
      const errMsg = err.message || err.details || err.code || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      toast({ title: '❌ Gagal men-generate ATP', description: errMsg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading || contextLoading) {
    return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const mataPelajaran = activeMapel?.mata_pelajaran || 'Mata Pelajaran';
  const fase = activeMapel?.fase || 'Fase E (Kelas 10)';

  const filteredAtp = filterSemester === 'all' ? atpList : atpList.filter(tp => tp.semester === parseInt(filterSemester));
  const totalJP = atpList.reduce((sum, tp) => sum + (tp.jp || 0), 0);
  const sem1JP = atpList.filter(t => t.semester === 1).reduce((sum, t) => sum + (t.jp || 0), 0);
  const sem2JP = atpList.filter(t => t.semester === 2).reduce((sum, t) => sum + (t.jp || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 print:pt-[1cm] print:pb-[1cm] print:px-[1.5cm]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 leading-tight">Alur Tujuan Pembelajaran (ATP)</h2>
            <p className="text-xs text-slate-500">{mataPelajaran} · {fase}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={generateBatch} onValueChange={setGenerateBatch}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Pilih Bagian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TP 1-4">TP 1-4</SelectItem>
              <SelectItem value="TP 5-8">TP 5-8</SelectItem>
              <SelectItem value="TP 9-12">TP 9-12</SelectItem>
              <SelectItem value="TP 13-16">TP 13-16</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateAI} disabled={generating} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md disabled:opacity-70 h-9">
            {generating ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div> AI...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-1" /> Generate</>
            )}
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300 h-9">
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-blue-700">{atpList.length}</p>
            <p className="text-[10px] font-medium text-blue-500 uppercase">Total TP</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-700">{totalJP}</p>
            <p className="text-[10px] font-medium text-emerald-500 uppercase">Total JP/Tahun</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-700">{sem1JP} JP</p>
            <p className="text-[10px] font-medium text-amber-500 uppercase">Semester 1</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-purple-700">{sem2JP} JP</p>
            <p className="text-[10px] font-medium text-purple-500 uppercase">Semester 2</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Filter Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'destructive' : 'outline'}>
          {showAddForm ? 'Tutup Form' : <><Plus className="w-4 h-4 mr-1" /> Tambah TP</>}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-dashed border-2 border-blue-300 bg-blue-50/30">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-bold text-sm text-blue-700">Tambah Tujuan Pembelajaran Baru</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Kode *</Label>
                <Input value={newTP.kode} onChange={e => setNewTP({ ...newTP, kode: e.target.value })} placeholder="TP1" className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">JP</Label>
                <Input type="number" value={newTP.jp} onChange={e => setNewTP({ ...newTP, jp: parseInt(e.target.value) || 0 })} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Semester</Label>
                <Select value={String(newTP.semester)} onValueChange={v => setNewTP({ ...newTP, semester: parseInt(v) })}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Elemen Terkait</Label>
                <Input value={newTP.elemen_terkait} onChange={e => setNewTP({ ...newTP, elemen_terkait: e.target.value })} placeholder="E1" className="bg-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500">Tujuan Pembelajaran *</Label>
              <Textarea value={newTP.tujuan} onChange={e => setNewTP({ ...newTP, tujuan: e.target.value })} placeholder="Deskripsikan tujuan pembelajaran..." className="bg-white min-h-[60px]" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddTP} className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-1" /> Simpan TP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ATP Table */}
      {filteredAtp.length === 0 ? (
        <Card className="bg-slate-50 border-slate-200/60 no-print">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700">Belum ada Alur Tujuan Pembelajaran</h4>
            <p className="text-sm text-slate-500 mt-1">Klik "+ Tambah TP" atau gunakan AI untuk men-generate</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="hidden print:block w-full">
            <KopSurat />
            <div className="pb-4 pt-2 text-center">
              <h2 className="text-xl font-bold uppercase underline pb-2">Alur Tujuan Pembelajaran (ATP)</h2>
              <p className="text-sm font-medium">Mata Pelajaran: {activeMapel?.mata_pelajaran || 'Mata Pelajaran'}</p>
            </div>
          </div>
          <div className="overflow-x-auto print:overflow-visible">
            <table id="atp-table" className="w-full text-sm print:text-base print:border-collapse print-table">
              <colgroup>
                <col className="w-[70px]" />
                <col className="w-full" />
                <col className="w-[60px]" />
                <col className="w-[90px]" />
                <col className="w-[80px]" />
                <col className="w-[80px] no-print" />
              </colgroup>
              <thead>
                <tr className="hidden print:table-row print:border-transparent print:border-none">
                  <td colSpan={5} style={{ height: '1.5cm' }} className="print:border-none print:border-transparent bg-white"></td>
                </tr>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 print:bg-gray-100 print:border-black">
                  <th style={{ padding: '16px' }} className="p-4 text-left font-bold text-slate-600 w-[70px] print:text-black print:border print:border-black print:text-center align-middle">Kode</th>
                  <th style={{ padding: '16px' }} className="p-4 text-left font-bold text-slate-600 print:text-black print:border print:border-black print:text-center align-middle">Tujuan Pembelajaran</th>
                  <th style={{ padding: '16px' }} className="p-4 text-center font-bold text-slate-600 w-[60px] print:text-black print:border print:border-black align-middle">JP</th>
                  <th style={{ padding: '16px' }} className="p-4 text-center font-bold text-slate-600 w-[90px] print:text-black print:border print:border-black align-middle">Semester</th>
                  <th style={{ padding: '16px' }} className="p-4 text-center font-bold text-slate-600 w-[80px] print:text-black print:border print:border-black align-middle">Elemen</th>
                  <th style={{ padding: '16px' }} className="p-4 text-center font-bold text-slate-600 w-[80px] no-print align-middle">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtp.map((tp, index) => {
                  const isEditing = editingId === tp.id;
                  return (
                    <tr key={tp.id} className={`border-b border-slate-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 print:border-black print:bg-white print:break-inside-avoid`}>
                      {isEditing && editForm ? (
                        <>
                          <td className="px-3 py-2"><Input value={editForm.kode} onChange={e => setEditForm({ ...editForm, kode: e.target.value })} className="h-8 text-xs" /></td>
                          <td className="px-3 py-2"><Textarea value={editForm.tujuan} onChange={e => setEditForm({ ...editForm, tujuan: e.target.value })} className="min-h-[40px] text-xs" /></td>
                          <td className="px-3 py-2"><Input type="number" value={editForm.jp} onChange={e => setEditForm({ ...editForm, jp: parseInt(e.target.value) || 0 })} className="h-8 text-xs text-center" /></td>
                          <td className="px-3 py-2">
                            <Select value={String(editForm.semester)} onValueChange={v => setEditForm({ ...editForm, semester: parseInt(v) })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2"><Input value={editForm.elemen_terkait} onChange={e => setEditForm({ ...editForm, elemen_terkait: e.target.value })} className="h-8 text-xs text-center" /></td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }} className="h-7 w-7 p-0 text-slate-400">✕</Button>
                              <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="h-7 w-7 p-0 text-green-500"><Save className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '16px' }} className="p-4 font-bold text-blue-600 print:text-black print:border print:border-black print:text-center align-top">{tp.kode}</td>
                          <td style={{ padding: '16px' }} className="p-4 text-slate-700 leading-relaxed print:text-black print:border print:border-black print:text-left align-top">{tp.tujuan}</td>
                          <td style={{ padding: '16px' }} className="p-4 text-center print:border print:border-black align-top">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full print:bg-transparent print:text-black print:text-base">{tp.jp}</span>
                          </td>
                          <td style={{ padding: '16px' }} className="p-4 text-center print:border print:border-black align-top">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tp.semester === 1 ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'} print:bg-transparent print:text-black print:text-base`}>
                              Sem {tp.semester}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }} className="p-4 text-center text-xs font-medium text-slate-500 print:text-black print:text-base print:border print:border-black align-top">{tp.elemen_terkait}</td>
                          <td className="px-4 py-3 text-center no-print">
                            <div className="flex gap-0.5 justify-center">
                              <Button variant="ghost" size="sm" onClick={() => handleStartEdit(tp)} className="h-7 w-7 p-0 text-slate-400 hover:text-blue-500"><Edit3 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTP(tp.id!)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {/* Total Row moved inside tbody so it doesn't repeat on every printed page */}
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 print:bg-gray-100 print:border-black print:break-inside-avoid">
                  <td style={{ padding: '16px' }} className="p-4 font-extrabold text-slate-700 print:text-black print:border print:border-black">Total</td>
                  <td style={{ padding: '16px' }} className="p-4 text-slate-500 text-xs print:text-black print:text-base print:border print:border-black">{filteredAtp.length} Tujuan Pembelajaran</td>
                  <td style={{ padding: '16px' }} className="p-4 text-center print:border print:border-black">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full print:bg-transparent print:text-black print:text-base">{filteredAtp.reduce((s, t) => s + (t.jp || 0), 0)} JP</span>
                  </td>
                  <td colSpan={3} className="print:border print:border-black"></td>
                </tr>
              </tbody>
              <tfoot className="hidden print:table-footer-group print:border-none print:border-transparent">
                <tr className="print:border-none print:border-transparent">
                  <td colSpan={5} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
