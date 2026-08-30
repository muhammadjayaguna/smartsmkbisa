'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Save, Shield, Plus, Upload, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSisminjar, PengaturanGuru } from './SisminjarContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNew?: boolean;
}

export default function SettingsModal({ isOpen, onClose, defaultNew = false }: SettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingKop, setUploadingKop] = useState(false);
  const [formData, setFormData] = useState({
    mata_pelajaran: 'Kurikulum Merdeka',
    jp_per_minggu: '',
    jenjang_sekolah: 'SMK',
    fase: 'Fase E (Kelas 10)',
    kkm: 75,
    url_logo: '',
    url_kop_surat: '',
    nama_guru_override: '',
    nip_guru: '',
    lokasi_penetapan: 'Banjarmasin',
    teks_acuan_cp: '',
    is_guru_bk: false,
    pengumuman_siswa: '',
    jadwal_pelajaran: ''
  });

  const { listMapel, activeMapel, refreshData, setActiveMapelId } = useSisminjar();
  const [editingMapelId, setEditingMapelId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (defaultNew) {
        setEditingMapelId('baru');
        resetForm();
      } else if (activeMapel) {
        setEditingMapelId(activeMapel.id);
        populateForm(activeMapel);
      } else {
        setEditingMapelId('baru');
        resetForm();
      }
    }
  }, [isOpen, activeMapel, defaultNew]);

  const populateForm = (data: PengaturanGuru) => {
    setFormData({
      mata_pelajaran: data.mata_pelajaran || 'Kurikulum Merdeka',
      jp_per_minggu: data.jp_per_minggu || '',
      jenjang_sekolah: data.jenjang_sekolah || 'SMK',
      fase: data.fase || 'Fase E (Kelas 10)',
      kkm: data.kkm || 75,
      url_logo: data.url_logo || '',
      url_kop_surat: data.url_kop_surat || '',
      nama_guru_override: user?.nama || '',
      nip_guru: data.nip_guru || '',
      lokasi_penetapan: data.lokasi_penetapan || 'Banjarmasin',
      teks_acuan_cp: data.teks_acuan_cp || '',
      is_guru_bk: data.is_guru_bk || false,
      pengumuman_siswa: data.pengumuman_siswa || '',
      jadwal_pelajaran: data.jadwal_pelajaran || ''
    });
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      mata_pelajaran: '',
      jp_per_minggu: '',
      fase: 'Fase E (Kelas 10)',
      teks_acuan_cp: '',
      pengumuman_siswa: '',
      jadwal_pelajaran: ''
    }));
  };

  const handleMapelChange = (val: string) => {
    setEditingMapelId(val);
    if (val === 'baru') {
      resetForm();
    } else {
      const selected = listMapel.find(m => m.id === val);
      if (selected) populateForm(selected);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const uid = user.db_id || user.id;
      
      const { nama_guru_override, ...pengaturanData } = formData;
      
      let error;
      if (editingMapelId !== 'baru') {
        const { error: updateError } = await supabase.from('pengaturan_guru').update({
          ...pengaturanData,
          updated_at: new Date().toISOString()
        }).eq('id', editingMapelId);
        error = updateError;
      } else {
        const { data: insertedData, error: insertError } = await supabase.from('pengaturan_guru').insert({
          guru_id: uid,
          ...pengaturanData
        }).select('id').single();
        error = insertError;
        if (insertedData) {
           setActiveMapelId(insertedData.id);
        }
      }

      if (error) throw error;

      // Update users table for nama guru
      if (nama_guru_override !== undefined && nama_guru_override !== user.nama) {
        await supabase.from('users').update({ nama: nama_guru_override }).eq('id', uid);
        if (typeof window !== 'undefined') {
          // Quick reload to update auth context
          window.location.reload();
        }
      }

      toast({ title: 'Pengaturan berhasil disimpan!' });
      await refreshData();
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'kop_surat') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingKop(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${user.db_id || user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sekolah-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('sekolah-assets').getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'url_logo' : 'url_kop_surat']: data.publicUrl
      }));

      toast({ title: 'Gambar berhasil diunggah' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Gagal mengunggah gambar', description: error.message || 'Pastikan bucket sekolah-assets sudah dibuat dan di-set Public', variant: 'destructive' });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingKop(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-4 border-b border-slate-200 bg-white shadow-sm z-10 flex flex-row items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <DialogTitle className="text-lg">Pengaturan Aplikasi</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] p-6">
          <div className="space-y-8 pb-10">
            {/* Mapel Selector in Modal */}
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold text-teal-800">Mata Pelajaran yang Diedit</Label>
                <p className="text-xs text-teal-600/70 mt-1">Pilih mapel untuk diubah atau buat mapel baru.</p>
              </div>
              <div className="w-1/2">
                <Select value={editingMapelId} onValueChange={handleMapelChange}>
                  <SelectTrigger className="bg-white border-teal-200">
                    <SelectValue placeholder="Pilih Mapel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listMapel.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.mata_pelajaran}</SelectItem>
                    ))}
                    <SelectItem value="baru" className="text-emerald-600 font-bold"><span className="flex items-center"><Plus className="w-3 h-3 mr-1" /> Tambah Mapel Baru</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran yang Diampu</Label>
                  <Input name="mata_pelajaran" value={formData.mata_pelajaran} onChange={handleChange} className="bg-white border-teal-300 focus-visible:ring-teal-500" placeholder="Cth: Matematika" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">JP Per Minggu</Label>
                  <Input name="jp_per_minggu" placeholder="Contoh: 4 atau 4,5" value={formData.jp_per_minggu} onChange={handleChange} className="bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">KKM / KCM</Label>
                  <Input name="kkm" type="number" value={formData.kkm} onChange={handleChange} className="bg-white" />
                </div>
              </div>
              


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Guru (Opsional dengan Gelar)</Label>
                  <Input name="nama_guru_override" value={formData.nama_guru_override} onChange={handleChange} className="bg-white" placeholder="Contoh: Muhammad Jayaguna, S.Pd" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIP Guru</Label>
                  <Input name="nip_guru" value={formData.nip_guru} onChange={handleChange} className="bg-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi Penetapan (Kota)</Label>
                <Input name="lokasi_penetapan" value={formData.lokasi_penetapan} onChange={handleChange} className="bg-white" />
                <p className="text-[11px] text-slate-400">Digunakan untuk Tanda Tangan dokumen cetak (Cth: Jakarta, 17 Juli 2026).</p>
              </div>
            </div>

            {/* Section 2: Kurikulum */}
            <div className="pt-6 border-t border-slate-200 space-y-4">


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenjang Sekolah</Label>
                  <Select value={formData.jenjang_sekolah} onValueChange={(v) => setFormData(p => ({...p, jenjang_sekolah: v}))}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SD">SD</SelectItem>
                      <SelectItem value="SMP">SMP</SelectItem>
                      <SelectItem value="SMA">SMA</SelectItem>
                      <SelectItem value="SMK">SMK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fase (Opsional)</Label>
                  <Select value={formData.fase} onValueChange={(v) => setFormData(p => ({...p, fase: v}))}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fase A (Kelas 1-2)">Fase A (Kelas 1-2)</SelectItem>
                      <SelectItem value="Fase B (Kelas 3-4)">Fase B (Kelas 3-4)</SelectItem>
                      <SelectItem value="Fase C (Kelas 5-6)">Fase C (Kelas 5-6)</SelectItem>
                      <SelectItem value="Fase D (Kelas 7-9)">Fase D (Kelas 7-9)</SelectItem>
                      <SelectItem value="Fase E (Kelas 10)">Fase E (Kelas 10)</SelectItem>
                      <SelectItem value="Fase F (Kelas 11-12)">Fase F (Kelas 11-12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teks Acuan CP Resmi (Kepka BSKAP)</Label>
                <Textarea name="teks_acuan_cp" className="min-h-[100px] bg-white" value={formData.teks_acuan_cp} onChange={handleChange} />
              </div>
            </div>

            {/* Section 3: Extra */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center space-x-3 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                <Checkbox 
                  id="guru_bk" 
                  checked={formData.is_guru_bk} 
                  onCheckedChange={(c) => setFormData(p => ({...p, is_guru_bk: !!c}))}
                />
                <div>
                  <Label htmlFor="guru_bk" className="text-sm font-bold text-slate-800">Saya adalah Guru BK / Piket</Label>
                  <p className="text-[11px] text-slate-500 mt-1">Mengaktifkan fitur ini akan memunculkan menu khusus kedisiplinan siswa.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Pengaturan Dashboard Siswa
                </Label>
                <div className="space-y-4 mt-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengumuman Untuk Siswa</Label>
                    <Textarea name="pengumuman_siswa" placeholder="Harap membawa buku gambar A4..." value={formData.pengumuman_siswa} onChange={handleChange} className="bg-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jadwal Pelajaran / Info Kelas</Label>
                    <Textarea name="jadwal_pelajaran" placeholder="Senin: 07.30 - 09.00" value={formData.jadwal_pelajaran} onChange={handleChange} className="bg-white mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? 'Menyimpan...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
