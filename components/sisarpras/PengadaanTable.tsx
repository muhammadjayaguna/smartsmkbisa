'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, AlertTriangle, Clock, ShoppingCart } from 'lucide-react';
import PengadaanForm from './PengadaanForm';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/components/ui/use-toast';

export default function PengadaanTable() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === 'admin' || role === 'kepala_sekolah';
  const isKajur = role === 'kajur' || role === 'admin';
  const isSarpras = role === 'waka_sarpras' || role === 'admin';
  const isBendahara = role === 'bendahara_bos' || role === 'admin';
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    if(!user) return;
    setLoading(true);
    let query = supabase.from('pengajuan_pengadaan')
      .select('*, pengaju:users(nama, email)')
      .order('created_at', { ascending: false });
    
    if (!isAdmin && !isKajur && !isSarpras && !isBendahara) {
      query = query.eq('pengaju_id', user.db_id || user.id);
    }
    
    const { data: list, error } = await query;
    if (!error && list) setData(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const handleUpdateStatus = async (id: string, status: string) => {
    if(confirm(`Yakin mengubah status menjadi: ${status}?`)) {
      const { error } = await supabase.from('pengajuan_pengadaan').update({ status }).eq('id', id);
      if(error) toast({ title: 'Error', description: 'Gagal update status', variant: 'destructive' });
      else {
        toast({ title: 'Sukses', description: 'Status berhasil diperbarui' });
        fetchData();
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 hidden sm:block">Daftar Pengajuan Pengadaan</h3>
        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
          <ShoppingCart className="w-4 h-4 mr-2" /> Ajukan Barang
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Tgl Pengajuan</th>
              <th className="px-6 py-4 font-semibold">Pengaju</th>
              <th className="px-6 py-4 font-semibold">Nama Barang</th>
              <th className="px-6 py-4 font-semibold text-center">Jumlah</th>
              <th className="px-6 py-4 font-semibold text-right">Est. Harga</th>
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
                  <ShoppingCart className="w-12 h-12 text-amber-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Belum ada pengajuan pengadaan barang</p>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const currentStatus = item.status || 'Menunggu Kajur';
                return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{item.pengaju?.nama || item.pengaju?.email?.split('@')[0]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.nama_barang}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.spesifikasi}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {item.jumlah}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-600">
                    Rp {item.estimasi_harga?.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {currentStatus.startsWith('Menunggu') && <Clock className="w-4 h-4 text-amber-500" />}
                      {currentStatus === 'Disetujui' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {currentStatus === 'Ditolak' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {currentStatus === 'Selesai' && <ShoppingCart className="w-4 h-4 text-blue-500" />}
                      <span className="font-semibold text-slate-700">{currentStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2 items-center h-full">
                    {currentStatus === 'Menunggu Kajur' && isKajur && (
                      <Button size="sm" onClick={() => handleUpdateStatus(item.id, 'Menunggu Waka Sarpras')} className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2 h-7">Setuju (Kajur)</Button>
                    )}
                    {currentStatus === 'Menunggu Waka Sarpras' && isSarpras && (
                      <Button size="sm" onClick={() => handleUpdateStatus(item.id, 'Menunggu Bendahara BOS')} className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2 h-7">Setuju (Sarpras)</Button>
                    )}
                    {currentStatus === 'Menunggu Bendahara BOS' && isBendahara && (
                      <Button size="sm" onClick={() => handleUpdateStatus(item.id, 'Disetujui')} className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2 h-7">Setuju (BOS)</Button>
                    )}
                    {currentStatus.startsWith('Menunggu') && (isAdmin || isKajur || isSarpras || isBendahara) && (
                      <Button size="sm" onClick={() => handleUpdateStatus(item.id, 'Ditolak')} variant="destructive" className="text-xs px-2 h-7">Tolak</Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setEditingItem(item); setIsFormOpen(true); }}
                      className={`h-7 px-2 text-xs ${isAdmin ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : ''}`}
                    >
                      {isAdmin ? 'Review' : 'Detail'}
                    </Button>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <PengadaanForm 
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
