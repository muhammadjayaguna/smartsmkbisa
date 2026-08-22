'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CetakSuratPeringatan() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const level = searchParams.get('level') || '1';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Fetch siswa
        const { data: siswaData } = await supabase
          .from('siswa')
          .select('*, rombel:rombel_id(nama_rombel)')
          .eq('id', id)
          .single();

        // Fetch 5 pelanggaran terakhir
        const { data: poinData } = await supabase
          .from('poin_siswa')
          .select('*')
          .eq('siswa_id', id)
          .eq('jenis', 'negatif')
          .order('tanggal', { ascending: false })
          .limit(5);

        // Fetch total negatif
        const { data: allNegatif } = await supabase
          .from('poin_siswa')
          .select('poin')
          .eq('siswa_id', id)
          .eq('jenis', 'negatif');
          
        const totalPoin = allNegatif?.reduce((acc, p) => acc + p.poin, 0) || 0;

        setData({
          siswa: siswaData,
          pelanggaran: poinData || [],
          totalPoin: totalPoin
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-red-600 h-10 w-10" /></div>;
  if (!data || !data.siswa) return <div className="text-center mt-20 text-red-500 font-bold">Data siswa tidak ditemukan.</div>;

  const handlePrint = () => {
    window.print();
  };

  const getTingkatSP = (lvl: string) => {
    if (lvl === '3') return 'III (Tiga) / Panggilan Orang Tua';
    if (lvl === '2') return 'II (Dua)';
    return 'I (Satu)';
  };

  const todayDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-200 py-8 font-serif">
      {/* Kontrol (Sembunyikan saat dicetak) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
        <Link href={`/sipoin/profil/${id}`}>
          <Button variant="outline" className="bg-white hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Profil
          </Button>
        </Link>
        <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg">
          <Printer className="w-4 h-4 mr-2" /> Cetak Surat (A4)
        </Button>
      </div>

      {/* Kertas A4 */}
      <div className="bg-white mx-auto shadow-2xl print:shadow-none print:m-0"
           style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
        
        {/* Kop Surat */}
        <div className="border-b-4 border-double border-black pb-4 mb-6 flex items-center justify-between">
          <div className="w-24 h-24 bg-slate-100 flex items-center justify-center border border-slate-300">
            <span className="text-xs text-slate-400">Logo</span>
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-bold uppercase tracking-wide">PEMERINTAH PROVINSI KALIMANTAN SELATAN</h1>
            <h2 className="text-lg font-bold uppercase">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
            <h3 className="text-2xl font-black mt-1">SMK NEGERI 1 BANJARMASIN</h3>
            <p className="text-sm mt-2">Jalan Mulawarman No. 45, Banjarmasin, Telp/Fax (0511) 3352216</p>
            <p className="text-xs">Website: smkn1bjm.sch.id | Email: info@smkn1bjm.sch.id</p>
          </div>
        </div>

        {/* Nomor & Tanggal */}
        <div className="flex justify-between mb-8 text-sm">
          <div>
            <table className="mt-2">
              <tbody>
                <tr><td className="w-20">Nomor</td><td>: 421.5 / SMKN1-BJM / SP{level} / {new Date().getFullYear()}</td></tr>
                <tr><td>Lampiran</td><td>: -</td></tr>
                <tr><td>Perihal</td><td>: <strong>Surat Peringatan {getTingkatSP(level)}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <p>Banjarmasin, {todayDate}</p>
          </div>
        </div>

        {/* Tujuan */}
        <div className="mb-8 text-sm leading-relaxed">
          <p>Kepada Yth.</p>
          <p>Bapak / Ibu Orang Tua / Wali Murid dari:</p>
          <p className="font-bold">{data.siswa.nama}</p>
          <p>di -</p>
          <p className="ml-8">Tempat</p>
        </div>

        {/* Isi Surat */}
        <div className="text-sm leading-relaxed text-justify space-y-4 mb-8">
          <p>Dengan hormat,</p>
          <p>
            Melalui surat ini, kami memberitahukan bahwa putra/putri Bapak/Ibu yang bernama di bawah ini:
          </p>
          <table className="w-full ml-8 mb-4">
            <tbody>
              <tr><td className="w-40 py-1">Nama Lengkap</td><td>: <strong>{data.siswa.nama}</strong></td></tr>
              <tr><td className="py-1">NISN</td><td>: {data.siswa.nisn}</td></tr>
              <tr><td className="py-1">Kelas / Rombel</td><td>: {data.siswa.rombel?.nama_rombel || '-'}</td></tr>
            </tbody>
          </table>
          <p>
            Telah melakukan pelanggaran tata tertib sekolah sehingga mengumpulkan Total Poin Pelanggaran sebanyak <strong>{data.totalPoin} Poin</strong>. Sesuai dengan peraturan yang berlaku di SMK Negeri 1 Banjarmasin, pencapaian poin tersebut dikenakan sanksi berupa <strong>Surat Peringatan {getTingkatSP(level)}</strong>.
          </p>
          <p>Berikut adalah catatan {data.pelanggaran.length} pelanggaran terakhir yang dilakukan:</p>
          
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black px-2 py-1">No</th>
                <th className="border border-black px-2 py-1">Tanggal</th>
                <th className="border border-black px-2 py-1">Kategori</th>
                <th className="border border-black px-2 py-1">Keterangan</th>
                <th className="border border-black px-2 py-1">Poin</th>
              </tr>
            </thead>
            <tbody>
              {data.pelanggaran.map((p: any, i: number) => (
                <tr key={p.id}>
                  <td className="border border-black px-2 py-1 text-center">{i+1}</td>
                  <td className="border border-black px-2 py-1 whitespace-nowrap">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="border border-black px-2 py-1">{p.kategori}</td>
                  <td className="border border-black px-2 py-1">{p.keterangan}</td>
                  <td className="border border-black px-2 py-1 text-center font-bold text-red-600">-{p.poin}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {level === '3' ? (
            <p className="mt-4 font-bold underline">
              Sehubungan dengan hal tersebut, kami mengundang Bapak/Ibu untuk hadir ke sekolah menemui Guru Bimbingan Konseling pada jam kerja untuk mendiskusikan tindak lanjut pembinaan siswa tersebut.
            </p>
          ) : (
            <p className="mt-4">
              Oleh karena itu, kami memohon kerja sama Bapak/Ibu untuk lebih meningkatkan pengawasan dan bimbingan terhadap putra/putrinya di rumah agar tidak mengulangi pelanggaran tata tertib sekolah di kemudian hari.
            </p>
          )}

          <p>Demikian surat peringatan ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-16 text-sm">
          <div className="text-center w-1/3">
            <p>Mengetahui,</p>
            <p>Orang Tua / Wali Murid</p>
            <br /><br /><br /><br />
            <p className="font-bold underline">(.......................................)</p>
          </div>
          <div className="text-center w-1/3">
            <p>&nbsp;</p>
            <p>Guru Bimbingan Konseling</p>
            <br /><br /><br /><br />
            <p className="font-bold underline">(.......................................)</p>
            <p>NIP. </p>
          </div>
          <div className="text-center w-1/3">
            <p>&nbsp;</p>
            <p>Wali Kelas</p>
            <br /><br /><br /><br />
            <p className="font-bold underline">(.......................................)</p>
            <p>NIP. </p>
          </div>
        </div>
        <div className="flex justify-center mt-8 text-sm">
          <div className="text-center w-1/3">
            <p>Menyetujui,</p>
            <p>Kepala Sekolah</p>
            <br /><br /><br /><br />
            <p className="font-bold underline">(.......................................)</p>
            <p>NIP. </p>
          </div>
        </div>

      </div>
    </div>
  );
}
