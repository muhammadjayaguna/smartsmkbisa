'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Trash2, PlusCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { Badge } from '@/components/ui/badge';

export default function MasterDataPoinPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterJenis, setFilterJenis] = useState('semua');

  // Form State
  const [form, setForm] = useState({
    jenis: 'negatif',
    kategori: '',
    nama_item: '',
    bobot_poin: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('master_poin')
        .select('*')
        .order('jenis', { ascending: false })
        .order('kategori', { ascending: true })
        .order('bobot_poin', { ascending: true });
        
      if (error) throw error;
      setData(result || []);
    } catch (err: any) {
      toast({ title: 'Gagal memuat data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jenis || !form.kategori || !form.nama_item || !form.bobot_poin) {
      toast({ title: 'Form Tidak Lengkap', description: 'Harap isi semua kolom.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('master_poin').insert({
        jenis: form.jenis,
        kategori: form.kategori,
        nama_item: form.nama_item,
        bobot_poin: Math.abs(parseInt(form.bobot_poin)) // Pastikan selalu positif simpannya
      });

      if (error) throw error;
      
      toast({ title: 'Berhasil', description: 'Item master poin berhasil ditambahkan.' });
      setForm({ ...form, nama_item: '', bobot_poin: '' }); // Reset partial
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus item ini? Data poin siswa yang sudah menggunakan item ini tidak akan terpengaruh.')) return;
    try {
      const { error } = await supabase.from('master_poin').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Item berhasil dihapus.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' });
    }
  };

  if (roleLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-600 h-8 w-8" /></div>;
  if (!isAdmin) return <div className="text-center mt-20 text-red-500 font-bold">Akses Ditolak. Halaman ini khusus Admin.</div>;

  const filteredData = filterJenis === 'semua' ? data : data.filter(d => d.jenis === filterJenis);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Master Data Poin" className="mb-2" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Tambah Kiri */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200/60 shadow-sm sticky top-24">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-amber-600" />
                Tambah Aturan Poin
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Jenis</label>
                  <Select value={form.jenis} onValueChange={(v) => setForm({...form, jenis: v, kategori: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positif">Prestasi (+)</SelectItem>
                      <SelectItem value="negatif">Pelanggaran (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Kategori</label>
                  <Input 
                    placeholder="Contoh: Kedisiplinan / Akademik" 
                    value={form.kategori}
                    onChange={(e) => setForm({...form, kategori: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-500">Ketik manual kategori untuk klasifikasi.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nama Item (Deskripsi Singkat)</label>
                  <Input 
                    placeholder="Contoh: Terlambat masuk sekolah" 
                    value={form.nama_item}
                    onChange={(e) => setForm({...form, nama_item: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Bobot Poin</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">
                      {form.jenis === 'positif' ? '+' : '-'}
                    </span>
                    <Input 
                      type="number" 
                      min="1"
                      className="pl-8"
                      placeholder="Angka bobot" 
                      value={form.bobot_poin}
                      onChange={(e) => setForm({...form, bobot_poin: e.target.value})}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold mt-2">
                  {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Simpan Aturan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Kanan */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Database className="h-5 w-5 text-amber-600" />
                  Katalog Master Poin
                </CardTitle>
                <CardDescription>Daftar aturan baku poin prestasi dan pelanggaran sekolah.</CardDescription>
              </div>
              <Select value={filterJenis} onValueChange={setFilterJenis}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Jenis</SelectItem>
                  <SelectItem value="positif">Prestasi (+)</SelectItem>
                  <SelectItem value="negatif">Pelanggaran (-)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-500 h-8 w-8" /></div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Data master kosong.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left bg-slate-50">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kategori</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Item Aturan</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Bobot</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-500 text-xs font-medium">{d.kategori}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{d.nama_item}</div>
                            <div className="text-[10px] mt-0.5 text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              {d.jenis === 'positif' ? <ThumbsUp className="w-3 h-3 text-emerald-500"/> : <ThumbsDown className="w-3 h-3 text-red-500"/>}
                              {d.jenis}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={d.jenis === 'positif' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none' : 'bg-red-100 text-red-700 hover:bg-red-200 border-none'}>
                              {d.jenis === 'positif' ? '+' : '-'}{d.bobot_poin}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(d.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
