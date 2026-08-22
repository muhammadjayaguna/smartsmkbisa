'use client';
import React, { useState } from 'react';
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

interface PengadaanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
  isAdmin?: boolean;
}

export default function PengadaanForm({ isOpen, onClose, onSuccess, editData, isAdmin }: PengadaanFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>(
    editData || {
      nama_barang: '',
      spesifikasi: '',
      jumlah: '1',
      estimasi_harga: '',
      alasan: '',
      status: 'Menunggu Kajur',
      tanggapan: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast({ title: 'Error', description: 'Anda belum login', variant: 'destructive' });
    setLoading(true);

    try {
      const payload: any = {
        nama_barang: formData.nama_barang,
        spesifikasi: formData.spesifikasi,
        jumlah: parseInt(formData.jumlah),
        estimasi_harga: formData.estimasi_harga ? parseFloat(formData.estimasi_harga) : 0,
        alasan: formData.alasan,
      };

      if (isAdmin && editData) {
        payload.status = formData.status;
        payload.tanggapan = formData.tanggapan;
      }

      if (editData) {
        const { error } = await supabase.from('pengajuan_pengadaan').update(payload).eq('id', editData.id);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Pengajuan berhasil diperbarui' });
      } else {
        payload.pengaju_id = user.db_id || user.id;
        payload.status = 'Menunggu Kajur';
        const { error } = await supabase.from('pengajuan_pengadaan').insert([payload]);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Pengajuan pengadaan berhasil dikirim' });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Gagal menyimpan data: ' + error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? (isAdmin ? 'Review Pengajuan' : 'Edit Pengajuan') : 'Buat Pengajuan Pengadaan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nama Barang yang Dibutuhkan</Label>
            <Input 
              value={formData.nama_barang} 
              onChange={(e) => setFormData({...formData, nama_barang: e.target.value})} 
              required 
              placeholder="Contoh: Router Mikrotik RB951" 
              disabled={isAdmin && !!editData}
            />
          </div>

          <div className="space-y-2">
            <Label>Spesifikasi Detail</Label>
            <Textarea 
              value={formData.spesifikasi} 
              onChange={(e) => setFormData({...formData, spesifikasi: e.target.value})} 
              required 
              placeholder="Cantumkan merk, tipe, dan spesifikasi teknis agar tidak salah beli..." 
              disabled={isAdmin && !!editData}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jumlah Barang</Label>
              <Input 
                type="number"
                min="1"
                value={formData.jumlah} 
                onChange={(e) => setFormData({...formData, jumlah: e.target.value})} 
                required 
                disabled={isAdmin && !!editData}
              />
            </div>
            <div className="space-y-2">
              <Label>Estimasi Harga (Total) Rp</Label>
              <Input 
                type="number"
                value={formData.estimasi_harga} 
                onChange={(e) => setFormData({...formData, estimasi_harga: e.target.value})} 
                required 
                placeholder="0"
                disabled={isAdmin && !!editData}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alasan Kebutuhan</Label>
            <Textarea 
              value={formData.alasan} 
              onChange={(e) => setFormData({...formData, alasan: e.target.value})} 
              required 
              placeholder="Mengapa barang ini sangat dibutuhkan untuk kegiatan KBM?" 
              disabled={isAdmin && !!editData}
            />
          </div>

          {isAdmin && editData && (
            <div className="mt-6 pt-6 border-t space-y-4 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-bold text-slate-800">Keputusan Sarpras / Kepsek</h3>
              <div className="space-y-2">
                <Label>Status Persetujuan</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Menunggu Kajur">Menunggu Kajur</SelectItem>
                    <SelectItem value="Menunggu Waka Sarpras">Menunggu Waka Sarpras</SelectItem>
                    <SelectItem value="Menunggu Bendahara BOS">Menunggu Bendahara BOS</SelectItem>
                    <SelectItem value="Disetujui">Disetujui (Menunggu Pembelian)</SelectItem>
                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                    <SelectItem value="Selesai">Selesai (Barang Tersedia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggapan / Catatan</Label>
                <Textarea 
                  className="bg-white"
                  value={formData.tanggapan || ''} 
                  onChange={(e) => setFormData({...formData, tanggapan: e.target.value})} 
                  placeholder="Dana BOS cair bulan depan..." 
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isAdmin && editData ? 'Simpan Keputusan' : 'Kirim Pengajuan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
