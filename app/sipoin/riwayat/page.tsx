'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, ThumbsUp, ThumbsDown, Trash2, History } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { useToast } from '@/hooks/use-toast';

export default function RiwayatPoinPage() {
  const { isAdmin, isSiswa, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [filterKategori, setFilterKategori] = useState('semua');

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('poin_siswa')
        .select('*, siswa:siswa_id(nama, nisn, rombel:rombel_id(nama_rombel))')
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

      if (filterJenis !== 'semua') {
        query = query.eq('jenis', filterJenis);
      }
      if (filterKategori !== 'semua') {
        query = query.eq('kategori', filterKategori);
      }

      // Siswa hanya lihat poin sendiri
      if (isSiswa && user) {
        // Perlu cari siswa_id yang terhubung ke user ini
        const { data: siswaData } = await supabase
          .from('siswa')
          .select('id')
          .eq('nisn', user.user_metadata?.nisn)
          .maybeSingle();
        if (siswaData) {
          query = query.eq('siswa_id', siswaData.id);
        }
      }

      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading) fetchData();
  }, [roleLoading, filterJenis, filterKategori]);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan poin ini?')) return;
    try {
      const { error } = await supabase.from('poin_siswa').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Catatan poin berhasil dihapus.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  const filteredData = data.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.siswa?.nama?.toLowerCase().includes(q) ||
      p.siswa?.nisn?.toLowerCase().includes(q) ||
      p.keterangan?.toLowerCase().includes(q) ||
      p.kategori?.toLowerCase().includes(q)
    );
  });

  const allKategori = [...new Set(data.map(d => d.kategori))];

  if (roleLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-600 h-8 w-8" /></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Riwayat Poin" className="mb-2" />

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Riwayat Pencatatan Poin</CardTitle>
              <CardDescription>Seluruh catatan poin prestasi dan pelanggaran siswa.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NISN, atau keterangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterJenis} onValueChange={setFilterJenis}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Jenis</SelectItem>
                <SelectItem value="positif">Positif (+)</SelectItem>
                <SelectItem value="negatif">Negatif (-)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kategori</SelectItem>
                {allKategori.map(k => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-500 h-8 w-8" /></div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada data poin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Siswa</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Jenis</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Poin</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Keterangan</th>
                    {isAdmin && <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(p.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{p.siswa?.nama || 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{p.siswa?.nisn} {p.siswa?.rombel ? `— ${p.siswa.rombel.nama_rombel}` : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {p.jenis === 'positif' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                            <ThumbsUp className="h-3 w-3" /> Positif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                            <ThumbsDown className="h-3 w-3" /> Negatif
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{p.kategori}</td>
                      <td className="px-4 py-3">
                        <span className={`font-black text-lg ${p.jenis === 'positif' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {p.jenis === 'positif' ? '+' : '-'}{p.poin}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate" title={p.keterangan}>{p.keterangan}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
