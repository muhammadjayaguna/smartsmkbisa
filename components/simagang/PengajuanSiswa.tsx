'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, CheckCircle, Clock, XCircle, Building } from 'lucide-react';

export default function PengajuanSiswa() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dudikas, setDudikas] = useState<any[]>([]);
  const [pengajuan, setPengajuan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedDudika, setSelectedDudika] = useState('');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const siswaId = user.db_id || user.id;

      // Ambil daftar dudika
      const { data: dData, error: dError } = await supabase.from('dudika').select('*').order('nama_perusahaan');
      if (!dError && dData) setDudikas(dData);

      // Ambil pengajuan terakhir (jika ada)
      const { data: pData, error: pError } = await supabase
        .from('pengajuan_magang')
        .select('*, dudika(nama_perusahaan, alamat)')
        .eq('siswa_id', siswaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!pError && pData) {
        setPengajuan(pData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedDudika) {
      toast({ title: 'Gagal', description: 'Silakan pilih DUDIKA tujuan.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const siswaId = user?.db_id || user?.id;
      const { error } = await supabase.from('pengajuan_magang').insert({
        siswa_id: siswaId,
        dudika_id: selectedDudika,
        catatan: catatan
      });

      if (error) throw error;
      
      toast({ title: 'Berhasil', description: 'Pengajuan magang berhasil dikirim.' });
      setSelectedDudika('');
      setCatatan('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message || 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatal = async (id: string) => {
    try {
      const { error } = await supabase.from('pengajuan_magang').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Pengajuan dibatalkan.' });
      setPengajuan(null);
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message || 'Gagal membatalkan', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-teal-600 h-8 w-8" /></div>;
  }

  const isDitolak = pengajuan?.status === 'Ditolak';
  const hasActivePengajuan = pengajuan && !isDitolak;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Kolom Form / Informasi Status */}
      <div className="space-y-6">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-teal-600" />
              Status Pengajuan Magang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasActivePengajuan ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  pengajuan.status === 'Disetujui' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {pengajuan.status === 'Disetujui' ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                    ) : (
                      <Clock className="h-6 w-6 text-amber-600 mt-1" />
                    )}
                    <div>
                      <h4 className={`font-bold ${pengajuan.status === 'Disetujui' ? 'text-green-800' : 'text-amber-800'}`}>
                        Status: {pengajuan.status}
                      </h4>
                      <p className="text-sm mt-1 text-slate-700">
                        DUDIKA Tujuan: <strong>{pengajuan.dudika?.nama_perusahaan}</strong>
                      </p>
                      <p className="text-xs mt-1 text-slate-500">
                        {pengajuan.dudika?.alamat}
                      </p>
                      {pengajuan.catatan && (
                        <div className="mt-3 text-xs bg-white/60 p-2 rounded text-slate-600 italic">
                          "{pengajuan.catatan}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {pengajuan.status === 'Menunggu' && (
                  <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleBatal(pengajuan.id)}>
                    Batalkan Pengajuan
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {isDitolak && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-800">Pengajuan Sebelumnya Ditolak</h4>
                      <p className="text-xs text-red-600 mt-1">Anda dapat mengajukan lokasi magang baru.</p>
                      {pengajuan.catatan && <p className="text-xs italic text-red-500 mt-1">Alasan: {pengajuan.catatan}</p>}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pilih Mitra DUDIKA</label>
                  <Select value={selectedDudika} onValueChange={setSelectedDudika}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih perusahaan/industri..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dudikas.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nama_perusahaan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Catatan Pengajuan (Opsional)</label>
                  <Textarea 
                    placeholder="Tuliskan minat atau alasan mengapa memilih tempat ini..." 
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !selectedDudika}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Ajukan Tempat Magang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Kolom Info DUDIKA */}
      <div className="space-y-6">
        <Card className="border-slate-200/60 shadow-sm bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Informasi DUDIKA Tersedia</CardTitle>
            <CardDescription>Cari tau lokasi dan detail industri mitra sebelum mengajukan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto pr-2 space-y-3">
            {dudikas.map(d => (
              <div key={d.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-1">
                <span className="font-bold text-sm text-slate-800">{d.nama_perusahaan}</span>
                <span className="text-xs text-slate-500 flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  {d.alamat}
                </span>
                {d.jurusan && <span className="text-[10px] font-medium bg-blue-50 text-blue-600 self-start px-2 py-0.5 rounded-full mt-1">{d.jurusan}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
