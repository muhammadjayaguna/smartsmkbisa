'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { Loader2, User, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Award, ArrowLeft, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import Link from 'next/link';

export default function ProfilPoinSiswa() {
  const { id } = useParams();
  const [siswa, setSiswa] = useState<any>(null);
  const [poinList, setPoinList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Fetch siswa info
        const { data: siswaData } = await supabase
          .from('siswa')
          .select('id, nama, nisn, rombel:rombel_id(nama_rombel)')
          .eq('id', id)
          .single();
        setSiswa(siswaData);

        // Fetch all poin for this siswa
        const { data: poinData } = await supabase
          .from('poin_siswa')
          .select('*')
          .eq('siswa_id', id)
          .order('tanggal', { ascending: false })
          .order('created_at', { ascending: false });
        setPoinList(poinData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-600 h-8 w-8" /></div>;
  if (!siswa) return <div className="text-center mt-20 text-red-500 font-bold">Siswa tidak ditemukan.</div>;

  const totalPositif = poinList.filter(p => p.jenis === 'positif').reduce((acc, p) => acc + p.poin, 0);
  const totalNegatif = poinList.filter(p => p.jenis === 'negatif').reduce((acc, p) => acc + p.poin, 0);
  const saldo = totalPositif - totalNegatif;

  // Hitung per kategori
  const kategoriMap = new Map<string, { jenis: string; total: number }>();
  poinList.forEach(p => {
    if (!kategoriMap.has(p.kategori)) {
      kategoriMap.set(p.kategori, { jenis: p.jenis, total: 0 });
    }
    kategoriMap.get(p.kategori)!.total += p.poin;
  });

  // Hitung Level SP
  let levelSP = 0;
  if (totalNegatif >= 150) levelSP = 3;
  else if (totalNegatif >= 100) levelSP = 2;
  else if (totalNegatif >= 50) levelSP = 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <PageBreadcrumb currentPage={`Profil Poin — ${siswa.nama}`} className="mb-2" />

      <Link href="/sipoin/rekap">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-800 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Rekap
        </Button>
      </Link>

      {/* Alert SP */}
      {levelSP > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-red-700">Telah Mencapai Batas SP {levelSP}</h3>
            <p className="text-sm text-red-600 mt-1">Siswa ini memiliki Total Poin Negatif sebanyak {totalNegatif}. Harap segera cetak Surat Peringatan.</p>
          </div>
          <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
            <Link href={`/cetak/sp/${id}?level=${levelSP}`}>
              <Button className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold">
                <Printer className="w-4 h-4 mr-2" /> Cetak SP {levelSP}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header Profil */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-800">{siswa.nama}</h2>
              <p className="text-slate-500">{siswa.nisn} — {siswa.rombel?.nama_rombel || 'Tanpa Rombel'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Saldo Poin</p>
              <p className={`text-4xl font-black ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {saldo >= 0 ? '+' : ''}{saldo}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-emerald-600">+{totalPositif}</p>
              <p className="text-xs text-emerald-700 font-medium">Total Positif</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-red-600">-{totalNegatif}</p>
              <p className="text-xs text-red-700 font-medium">Total Negatif</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-amber-600">{poinList.length}</p>
              <p className="text-xs text-amber-700 font-medium">Total Catatan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per Kategori */}
      {kategoriMap.size > 0 && (
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rincian Per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from(kategoriMap.entries()).map(([kat, val]) => (
                <div key={kat} className={`p-3 rounded-lg border text-sm ${
                  val.jenis === 'positif' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                }`}>
                  <p className="font-bold text-slate-700 text-xs">{kat}</p>
                  <p className={`text-lg font-black ${val.jenis === 'positif' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {val.jenis === 'positif' ? '+' : '-'}{val.total}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Riwayat */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Timeline Riwayat Poin</CardTitle>
          <CardDescription>Seluruh catatan poin dari yang terbaru.</CardDescription>
        </CardHeader>
        <CardContent>
          {poinList.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Belum ada catatan poin.</p>
          ) : (
            <div className="space-y-4">
              {poinList.map((p, i) => (
                <div key={p.id} className="flex items-start gap-4 relative">
                  {/* Timeline line */}
                  {i < poinList.length - 1 && (
                    <div className="absolute left-[19px] top-10 w-0.5 h-full bg-slate-100" />
                  )}
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    p.jenis === 'positif' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {p.jenis === 'positif' ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={p.jenis === 'positif' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}>
                        {p.jenis === 'positif' ? '+' : '-'}{p.poin} — {p.kategori}
                      </Badge>
                      <span className="text-xs text-slate-400">{new Date(p.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-sm text-slate-700">{p.keterangan}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
