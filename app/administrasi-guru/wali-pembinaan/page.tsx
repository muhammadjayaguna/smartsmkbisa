'use client';

import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, AlertTriangle, ShieldCheck, Clock, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useWali } from '@/components/administrasi-guru/WaliContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getLocalDateString } from '@/lib/utils';

export default function WaliPembinaanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeRombelId, activeRombel, loadingWali } = useWali();
  const [kasus, setKasus] = useState<any[]>([]);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    siswa_id: '',
    tanggal: getLocalDateString(),
    jenis: '',
    deskripsi: '',
    status: 'Proses',
    poin: 0
  });

  const fetchData = async () => {
    if (!activeRombelId || !user?.db_id) {
      setKasus([]);
      setSiswaList([]);
      return;
    }
    setLoading(true);
    try {
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('id, nama')
        .eq('rombel_id', activeRombelId)
        .order('nama');
      
      if (siswaData) setSiswaList(siswaData);

      const { data: kasusData, error } = await supabase
        .from('wali_pembinaan')
        .select(`*, siswa!inner (id, nama, rombel_id)`)
        .eq('guru_id', user.db_id)
        .eq('siswa.rombel_id', activeRombelId)
        .order('tanggal', { ascending: false });
      
      if (kasusData) setKasus(kasusData);
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeRombelId, user]);

  const handleSubmit = async () => {
    if (!formData.siswa_id || !formData.tanggal || !formData.jenis || !formData.deskripsi) {
      return toast({ title: 'Mohon lengkapi data', variant: 'destructive' });
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('wali_pembinaan').insert({
        guru_id: user?.db_id,
        siswa_id: formData.siswa_id,
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        deskripsi: formData.deskripsi,
        status: formData.status,
        poin: formData.poin
      });

      if (error) throw error;
      toast({ title: 'Berhasil mencatat kasus' });
      setOpen(false);
      setFormData({ siswa_id: '', tanggal: getLocalDateString(), jenis: '', deskripsi: '', status: 'Proses', poin: 0 });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal mencatat kasus', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalPoin = kasus.reduce((acc, curr) => acc + (curr.poin || 0), 0);
  const totalProses = kasus.filter(k => k.status !== 'Selesai').length;
  const totalSelesai = kasus.filter(k => k.status === 'Selesai').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Pembinaan & Jurnal Kasus {activeRombel ? `- ${activeRombel.nama_rombel}` : ''}</h2>
            <p className="text-xs text-slate-500">Catat pelanggaran, konseling, dan riwayat pembinaan siswa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50" disabled={!activeRombelId}>
                <Plus className="w-4 h-4 mr-2" /> Catat Kasus Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Catat Kasus / Pembinaan</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Siswa</label>
                  <Select value={formData.siswa_id} onValueChange={(val) => setFormData({...formData, siswa_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Siswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {siswaList.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input type="date" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Poin Pelanggaran</label>
                    <Input type="number" min="0" value={formData.poin} onChange={(e) => setFormData({...formData, poin: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jenis</label>
                    <Input placeholder="Misal: Terlambat, Merokok" value={formData.jenis} onChange={(e) => setFormData({...formData, jenis: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status Pembinaan</label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Proses">Sedang Proses</SelectItem>
                        <SelectItem value="Selesai">Selesai / Ditutup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi Kejadian</label>
                  <Textarea placeholder="Tuliskan kronologi singkat atau detail pembinaan..." value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white">
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ringkasan */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 shadow-lg shadow-rose-500/20">
            <CardContent className="p-6">
              <h3 className="font-bold text-rose-100 mb-1">Total Poin Kelas</h3>
              <p className="text-4xl font-black">{totalPoin}</p>
              <p className="text-xs text-rose-200 mt-2">Batas peringatan SP1: 50 Poin</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200/60 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-bold text-slate-700 mb-4 text-sm">Status Pembinaan</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500"/> Sedang Proses</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">{totalProses} Kasus</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Selesai/Ditutup</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{totalSelesai} Kasus</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daftar Kasus */}
        <div className="md:col-span-2 space-y-4">
          {loadingWali || loading ? (
            <div className="p-12 text-center text-slate-500">Memuat data pembinaan...</div>
          ) : kasus.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p>Belum ada catatan pembinaan atau kasus untuk kelas ini.</p>
            </div>
          ) : (
            kasus.map((item) => (
              <Card key={item.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.poin > 0 ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item.poin > 0 ? <AlertTriangle className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{item.siswa?.nama}</h4>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="text-slate-500">{new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-medium text-slate-600">{item.jenis}</span>
                        </div>
                      </div>
                    </div>
                    {item.poin > 0 && (
                      <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">
                        +{item.poin} Poin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 whitespace-pre-wrap">
                    {item.deskripsi}
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <Badge variant="outline" className={
                      item.status === 'Selesai' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-amber-200 text-amber-600 bg-amber-50'
                    }>
                      Status: {item.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-600 h-8" onClick={async () => {
                        if(confirm('Hapus catatan pembinaan ini?')) {
                          await supabase.from('wali_pembinaan').delete().eq('id', item.id);
                          fetchData();
                        }
                      }}>
                        Hapus
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-600 h-8" onClick={async () => {
                        if(item.status !== 'Selesai') {
                          await supabase.from('wali_pembinaan').update({ status: 'Selesai' }).eq('id', item.id);
                          toast({ title: 'Status diperbarui menjadi Selesai' });
                          fetchData();
                        }
                      }}>
                        {item.status === 'Selesai' ? <><Check className="w-3 h-3 mr-1" /> Selesai</> : 'Tandai Selesai'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
