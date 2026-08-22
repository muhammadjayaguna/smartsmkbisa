'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Camera, CheckCircle2, Clock, Calendar, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';
import { getLocalDateString } from '@/lib/utils';

export default function KehadiranGuruPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [absensiToday, setAbsensiToday] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    status: 'hadir',
    keterangan: ''
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const checkTodayAbsensi = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      const today = getLocalDateString();
      const { data } = await supabase.from('absensi_guru')
        .select('*')
        .eq('guru_id', uid)
        .eq('tanggal', today)
        .eq('jenis_absensi', 'upacara')
        .maybeSingle();
      
      setAbsensiToday(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { checkTodayAbsensi(); }, [checkTodayAbsensi]);

  const isMonday = () => new Date().getDay() === 1;

  // Handle Foto
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast({ title: '❌ Ukuran maksimal 5MB', variant: 'destructive' });
      toast({ title: '⏳ Mengompres foto...' });
      const compressed = await compressImage(file);
      setSelectedFile(compressed);
      setPhotoUrl(URL.createObjectURL(compressed));
    }
  };

  // Submit Absensi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status === 'hadir' && !selectedFile) return toast({ title: '⚠️ Foto wajib untuk status hadir', variant: 'destructive' });
    
    setIsSubmitting(true);
    try {
      const uid = user?.db_id || user?.id;
      let finalPhotoUrl = null;

      if (selectedFile) {
        const fileName = `${uid}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('absensi-guru').upload(fileName, selectedFile, { contentType: selectedFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('absensi-guru').getPublicUrl(fileName);
        finalPhotoUrl = urlData.publicUrl;
      }
      
      const { error } = await supabase.from('absensi_guru').insert({
        guru_id: uid,
        tanggal: getLocalDateString(),
        jenis_absensi: 'upacara',
        status: formData.status,
        foto_url: finalPhotoUrl,
        keterangan: formData.keterangan || null,
        waktu_absen: new Date().toISOString()
      });

      if (error) throw error;
      
      toast({ title: '✅ Absensi berhasil disimpan!' });
      checkTodayAbsensi();
    } catch (error: any) {
      toast({ title: '❌ Gagal menyimpan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><CheckSquare className="w-5 h-5" /></div>
        <div><h2 className="font-bold text-lg text-slate-800">Kehadiran Guru (Absen)</h2><p className="text-xs text-slate-500">Rekam absensi apel/upacara harian Anda</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Hari Ini</p>
              <p className="font-bold text-slate-800 text-sm">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${isMonday() ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} shadow-sm`}>
          <CardContent className="p-4 flex items-center gap-3">
            {isMonday() ? <CheckCircle2 className="w-8 h-8 text-amber-500" /> : <Clock className="w-8 h-8 text-slate-400" />}
            <div>
              <p className={`text-xs font-bold uppercase ${isMonday() ? 'text-amber-600' : 'text-slate-500'}`}>Status Hari</p>
              <p className={`font-bold text-sm ${isMonday() ? 'text-amber-800' : 'text-slate-800'}`}>
                {isMonday() ? 'Wajib Apel / Upacara' : 'Bukan Hari Upacara'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200 shadow-sm md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase">Status Anda</p>
              <p className="font-bold text-emerald-800 text-sm">
                {absensiToday ? 'Sudah Absen' : 'Belum Absen'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {absensiToday ? (
        <Card className="border-emerald-200 shadow-md bg-white overflow-hidden">
          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-800">Anda sudah melakukan absensi hari ini</h3>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Status Kehadiran</label>
                  <p className="font-bold text-lg text-slate-800 capitalize">{absensiToday.status}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Waktu Absen</label>
                  <p className="font-medium text-slate-700">{new Date(absensiToday.waktu_absen).toLocaleTimeString('id-ID')} WIB</p>
                </div>
                {absensiToday.keterangan && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Keterangan</label>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{absensiToday.keterangan}</p>
                  </div>
                )}
              </div>
              {absensiToday.foto_url && (
                <div className="w-full md:w-64">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Foto Bukti</label>
                  <img src={absensiToday.foto_url} alt="Bukti Kehadiran" className="w-full h-48 object-cover rounded-xl border-2 border-slate-100 shadow-sm" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Pilih Status Kehadiran</label>
                <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hadir">Hadir (Upacara/Apel)</SelectItem>
                    <SelectItem value="izin">Izin</SelectItem>
                    <SelectItem value="sakit">Sakit</SelectItem>
                    <SelectItem value="alpha">Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Keterangan (Opsional)</label>
                <Textarea 
                  value={formData.keterangan} 
                  onChange={e => setFormData({...formData, keterangan: e.target.value})} 
                  placeholder="Isi alasan jika sakit/izin..." 
                  className="min-h-[80px]" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">
                  Foto Bukti Selfie {formData.status === 'hadir' && <span className="text-red-500">* (Wajib)</span>}
                </label>
                {!photoUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Camera className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-600">Ambil/Pilih Foto Selfie</span>
                    <span className="text-xs text-slate-400 mt-1">Maksimal ukuran 5MB</span>
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </label>
                ) : (
                  <div className="relative inline-block w-full md:w-auto">
                    <img src={photoUrl} alt="Preview" className="w-full md:w-64 h-48 object-cover rounded-xl border-2 border-emerald-100 shadow-sm" />
                    <Button type="button" variant="destructive" size="sm" onClick={() => {setPhotoUrl(null); setSelectedFile(null);}} className="absolute top-2 right-2 h-7 px-3 text-xs shadow">Ganti Foto</Button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (formData.status === 'hadir' && !selectedFile)} 
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-10"
                >
                  {isSubmitting ? (
                    <>Menyimpan... <Upload className="w-5 h-5 ml-2 animate-bounce" /></>
                  ) : (
                    <>Kirim Absensi <CheckSquare className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
