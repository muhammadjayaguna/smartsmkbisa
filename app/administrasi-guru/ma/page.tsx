'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FileEdit, Sparkles, BookOpen, ChevronDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { KopSurat } from '@/components/administrasi-guru/KopSurat';

const formatText = (text: any) => {
  if (!text) return null;
  
  // If it's already an array (due to some DB magic fetching as JSONB)
  if (Array.isArray(text)) {
    return (
      <ul className="list-disc pl-4 space-y-1.5 mt-1">
        {text.map((item, idx) => <li key={idx} className="leading-relaxed">{item}</li>)}
      </ul>
    );
  }

  // If it's a string, try to parse it
  try {
    if (typeof text === 'string') {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return (
          <ul className="list-disc pl-4 space-y-1.5 mt-1">
            {parsed.map((item, idx) => <li key={idx} className="leading-relaxed">{item}</li>)}
          </ul>
        );
      }
    }
  } catch (e) {
    // Not a JSON array
  }
  return <span className="whitespace-pre-wrap leading-relaxed">{typeof text === 'string' ? text : JSON.stringify(text)}</span>;
};

export default function ModulAjarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [atpList, setAtpList] = useState<any[]>([]);
  const [modulList, setModulList] = useState<any[]>([]);
  const [selectedTp, setSelectedTp] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      if (activeMapel) {
        const { data: atpData } = await supabase.from('atp').select('*').eq('pengaturan_guru_id', activeMapel.id).order('urutan', { ascending: true });
        if (atpData) setAtpList(atpData);
        
        const { data: maData } = await supabase.from('modul_ajar').select('*').eq('pengaturan_guru_id', activeMapel.id).order('created_at', { ascending: false });
        if (maData) setModulList(maData);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user, activeMapel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateMA = async () => {
    if (!activeMapel) return toast({ title: '⚠️ Pilih atau Buat Mata Pelajaran terlebih dahulu', variant: 'destructive' });
    if (!selectedTp) return toast({ title: '⚠️ Pilih Tujuan Pembelajaran (TP) terlebih dahulu', variant: 'destructive' });
    const tp = atpList.find(t => t.kode === selectedTp);
    if (!tp) return;

    setGenerating(true);
    try {
      const uid = user?.db_id || user?.id;
      
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_ma',
          mataPelajaran: activeMapel.mata_pelajaran,
          fase: activeMapel.fase || 'Fase E',
          tp_kode: tp.kode,
          tujuan: tp.tujuan
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal generate AI');

      const aiData = result.data;
      
      const { error } = await supabase.from('modul_ajar').insert({
        guru_id: uid,
        pengaturan_guru_id: activeMapel.id,
        tp_kode: tp.kode,
        judul: aiData.judul || 'Modul Pembelajaran',
        pemahaman_bermakna: typeof aiData.pemahaman_bermakna === 'object' ? JSON.stringify(aiData.pemahaman_bermakna) : (aiData.pemahaman_bermakna || ''),
        pertanyaan_pemantik: typeof aiData.pertanyaan_pemantik === 'object' ? JSON.stringify(aiData.pertanyaan_pemantik) : (aiData.pertanyaan_pemantik || ''),
        kegiatan_pendahuluan: typeof aiData.kegiatan_pendahuluan === 'object' ? JSON.stringify(aiData.kegiatan_pendahuluan) : (aiData.kegiatan_pendahuluan || ''),
        kegiatan_inti: typeof aiData.kegiatan_inti === 'object' ? JSON.stringify(aiData.kegiatan_inti) : (aiData.kegiatan_inti || ''),
        kegiatan_penutup: typeof aiData.kegiatan_penutup === 'object' ? JSON.stringify(aiData.kegiatan_penutup) : (aiData.kegiatan_penutup || ''),
        asesmen_jenis: typeof aiData.asesmen_jenis === 'object' ? JSON.stringify(aiData.asesmen_jenis) : (aiData.asesmen_jenis || ''),
        asesmen_deskripsi: typeof aiData.asesmen_deskripsi === 'object' ? JSON.stringify(aiData.asesmen_deskripsi) : (aiData.asesmen_deskripsi || '')
      });

      if (error) throw error;
      toast({ title: '✅ Modul Ajar berhasil di-generate!' });
      fetchData();
      setSelectedTp('');
    } catch (err: any) {
      console.error(err);
      toast({ title: '❌ Gagal men-generate', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteModul = async (id: string) => {
    if (!confirm('Hapus modul ajar ini?')) return;
    try {
      const { error } = await supabase.from('modul_ajar').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Modul dihapus' });
      fetchData();
    } catch (err: any) { toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' }); }
  };

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print-container print:max-w-none print:w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><FileEdit className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-lg text-slate-800">Modul Ajar (RPP)</h2><p className="text-xs text-slate-500">Rancangan pembelajaran per Tujuan Pembelajaran</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Cetak MA
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/50 no-print">
        <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-orange-800 mb-1.5 block">Pilih Tujuan Pembelajaran (Dari ATP)</label>
            <div className="relative">
              <select 
                value={selectedTp} onChange={(e) => setSelectedTp(e.target.value)}
                className="w-full p-2.5 bg-white border border-orange-200 rounded-lg text-sm appearance-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">-- Pilih Tujuan Pembelajaran --</option>
                {atpList.map(tp => <option key={tp.id} value={tp.kode}>[{tp.kode}] {tp.tujuan.substring(0, 80)}...</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-orange-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-auto flex items-end h-full">
            <Button 
              onClick={handleGenerateMA} disabled={generating || !selectedTp}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 h-[42px]"
            >
              {generating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Modul (AI)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {modulList.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada Modul Ajar yang dibuat.<br/>Pilih TP di atas lalu klik Generate untuk membuat secara otomatis.</p>
          </div>
        ) : (
          modulList.map((ma, idx) => (
            <Card key={ma.id} className="overflow-hidden border-slate-200 print-card-reset print:mb-12 print:break-after-page">
              <div className="bg-gradient-to-r from-slate-100 to-white px-5 py-3 border-b border-slate-200 flex justify-between items-center no-print">
                <div className="flex items-center gap-3">
                  <span className="bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-md">{ma.tp_kode}</span>
                  <h3 className="font-bold text-slate-800 text-lg">{ma.judul}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteModul(ma.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 no-print">Hapus</Button>
              </div>
              <CardContent className="p-0">
                {/* Print View & Screen View matching PDF */}
                <div className="bg-white p-6 md:p-10 print:p-0">
                  <div className="hidden print:block w-full">
                    <KopSurat />
                  </div>
                  <div className="text-center mb-8 pb-4 border-b-2 border-black">
                    <h3 className="font-bold text-xl uppercase underline underline-offset-4 decoration-2">MODUL AJAR KURIKULUM MERDEKA</h3>
                    <h4 className="font-bold text-lg uppercase mt-2">MODUL AJAR {ma.judul.toUpperCase()}</h4>
                    <p className="font-bold text-base mt-1">Kurikulum Merdeka — Fase {activeMapel.fase || 'E'} (Kelas {activeMapel.tingkat || '10'})</p>
                  </div>

                  <div className="space-y-8 text-sm print:text-[13px] text-black">
                    
                    {/* I. INFORMASI UMUM */}
                    <div>
                      <h4 className="font-bold text-blue-700 uppercase mb-2">I. INFORMASI UMUM</h4>
                      <table className="w-full border-collapse border border-black">
                        <tbody>
                          <tr>
                            <td className="border border-black p-2 font-bold w-1/4 bg-slate-50 print:bg-transparent">Nama Penyusun</td>
                            <td className="border border-black p-2 w-1/4">{activeMapel.nama_guru || user?.nama || 'Nama Guru, S.Pd'}</td>
                            <td className="border border-black p-2 font-bold w-1/4 bg-slate-50 print:bg-transparent">Mata Pelajaran/Materi Pokok</td>
                            <td className="border border-black p-2 w-1/4">{activeMapel.mata_pelajaran} / {ma.judul}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Instansi / Tahun</td>
                            <td className="border border-black p-2">SMK Negeri 1 / 2026/2027</td>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Jenjang/Fase/Kelas</td>
                            <td className="border border-black p-2">SMK / {activeMapel.fase || 'Fase E'} (Kelas {activeMapel.tingkat || '10'})</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Alokasi Waktu</td>
                            <td className="border border-black p-2">6 JP</td>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Pertemuan Ke-</td>
                            <td className="border border-black p-2">1</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Kompetensi Awal</td>
                            <td className="border border-black p-2" colSpan={3}>Peserta didik telah memahami konsep dasar terkait kompetensi yang akan diajarkan.</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Sarana & Prasarana</td>
                            <td className="border border-black p-2" colSpan={3}>
                              Alat: Laptop/komputer siswa, proyektor/LCD, papan tulis.<br/>
                              Digital: Akses internet untuk pencarian sumber data.
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Target Peserta Didik</td>
                            <td className="border border-black p-2">Reguler (dapat dimodifikasi)</td>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Model/Pendekatan Pembelajaran</td>
                            <td className="border border-black p-2">Project Based Learning (PjBL)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* II. KOMPONEN INTI */}
                    <div>
                      <h4 className="font-bold text-blue-700 uppercase mb-2">II. KOMPONEN INTI</h4>
                      <table className="w-full border-collapse border border-black">
                        <tbody>
                          <tr>
                            <td className="border border-black p-2 font-bold w-1/4 bg-slate-50 print:bg-transparent">1. Capaian / Tujuan Pembelajaran (TP)</td>
                            <td className="border border-black p-2 w-3/4">
                              <span className="font-bold">[{ma.tp_kode}]</span> Siswa mampu mendefinisikan, mengidentifikasi, dan menganalisis materi {ma.judul}.
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">2. Pemahaman Bermakna</td>
                            <td className="border border-black p-2">{formatText(ma.pemahaman_bermakna)}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Pertanyaan Pemantik</td>
                            <td className="border border-black p-2">{formatText(ma.pertanyaan_pemantik)}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">3. Dimensi Profil Lulusan</td>
                            <td className="border border-black p-2">Penalaran Kritis, Kolaborasi, Kreativitas</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Langkah Pembelajaran */}
                    <div className="print:break-inside-avoid pt-2">
                      <h4 className="font-bold text-base mb-4">4. Pengalaman Belajar & Langkah-Langkah Pembelajaran:</h4>
                      
                      <div className="mb-4">
                        <h5 className="font-bold mb-1 uppercase">A. PENDAHULUAN (15 Menit)</h5>
                        <div className="pl-4">{formatText(ma.kegiatan_pendahuluan)}</div>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-bold mb-1 uppercase">B. KEGIATAN INTI (150 Menit)</h5>
                        <div className="pl-4">{formatText(ma.kegiatan_inti)}</div>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-bold mb-1 uppercase">C. PENUTUP (15 Menit)</h5>
                        <div className="pl-4">{formatText(ma.kegiatan_penutup)}</div>
                      </div>
                    </div>

                    {/* 5. ASESMEN */}
                    <div className="print:break-before-page pt-2">
                      <h4 className="font-bold text-base mb-2 uppercase">5. ASESMEN PEMBELAJARAN</h4>
                      <table className="w-full border-collapse border border-black">
                        <tbody>
                          <tr>
                            <td className="border border-black p-2 font-bold w-1/4 bg-slate-50 print:bg-transparent">Asesmen Awal (Diagnostik)</td>
                            <td className="border border-black p-2 w-3/4">Pertanyaan lisan singkat mengenai pemahaman awal {ma.judul}.</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Asesmen Proses (Formatif)</td>
                            <td className="border border-black p-2">Pengamatan terhadap partisipasi dan kemampuan komunikasi siswa saat diskusi kelompok.</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Asesmen Akhir (Sumatif)</td>
                            <td className="border border-black p-2">{formatText(ma.asesmen_deskripsi)}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Pengayaan</td>
                            <td className="border border-black p-2">Untuk siswa pencapaian tinggi: Tambahkan tugas menganalisis kompleksitas lebih dalam dan presentasi.</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Remedial</td>
                            <td className="border border-black p-2">Untuk siswa yang kesulitan: Guru menyediakan penjelasan ulang dengan pendekatan visual dan tutor sebaya.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* III. LAMPIRAN */}
                    <div className="print:break-before-page space-y-8 pt-2">
                      <div>
                        <h4 className="font-bold text-blue-700 uppercase mb-2">III. LAMPIRAN</h4>
                        <table className="w-full border-collapse border border-black">
                          <tbody>
                            <tr>
                              <td className="border border-black p-2 font-bold w-1/4 bg-slate-50 print:bg-transparent">Bahan Bacaan Guru & Peserta Didik</td>
                              <td className="border border-black p-2 w-3/4">
                                1. Modul Pembelajaran Kurikulum Merdeka<br/>
                                2. Buku Teks Utama dari Kemendikbud<br/>
                                3. Jurnal online terakreditasi dan Video tutorial referensi
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-black p-2 font-bold bg-slate-50 print:bg-transparent">Media & Alat Pembelajaran</td>
                              <td className="border border-black p-2">
                                Alat: Laptop/komputer siswa, proyektor/LCD, papan tulis.<br/>
                                Bahan: LKPD cetak, sticky note, kertas plano.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* LKPD */}
                      <div className="print:break-before-page">
                        <h4 className="font-bold text-blue-700 uppercase mb-4 text-center">LAMPIRAN: LEMBAR KERJA PESERTA DIDIK (LKPD)</h4>
                        <div className="border border-black p-5 min-h-[350px]">
                          <p className="font-bold mb-4">LEMBAR KERJA PESERTA DIDIK (LKPD)</p>
                          <p className="mb-2">PETUNJUK KERJA:</p>
                          <ol className="list-decimal pl-5 mb-6 space-y-1">
                            <li>Kerjakan LKPD ini secara berkelompok (4-5 orang).</li>
                            <li>Bacalah setiap instruksi dengan cermat.</li>
                            <li>Setiap anggota wajib berkontribusi aktif dalam diskusi.</li>
                            <li>Siapkan diri untuk mempresentasikan hasil diskusi di depan kelas.</li>
                          </ol>
                          <p className="font-bold mb-2">SOAL / KASUS DISKUSI:</p>
                          <p className="italic text-slate-500">(Ruang untuk guru mendiktekan soal/studi kasus khusus terkait {ma.judul})</p>
                        </div>
                      </div>

                      {/* Tanda Tangan */}
                      <div className="pt-16 pb-8 flex justify-between text-sm print:text-[13px] print:break-inside-avoid">
                        <div className="text-center w-64">
                          <p>Mengetahui,</p>
                          <p>Kepala {activeMapel.nama_sekolah || 'SMKN 1 Banjarmasin'}</p>
                          <div className="h-24"></div>
                          <p className="font-bold underline">{activeMapel.nama_kepala_sekolah || 'Agustin Purnomosari, S.Pd, M.Pd'}</p>
                          <p>NIP. {activeMapel.nip_kepala_sekolah || '197208211998032007'}</p>
                        </div>
                        <div className="text-center w-64">
                          <p>{activeMapel.lokasi_penetapan || 'Banjarmasin'}, 13 Juli 2026</p>
                          <p>Guru Pengajar</p>
                          <div className="h-24"></div>
                          <p className="font-bold underline">{activeMapel.nama_guru || user?.nama || 'Muhammad Jayaguna, S.Pd'}</p>
                          <p>NIP. {activeMapel.nip_guru || '199307102019031007'}</p>
                        </div>
                      </div>
                    </div>

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
