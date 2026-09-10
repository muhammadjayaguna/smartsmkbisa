'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Trash2, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';

interface Pengumuman {
  id: string;
  kelas: string;
  judul: string;
  isi: string;
  mata_pelajaran: string;
  created_at: string;
}

export default function PengumumanKelasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel } = useSisminjar();
  
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [rombels, setRombels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    kelas: '',
    judul: '',
    isi: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uid = user.db_id || user.id;
      
      // Fetch Rombel for the dropdown
      const { data: rombelData } = await supabase
        .from('rombel')
        .select('nama_rombel')
        .order('nama_rombel');
      if (rombelData) setRombels(rombelData);

      // Fetch Pengumuman
      const { data, error } = await supabase
        .from('pengumuman_kelas')
        .select('*')
        .eq('guru_id', uid)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPengumuman(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      if (error.code === '42P01') {
         toast({
           title: 'Tabel Belum Dibuat',
           description: 'Harap jalankan script SQL setup_pengumuman_kelas.sql di Supabase Anda.',
           variant: 'destructive',
         });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.kelas || !formData.judul || !formData.isi) {
      toast({ title: 'Error', description: 'Semua kolom harus diisi', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const uid = user.db_id || user.id;
      const { error } = await supabase.from('pengumuman_kelas').insert({
        guru_id: uid,
        kelas: formData.kelas,
        judul: formData.judul,
        isi: formData.isi,
        mata_pelajaran: activeMapel?.mata_pelajaran || 'Umum'
      });
      
      if (error) throw error;
      
      toast({
        title: 'Berhasil',
        description: 'Pengumuman kelas berhasil dipublikasikan',
      });
      
      setFormData({ kelas: '', judul: '', isi: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Gagal Menyimpan',
        description: error.message || 'Terjadi kesalahan sistem',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    
    try {
      const { error } = await supabase.from('pengumuman_kelas').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: 'Terhapus', description: 'Pengumuman berhasil dihapus' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Gagal Menghapus', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
            <Megaphone className="w-6 h-6" />
          </div>
          Pengumuman Kelas
        </h1>
        <p className="text-slate-500 mt-2">Buat pengumuman yang akan langsung terlihat di dasbor siswa pada kelas yang dipilih.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-base">Buat Pengumuman Baru</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Pilih Kelas</label>
                  <Select value={formData.kelas} onValueChange={(val) => setFormData({ ...formData, kelas: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Kelas --" />
                    </SelectTrigger>
                    <SelectContent>
                      {rombels.map((rombel, i) => (
                        <SelectItem key={i} value={rombel.nama_rombel}>{rombel.nama_rombel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Judul Pengumuman</label>
                  <Input 
                    placeholder="Misal: Tugas Kelompok" 
                    value={formData.judul}
                    onChange={(e) => setFormData({...formData, judul: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Isi Pengumuman</label>
                  <Textarea 
                    placeholder="Tulis detail pengumuman di sini..." 
                    className="h-32"
                    value={formData.isi}
                    onChange={(e) => setFormData({...formData, isi: e.target.value})}
                  />
                </div>
                
                <Button type="submit" disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700">
                  {saving ? 'Menyimpan...' : 'Publikasikan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            Riwayat Pengumuman Anda
          </h3>
          
          {loading ? (
            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
          ) : pengumuman.length === 0 ? (
            <div className="bg-white border-dashed border-2 border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center">
              <Megaphone className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="text-slate-500 font-medium">Belum ada pengumuman</h4>
              <p className="text-xs text-slate-400 mt-1">Pengumuman yang Anda buat akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pengumuman.map((item) => (
                <Card key={item.id} className="border-0 shadow-sm overflow-hidden group">
                  <div className="h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
                  <CardContent className="p-5 relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mb-2">
                      <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">{item.kelas}</span>
                      <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-lg mb-1 pr-8">{item.judul}</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.isi}</p>
                    
                    {item.mata_pelajaran && item.mata_pelajaran !== 'Umum' && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          Mapel: <span className="font-medium text-slate-600">{item.mata_pelajaran}</span>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
