'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, XCircle, Printer } from 'lucide-react';

export default function PengajuanAdmin() {
  const { toast } = useToast();
  const [pengajuans, setPengajuans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengajuan_magang')
        .select('*, siswa(nama, nisn), dudika(nama_perusahaan)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPengajuans(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, status: string) => {
    let catatan = '';
    if (status === 'Ditolak') {
      const reason = prompt('Masukkan alasan penolakan:');
      if (reason === null) return; // User cancelled
      catatan = reason;
    }

    try {
      const { error } = await supabase
        .from('pengajuan_magang')
        .update({ status, catatan })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: `Pengajuan berhasil di-${status.toLowerCase()}.` });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    }
  };

  const filteredData = pengajuans.filter(p => {
    const studentName = p.siswa?.nama?.toLowerCase() || '';
    const dudikaName = p.dudika?.nama_perusahaan?.toLowerCase() || '';
    const s = search.toLowerCase();
    return studentName.includes(s) || dudikaName.includes(s);
  });

  return (
    <Card className="border-slate-200/60 shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Daftar Pengajuan Magang</CardTitle>
          <p className="text-sm text-slate-500">Kelola persetujuan tempat magang siswa.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari siswa atau DUDIKA..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-teal-600 h-8 w-8" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold">Siswa</th>
                  <th className="px-6 py-4 font-bold">DUDIKA Tujuan</th>
                  <th className="px-6 py-4 font-bold">Tanggal</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{p.siswa?.nama || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{p.siswa?.nisn}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{p.dudika?.nama_perusahaan}</span>
                      {p.catatan && p.status === 'Menunggu' && (
                        <div className="text-xs text-slate-500 mt-1 italic">"{p.catatan}"</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        p.status === 'Disetujui' ? 'bg-green-50 text-green-700 border-green-200' :
                        p.status === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'Menunggu' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleAction(p.id, 'Disetujui')} className="bg-green-600 hover:bg-green-700 h-8 text-xs">
                            <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(p.id, 'Ditolak')} className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs">
                            <XCircle className="h-4 w-4 mr-1" /> Tolak
                          </Button>
                        </div>
                      ) : p.status === 'Disetujui' ? (
                        <Button size="sm" variant="outline" onClick={() => window.open(`/cetak/surat-pengajuan/${p.id}`, '_blank')} className="text-teal-600 border-teal-200 hover:bg-teal-50 h-8 text-xs">
                          <Printer className="h-4 w-4 mr-1" /> Cetak Surat
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Ditolak</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data pengajuan yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
