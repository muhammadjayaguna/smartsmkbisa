'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Search, BarChart3, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { useRouter } from 'next/navigation';

interface SiswaRekap {
  siswa_id: string;
  nama: string;
  nisn: string;
  rombel_nama: string;
  total_positif: number;
  total_negatif: number;
  saldo: number;
  level_sp: number;
}

export default function RekapPoinPage() {
  const router = useRouter();
  const [data, setData] = useState<SiswaRekap[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRombel, setFilterRombel] = useState('semua');
  const [rombelList, setRombelList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all poin_siswa with siswa data
        const { data: poinData } = await supabase
          .from('poin_siswa')
          .select('siswa_id, jenis, poin, siswa:siswa_id(nama, nisn, rombel:rombel_id(nama_rombel, id))');

        // Fetch rombel for filter
        const { data: rombels } = await supabase.from('rombel').select('id, nama_rombel').order('nama_rombel');
        setRombelList(rombels || []);

        if (!poinData) { setData([]); setLoading(false); return; }

        // Aggregate per siswa
        const map = new Map<string, SiswaRekap>();
        poinData.forEach((p: any) => {
          if (!p.siswa_id) return;
          if (!map.has(p.siswa_id)) {
            map.set(p.siswa_id, {
              siswa_id: p.siswa_id,
              nama: p.siswa?.nama || 'Unknown',
              nisn: p.siswa?.nisn || '-',
              rombel_nama: p.siswa?.rombel?.nama_rombel || '-',
              total_positif: 0,
              total_negatif: 0,
              saldo: 0,
              level_sp: 0,
            });
          }
          const entry = map.get(p.siswa_id)!;
          if (p.jenis === 'positif') {
            entry.total_positif += p.poin;
          } else {
            entry.total_negatif += p.poin;
          }
          entry.saldo = entry.total_positif - entry.total_negatif;
          if (entry.total_negatif >= 150) entry.level_sp = 3;
          else if (entry.total_negatif >= 100) entry.level_sp = 2;
          else if (entry.total_negatif >= 50) entry.level_sp = 1;
          else entry.level_sp = 0;
        });

        const result = Array.from(map.values());
        result.sort((a, b) => b.saldo - a.saldo);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = data.filter(d => {
    const matchSearch = !search.trim() || 
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      d.nisn.toLowerCase().includes(search.toLowerCase());
    const matchRombel = filterRombel === 'semua' || d.rombel_nama === filterRombel;
    return matchSearch && matchRombel;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageBreadcrumb currentPage="Rekap Per Siswa" className="mb-2" />

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Rekap Poin Per Siswa</CardTitle>
              <CardDescription>Rangkuman saldo poin seluruh siswa (Positif - Negatif).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama atau NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRombel} onValueChange={setFilterRombel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Rombel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Rombel</SelectItem>
                {rombelList.map(r => (
                  <SelectItem key={r.id} value={r.nama_rombel}>{r.nama_rombel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-500 h-8 w-8" /></div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada data poin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-10">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nama Siswa</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Rombel</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">
                      <span className="text-emerald-600">Positif (+)</span>
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">
                      <span className="text-red-600">Negatif (-)</span>
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Saldo</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((d, i) => (
                    <tr key={d.siswa_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {d.nama}
                          {d.level_sp > 0 && (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0">
                              SP {d.level_sp}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{d.nisn}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.rombel_nama}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-emerald-600 flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" /> +{d.total_positif}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-red-600 flex items-center justify-center gap-1">
                          <TrendingDown className="h-3 w-3" /> -{d.total_negatif}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black text-lg ${d.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {d.saldo >= 0 ? '+' : ''}{d.saldo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => router.push(`/sipoin/profil/${d.siswa_id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Detail
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
  );
}
