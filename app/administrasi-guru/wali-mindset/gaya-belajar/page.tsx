'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Target, Search, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { useWali } from '@/components/administrasi-guru/WaliContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function GayaBelajarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeRombelId, activeRombel, loadingWali } = useWali();
  const [students, setStudents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!activeRombelId || !user) return;
    setLoading(true);
    try {
      // Fetch students
      const { data: stdData } = await supabase
        .from('siswa')
        .select('id, nama, nisn')
        .eq('rombel_id', activeRombelId)
        .order('nama');
      
      if (stdData) setStudents(stdData);

      // Fetch existing assessments for Gaya Belajar
      const { data: asmData } = await supabase
        .from('asesmen_psikologis')
        .select('*')
        .eq('rombel_id', activeRombelId)
        .eq('jenis_asesmen', 'Gaya Belajar');

      if (asmData) {
        const asmMap: Record<string, any> = {};
        asmData.forEach(a => {
          asmMap[a.siswa_id] = { hasil: a.hasil, catatan: a.catatan || '', id: a.id };
        });
        setAssessments(asmMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeRombelId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = (siswaId: string, field: 'hasil' | 'catatan', value: string) => {
    setAssessments(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value
      }
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const uid = user?.db_id || user?.id;
      const upsertData = Object.keys(assessments).map(siswaId => {
        const data = assessments[siswaId];
        return {
          ...(data.id ? { id: data.id } : {}), // include ID if updating
          guru_id: uid,
          rombel_id: activeRombelId,
          siswa_id: siswaId,
          jenis_asesmen: 'Gaya Belajar',
          hasil: data.hasil,
          catatan: data.catatan
        };
      }).filter(d => d.hasil); // only save if hasil is selected

      if (upsertData.length > 0) {
        const { error } = await supabase.from('asesmen_psikologis').upsert(upsertData, { onConflict: 'id' });
        if (error) throw error;
        toast({ title: '✅ Data Gaya Belajar berhasil disimpan!' });
        fetchData(); // reload to get IDs for new inserts
      } else {
        toast({ title: 'Tidak ada data untuk disimpan', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: '❌ Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.nama?.toLowerCase().includes(search.toLowerCase()) || 
    s.nisn?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats for visualization
  const stats = { Visual: 0, Auditori: 0, Kinestetik: 0 };
  Object.values(assessments).forEach(a => {
    if (a.hasil === 'Visual') stats.Visual++;
    if (a.hasil === 'Auditori') stats.Auditori++;
    if (a.hasil === 'Kinestetik') stats.Kinestetik++;
  });
  const totalAssessed = stats.Visual + stats.Auditori + stats.Kinestetik;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <Link href="/administrasi-guru/wali-mindset" className="inline-flex items-center text-sm text-slate-500 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Pemetaan Pola Pikir
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Gaya Belajar {activeRombel ? `- ${activeRombel.nama_rombel}` : ''}</h2>
            <p className="text-xs text-slate-500">Pemetaan tipe belajar siswa (Visual, Auditori, Kinestetik)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSaveAll} disabled={saving || loadingWali || loading} className="bg-orange-600 hover:bg-orange-700 text-white">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Siswa Dipetakan</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalAssessed} <span className="text-sm font-normal text-slate-400">/ {students.length}</span></h3>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-blue-600 uppercase">Visual</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{stats.Visual} <span className="text-sm font-normal text-blue-400">Siswa</span></h3>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-emerald-600 uppercase">Auditori</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.Auditori} <span className="text-sm font-normal text-emerald-400">Siswa</span></h3>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-amber-600 uppercase">Kinestetik</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{stats.Kinestetik} <span className="text-sm font-normal text-amber-400">Siswa</span></h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-white" 
              placeholder="Cari nama atau NISN siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold w-12">No</th>
                  <th className="px-6 py-4 font-bold w-1/3">Nama Lengkap</th>
                  <th className="px-6 py-4 font-bold w-48">Gaya Belajar</th>
                  <th className="px-6 py-4 font-bold">Catatan Observasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingWali || loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Memuat data siswa...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Tidak ada siswa ditemukan.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const asm = assessments[student.id] || { hasil: '', catatan: '' };
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{student.nama}</div>
                          <div className="text-xs text-slate-500">{student.nisn || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={asm.hasil} 
                            onChange={e => handleUpdate(student.id, 'hasil', e.target.value)}
                            className={`w-full p-2 border rounded-lg text-sm outline-none transition-colors ${
                              asm.hasil === 'Visual' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 
                              asm.hasil === 'Auditori' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 
                              asm.hasil === 'Kinestetik' ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' : 
                              'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="">-- Pilih --</option>
                            <option value="Visual">Visual</option>
                            <option value="Auditori">Auditori</option>
                            <option value="Kinestetik">Kinestetik</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <Input 
                            value={asm.catatan} 
                            onChange={e => handleUpdate(student.id, 'catatan', e.target.value)}
                            placeholder="Catatan tambahan (opsional)..." 
                            className="bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
