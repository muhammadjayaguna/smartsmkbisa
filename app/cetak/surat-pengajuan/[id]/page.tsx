'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Printer, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CetakSuratPengajuan() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const { data: pData, error } = await supabase
          .from('pengajuan_magang')
          .select('*, siswa(nama, nisn), dudika(nama_perusahaan, alamat)')
          .eq('id', id)
          .single();
        
        if (!error && pData) {
          setData(pData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    // Auto trigger print dialog after 1s if data is loaded
    if (!loading && data) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-teal-600 h-10 w-10" /></div>;
  if (!data) return <div className="text-center mt-20 text-red-500 font-bold">Data pengajuan tidak ditemukan.</div>;

  const handlePrint = () => window.print();

  // Tanggal Hari Ini
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-slate-200 min-h-screen py-8 print:py-0 print:bg-white text-slate-900 font-serif">
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
        <div className="text-sm text-slate-500 flex items-center gap-1 bg-white px-3 py-1.5 rounded shadow-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Preview Cetak Surat
        </div>
        <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg">
          <Printer className="mr-2 h-4 w-4" /> Cetak (A4)
        </Button>
      </div>

      {/* Kertas A4 */}
      <div 
        className="bg-white mx-auto shadow-xl print:shadow-none text-black relative" 
        style={{ width: '210mm', minHeight: '297mm', padding: '25mm' }}
      >
        {/* KOP SURAT */}
        <div className="border-b-4 border-black pb-4 mb-8 flex items-center justify-between">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            {/* Logo Placeholder */}
            <span className="text-slate-400 text-xs text-center font-sans">Logo<br/>Sekolah</span>
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-bold uppercase tracking-wide">Pemerintah Provinsi Kalimantan Selatan</h1>
            <h2 className="text-2xl font-bold uppercase mt-1">SMK Negeri 1 Banjarmasin</h2>
            <p className="text-sm mt-2">Jl. Mulawarman No.45, Teluk Dalam, Kec. Banjarmasin Tengah, Kota Banjarmasin</p>
            <p className="text-sm">Telepon: (0511) 335XXXX | Email: info@smkn1bjm.sch.id</p>
          </div>
        </div>

        {/* Info Surat */}
        <div className="flex justify-between mb-8">
          <div>
            <p>Nomor<span className="inline-block w-8 text-center">:</span>421.5 / <span className="font-bold">{data.id.substring(0,4).toUpperCase()}</span> / SMKN1 / {new Date().getFullYear()}</p>
            <p>Lampiran<span className="inline-block w-4 text-center">:</span>-</p>
            <p>Perihal<span className="inline-block w-7 text-center">:</span><strong>Permohonan Tempat Magang (Prakerin)</strong></p>
          </div>
          <div>
            <p>Banjarmasin, {today}</p>
          </div>
        </div>

        {/* Tujuan */}
        <div className="mb-10">
          <p>Yth. Pimpinan</p>
          <p className="font-bold">{data.dudika?.nama_perusahaan}</p>
          <p className="max-w-[250px]">{data.dudika?.alamat}</p>
          <p>di Tempat</p>
        </div>

        {/* Isi Surat */}
        <div className="space-y-4 leading-relaxed text-justify">
          <p>Dengan hormat,</p>
          <p>Dalam rangka meningkatkan kompetensi siswa dan menyelaraskan pendidikan vokasi dengan kebutuhan dunia usaha/dunia industri (DUDIKA), maka SMK Negeri 1 Banjarmasin bermaksud memohon perkenan Bapak/Ibu untuk dapat menerima siswa/i kami melaksanakan Praktik Kerja Industri (Prakerin) di instansi/perusahaan yang Bapak/Ibu pimpin.</p>
          <p>Adapun data siswa yang diajukan adalah sebagai berikut:</p>
          
          <div className="pl-8 mb-4">
            <table className="w-full max-w-sm mt-2">
              <tbody>
                <tr>
                  <td className="w-32 py-1">Nama Lengkap</td>
                  <td className="w-4">:</td>
                  <td className="font-bold">{data.siswa?.nama}</td>
                </tr>
                <tr>
                  <td className="py-1">NISN</td>
                  <td>:</td>
                  <td>{data.siswa?.nisn}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>Besar harapan kami agar Bapak/Ibu berkenan menerima permohonan ini. Atas perhatian dan kerjasamanya, kami mengucapkan terima kasih.</p>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-20 flex justify-end">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="mb-20 font-bold">Kepala Sekolah</p>
            <p className="font-bold underline">H. Dedi Hidayat, S.Pd, M.Pd</p>
            <p>NIP. 19751012 200501 1 005</p>
          </div>
        </div>
        
        {/* Footer info (optional for tracking) */}
        <div className="absolute bottom-10 left-[25mm] text-[10px] text-slate-400 font-sans">
          Generated by SiMagang - {data.id} - {new Date().toISOString()}
        </div>
      </div>
    </div>
  );
}
