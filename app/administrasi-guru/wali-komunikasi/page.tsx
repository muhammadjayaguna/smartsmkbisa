'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, MessageSquare, Plus, CheckCircle2, Check } from 'lucide-react';
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

export default function WaliKomunikasiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeRombelId, activeRombel, loadingWali } = useWali();
  const [logs, setLogs] = useState<any[]>([]);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    siswa_id: '',
    tanggal: getLocalDateString(),
    ortu: '',
    media: 'Telepon',
    keperluan: '',
    hasil: '',
    status: 'Proses'
  });

  const fetchData = async () => {
    if (!activeRombelId || !user?.db_id) {
      setLogs([]);
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

      const { data: logsData, error } = await supabase
        .from('wali_komunikasi')
        .select(`*, siswa!inner (id, nama, rombel_id)`)
        .eq('guru_id', user.db_id)
        .eq('siswa.rombel_id', activeRombelId)
        .order('tanggal', { ascending: false });
      
      if (logsData) setLogs(logsData);
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
    if (!formData.siswa_id || !formData.tanggal || !formData.ortu || !formData.keperluan) {
      return toast({ title: 'Mohon lengkapi data', variant: 'destructive' });
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('wali_komunikasi').insert({
        guru_id: user?.db_id,
        siswa_id: formData.siswa_id,
        tanggal: formData.tanggal,
        ortu: formData.ortu,
        media: formData.media,
        keperluan: formData.keperluan,
        hasil: formData.hasil,
        status: formData.status
      });

      if (error) throw error;
      toast({ title: 'Berhasil mencatat log komunikasi' });
      setOpen(false);
      setFormData({ siswa_id: '', tanggal: getLocalDateString(), ortu: '', media: 'Telepon', keperluan: '', hasil: '', status: 'Proses' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal mencatat log', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Log Komunikasi Orang Tua {activeRombel ? `- ${activeRombel.nama_rombel}` : ''}</h2>
            <p className="text-xs text-slate-500">Rekapitulasi komunikasi dan pemanggilan wali murid</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm disabled:opacity-50" disabled={!activeRombelId}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Catatan Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Catat Log Komunikasi</DialogTitle>
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
                    <label className="text-sm font-medium">Nama Wali / Ortu</label>
                    <Input placeholder="Bpk/Ibu..." value={formData.ortu} onChange={(e) => setFormData({...formData, ortu: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Media Komunikasi</label>
                    <Select value={formData.media} onValueChange={(val) => setFormData({...formData, media: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Telepon">Telepon</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Tatap Muka">Tatap Muka / Surat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input type="date" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status Tindak Lanjut</label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Proses">Sedang Proses</SelectItem>
                        <SelectItem value="Selesai">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keperluan / Tujuan</label>
                  <Textarea placeholder="Misal: Membahas ketidakhadiran 3 hari berturut-turut..." value={formData.keperluan} onChange={(e) => setFormData({...formData, keperluan: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hasil / Kesepakatan</label>
                  <Textarea placeholder="Misal: Ortu setuju memantau anaknya..." value={formData.hasil} onChange={(e) => setFormData({...formData, hasil: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
                  {loading ? 'Menyimpan...' : 'Simpan Log'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingWali || loading ? (
          <div className="col-span-full p-12 text-center text-slate-500">Memuat log komunikasi...</div>
        ) : logs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Phone className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p>Belum ada catatan komunikasi untuk kelas ini.</p>
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {log.siswa?.nama} 
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal text-[10px]">Ortu: {log.ortu}</Badge>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(log.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})} • {log.media}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={async () => {
                        if(confirm('Hapus log komunikasi ini?')) {
                          await supabase.from('wali_komunikasi').delete().eq('id', log.id);
                          fetchData();
                        }
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </Button>
                    <div className={`${log.status === 'Selesai' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} p-2 rounded-full cursor-pointer`}
                      title={log.status === 'Selesai' ? 'Selesai' : 'Klik untuk tandai selesai'}
                      onClick={async () => {
                        if (log.status !== 'Selesai') {
                          await supabase.from('wali_komunikasi').update({ status: 'Selesai' }).eq('id', log.id);
                          toast({ title: 'Status diperbarui menjadi Selesai' });
                          fetchData();
                        }
                      }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tujuan / Keperluan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.keperluan}</p>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <p className="text-xs font-bold text-blue-500 uppercase mb-1">Hasil Komunikasi / Kesepakatan</p>
                    <p className="text-sm text-slate-700 italic whitespace-pre-wrap">"{log.hasil}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
