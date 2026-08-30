'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Save, Upload, Loader2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PengaturanAplikasiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingKop, setUploadingKop] = useState(false);
  const [formData, setFormData] = useState({
    url_logo: '',
    url_kop_surat: '',
    nama_sekolah: '',
    npsn: '',
    nama_kepala_sekolah: '',
    nip_kepala_sekolah: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('pengaturan_aplikasi').select('*').eq('id', 1).maybeSingle();
        if (data) {
          setFormData({
            url_logo: data.url_logo || '',
            url_kop_surat: data.url_kop_surat || '',
            nama_sekolah: data.nama_sekolah || '',
            npsn: data.npsn || '',
            nama_kepala_sekolah: data.nama_kepala_sekolah || '',
            nip_kepala_sekolah: data.nip_kepala_sekolah || ''
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'kop_surat') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingKop(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `global-${type}-${Date.now()}.${fileExt}`;
      const filePath = `global-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sekolah-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('sekolah-assets').getPublicUrl(filePath);
      
      setFormData(prev => {
        const newData = {
          ...prev,
          [type === 'logo' ? 'url_logo' : 'url_kop_surat']: data.publicUrl
        };
        
        // Auto-save ke database agar user tidak lupa menekan Simpan
        supabase.from('pengaturan_aplikasi').upsert({
          id: 1,
          url_logo: newData.url_logo,
          url_kop_surat: newData.url_kop_surat,
          nama_sekolah: newData.nama_sekolah,
          npsn: newData.npsn,
          nama_kepala_sekolah: newData.nama_kepala_sekolah,
          nip_kepala_sekolah: newData.nip_kepala_sekolah
        }).then(({ error }) => {
          if (error) console.error('Error auto-saving image:', error);
        });

        return newData;
      });

      toast({ title: 'Gambar berhasil diunggah dan disimpan!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Gagal mengunggah gambar', description: error.message, variant: 'destructive' });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingKop(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Periksa apakah data pengaturan_aplikasi (id=1) sudah ada
      const { data: checkData, error: checkError } = await supabase.from('pengaturan_aplikasi').select('id').eq('id', 1).maybeSingle();
      
      if (checkError) throw checkError;

      if (checkData) {
        // Update
        const { error: updateError } = await supabase.from('pengaturan_aplikasi').update({
          url_logo: formData.url_logo,
          url_kop_surat: formData.url_kop_surat,
          nama_sekolah: formData.nama_sekolah,
          npsn: formData.npsn,
          nama_kepala_sekolah: formData.nama_kepala_sekolah,
          nip_kepala_sekolah: formData.nip_kepala_sekolah
        }).eq('id', 1);
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase.from('pengaturan_aplikasi').insert({
          id: 1,
          url_logo: formData.url_logo,
          url_kop_surat: formData.url_kop_surat,
          nama_sekolah: formData.nama_sekolah,
          npsn: formData.npsn,
          nama_kepala_sekolah: formData.nama_kepala_sekolah,
          nip_kepala_sekolah: formData.nip_kepala_sekolah
        });
        if (insertError) throw insertError;
      }

      toast({ title: 'Pengaturan Aplikasi berhasil disimpan!' });
    } catch (error: any) {
      console.error('Error saving app settings:', error);
      toast({ title: 'Gagal menyimpan pengaturan', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.email !== 'kunbobo42@gmail.com') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
            <p className="text-slate-500">Halaman Pengaturan Aplikasi ini hanya dapat diakses oleh Super Admin.</p>
            <Link href="/">
              <Button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700">Kembali ke Beranda</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Pengaturan Aplikasi</h1>
            <p className="text-slate-500 text-sm">Kelola pengaturan global untuk sistem Smart SMK.</p>
          </div>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Logo & Kop Surat Sekolah</CardTitle>
                <CardDescription>Logo dan Kop Surat ini bersifat global dan akan digunakan pada seluruh dokumen cetak seperti modul ajar, ATP, jurnal, dll.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8 bg-white">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Nama Sekolah</Label>
                <Input name="nama_sekolah" placeholder="Contoh: SMK Negeri 1 Banjarmasin" value={formData.nama_sekolah} onChange={handleChange} className="bg-slate-50" />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">NPSN</Label>
                <Input name="npsn" placeholder="Contoh: 30304268" value={formData.npsn} onChange={handleChange} className="bg-slate-50" />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Nama Kepala Sekolah</Label>
                <Input name="nama_kepala_sekolah" placeholder="Contoh: Drs. H. Nama Kepala, M.Pd" value={formData.nama_kepala_sekolah} onChange={handleChange} className="bg-slate-50" />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">NIP Kepala Sekolah</Label>
                <Input name="nip_kepala_sekolah" placeholder="Contoh: 19700101 199512 1 001" value={formData.nip_kepala_sekolah} onChange={handleChange} className="bg-slate-50" />
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-700">Logo Sekolah</Label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-32 h-32 shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                  {formData.url_logo ? (
                    <img src={formData.url_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span className="text-[10px] text-slate-400 font-medium">Belum ada logo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <p className="text-xs text-slate-500">Gunakan logo berformat PNG transparan (disarankan). Maksimal ukuran file 2MB.</p>
                  <Input name="url_logo" placeholder="URL Logo atau Pilih file..." value={formData.url_logo} onChange={handleChange} className="bg-slate-50" />
                  <div className="relative inline-block">
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                    <Button type="button" variant="outline" className="gap-2" disabled={uploadingLogo}>
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Logo Dari Perangkat
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-700">Kop Surat (Header Dokumen)</Label>
              <div className="flex flex-col gap-4 items-start">
                <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                  {formData.url_kop_surat ? (
                    <img src={formData.url_kop_surat} alt="Kop Surat" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span className="text-xs text-slate-400 font-medium">Belum ada Kop Surat</span>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-3">
                  <p className="text-xs text-slate-500">Gunakan gambar persegi panjang yang memanjang (lanskap) yang berisi nama sekolah dan alamat.</p>
                  <Input name="url_kop_surat" placeholder="URL Kop Surat atau Pilih file..." value={formData.url_kop_surat} onChange={handleChange} className="bg-slate-50" />
                  <div className="relative inline-block">
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'kop_surat')} disabled={uploadingKop} />
                    <Button type="button" variant="outline" className="gap-2" disabled={uploadingKop}>
                      {uploadingKop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Kop Surat Dari Perangkat
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm px-8">
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Simpan Pengaturan
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
