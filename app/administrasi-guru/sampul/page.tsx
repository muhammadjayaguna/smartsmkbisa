'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Book, Save, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function SampulPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { activeMapel, appSettings, loading: contextLoading } = useSisminjar();

  // Form State
  const [judul, setJudul] = useState('BUKU KERJA GURU');
  const [tahunPelajaran, setTahunPelajaran] = useState('2024/2025');
  const [kelas, setKelas] = useState('XII (GANJIL & GENAP)');
  const [daftarIsi, setDaftarIsi] = useState('PROGRAM TAHUNAN\nPROGRAM SEMESTER\nKKM\nALUR TUJUAN PEMBELAJARAN\nMODUL AJAR\nBAHAN AJAR\nINSTRUMEN ASESMEN\nABSENSI SISWA\nJURNAL MENGAJAR\nPENILAIAN TUGAS\nPROGRAM REMEDIAL\nJADWAL PELAJARAN');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('pengaturan_guru')
          .select('*')
          .eq('guru_id', user.db_id || user.id)
          .maybeSingle();
        
        if (data) {
          setPengaturan(data);
          if (data.sampul_judul) setJudul(data.sampul_judul);
          if (data.sampul_tahun) setTahunPelajaran(data.sampul_tahun);
          if (data.sampul_kelas) setKelas(data.sampul_kelas);
          if (data.sampul_daftar_isi) setDaftarIsi(data.sampul_daftar_isi);
        }
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const uid = user.db_id || user.id;
      const { error } = await supabase
        .from('pengaturan_guru')
        .update({
          sampul_judul: judul,
          sampul_tahun: tahunPelajaran,
          sampul_kelas: kelas,
          sampul_daftar_isi: daftarIsi,
          updated_at: new Date().toISOString()
        })
        .eq('guru_id', uid);

      if (error) throw error;
      toast({ title: 'Pengaturan Sampul berhasil disimpan!' });
    } catch (err) {
      console.error('Save error', err);
      toast({ title: 'Gagal menyimpan pengaturan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || contextLoading) {
    return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const guruName = user?.nama || 'NAMA GURU, S.Pd';
  const nip = activeMapel?.nip_guru || '-';
  const mataPelajaran = activeMapel?.mata_pelajaran || 'MATA PELAJARAN';
  const namaSekolah = appSettings?.nama_sekolah || 'SMK NEGERI 1';
  const lokasi = activeMapel?.lokasi_penetapan || 'ALAMAT';
  const tahunPenetapan = new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print-container">
      {/* Header Actions - Hidden when printing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Book className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 leading-tight">Halaman Sampul</h2>
            <p className="text-xs text-slate-500">Sampul Perangkat Pembelajaran</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="border-slate-300">
            <Printer className="w-4 h-4 mr-2" />
            Cetak Sampul
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Form Settings */}
        <Card className="bg-slate-50/50 shadow-sm border-slate-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Pengaturan Sampul</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Judul Dokumen</Label>
                <Input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Contoh: BUKU KERJA GURU" className="bg-white uppercase font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Tahun Pelajaran</Label>
                <Input value={tahunPelajaran} onChange={e => setTahunPelajaran(e.target.value)} placeholder="Contoh: 2024/2025" className="bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Kelas</Label>
                <Input value={kelas} onChange={e => setKelas(e.target.value)} placeholder="Contoh: XII (GANJIL & GENAP)" className="bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Daftar Isi / Kelengkapan (Tiap baris jadi 1 nomor)</Label>
              <Textarea 
                value={daftarIsi} 
                onChange={e => setDaftarIsi(e.target.value)} 
                className="bg-white min-h-[200px]" 
                placeholder="PROGRAM TAHUNAN..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Small screen preview notice */}
        <div className="lg:hidden text-center text-slate-500 text-sm py-4">
          Pratinjau kertas tersedia di bawah.
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 no-print">Preview (Pratinjau A4)</h3>
        
        {/* A4 Paper Container */}
        <div className="flex justify-center bg-slate-200 p-4 md:p-8 rounded-xl overflow-x-auto no-print">
          <div className="bg-white shadow-xl a4-paper w-[210mm] min-h-[297mm] p-[15mm] shrink-0 mx-auto relative printable-area">
            {/* Outer Border (Triple Line effect) */}
            <div className="w-full h-full border-[6px] border-double border-black p-[2mm]">
              {/* Inner Border */}
              <div className="w-full h-full border-2 border-black flex flex-col justify-between items-center py-20 px-10 text-center">
                
                {/* Top Section */}
                <div className="space-y-8 mt-10">
                  <h1 className="text-3xl font-extrabold uppercase tracking-widest">{judul}</h1>
                  <h2 className="text-2xl font-bold uppercase">{mataPelajaran}</h2>
                  <p className="text-lg font-medium">Tahun Pelajaran : {tahunPelajaran}</p>
                </div>

                {/* Middle Section (Optional Logo or just blank space as in screenshot) */}
                <div className="flex-1 flex flex-col justify-center items-center my-16 w-full">
                  {appSettings?.url_logo ? (
                    <img src={appSettings.url_logo} alt="Logo" className="w-40 h-40 object-contain" />
                  ) : (
                    <div className="w-full max-w-sm">
                      {/* Daftar Isi Preview (Optional, usually in next page, but some put it on cover) 
                          Screenshot didn't show daftar isi on cover, just title and footer. 
                          I will render it as a list if they want it. But based on screenshot, it's just blank space in the middle.
                      */}
                    </div>
                  )}
                </div>

                {/* Bottom Section */}
                <div className="space-y-2 mb-10 w-full flex flex-col items-center">
                  <p className="text-sm font-medium">Disusun Oleh :</p>
                  <p className="text-lg font-extrabold underline uppercase">{guruName}</p>
                  <p className="text-sm font-bold">NIP. {nip}</p>
                  
                  <div className="mt-8 space-y-1">
                    <h3 className="text-xl font-extrabold uppercase">{namaSekolah}</h3>
                    <h4 className="text-md font-bold uppercase">{lokasi}</h4>
                    <h4 className="text-md font-bold uppercase">TAHUN {tahunPenetapan}</h4>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Print Version (Only visible when printing) */}
        <div className="hidden print-only bg-white w-full h-[99vh]">
          <div className="w-full h-full p-[10mm] mx-auto relative">
            <div className="w-full h-full border-[6px] border-double border-black p-[2mm]">
              <div className="w-full h-full border-2 border-black flex flex-col justify-between items-center py-20 px-10 text-center">
                
                <div className="space-y-8 mt-10">
                  <h1 className="text-3xl font-extrabold uppercase tracking-widest">{judul}</h1>
                  <h2 className="text-2xl font-bold uppercase">{mataPelajaran}</h2>
                  <p className="text-lg font-medium">Tahun Pelajaran : {tahunPelajaran}</p>
                </div>

                <div className="flex-1 flex justify-center items-center my-16">
                  {appSettings?.url_logo && (
                    <img src={appSettings.url_logo} alt="Logo" className="w-40 h-40 object-contain" />
                  )}
                </div>

                <div className="space-y-2 mb-10 w-full flex flex-col items-center">
                  <p className="text-sm font-medium">Disusun Oleh :</p>
                  <p className="text-lg font-extrabold underline uppercase">{guruName}</p>
                  <p className="text-sm font-bold">NIP. {nip}</p>
                  
                  <div className="mt-8 space-y-1">
                    <h3 className="text-xl font-extrabold uppercase">{namaSekolah}</h3>
                    <h4 className="text-md font-bold uppercase">{lokasi}</h4>
                    <h4 className="text-md font-bold uppercase">TAHUN {tahunPenetapan}</h4>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
