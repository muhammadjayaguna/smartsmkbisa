'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface LaporanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
  isAdmin?: boolean;
}

export default function LaporanKerusakanForm({ isOpen, onClose, onSuccess, editData, isAdmin }: LaporanFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventaris, setInventaris] = useState<any[]>([]);

  const [formData, setFormData] = useState(
    editData || {
      jenis_kerusakan: 'Kerusakan Barang',
      barang_id: 'none',
      lokasi: '',
      deskripsi: '',
      tingkat_urgensi: 'Sedang',
      status: 'Menunggu',
      tanggapan: ''
    }
  );

  useEffect(() => {
    // Fetch barang list for dropdown
    const fetchBarang = async () => {
      const { data } = await supabase.from('inventaris_barang').select('id, nama_barang, kode_barang, lokasi');
      if (data) setInventaris(data);
    };
    fetchBarang();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast({ title: 'Error', description: 'Anda belum login', variant: 'destructive' });
    setLoading(true);

    try {
      const payload: any = {
        jenis_kerusakan: formData.jenis_kerusakan,
        lokasi: formData.lokasi,
        deskripsi: formData.deskripsi,
        tingkat_urgensi: formData.tingkat_urgensi,
      };

      if (formData.barang_id !== 'none') {
        payload.barang_id = formData.barang_id;
      } else {
        payload.barang_id = null;
      }

      // If Admin editing
      if (isAdmin && editData) {
        payload.status = formData.status;
        payload.tanggapan = formData.tanggapan;
      }

      if (editData) {
        const { error } = await supabase.from('laporan_kerusakan').update(payload).eq('id', editData.id);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Laporan berhasil diperbarui' });
      } else {
        payload.pelapor_id = user.db_id || user.id;
        const { error } = await supabase.from('laporan_kerusakan').insert([payload]);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Laporan berhasil dikirim' });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Gagal menyimpan laporan: ' + error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? (isAdmin ? 'Tanggapi Laporan' : 'Edit Laporan') : 'Buat Laporan Kerusakan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Jenis Kerusakan</Label>
            <Select 
              value={formData.jenis_kerusakan} 
              onValueChange={(val) => setFormData({...formData, jenis_kerusakan: val})}
              disabled={isAdmin && !!editData}
            >
              <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Kerusakan Barang">Kerusakan Barang/Alat</SelectItem>
                <SelectItem value="Fasilitas Ruangan">Fasilitas Ruangan (AC, Lampu, dll)</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.jenis_kerusakan === 'Kerusakan Barang' && (
            <div className="space-y-2">
              <Label>Barang yang Rusak</Label>
              <Select 
                value={formData.barang_id} 
                onValueChange={(val) => setFormData({...formData, barang_id: val})}
                disabled={isAdmin && !!editData}
              >
                <SelectTrigger><SelectValue placeholder="Pilih Barang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Bukan dari daftar inventaris --</SelectItem>
                  {inventaris.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.kode_barang} - {b.nama_barang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Lokasi Kejadian / Barang</Label>
            <Input 
              value={formData.lokasi} 
              onChange={(e) => setFormData({...formData, lokasi: e.target.value})} 
              required 
              placeholder="Lab TJKT 1, Meja Guru" 
              disabled={isAdmin && !!editData}
            />
          </div>

          <div className="space-y-2">
            <Label>Tingkat Urgensi</Label>
            <Select 
              value={formData.tingkat_urgensi} 
              onValueChange={(val) => setFormData({...formData, tingkat_urgensi: val})}
              disabled={isAdmin && !!editData}
            >
              <SelectTrigger><SelectValue placeholder="Tingkat Urgensi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rendah">Rendah (Bisa ditunda)</SelectItem>
                <SelectItem value="Sedang">Sedang</SelectItem>
                <SelectItem value="Tinggi">Tinggi (Mengganggu KBM)</SelectItem>
                <SelectItem value="Mendesak">Mendesak (Bahaya/Darurat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi Kerusakan</Label>
            <Textarea 
              value={formData.deskripsi} 
              onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} 
              required 
              placeholder="Jelaskan secara detail bagian yang rusak..." 
              disabled={isAdmin && !!editData}
            />
          </div>

          {isAdmin && editData && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h3 className="font-bold text-slate-800">Tanggapan Sarpras</h3>
              <div className="space-y-2">
                <Label>Status Tindak Lanjut</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Menunggu">Menunggu</SelectItem>
                    <SelectItem value="Diproses">Sedang Diproses (Diperbaiki)</SelectItem>
                    <SelectItem value="Selesai">Selesai (Diperbaiki)</SelectItem>
                    <SelectItem value="Ditolak">Ditolak / Tidak Dapat Diperbaiki</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catatan Teknisi / Sarpras</Label>
                <Textarea 
                  value={formData.tanggapan || ''} 
                  onChange={(e) => setFormData({...formData, tanggapan: e.target.value})} 
                  placeholder="Sparepart sedang dipesan..." 
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isAdmin && editData ? 'Simpan Tanggapan' : 'Kirim Laporan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
