'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Award, Info } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { Badge } from '@/components/ui/badge';

export default function CatatPoinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [masterPoin, setMasterPoin] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    siswa_id: '',
    jenis: '',
    master_id: '', // ID dari master_poin yang dipilih
    catatan_tambahan: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  const selectedSiswa = siswaList.find(s => s.id === form.siswa_id);
  const selectedMaster = masterPoin.find(m => m.id === form.master_id);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Siswa
        const { data: siswaData } = await supabase
          .from('siswa')
          .select('id, nama, nisn, rombel_id, rombel:rombel_id(nama_rombel)')
          .order('nama');
        
        setSiswaList(siswaData || []);
        setFilteredSiswa(siswaData || []);

        // Fetch Master Poin
        const { data: masterData } = await supabase
          .from('master_poin')
          .select('*')
          .order('kategori', { ascending: true })
          .order('bobot_poin', { ascending: true });
          
        setMasterPoin(masterData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSiswa(siswaList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredSiswa(siswaList.filter(s =>
        s.nama?.toLowerCase().includes(q) ||
        s.nisn?.toLowerCase().includes(q) ||
        s.rombel?.nama_rombel?.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, siswaList]);

  // Saat jenis berubah, reset master_id yang dipilih
  useEffect(() => {
    setForm(prev => ({ ...prev, master_id: '' }));
  }, [form.jenis]);

  const handleSubmit = async () => {
    if (!form.siswa_id || !form.jenis || !form.master_id) {
      toast({ title: 'Lengkapi Form', description: 'Pastikan Siswa, Jenis, dan Aturan Poin telah dipilih.', variant: 'destructive' });
      return;
    }

    if (!selectedMaster) return;

    setSubmitting(true);
    try {
      // Susun keterangan: Nama Item dari Master + Catatan Tambahan (jika ada)
      const keteranganFinal = form.catatan_tambahan.trim() 
        ? `${selectedMaster.nama_item} - (${form.catatan_tambahan})` 
        : selectedMaster.nama_item;

      const { error } = await supabase.from('poin_siswa').insert({
        siswa_id: form.siswa_id,
        jenis: form.jenis,
        kategori: selectedMaster.kategori,
        poin: selectedMaster.bobot_poin, // Pastikan ini angka positif, karena logic +/- ditangani berdasarkan 'jenis' di query/UI lain.
        keterangan: keteranganFinal,
        tanggal: form.tanggal,
        dicatat_oleh: user?.id,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil!',
        description: `Catatan poin berhasil ditambahkan untuk ${selectedSiswa?.nama}.`,
      });

      // Reset form
      setForm({ siswa_id: '', jenis: '', master_id: '', catatan_tambahan: '', tanggal: new Date().toISOString().split('T')[0] });
      setSearchQuery('');
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaster = masterPoin.filter(m => m.jenis === form.jenis);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-600 h-8 w-8" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Catat Poin Baru" className="mb-2" />

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Catat Poin Berdasarkan Master</CardTitle>
              <CardDescription>Pilih aturan dari Master Data untuk memberikan poin baku secara adil.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. Pilih Siswa */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">1. Pilih Siswa</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama atau NISN siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedSiswa && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-800">{selectedSiswa.nama}</span>
                  <span className="text-amber-600 ml-2">({selectedSiswa.nisn})</span>
                  {selectedSiswa.rombel && <span className="text-amber-500 ml-2">— {selectedSiswa.rombel.nama_rombel}</span>}
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-700" onClick={() => setForm({...form, siswa_id: ''})}>Ganti</Button>
              </div>
            )}
            {!selectedSiswa && (
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredSiswa.slice(0, 10).map(s => (
                  <div 
                    key={s.id} 
                    className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center group"
                    onClick={() => setForm({...form, siswa_id: s.id})}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{s.nama}</div>
                      <div className="text-xs text-slate-500">{s.nisn} {s.rombel ? `— ${s.rombel.nama_rombel}` : ''}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 text-xs">Pilih</Button>
                  </div>
                ))}
                {filteredSiswa.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">Siswa tidak ditemukan.</div>}
              </div>
            )}
          </div>

          <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">2. Tanggal Kejadian</label>
              <Input 
                type="date" 
                value={form.tanggal} 
                onChange={(e) => setForm({...form, tanggal: e.target.value})} 
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">3. Jenis Poin</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${form.jenis === 'positif' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                  <input type="radio" name="jenis" value="positif" className="sr-only" onChange={(e) => setForm({...form, jenis: e.target.value})} checked={form.jenis === 'positif'} />
                  <span className="text-xl font-bold mb-1">+</span>
                  <span className="font-medium text-sm">Prestasi</span>
                </label>
                <label className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${form.jenis === 'negatif' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                  <input type="radio" name="jenis" value="negatif" className="sr-only" onChange={(e) => setForm({...form, jenis: e.target.value})} checked={form.jenis === 'negatif'} />
                  <span className="text-xl font-bold mb-1">-</span>
                  <span className="font-medium text-sm">Pelanggaran</span>
                </label>
              </div>
            </div>
          </div>

          {form.jenis && (
            <div className="border-t pt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">4. Pilih Aturan dari Master Data</label>
                <Select value={form.master_id} onValueChange={(v) => setForm({...form, master_id: v})}>
                  <SelectTrigger className="h-auto py-3">
                    <SelectValue placeholder="Pilih Pelanggaran / Prestasi..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMaster.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500 text-center">Data master belum diatur oleh Admin.</div>
                    ) : (
                      filteredMaster.map(m => (
                        <SelectItem key={m.id} value={m.id} className="py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-slate-800">{m.nama_item}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] bg-slate-50">{m.kategori}</Badge>
                              <span className={`text-xs font-bold ${m.jenis === 'positif' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {m.jenis === 'positif' ? '+' : '-'}{m.bobot_poin} Poin
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedMaster && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                  <Info className="w-5 h-5 shrink-0 text-blue-600" />
                  <div>
                    Siswa ini akan mendapatkan <strong className={selectedMaster.jenis === 'positif' ? 'text-emerald-600' : 'text-red-600'}>{selectedMaster.jenis === 'positif' ? '+' : '-'}{selectedMaster.bobot_poin} poin</strong>. Poin dan Kategori ({selectedMaster.kategori}) ini dikunci berdasarkan aturan baku sekolah.
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">5. Catatan Tambahan (Opsional)</label>
                <Textarea 
                  placeholder="Tambahkan detail spesifik jika diperlukan..." 
                  value={form.catatan_tambahan}
                  onChange={(e) => setForm({...form, catatan_tambahan: e.target.value})}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !form.siswa_id || !form.jenis || !form.master_id}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full md:w-auto px-8"
                >
                  {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Simpan Catatan Poin
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
