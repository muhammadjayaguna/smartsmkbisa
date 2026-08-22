// @ts-nocheck
'use client';


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

interface Rombel {
  id: string;
  nama_rombel: string;
  wali_kelas: string;
  tahun_ajaran: string;
}

const ManageRombel = () => {
  const router = useRouter();
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [formData, setFormData] = useState({
    nama_rombel: '',
    wali_kelas: '',
    tahun_ajaran: '2024/2025'
  });

  useEffect(() => {
    fetchRombels();
  }, []);

  const fetchRombels = async () => {
    try {
      const { data, error } = await supabase
        .from('rombel')
        .select('*')
        .order('nama_rombel');

      if (error) throw error;
      setRombels(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data rombel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.nama_rombel.trim()) {
      toast({
        title: "Error",
        description: "Nama rombel harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!formData.wali_kelas.trim()) {
      toast({
        title: "Error",
        description: "Wali kelas harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!formData.tahun_ajaran.trim()) {
      toast({
        title: "Error",
        description: "Tahun ajaran harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate rombel name
    if (!editingRombel) {
      const { data: existingRombel, error: checkError } = await supabase
        .from('rombel')
        .select('id')
        .eq('nama_rombel', formData.nama_rombel.trim())
        .eq('tahun_ajaran', formData.tahun_ajaran.trim());

      if (checkError) {
        toast({
          title: "Error",
          description: "Gagal memeriksa data rombel yang sudah ada",
          variant: "destructive",
        });
        return;
      }

      if (existingRombel && existingRombel.length > 0) {
        toast({
          title: "Error",
          description: "Nama rombel sudah ada untuk tahun ajaran ini",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (editingRombel) {
        const { error } = await Promise.race([
          supabase
          .from('rombel')
          .update({
            nama_rombel: formData.nama_rombel.trim(),
            wali_kelas: formData.wali_kelas.trim(),
            tahun_ajaran: formData.tahun_ajaran.trim()
          })
          .eq('id', editingRombel.id),
          new Promise<{ error: any }>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]) as { error: any };
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Rombel berhasil diperbarui",
        });
      } else {
        const { error } = await Promise.race([
          supabase
          .from('rombel')
          .insert([{
            nama_rombel: formData.nama_rombel.trim(),
            wali_kelas: formData.wali_kelas.trim(),
            tahun_ajaran: formData.tahun_ajaran.trim()
          }]),
          new Promise<{ error: any }>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]) as { error: any };
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Rombel berhasil ditambahkan",
        });
      }
      
      setIsDialogOpen(false);
      setEditingRombel(null);
      setFormData({ nama_rombel: '', wali_kelas: '', tahun_ajaran: '2024/2025' });
      fetchRombels();
    } catch (error) {
      console.error('Error saving rombel:', error);
      
      let errorMessage = "Gagal menyimpan data rombel";
      if (error.message.includes('timeout')) {
        errorMessage = "Koneksi timeout. Periksa koneksi internet dan coba lagi.";
      } else if (error.code === '23505') {
        errorMessage = "Nama rombel sudah ada";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (rombel: Rombel) => {
    setEditingRombel(rombel);
    setFormData({
      nama_rombel: rombel.nama_rombel,
      wali_kelas: rombel.wali_kelas,
      tahun_ajaran: rombel.tahun_ajaran
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rombel ini?')) return;
    
    try {
      const { error } = await supabase
        .from('rombel')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Rombel berhasil dihapus",
      });
      
      fetchRombels();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus rombel",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <PageBreadcrumb currentPage="Manajemen Rombel" className="mb-4" />
            
            <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Tambah Rombel</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRombel ? 'Edit Rombel' : 'Tambah Rombel Baru'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRombel ? 'Edit informasi rombel' : 'Tambahkan rombel baru ke sistem'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nama_rombel">Nama Rombel</Label>
                      <Input
                        id="nama_rombel"
                        value={formData.nama_rombel}
                        onChange={(e) => setFormData({...formData, nama_rombel: e.target.value})}
                        placeholder="Contoh: X TJKT 1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="wali_kelas">Wali Kelas</Label>
                      <Input
                        id="wali_kelas"
                        value={formData.wali_kelas}
                        onChange={(e) => setFormData({...formData, wali_kelas: e.target.value})}
                        placeholder="Nama Wali Kelas"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tahun_ajaran">Tahun Ajaran</Label>
                      <Input
                        id="tahun_ajaran"
                        value={formData.tahun_ajaran}
                        onChange={(e) => setFormData({...formData, tahun_ajaran: e.target.value})}
                        placeholder="2024/2025"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingRombel ? 'Update Rombel' : 'Tambah Rombel'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">Manajemen Rombel</h1>
                <p className="text-blue-100">Kelola data rombel dan kelas di SMK Negeri 1 Banjarmasin</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Rombel</CardTitle>
              <CardDescription>Total {rombels.length} rombel terdaftar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Rombel</TableHead>
                    <TableHead>Wali Kelas</TableHead>
                    <TableHead>Tahun Ajaran</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rombels.map((rombel) => (
                    <TableRow key={rombel.id}>
                      <TableCell className="font-medium">{rombel.nama_rombel}</TableCell>
                      <TableCell>{rombel.wali_kelas}</TableCell>
                      <TableCell>{rombel.tahun_ajaran}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(rombel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(rombel.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ManageRombel;
