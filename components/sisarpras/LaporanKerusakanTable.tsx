'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit2, Wrench, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import LaporanKerusakanForm from './LaporanKerusakanForm';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export default function LaporanKerusakanTable() {
  const { user } = useAuth();
  const { role, isTeknisi } = useUserRole();
  const isAdmin = role === 'admin' || role === 'kepala_sekolah' || role === 'waka_sarpras' || isTeknisi;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    if(!user) return;
    setLoading(true);
    let query = supabase.from('laporan_kerusakan')
      .select('*, pelapor:users(nama, email), barang:inventaris_barang(nama_barang, kode_barang)')
      .order('created_at', { ascending: false });
    
    // If not admin, only see own reports
    if (!isAdmin) {
      query = query.eq('pelapor_id', user.db_id || user.id);
    }
    
    const { data: laporan, error } = await query;
    if (!error && laporan) setData(laporan);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 hidden sm:block">Daftar Tiket Laporan</h3>
        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
          <Wrench className="w-4 h-4 mr-2" /> Buat Laporan
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Tgl Lapor</th>
              <th className="px-6 py-4 font-semibold">Pelapor</th>
              <th className="px-6 py-4 font-semibold">Kerusakan</th>
              <th className="px-6 py-4 font-semibold">Lokasi</th>
              <th className="px-6 py-4 font-semibold">Urgensi</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Belum ada laporan kerusakan</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{item.pelapor?.nama || item.pelapor?.email?.split('@')[0]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.jenis_kerusakan}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.deskripsi}</div>
                    {item.barang && (
                      <div className="text-[10px] mt-1 bg-slate-100 p-1 rounded font-mono inline-block">
                        {item.barang.kode_barang}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.lokasi}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                      ${item.tingkat_urgensi === 'Rendah' ? 'bg-slate-100 text-slate-600' : 
                        item.tingkat_urgensi === 'Sedang' ? 'bg-blue-100 text-blue-700' :
                        item.tingkat_urgensi === 'Tinggi' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                    `}>
                      {item.tingkat_urgensi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {item.status === 'Menunggu' && <Clock className="w-4 h-4 text-amber-500" />}
                      {item.status === 'Diproses' && <Wrench className="w-4 h-4 text-blue-500" />}
                      {item.status === 'Selesai' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {item.status === 'Ditolak' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className="font-semibold text-slate-700">{item.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setEditingItem(item); setIsFormOpen(true); }}
                      className={isAdmin ? 'border-indigo-200 text-indigo-700 hover:bg-indigo-50' : ''}
                    >
                      {isAdmin ? 'Tanggapi' : 'Detail'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <LaporanKerusakanForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchData} 
          editData={editingItem}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
