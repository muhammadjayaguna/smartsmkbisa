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

interface RuanganFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function RuanganForm({ isOpen, onClose, onSuccess, editData }: RuanganFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(
    editData || {
      kode_ruangan: '',
      nama_ruangan: '',
      jenis_ruangan: 'Kelas',
      kapasitas: '36',
      penanggung_jawab: '',
      keterangan: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        kapasitas: parseInt(formData.kapasitas) || 0
      };

      if (editData) {
        const { error } = await supabase.from('data_ruangan').update(payload).eq('id', editData.id);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Data ruangan berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('data_ruangan').insert([payload]);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Data ruangan berhasil ditambahkan' });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Data Ruangan' : 'Tambah Data Ruangan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Kode Ruangan</Label>
            <Input 
              value={formData.kode_ruangan} 
              onChange={(e) => setFormData({...formData, kode_ruangan: e.target.value})} 
              required 
              placeholder="Contoh: R-X-TJKT-1" 
            />
          </div>

          <div className="space-y-2">
            <Label>Nama Ruangan / Lab</Label>
            <Input 
              value={formData.nama_ruangan} 
              onChange={(e) => setFormData({...formData, nama_ruangan: e.target.value})} 
              required 
              placeholder="Lab Teknik Jaringan Komputer dan Telekomunikasi 1" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jenis Ruangan</Label>
              <Select value={formData.jenis_ruangan} onValueChange={(val) => setFormData({...formData, jenis_ruangan: val})}>
                <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kelas">Ruang Kelas</SelectItem>
                  <SelectItem value="Lab">Laboratorium</SelectItem>
                  <SelectItem value="Bengkel">Bengkel Praktik</SelectItem>
                  <SelectItem value="Kantor">Kantor / Ruang Guru</SelectItem>
                  <SelectItem value="Gudang">Gudang</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kapasitas (Orang)</Label>
              <Input 
                type="number"
                min="0"
                value={formData.kapasitas} 
                onChange={(e) => setFormData({...formData, kapasitas: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Penanggung Jawab (Kepala Lab / Wali Kelas)</Label>
            <Input 
              value={formData.penanggung_jawab} 
              onChange={(e) => setFormData({...formData, penanggung_jawab: e.target.value})} 
              placeholder="Nama Guru / Staf" 
            />
          </div>

          <div className="space-y-2">
            <Label>Keterangan Tambahan</Label>
            <Textarea 
              value={formData.keterangan || ''} 
              onChange={(e) => setFormData({...formData, keterangan: e.target.value})} 
              placeholder="Lokasi gedung A lantai 2..." 
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Ruangan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
