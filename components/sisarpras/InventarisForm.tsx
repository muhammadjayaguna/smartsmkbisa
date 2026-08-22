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

interface InventarisFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function InventarisForm({ isOpen, onClose, onSuccess, editData }: InventarisFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(
    editData || {
      kode_barang: '',
      nama_barang: '',
      kategori: 'Elektronik',
      merk: '',
      tahun_pengadaan: new Date().getFullYear().toString(),
      kondisi: 'Baik',
      jumlah: '1',
      lokasi: '',
      keterangan: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        jumlah: parseInt(formData.jumlah),
        tahun_pengadaan: parseInt(formData.tahun_pengadaan)
      };

      if (editData) {
        const { error } = await supabase.from('inventaris_barang').update(payload).eq('id', editData.id);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Data barang berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('inventaris_barang').insert([payload]);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Data barang berhasil ditambahkan' });
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
          <DialogTitle>{editData ? 'Edit Data Barang' : 'Tambah Data Barang Baru'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode_barang">Kode Barang</Label>
              <Input id="kode_barang" value={formData.kode_barang} onChange={(e) => setFormData({...formData, kode_barang: e.target.value})} required placeholder="Contoh: ELK-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_barang">Nama Barang</Label>
              <Input id="nama_barang" value={formData.nama_barang} onChange={(e) => setFormData({...formData, nama_barang: e.target.value})} required placeholder="Laptop Asus ROG" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={formData.kategori} onValueChange={(val) => setFormData({...formData, kategori: val})}>
                <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elektronik">Elektronik</SelectItem>
                  <SelectItem value="Mebel">Mebel (Furnitur)</SelectItem>
                  <SelectItem value="Alat Praktik">Alat Praktik</SelectItem>
                  <SelectItem value="Kendaraan">Kendaraan</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merk">Merk / Brand</Label>
              <Input id="merk" value={formData.merk} onChange={(e) => setFormData({...formData, merk: e.target.value})} placeholder="Asus" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun Pengadaan</Label>
              <Input id="tahun" type="number" value={formData.tahun_pengadaan} onChange={(e) => setFormData({...formData, tahun_pengadaan: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kondisi">Kondisi</Label>
              <Select value={formData.kondisi} onValueChange={(val) => setFormData({...formData, kondisi: val})}>
                <SelectTrigger><SelectValue placeholder="Kondisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baik">Baik</SelectItem>
                  <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                  <SelectItem value="Rusak Berat">Rusak Berat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah</Label>
              <Input id="jumlah" type="number" min="1" value={formData.jumlah} onChange={(e) => setFormData({...formData, jumlah: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi / Ruangan</Label>
              <Input id="lokasi" value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})} placeholder="Lab TJKT 1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan Tambahan</Label>
            <Textarea id="keterangan" value={formData.keterangan} onChange={(e) => setFormData({...formData, keterangan: e.target.value})} placeholder="Spesifikasi singkat, dll." />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Data
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
