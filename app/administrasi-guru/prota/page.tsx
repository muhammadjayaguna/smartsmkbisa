'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, Printer, Save, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function ProtaPromesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { activeMapel, loading: contextLoading } = useSisminjar();
  const [atpList, setAtpList] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const uid = user.db_id || user.id;
      const { data: pgData } = await supabase.from('pengaturan_guru').select('*').eq('guru_id', uid).maybeSingle();
      if (pgData) setPengaturan(pgData);

      const { data: atpData } = await supabase.from('atp').select('*').eq('guru_id', uid).order('urutan', { ascending: true });
      if (atpData) setAtpList(atpData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || contextLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const mapel = activeMapel?.mata_pelajaran || 'Mata Pelajaran';
  const sem1 = atpList.filter(t => t.semester === 1);
  const sem2 = atpList.filter(t => t.semester === 2);
  const totalJP = atpList.reduce((s: number, t: any) => s + (t.jp || 0), 0);

  const months1 = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const months2 = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print:pt-[1.5cm] print:pb-[1.5cm] print:px-[1.5cm]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Program Tahunan & Program Semester</h2>
            <p className="text-xs text-slate-500">{mapel} · Total {totalJP} JP/Tahun</p>
          </div>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="border-slate-300">
          <Printer className="w-4 h-4 mr-2" /> Cetak Prota/Promes
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 no-print">
        <CardContent className="p-4">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-amber-700">📋 Info:</span> Data Prota & Promes diambil secara otomatis dari <span className="font-bold">Alur Tujuan Pembelajaran (ATP)</span> yang sudah Anda buat/generate sebelumnya. Pastikan ATP sudah terisi untuk melihat data di sini.
          </p>
        </CardContent>
      </Card>

      {atpList.length === 0 ? (
        <Card className="bg-slate-50"><CardContent className="p-12 flex flex-col items-center text-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700">Belum ada data ATP</h4>
          <p className="text-sm text-slate-500 mt-1">Buat ATP terlebih dahulu di menu "Alur Tujuan Pemb." agar Prota & Promes bisa ditampilkan.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* PROTA */}
          <h3 className="font-bold text-slate-700 text-lg">📘 Program Tahunan (Prota)</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm print:text-base print:border-collapse print-table">
                <thead>
                  <tr className="hidden print:table-row print:border-transparent print:border-none">
                    <td colSpan={6} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                  </tr>
                  <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 print:bg-gray-100 print:border-black">
                    <th className="p-4 text-left font-bold text-slate-600 w-[60px] print:text-black print:border print:border-black print:text-center align-middle">No</th>
                    <th className="p-4 text-left font-bold text-slate-600 w-[80px] print:text-black print:border print:border-black print:text-center align-middle">Kode</th>
                    <th className="p-4 text-left font-bold text-slate-600 print:text-black print:border print:border-black print:text-center align-middle">Tujuan Pembelajaran</th>
                    <th className="p-4 text-center font-bold text-slate-600 w-[60px] print:text-black print:border print:border-black align-middle">JP</th>
                    <th className="p-4 text-center font-bold text-slate-600 w-[100px] print:text-black print:border print:border-black align-middle">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {atpList.map((tp, idx) => (
                    <tr key={tp.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} print:border-black print:bg-white print:break-inside-avoid`}>
                      <td className="p-4 text-slate-500 print:text-black print:border print:border-black print:text-center align-top">{idx + 1}</td>
                      <td className="p-4 font-bold text-blue-600 print:text-black print:border print:border-black print:text-center align-top">{tp.kode}</td>
                      <td className="p-4 text-slate-700 leading-relaxed print:text-black print:border print:border-black print:text-left align-top">{tp.tujuan}</td>
                      <td className="p-4 text-center print:border print:border-black align-top"><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full print:bg-transparent print:text-black print:text-base">{tp.jp}</span></td>
                      <td className="p-4 text-center print:border print:border-black align-top">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tp.semester === 1 ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'} print:bg-transparent print:text-black print:text-base`}>Sem {tp.semester}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50 border-t-2 border-amber-200 print:bg-gray-100 print:border-black print:break-inside-avoid">
                    <td colSpan={3} className="p-4 font-extrabold text-slate-700 print:text-black print:border print:border-black">Total JP per Tahun</td>
                    <td className="p-4 text-center print:border print:border-black"><span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-full print:bg-transparent print:text-black print:text-base">{totalJP} JP</span></td>
                    <td className="print:border print:border-black"></td>
                  </tr>
                </tbody>
                <tfoot className="hidden print:table-footer-group print:border-none print:border-transparent">
                  <tr className="print:border-none print:border-transparent">
                    <td colSpan={6} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* PROMES */}
          <h3 className="font-bold text-slate-700 text-lg mt-8">📙 Program Semester (Promes)</h3>

          {/* Semester 1 */}
          <Card className="border-amber-200/60 overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <div className="bg-gradient-to-r from-amber-100 to-amber-50 px-5 py-3 border-b border-amber-200 print:bg-transparent print:border-none print:px-0">
              <h4 className="font-bold text-amber-800 print:text-black print:text-lg">Semester 1 (Ganjil) — {sem1.reduce((s: number, t: any) => s + (t.jp || 0), 0)} JP</h4>
            </div>
            <CardContent className="p-0 print:p-0">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-xs print:text-sm print:border-collapse print-table">
                  <thead>
                    <tr className="hidden print:table-row print:border-transparent print:border-none">
                      <td colSpan={12} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                    </tr>
                    <tr className="bg-slate-50 border-b print:bg-gray-100 print:border-black">
                      <th className="p-3 text-left font-bold text-slate-500 w-[60px] print:text-black print:border print:border-black print:text-center align-middle">Kode</th>
                      <th className="p-3 text-left font-bold text-slate-500 print:text-black print:border print:border-black print:text-center align-middle">Tujuan Pembelajaran</th>
                      <th className="p-3 text-center font-bold text-slate-500 w-[40px] print:text-black print:border print:border-black align-middle">JP</th>
                      {months1.map(m => <th key={m} className="p-2 text-center font-bold text-slate-500 w-[50px] print:text-black print:border print:border-black align-middle">{m.slice(0, 3)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sem1.map((tp: any, idx: number) => (
                      <tr key={tp.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} print:border-black print:bg-white print:break-inside-avoid`}>
                        <td className="p-3 font-bold text-blue-600 print:text-black print:border print:border-black print:text-center align-top">{tp.kode}</td>
                        <td className="p-3 text-slate-700 max-w-[200px] truncate print:max-w-none print:whitespace-normal print:text-black print:border print:border-black print:text-left align-top">{tp.tujuan}</td>
                        <td className="p-3 text-center font-bold print:border print:border-black align-top">{tp.jp}</td>
                        {months1.map((m, mi) => (
                          <td key={m} className="p-2 text-center print:border print:border-black align-middle">
                            {mi === idx % months1.length ? <div className="w-6 h-4 bg-amber-400 rounded mx-auto print:border print:border-black print:bg-black"></div> : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="hidden print:table-footer-group print:border-none print:border-transparent">
                    <tr className="print:border-none print:border-transparent">
                      <td colSpan={12} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Semester 2 */}
          <Card className="border-purple-200/60 overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <div className="bg-gradient-to-r from-purple-100 to-purple-50 px-5 py-3 border-b border-purple-200 print:bg-transparent print:border-none print:px-0">
              <h4 className="font-bold text-purple-800 print:text-black print:text-lg">Semester 2 (Genap) — {sem2.reduce((s: number, t: any) => s + (t.jp || 0), 0)} JP</h4>
            </div>
            <CardContent className="p-0 print:p-0">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-xs print:text-sm print:border-collapse print-table">
                  <thead>
                    <tr className="hidden print:table-row print:border-transparent print:border-none">
                      <td colSpan={12} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                    </tr>
                    <tr className="bg-slate-50 border-b print:bg-gray-100 print:border-black">
                      <th className="p-3 text-left font-bold text-slate-500 w-[60px] print:text-black print:border print:border-black print:text-center align-middle">Kode</th>
                      <th className="p-3 text-left font-bold text-slate-500 print:text-black print:border print:border-black print:text-center align-middle">Tujuan Pembelajaran</th>
                      <th className="p-3 text-center font-bold text-slate-500 w-[40px] print:text-black print:border print:border-black align-middle">JP</th>
                      {months2.map(m => <th key={m} className="p-2 text-center font-bold text-slate-500 w-[50px] print:text-black print:border print:border-black align-middle">{m.slice(0, 3)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sem2.map((tp: any, idx: number) => (
                      <tr key={tp.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} print:border-black print:bg-white print:break-inside-avoid`}>
                        <td className="p-3 font-bold text-blue-600 print:text-black print:border print:border-black print:text-center align-top">{tp.kode}</td>
                        <td className="p-3 text-slate-700 max-w-[200px] truncate print:max-w-none print:whitespace-normal print:text-black print:border print:border-black print:text-left align-top">{tp.tujuan}</td>
                        <td className="p-3 text-center font-bold print:border print:border-black align-top">{tp.jp}</td>
                        {months2.map((m, mi) => (
                          <td key={m} className="p-2 text-center print:border print:border-black align-middle">
                            {mi === idx % months2.length ? <div className="w-6 h-4 bg-purple-400 rounded mx-auto print:border print:border-black print:bg-black"></div> : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="hidden print:table-footer-group print:border-none print:border-transparent">
                    <tr className="print:border-none print:border-transparent">
                      <td colSpan={12} style={{ height: '1cm' }} className="print:border-none print:border-transparent bg-white"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
