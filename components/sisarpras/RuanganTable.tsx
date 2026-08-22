'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit2, Trash2, Map } from 'lucide-react';
import RuanganForm from './RuanganForm';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

export default function RuanganTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('data_ruangan').select('*').order('nama_ruangan', { ascending: true });
    if (search) {
      query = query.or(`nama_ruangan.ilike.%${search}%,kode_ruangan.ilike.%${search}%,penanggung_jawab.ilike.%${search}%`);
    }
    const { data: ruangan, error } = await query;
    if (!error && ruangan) setData(ruangan);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id: string, nama: string) => {
    if(confirm(`Yakin ingin menghapus ruangan "${nama}"?`)) {
      const { error } = await supabase.from('data_ruangan').delete().eq('id', id);
      if(error) toast({ title: 'Error', description: 'Gagal menghapus data', variant: 'destructive' });
      else {
        toast({ title: 'Sukses', description: 'Ruangan berhasil dihapus' });
        fetchData();
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Cari nama atau kode ruangan..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Ruangan
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Kode</th>
              <th className="px-6 py-4 font-semibold">Nama Ruangan</th>
              <th className="px-6 py-4 font-semibold text-center">Kapasitas</th>
              <th className="px-6 py-4 font-semibold">Penanggung Jawab</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Tidak ada data ruangan ditemukan</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-600">{item.kode_ruangan}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${item.jenis_ruangan === 'Kelas' ? 'bg-blue-100 text-blue-700' : 
                          item.jenis_ruangan === 'Lab' ? 'bg-indigo-100 text-indigo-700' : 
                          item.jenis_ruangan === 'Bengkel' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}
                      `}>
                        {item.jenis_ruangan}
                      </span>
                      <span className="font-semibold text-slate-800">{item.nama_ruangan}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-700">
                    {item.kapasitas} <span className="text-xs font-normal text-slate-400">org</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.penanggung_jawab || <span className="text-slate-400 italic">Belum diatur</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setIsFormOpen(true); }}>
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id, item.nama_ruangan)} className="hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <RuanganForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchData} 
          editData={editingItem}
        />
      )}
    </div>
  );
}
