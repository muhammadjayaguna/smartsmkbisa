'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Printer, Sparkles, BookOpen, Plus, Trash2, Save, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';

interface ElemenCP {
  id?: string;
  guru_id?: string;
  kode: string;
  judul: string;
  fase: string;
  deskripsi: string;
  urutan: number;
}

const BORDER_COLORS = [
  'border-l-blue-500',
  'border-l-red-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-purple-500',
  'border-l-cyan-500',
  'border-l-rose-500',
  'border-l-teal-500',
];

const ICON_COLORS = [
  'text-blue-500',
  'text-red-500',
  'text-emerald-500',
  'text-amber-500',
  'text-purple-500',
  'text-cyan-500',
  'text-rose-500',
  'text-teal-500',
];

const BADGE_COLORS = [
  'bg-blue-50 text-blue-600 border-blue-200',
  'bg-red-50 text-red-600 border-red-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-purple-50 text-purple-600 border-purple-200',
  'bg-cyan-50 text-cyan-600 border-cyan-200',
  'bg-rose-50 text-rose-600 border-rose-200',
  'bg-teal-50 text-teal-600 border-teal-200',
];

const ICON_LIST = [
  <BookOpen key="0" className="w-5 h-5" />,
  <Edit3 key="1" className="w-5 h-5" />,
  <BookOpen key="2" className="w-5 h-5" />,
  <Sparkles key="3" className="w-5 h-5" />,
];

export default function CapaianPembelajaranPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel, loading: contextLoading, refreshData } = useSisminjar();
  const [loading, setLoading] = useState(true);
  const [elemenList, setElemenList] = useState<ElemenCP[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ElemenCP | null>(null);
  const [deskripsiUmum, setDeskripsiUmum] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState(false);
  const [savingDeskripsi, setSavingDeskripsi] = useState(false);

  // Adding new elemen
  const [showAddForm, setShowAddForm] = useState(false);
  const [newElemen, setNewElemen] = useState<ElemenCP>({ kode: '', judul: '', fase: '', deskripsi: '', urutan: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;

      if (activeMapel) {
        setDeskripsiUmum(activeMapel.teks_acuan_cp || '');
      }

      // Fetch elemen CP
      const { data: cpData } = await supabase
        .from('elemen_cp')
        .select('*')
        .eq('guru_id', uid)
        .order('urutan', { ascending: true });

      if (cpData) {
        setElemenList(cpData);
      }
    } catch (err) {
      console.error('Error fetching CP data', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!contextLoading) {
      fetchData();
    }
  }, [fetchData, contextLoading, activeMapel]);

  const handleSaveDeskripsiUmum = async () => {
    setSavingDeskripsi(true);
    try {
      const { error } = await supabase
        .from('pengaturan_guru')
        .update({ teks_acuan_cp: deskripsiUmum, updated_at: new Date().toISOString() })
        .eq('id', activeMapel?.id);

      if (error) throw error;
      toast({ title: 'Deskripsi Umum CP berhasil disimpan!' });
      setEditDeskripsi(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSavingDeskripsi(false);
    }
  };

  const handleAddElemen = async () => {
    if (!user || !newElemen.kode || !newElemen.judul || !newElemen.deskripsi) {
      toast({ title: 'Kode, Judul, dan Deskripsi wajib diisi!', variant: 'destructive' });
      return;
    }
    try {
      const uid = user.db_id || user.id;
      const { error } = await supabase
        .from('elemen_cp')
        .insert({
          guru_id: uid,
          kode: newElemen.kode,
          judul: newElemen.judul,
          fase: newElemen.fase || activeMapel?.fase || 'Fase E (Kelas 10)',
          deskripsi: newElemen.deskripsi,
          urutan: elemenList.length + 1
        });

      if (error) throw error;
      toast({ title: `Elemen ${newElemen.kode} berhasil ditambahkan!` });
      setNewElemen({ kode: '', judul: '', fase: '', deskripsi: '', urutan: 0 });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal menambahkan elemen', variant: 'destructive' });
    }
  };

  const handleDeleteElemen = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus elemen ini?')) return;
    try {
      const { error } = await supabase.from('elemen_cp').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Elemen berhasil dihapus' });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal menghapus', variant: 'destructive' });
    }
  };

  const handleStartEdit = (elemen: ElemenCP) => {
    setEditingId(elemen.id || null);
    setEditForm({ ...elemen });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;
    try {
      const { error } = await supabase
        .from('elemen_cp')
        .update({
          kode: editForm.kode,
          judul: editForm.judul,
          fase: editForm.fase,
          deskripsi: editForm.deskripsi,
        })
        .eq('id', editingId);

      if (error) throw error;
      toast({ title: `Elemen ${editForm.kode} berhasil diperbarui!` });
      setEditingId(null);
      setEditForm(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal memperbarui', variant: 'destructive' });
    }
  };

  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!user) return;
    if (!activeMapel) return toast({ title: '⚠️ Pilih atau Buat Mata Pelajaran terlebih dahulu', variant: 'destructive' });
    
    if (elemenList.length > 0) {
      const konfirmasi = confirm(
        '⚠️ Generate AI akan MENGGANTI seluruh Deskripsi Umum dan Elemen CP yang sudah ada.\n\nApakah Anda yakin ingin melanjutkan?'
      );
      if (!konfirmasi) return;
    }

    setGenerating(true);
    toast({
      title: '🤖 Sedang men-generate kurikulum...',
      description: 'AI sedang menyusun Capaian Pembelajaran. Mohon tunggu 15-30 detik.',
    });

    try {
      const uid = user.db_id || user.id;
      const mapel = activeMapel?.mata_pelajaran || 'Informatika';
      const faseVal = activeMapel?.fase || 'Fase E (Kelas 10)';
      const jenjang = activeMapel?.jenjang_sekolah || 'SMK';

      // Call server-side API route
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_cp',
          mataPelajaran: mapel,
          fase: faseVal,
          jenjang: jenjang,
          jurusan: mapel,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal generate dari AI');
      }

      const aiData = result.data;

      // 1. Save deskripsi umum to pengaturan_guru
      if (aiData.deskripsi_umum) {
        await supabase
          .from('pengaturan_guru')
          .update({ 
            teks_acuan_cp: aiData.deskripsi_umum, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', activeMapel?.id);
        
        setDeskripsiUmum(aiData.deskripsi_umum);
      }

      // 2. Delete old elemen then insert new ones
      if (aiData.elemen && aiData.elemen.length > 0) {
        await supabase.from('elemen_cp').delete().eq('guru_id', uid);

        const insertData = aiData.elemen.map((el: any, idx: number) => ({
          guru_id: uid,
          kode: el.kode,
          judul: el.judul,
          fase: el.fase || faseVal,
          deskripsi: el.deskripsi,
          urutan: idx + 1,
        }));

        const { error: insertErr } = await supabase.from('elemen_cp').insert(insertData);
        if (insertErr) throw insertErr;
      }

      toast({
        title: '✅ Kurikulum berhasil di-generate!',
        description: `${aiData.elemen?.length || 0} elemen CP telah dibuat oleh AI (${result.model}).`,
      });

      fetchData(); // Refresh
    } catch (err: any) {
      console.error('AI Generate Error:', err);
      toast({
        title: '❌ Gagal men-generate kurikulum',
        description: err.message || 'Terjadi kesalahan saat menghubungi AI.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || contextLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const mataPelajaran = activeMapel?.mata_pelajaran || 'Mata Pelajaran';
  const fase = activeMapel?.fase || 'Fase E (Kelas 10)';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 print-container print:p-12 print:max-w-none print:w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 leading-tight">Capaian Pembelajaran (CP)</h2>
            <p className="text-xs text-slate-500">Kurikulum Merdeka · {mataPelajaran}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateAI} disabled={generating} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md disabled:opacity-70">
            {generating ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Kurikulum (AI)</>
            )}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" />
            Cetak CP
          </Button>
        </div>
      </div>

      {/* Deskripsi Umum */}
      <Card className={`border-slate-200/60 shadow-sm overflow-hidden print:border-none print:shadow-none print:break-inside-avoid print:mb-8 ${!deskripsiUmum ? 'print:hidden' : ''}`}>
        <CardContent className="p-6 print:p-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="text-lg">📋</span> Deskripsi Umum CP
            </h3>
            {!editDeskripsi && (
              <Button variant="ghost" size="sm" onClick={() => setEditDeskripsi(true)} className="text-slate-400 hover:text-slate-600 no-print">
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {editDeskripsi ? (
            <div className="space-y-3">
              <Textarea
                value={deskripsiUmum}
                onChange={e => setDeskripsiUmum(e.target.value)}
                className="min-h-[150px] bg-slate-50"
                placeholder="Masukkan deskripsi umum capaian pembelajaran..."
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditDeskripsi(false)}>Batal</Button>
                <Button size="sm" onClick={handleSaveDeskripsi} disabled={savingDeskripsi} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                  <Save className="w-4 h-4 mr-1" />
                  {savingDeskripsi ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-5 border border-slate-100 print:bg-none print:border-none print:p-0 print:rounded-none">
              <p className={`text-sm text-slate-600 print:text-black leading-relaxed whitespace-pre-wrap ${!deskripsiUmum ? 'print:hidden' : ''}`}>
                {deskripsiUmum || 'Belum ada deskripsi. Klik ikon ✏️ di atas untuk menambahkan, atau gunakan tombol Generate AI!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Elemen CP */}
      <div className="space-y-4 print:space-y-8">
        <div className="flex items-center justify-between print:mb-4">
          <h3 className="font-bold text-slate-700 text-lg print:text-xl print:text-black print:uppercase print:tracking-wide">Elemen Capaian Pembelajaran</h3>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'destructive' : 'outline'}
            className="no-print"
          >
            {showAddForm ? 'Tutup Form' : <><Plus className="w-4 h-4 mr-1" /> Tambah Elemen</>}
          </Button>
        </div>

        {/* Add New Form */}
        {showAddForm && (
          <Card className="border-dashed border-2 border-indigo-300 bg-indigo-50/30 no-print">
            <CardContent className="p-5 space-y-4">
              <h4 className="font-bold text-sm text-indigo-700">Tambah Elemen Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-bold">Kode *</Label>
                  <Input value={newElemen.kode} onChange={e => setNewElemen({ ...newElemen, kode: e.target.value })} placeholder="Contoh: E1" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-bold">Judul *</Label>
                  <Input value={newElemen.judul} onChange={e => setNewElemen({ ...newElemen, judul: e.target.value })} placeholder="Contoh: Validitas dan Pengelolaan Data" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-bold">Fase</Label>
                  <Input value={newElemen.fase} onChange={e => setNewElemen({ ...newElemen, fase: e.target.value })} placeholder={fase} className="bg-white" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-bold">Deskripsi *</Label>
                <Textarea value={newElemen.deskripsi} onChange={e => setNewElemen({ ...newElemen, deskripsi: e.target.value })} placeholder="Deskripsikan elemen capaian pembelajaran ini..." className="bg-white min-h-[80px]" />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddElemen} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Simpan Elemen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Elemen Cards */}
        {elemenList.length === 0 ? (
          <Card className="bg-slate-50 border-slate-200/60">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">Belum ada Elemen CP</h4>
              <p className="text-sm text-slate-500 mt-1">Klik tombol "+ Tambah Elemen" atau gunakan AI untuk men-generate</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {elemenList.map((elemen, index) => {
              const colorIdx = index % BORDER_COLORS.length;
              const isEditing = editingId === elemen.id;

              return (
                <Card
                  key={elemen.id}
                  className={`border-l-4 ${BORDER_COLORS[colorIdx]} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden print:border-0 print:border-b print:border-slate-400 print:shadow-none print:rounded-none print:break-inside-avoid print:bg-transparent`}
                >
                  <CardContent className="p-5 print:pt-12 print:pb-8 print:px-0">
                    {isEditing && editForm ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input value={editForm.kode} onChange={e => setEditForm({ ...editForm, kode: e.target.value })} placeholder="Kode" />
                          <Input value={editForm.judul} onChange={e => setEditForm({ ...editForm, judul: e.target.value })} placeholder="Judul" />
                          <Input value={editForm.fase} onChange={e => setEditForm({ ...editForm, fase: e.target.value })} placeholder="Fase" />
                        </div>
                        <Textarea value={editForm.deskripsi} onChange={e => setEditForm({ ...editForm, deskripsi: e.target.value })} className="min-h-[80px]" />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}>Batal</Button>
                          <Button size="sm" onClick={handleSaveEdit} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                            <Save className="w-4 h-4 mr-1" /> Simpan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`${ICON_COLORS[colorIdx]} print:hidden`}>
                              {ICON_LIST[index % ICON_LIST.length]}
                            </span>
                            <h4 className="font-bold text-slate-800 print:text-black text-base print:text-lg">
                              {elemen.kode} — {elemen.judul}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${BADGE_COLORS[colorIdx]}`}>
                              {elemen.fase}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleStartEdit(elemen)} className="text-slate-400 hover:text-blue-500 no-print h-8 w-8 p-0">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteElemen(elemen.id!)} className="text-slate-400 hover:text-red-500 no-print h-8 w-8 p-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 print:text-black leading-relaxed text-justify">{elemen.deskripsi}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
