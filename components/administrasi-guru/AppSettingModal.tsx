'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Save, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useSisminjar } from './SisminjarContext';

interface AppSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppSettingModal({ isOpen, onClose }: AppSettingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { appSettings, refreshData } = useSisminjar();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingKop, setUploadingKop] = useState(false);
  const [formData, setFormData] = useState({
    url_logo: '',
    url_kop_surat: ''
  });

  useEffect(() => {
    if (isOpen && appSettings) {
      setFormData({
        url_logo: appSettings.url_logo || '',
        url_kop_surat: appSettings.url_kop_surat || ''
      });
    }
  }, [isOpen, appSettings]);

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
      
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'url_logo' : 'url_kop_surat']: data.publicUrl
      }));

      toast({ title: 'Gambar berhasil diunggah' });
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
          url_kop_surat: formData.url_kop_surat
        }).eq('id', 1);
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase.from('pengaturan_aplikasi').insert({
          id: 1,
          url_logo: formData.url_logo,
          url_kop_surat: formData.url_kop_surat
        });
        if (insertError) throw insertError;
      }

      toast({ title: 'Pengaturan Aplikasi berhasil disimpan!' });
      await refreshData(); // Refresh context
      onClose();
    } catch (error: any) {
      console.error('Error saving app settings:', error);
      toast({ title: 'Gagal menyimpan pengaturan', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Settings className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">Pengaturan Aplikasi</DialogTitle>
          </div>
          <p className="text-sm text-slate-500 mt-1">Logo dan Kop Surat ini bersifat global dan akan digunakan pada seluruh dokumen cetak.</p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">Logo Sekolah</Label>
            <div className="flex gap-3">
              <div className="w-24 h-24 shrink-0 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                {formData.url_logo ? (
                  <img src={formData.url_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input name="url_logo" placeholder="URL Logo atau Pilih file..." value={formData.url_logo} onChange={handleChange} className="bg-white" />
                <div className="relative inline-block">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploadingLogo}>
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Logo Baru
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">Kop Surat (Header Dokumen)</Label>
            <div className="flex flex-col gap-3">
              <div className="w-full h-24 shrink-0 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                {formData.url_kop_surat ? (
                  <img src={formData.url_kop_surat} alt="Kop Surat" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xs font-medium text-slate-400">Belum ada Kop Surat</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input name="url_kop_surat" placeholder="URL Kop Surat atau Pilih file..." value={formData.url_kop_surat} onChange={handleChange} className="bg-white" />
                <div className="relative inline-block">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'kop_surat')} disabled={uploadingKop} />
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploadingKop}>
                    {uploadingKop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Kop Surat Baru
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Pengaturan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
