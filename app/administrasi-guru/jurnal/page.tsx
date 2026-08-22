'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Camera, MapPin, Save, Plus, FileText, CheckCircle2, Edit, Trash2, PieChart, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';
import { getLocalDateString } from '@/lib/utils';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import JurnalMengajarReport from '@/components/reports/JurnalMengajarReport';

export default function JurnalMengajarSintesaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [loading, setLoading] = useState(true);
  const [jurnalList, setJurnalList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    mata_pelajaran: activeMapel?.mata_pelajaran || '',
    kelas: '',
    jam_mapel: '',
    materi: '',
    siswa_izin: '',
    siswa_sakit: '',
    siswa_alfa: ''
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const uid = user.db_id || user.id;
      let query = supabase.from('jurnal_mengajar')
        .select('*')
        .eq('guru_id', uid)
        .order('created_at', { ascending: false });
        
      if (activeMapel) {
        query = query.eq('mata_pelajaran', activeMapel.mata_pelajaran);
      }
      
      const { data } = await query;
      
      if (data) setJurnalList(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user, activeMapel]);

  useEffect(() => {
    if (activeMapel) {
      setFormData(prev => ({ ...prev, mata_pelajaran: activeMapel.mata_pelajaran }));
    }
  }, [activeMapel]);

  useEffect(() => { 
    if (!contextLoading) {
      fetchData(); 
    }
  }, [fetchData, contextLoading]);



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

  // Submit Jurnal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const uid = user?.db_id || user?.id;
      let finalPhotoUrl = photoUrl;

      // Upload if there's a new file
      if (selectedFile) {
        const fileName = `${uid}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('jurnal-mengajar').upload(fileName, selectedFile, { contentType: selectedFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('jurnal-mengajar').getPublicUrl(fileName);
        finalPhotoUrl = urlData.publicUrl;
      }

      // Format absen
      const parseAbsen = (str: string) => str ? str.split(',').map(s => s.trim()).filter(s => s) : null;
      
      const payload = {
        mata_pelajaran: formData.mata_pelajaran,
        kelas: formData.kelas,
        jam_mapel: formData.jam_mapel,
        materi: formData.materi,
        siswa_izin: parseAbsen(formData.siswa_izin),
        siswa_sakit: parseAbsen(formData.siswa_sakit),
        siswa_alfa: parseAbsen(formData.siswa_alfa),
        foto_kegiatan_url: finalPhotoUrl,
      };

      if (editId) {
        const { error } = await supabase.from('jurnal_mengajar').update(payload).eq('id', editId);
        if (error) throw error;
        toast({ title: '✅ Jurnal berhasil diperbarui!' });
      } else {
        const insertPayload = {
            ...payload,
            guru_id: uid,
            nama_guru: user?.nama || 'Guru',
            tanggal: getLocalDateString()
        };
        const { error } = await supabase.from('jurnal_mengajar').insert(insertPayload);
        if (error) throw error;
        toast({ title: '✅ Jurnal berhasil disimpan!' });
      }
      
      setShowForm(false);
      setEditId(null);
      setFormData({ mata_pelajaran: activeMapel?.mata_pelajaran || '', kelas: '', jam_mapel: '', materi: '', siswa_izin: '', siswa_sakit: '', siswa_alfa: '' });
      setSelectedFile(null);
      setPhotoUrl(null);
      fetchData();
    } catch (error: any) {
      toast({ title: '❌ Gagal menyimpan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (jurnal: any) => {
    setEditId(jurnal.id);
    setFormData({
      mata_pelajaran: jurnal.mata_pelajaran,
      kelas: jurnal.kelas,
      jam_mapel: jurnal.jam_mapel,
      materi: jurnal.materi,
      siswa_izin: Array.isArray(jurnal.siswa_izin) ? jurnal.siswa_izin.join(', ') : String(jurnal.siswa_izin || '').replace(/[{}]/g, ''),
      siswa_sakit: Array.isArray(jurnal.siswa_sakit) ? jurnal.siswa_sakit.join(', ') : String(jurnal.siswa_sakit || '').replace(/[{}]/g, ''),
      siswa_alfa: Array.isArray(jurnal.siswa_alfa) ? jurnal.siswa_alfa.join(', ') : String(jurnal.siswa_alfa || '').replace(/[{}]/g, '')
    });
    setPhotoUrl(jurnal.foto_kegiatan_url || null);
    setSelectedFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) return;
    try {
      const { error } = await supabase.from('jurnal_mengajar').delete().eq('id', id);
      if (error) throw error;
      toast({ title: '✅ Jurnal berhasil dihapus!' });
      fetchData();
    } catch (err: any) {
      toast({ title: '❌ Gagal menghapus jurnal', description: err.message, variant: 'destructive' });
    }
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <Tabs defaultValue="jurnal" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 no-print">
          <TabsList className="bg-white shadow-sm border border-slate-200">
            <TabsTrigger value="jurnal" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <Book className="w-4 h-4 mr-2" />
              Jurnal Harian
            </TabsTrigger>
            <TabsTrigger value="laporan" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <PieChart className="w-4 h-4 mr-2" />
              Laporan & Rekap
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="jurnal" className="space-y-6 mt-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
            <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Book className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Jurnal Mengajar & Absensi Kelas</h2><p className="text-xs text-slate-500">Rekap kehadiran siswa dan materi per pertemuan</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300 no-print">
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Buat Jurnal Baru
            </Button>
          ) : (
            <Button onClick={() => { setShowForm(false); setEditId(null); setFormData({ mata_pelajaran: activeMapel?.mata_pelajaran || '', kelas: '', jam_mapel: '', materi: '', siswa_izin: '', siswa_sakit: '', siswa_alfa: '' }); setPhotoUrl(null); }} variant="outline">Batal</Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="border-indigo-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Mata Pelajaran</label>
                  <Input required value={formData.mata_pelajaran} onChange={e => setFormData({...formData, mata_pelajaran: e.target.value})} placeholder="Contoh: Pemrograman Web" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Kelas</label>
                  <Input required value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} placeholder="Contoh: XI TJKT 1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Jam Mapel</label>
                  <Input required value={formData.jam_mapel} onChange={e => setFormData({...formData, jam_mapel: e.target.value})} placeholder="Contoh: 1-4" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Materi yang Diajarkan</label>
                <Textarea required value={formData.materi} onChange={e => setFormData({...formData, materi: e.target.value})} placeholder="Tuliskan ringkasan materi hari ini..." className="min-h-[80px]" />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Absensi Siswa (Tulis Nama, pisahkan dengan koma)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-amber-600 mb-1 block">Siswa Izin</label>
                    <Textarea value={formData.siswa_izin} onChange={e => setFormData({...formData, siswa_izin: e.target.value})} placeholder="Budi, Siti..." className="h-10 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-600 mb-1 block">Siswa Sakit</label>
                    <Textarea value={formData.siswa_sakit} onChange={e => setFormData({...formData, siswa_sakit: e.target.value})} placeholder="Andi..." className="h-10 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-red-600 mb-1 block">Siswa Alfa</label>
                    <Textarea value={formData.siswa_alfa} onChange={e => setFormData({...formData, siswa_alfa: e.target.value})} placeholder="Doni..." className="h-10 bg-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><label className="text-sm font-bold text-slate-700">Bukti Foto Kelas</label></div>
                  {!photoUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <Camera className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">Ambil/Pilih Foto</span>
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={photoUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                      <Button type="button" variant="destructive" size="sm" onClick={() => {setPhotoUrl(null); setSelectedFile(null);}} className="absolute top-2 right-2 h-7 px-2 text-xs">Hapus</Button>
                    </div>
                  )}
                </div>


              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base font-bold">
                  {isSubmitting ? 'Menyimpan...' : 'Kirim Jurnal Mengajar'} <Save className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Jurnal List */}
      <div className="space-y-4">
        {jurnalList.length === 0 && !showForm ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada jurnal mengajar.<br/>Klik tombol "Buat Jurnal Baru" untuk mencatat KBM hari ini.</p>
          </div>
        ) : (
          jurnalList.map((jurnal) => (
            <Card key={jurnal.id} className="overflow-hidden border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-2 md:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-800">{jurnal.mata_pelajaran}</span>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">Kls {jurnal.kelas}</span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">Jam {jurnal.jam_mapel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{jurnal.tanggal}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 bg-white" onClick={() => handleEdit(jurnal)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 bg-white" onClick={() => handleDelete(jurnal.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-5 flex-1 border-r border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materi Pembelajaran</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{jurnal.materi}</p>
                    
                    {/* Absensi Tags */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                      {jurnal.siswa_izin && jurnal.siswa_izin.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          <span className="font-bold">Izin:</span> <span>{Array.isArray(jurnal.siswa_izin) ? jurnal.siswa_izin.join(', ') : String(jurnal.siswa_izin).replace(/[{}]/g, '')}</span>
                        </div>
                      )}
                      {jurnal.siswa_sakit && jurnal.siswa_sakit.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          <span className="font-bold">Sakit:</span> <span>{Array.isArray(jurnal.siswa_sakit) ? jurnal.siswa_sakit.join(', ') : String(jurnal.siswa_sakit).replace(/[{}]/g, '')}</span>
                        </div>
                      )}
                      {jurnal.siswa_alfa && jurnal.siswa_alfa.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                          <span className="font-bold">Alfa:</span> <span>{Array.isArray(jurnal.siswa_alfa) ? jurnal.siswa_alfa.join(', ') : String(jurnal.siswa_alfa).replace(/[{}]/g, '')}</span>
                        </div>
                      )}
                      {(!jurnal.siswa_izin && !jurnal.siswa_sakit && !jurnal.siswa_alfa) && (
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Semua Hadir (Nihil)</span>
                      )}
                    </div>
                  </div>
                  
                  {jurnal.foto_kegiatan_url && (
                    <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100">
                      <img src={jurnal.foto_kegiatan_url} alt="Foto KBM" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        </TabsContent>
        <TabsContent value="laporan" className="mt-0">
          <JurnalMengajarReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
