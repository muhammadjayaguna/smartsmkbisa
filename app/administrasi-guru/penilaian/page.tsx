'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Save, Plus, FileSpreadsheet, Users, Edit, Trash2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLocalDateString } from '@/lib/utils';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';

export default function PenilaianTugasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { listMapel } = useSisminjar();
  const [loading, setLoading] = useState(true);
  
  const [rombelList, setRombelList] = useState<any[]>([]);
  const [bukuNilaiList, setBukuNilaiList] = useState<any[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTanggal, setEditTanggal] = useState('');
  const [bukuNilaiIds, setBukuNilaiIds] = useState<Record<string, string>>({}); // siswa_id -> buku_nilai_id
  
  // Form State
  const [formData, setFormData] = useState({
    rombel_id: '',
    mata_pelajaran: '',
    jenis_penilaian: 'Tugas Harian',
    materi_topik: ''
  });
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [nilaiSiswa, setNilaiSiswa] = useState<Record<string, number | ''>>({});

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      // Get Rombel
      const { data: rombelData } = await supabase.from('rombel').select('*').order('nama_rombel');
      if (rombelData) setRombelList(rombelData);
      
      // Get History Buku Nilai
      const { data: nilaiData } = await supabase.from('buku_nilai')
        .select(`
          id, tanggal, mata_pelajaran, jenis_penilaian, materi_topik, nilai, rombel_id, siswa_id,
          rombel (nama_rombel),
          siswa (nama)
        `)
        .eq('guru_id', uid)
        .order('tanggal', { ascending: false });
        
      if (nilaiData) {
        // Group by class, mapel, jenis, tanggal for display
        const grouped = nilaiData.reduce((acc: any, curr: any) => {
          const key = `${curr.rombel_id}_${curr.mata_pelajaran}_${curr.jenis_penilaian}_${curr.tanggal}`;
          if (!acc[key]) {
            acc[key] = {
              rombel: curr.rombel?.nama_rombel,
              rombel_id: curr.rombel_id,
              mata_pelajaran: curr.mata_pelajaran,
              jenis_penilaian: curr.jenis_penilaian,
              materi_topik: curr.materi_topik,
              tanggal: curr.tanggal,
              siswa_count: 0,
              records: []
            };
          }
          acc[key].siswa_count++;
          acc[key].records.push(curr);
          return acc;
        }, {});
        setBukuNilaiList(Object.values(grouped));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load Siswa when Rombel changes (only for new entries)
  useEffect(() => {
    if (formData.rombel_id && !isEditMode) {
      const loadSiswa = async () => {
        const { data } = await supabase.from('siswa').select('*').eq('rombel_id', formData.rombel_id).order('nama');
        if (data) {
          setSiswaList(data);
          const initialNilai: Record<string, number | ''> = {};
          data.forEach(s => initialNilai[s.id] = '');
          setNilaiSiswa(initialNilai);
          setBukuNilaiIds({});
        }
      };
      loadSiswa();
    } else if (!formData.rombel_id) {
      setSiswaList([]);
      setNilaiSiswa({});
      setBukuNilaiIds({});
    }
  }, [formData.rombel_id, isEditMode]);

  const handleNilaiChange = (siswaId: string, val: string) => {
    let num = parseInt(val);
    if (isNaN(num)) {
      setNilaiSiswa(prev => ({...prev, [siswaId]: ''}));
      return;
    }
    if (num < 0) num = 0;
    if (num > 100) num = 100;
    setNilaiSiswa(prev => ({...prev, [siswaId]: num}));
  };

  const handleNew = () => {
    setIsEditMode(false);
    setEditTanggal('');
    setFormData({ rombel_id: '', mata_pelajaran: '', jenis_penilaian: 'Tugas Harian', materi_topik: '' });
    setSiswaList([]);
    setNilaiSiswa({});
    setBukuNilaiIds({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (group: any) => {
    setIsEditMode(true);
    setEditTanggal(group.tanggal);
    setFormData({
      rombel_id: group.rombel_id,
      mata_pelajaran: group.mata_pelajaran,
      jenis_penilaian: group.jenis_penilaian,
      materi_topik: group.materi_topik
    });
    
    // We need all students in that class just in case a new student was added,
    // but also we need to map the existing records.
    const { data: classStudents } = await supabase.from('siswa').select('*').eq('rombel_id', group.rombel_id).order('nama');
    
    if (classStudents) {
      setSiswaList(classStudents);
      const initialNilai: Record<string, number | ''> = {};
      const initialIds: Record<string, string> = {};
      
      classStudents.forEach(s => initialNilai[s.id] = '');
      
      group.records.forEach((rec: any) => {
        initialNilai[rec.siswa_id] = rec.nilai;
        initialIds[rec.siswa_id] = rec.id;
      });
      
      setNilaiSiswa(initialNilai);
      setBukuNilaiIds(initialIds);
    }
    
    setShowForm(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, group: any) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus seluruh data penilaian ini? Aksi ini tidak dapat dibatalkan.')) return;
    
    try {
      const idsToDelete = group.records.map((r: any) => r.id);
      const { error } = await supabase.from('buku_nilai').delete().in('id', idsToDelete);
      if (error) throw error;
      
      toast({ title: '✅ Data penilaian berhasil dihapus' });
      fetchData();
    } catch (error: any) {
      toast({ title: '❌ Gagal menghapus', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rombel_id) return toast({ title: 'Pilih kelas terlebih dahulu', variant: 'destructive' });
    if (siswaList.length === 0) return toast({ title: 'Tidak ada siswa di kelas ini', variant: 'destructive' });
    
    setIsSubmitting(true);
    try {
      const uid = user?.db_id || user?.id;
      const today = getLocalDateString();
      const targetTanggal = isEditMode ? editTanggal : today;
      
      const upserts = siswaList.map(siswa => {
        const payload: any = {
          guru_id: uid,
          siswa_id: siswa.id,
          rombel_id: formData.rombel_id,
          mata_pelajaran: formData.mata_pelajaran,
          jenis_penilaian: formData.jenis_penilaian,
          materi_topik: formData.materi_topik,
          nilai: typeof nilaiSiswa[siswa.id] === 'number' ? nilaiSiswa[siswa.id] : 0,
          tanggal: targetTanggal
        };
        
        if (bukuNilaiIds[siswa.id]) {
          payload.id = bukuNilaiIds[siswa.id]; // for updating existing
        }
        
        return payload;
      });
      
      const { error } = await supabase.from('buku_nilai').upsert(upserts);
      if (error) throw error;
      
      toast({ title: '✅ Nilai kelas berhasil disimpan!' });
      setShowForm(false);
      setIsEditMode(false);
      setFormData({ rombel_id: '', mata_pelajaran: '', jenis_penilaian: 'Tugas Harian', materi_topik: '' });
      fetchData();
    } catch (error: any) {
      toast({ title: '❌ Gagal menyimpan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Trophy className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Penilaian Tugas</h2><p className="text-xs text-slate-500">Input nilai formatif/sumatif secara massal</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300 no-print">
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
          {!showForm ? (
            <Button onClick={handleNew} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Input Nilai Baru
            </Button>
          ) : (
            <Button onClick={() => setShowForm(false)} variant="outline">Batal</Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="border-amber-200 shadow-md">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">{isEditMode ? 'Edit Nilai Kelas' : 'Formulir Pengisian Nilai Baru'}</h3>
            </div>
            {isEditMode && <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded">Tanggal Asli: {editTanggal}</span>}
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Pilih Kelas</label>
                  <Select value={formData.rombel_id} onValueChange={val => setFormData({...formData, rombel_id: val})} disabled={isEditMode}>
                    <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent>
                      {rombelList.map(r => <SelectItem key={r.id} value={r.id}>{r.nama_rombel}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                  <Select value={formData.mata_pelajaran} onValueChange={val => setFormData({...formData, mata_pelajaran: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Mapel..." /></SelectTrigger>
                    <SelectContent>
                      {listMapel.map(m => (
                        <SelectItem key={m.id} value={m.mata_pelajaran}>{m.mata_pelajaran}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Jenis Penilaian</label>
                  <Select value={formData.jenis_penilaian} onValueChange={val => setFormData({...formData, jenis_penilaian: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tugas Harian">Tugas Harian</SelectItem>
                      <SelectItem value="Ulangan Harian">Ulangan Harian</SelectItem>
                      <SelectItem value="Praktikum">Praktikum / Proyek</SelectItem>
                      <SelectItem value="PTS">Ujian Tengah Semester (PTS)</SelectItem>
                      <SelectItem value="PAS">Ujian Akhir Semester (PAS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Materi / KD (Opsional)</label>
                  <Input value={formData.materi_topik} onChange={e => setFormData({...formData, materi_topik: e.target.value})} placeholder="Cth: Aljabar Linear" />
                </div>
              </div>

              {siswaList.length > 0 ? (
                <div className="mt-8 border rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                        <th className="px-4 py-3 font-bold">Nama Siswa</th>
                        <th className="px-4 py-3 font-bold w-32">Nilai (0-100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {siswaList.map((siswa, idx) => (
                        <tr key={siswa.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{siswa.nama}</td>
                          <td className="px-4 py-3">
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              required
                              value={nilaiSiswa[siswa.id]} 
                              onChange={(e) => handleNilaiChange(siswa.id, e.target.value)}
                              className="h-9 w-full text-center font-bold text-amber-700 border-amber-200 focus-visible:ring-amber-500"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : formData.rombel_id ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                  Sedang memuat data siswa...
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Pilih kelas terlebih dahulu untuk melihat daftar siswa.
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isSubmitting || siswaList.length === 0} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-5 px-8">
                  {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Buku Nilai')} <Save className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History Nilai List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 mb-2">Riwayat Penilaian Terakhir</h3>
        {bukuNilaiList.length === 0 && !showForm ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada catatan nilai.<br/>Klik tombol "Input Nilai Baru" untuk mulai menilai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bukuNilaiList.map((nilai, i) => (
              <Card 
                key={i} 
                onClick={() => handleEdit(nilai)}
                className="border-slate-200 hover:border-amber-400 hover:ring-2 hover:ring-amber-200 transition-all hover:shadow-md cursor-pointer group"
              >
                <CardContent className="p-5 relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-700 hover:bg-amber-200" title="Edit Nilai">
                      <Edit className="w-4 h-4" />
                    </div>
                    <div 
                      className="bg-red-100 p-2 rounded-full text-red-600 hover:bg-red-200" 
                      title="Hapus Nilai"
                      onClick={(e) => handleDelete(e, nilai)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex justify-between items-start mb-3 pr-8">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{nilai.jenis_penilaian}</span>
                    <span className="text-xs text-slate-400 font-medium">{nilai.tanggal}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{nilai.mata_pelajaran}</h4>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-1">{nilai.materi_topik || 'Topik Umum'}</p>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <div className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">Kelas {nilai.rombel}</div>
                    <div className="flex items-center text-xs text-slate-500"><Users className="w-3 h-3 mr-1"/> {nilai.siswa_count} Siswa</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
