'use client';

import React, { useState, useEffect } from 'react';
import { Target, Calendar, Plus, Save, Clock, Trash2, MapPin, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function WaliJadwalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [program, setProgram] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [openJadwal, setOpenJadwal] = useState(false);
  const [openProgram, setOpenProgram] = useState(false);
  
  const [formJadwal, setFormJadwal] = useState({ hari: 'Senin', jam: '', kegiatan: '', tempat: '' });
  const [formProgram, setFormProgram] = useState({ bulan: 'Juli', nama: '', status: 'Direncanakan' });

  const fetchJadwalAndProgram = async () => {
    if (!user?.db_id) return;
    setLoading(true);
    try {
      const { data: jadwalData } = await supabase
        .from('wali_jadwal')
        .select('*')
        .eq('guru_id', user.db_id)
        .order('created_at', { ascending: true });
      
      if (jadwalData) setJadwal(jadwalData);

      const { data: programData } = await supabase
        .from('wali_program')
        .select('*')
        .eq('guru_id', user.db_id)
        .order('created_at', { ascending: true });
      
      if (programData) setProgram(programData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwalAndProgram();
  }, [user]);

  const handleSimpanJadwal = async () => {
    if (!formJadwal.kegiatan || !formJadwal.jam) return toast({ title: 'Mohon lengkapi data', variant: 'destructive' });
    setLoading(true);
    try {
      const { error } = await supabase.from('wali_jadwal').insert({
        guru_id: user?.db_id,
        ...formJadwal
      });
      if (error) throw error;
      toast({ title: 'Berhasil menambah jadwal' });
      setOpenJadwal(false);
      setFormJadwal({ hari: 'Senin', jam: '', kegiatan: '', tempat: '' });
      fetchJadwalAndProgram();
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimpanProgram = async () => {
    if (!formProgram.nama) return toast({ title: 'Mohon lengkapi data', variant: 'destructive' });
    setLoading(true);
    try {
      const { error } = await supabase.from('wali_program').insert({
        guru_id: user?.db_id,
        ...formProgram
      });
      if (error) throw error;
      toast({ title: 'Berhasil menambah program' });
      setOpenProgram(false);
      setFormProgram({ bulan: 'Juli', nama: '', status: 'Direncanakan' });
      fetchJadwalAndProgram();
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Program & Jadwal Wali Kelas</h2>
            <p className="text-xs text-slate-500">Susun program kerja dan jadwal kegiatan siswa binaan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Mingguan */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Jadwal Kegiatan Mingguan
            </CardTitle>
            <Dialog open={openJadwal} onOpenChange={setOpenJadwal}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Tambah Jadwal Wali Kelas</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hari</label>
                      <Select value={formJadwal.hari} onValueChange={(val) => setFormJadwal({...formJadwal, hari: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Jam (misal 07:00-08:30)</label>
                      <Input placeholder="00:00 - 00:00" value={formJadwal.jam} onChange={(e) => setFormJadwal({...formJadwal, jam: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kegiatan</label>
                    <Input placeholder="Nama Kegiatan" value={formJadwal.kegiatan} onChange={(e) => setFormJadwal({...formJadwal, kegiatan: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tempat</label>
                    <Input placeholder="Lokasi" value={formJadwal.tempat} onChange={(e) => setFormJadwal({...formJadwal, tempat: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenJadwal(false)}>Batal</Button>
                  <Button onClick={handleSimpanJadwal} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-4">
              {loading ? (
                <div className="p-4 text-center text-slate-500">Memuat jadwal...</div>
              ) : jadwal.length === 0 ? (
                <div className="p-4 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">Belum ada jadwal</div>
              ) : (
                jadwal.map((item) => (
                  <div key={item.id} className="group border border-slate-100 rounded-xl p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center border-r border-slate-100 pr-4">
                        <p className="font-bold text-slate-800 text-sm">{item.hari}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.jam}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">{item.kegiatan}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {item.tempat}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={async () => {
                      if(confirm('Hapus jadwal ini?')) {
                        await supabase.from('wali_jadwal').delete().eq('id', item.id);
                        fetchJadwalAndProgram();
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Program Kerja Tahunan */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" /> Program Kerja Kelas
            </CardTitle>
            <Dialog open={openProgram} onOpenChange={setOpenProgram}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                  <Plus className="w-4 h-4 mr-1" /> Program
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Tambah Program Kerja</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bulan Pelaksanaan</label>
                      <Select value={formProgram.bulan} onValueChange={(val) => setFormProgram({...formProgram, bulan: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Juli','Agustus','September','Oktober','November','Desember','Januari','Februari','Maret','April','Mei','Juni'].map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={formProgram.status} onValueChange={(val) => setFormProgram({...formProgram, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Direncanakan">Direncanakan</SelectItem>
                          <SelectItem value="Selesai">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Program</label>
                    <Input placeholder="Misal: Pemilihan Pengurus Kelas" value={formProgram.nama} onChange={(e) => setFormProgram({...formProgram, nama: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenProgram(false)}>Batal</Button>
                  <Button onClick={handleSimpanProgram} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-4">
              {loading ? (
                <div className="p-4 text-center text-slate-500">Memuat program kerja...</div>
              ) : program.length === 0 ? (
                <div className="p-4 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">Belum ada program</div>
              ) : (
                program.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="mt-0.5 cursor-pointer" onClick={async () => {
                        const newStatus = item.status === 'Selesai' ? 'Direncanakan' : 'Selesai';
                        await supabase.from('wali_program').update({ status: newStatus }).eq('id', item.id);
                        fetchJadwalAndProgram();
                      }}>
                      {item.status === 'Selesai' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-emerald-300"></div>
                      )}
                    </div>
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${item.status === 'Selesai' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                          {item.nama}
                        </h4>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 mt-1">{item.bulan}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={async () => {
                        if(confirm('Hapus program ini?')) {
                          await supabase.from('wali_program').delete().eq('id', item.id);
                          fetchJadwalAndProgram();
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
