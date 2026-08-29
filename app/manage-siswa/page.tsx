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
import { Plus, Edit, Trash2, ArrowLeft, Users, FileSpreadsheet, Search, Filter, ArrowRightLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import SiswaImportDialog from '@/components/siswa/SiswaImportDialog';
import KenaikanKelasDialog from '@/components/siswa/KenaikanKelasDialog';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

interface Siswa {
  id: string;
  nama: string;
  nisn: string;
  email?: string;
  rombel_id: string;
  rombel?: {
    nama_rombel: string;
  };
}

interface Rombel {
  id: string;
  nama_rombel: string;
}

const ManageSiswa = () => {
  const router = useRouter();
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isKenaikanDialogOpen, setIsKenaikanDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRombel, setSelectedRombel] = useState('all');
  const [formData, setFormData] = useState({
    nama: '',
    nisn: '',
    email: '',
    rombel_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch siswa with rombel info
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select(`
          *,
          rombel:rombel_id (
            nama_rombel
          )
        `)
        .order('nama');

      if (siswaError) throw siswaError;

      // Fetch all rombel for dropdown
      const { data: rombelData, error: rombelError } = await supabase
        .from('rombel')
        .select('*')
        .order('nama_rombel');

      if (rombelError) throw rombelError;

      setSiswaList(siswaData || []);
      setRombelList(rombelData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAndLinkUser = async (email: string) => {
    if (!email.trim()) return;
    
    const { data: userData } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('email', email.trim())
      .maybeSingle();
      
    if (userData && userData.auth_id) {
      // Check if they already have a role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userData.auth_id)
        .maybeSingle();
        
      if (!roleData) {
        // Insert role 'siswa'
        await supabase
          .from('user_roles')
          .insert({
            user_id: userData.auth_id,
            role: 'siswa'
          });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama siswa harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!formData.nisn.trim()) {
      toast({
        title: "Error",
        description: "NISN harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive",
      });
      return;
    }

    if (!formData.rombel_id) {
      toast({
        title: "Error",
        description: "Rombel harus dipilih",
        variant: "destructive",
      });
      return;
    }

    // Validate NISN format
    if (!/^\d{8,}$/.test(formData.nisn.trim())) {
      toast({
        title: "Error",
        description: "NISN harus berupa angka minimal 8 digit",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate NISN
    if (!editingSiswa) {
      const { data: existingSiswa, error: checkError } = await supabase
        .from('siswa')
        .select('id')
        .eq('nisn', formData.nisn.trim());

      if (checkError) {
        toast({
          title: "Error",
          description: "Gagal memeriksa NISN yang sudah ada",
          variant: "destructive",
        });
        return;
      }

      if (existingSiswa && existingSiswa.length > 0) {
        toast({
          title: "Error",
          description: "NISN sudah terdaftar",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (editingSiswa) {
        const { error } = await Promise.race([
          supabase
          .from('siswa')
          .update({
            nama: formData.nama.trim(),
            nisn: formData.nisn.trim(),
            email: formData.email.trim() || null,
            rombel_id: formData.rombel_id
          })
          .eq('id', editingSiswa.id),
          new Promise<{ error: any }>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]) as { error: any };
        
        if (error) throw error;
        
        await checkAndLinkUser(formData.email);
        
        toast({
          title: "Berhasil",
          description: "Data siswa berhasil diperbarui",
        });
      } else {
        const { error } = await Promise.race([
          supabase
          .from('siswa')
          .insert([{
            nama: formData.nama.trim(),
            nisn: formData.nisn.trim(),
            email: formData.email.trim() || null,
            rombel_id: formData.rombel_id
          }]),
          new Promise<{ error: any }>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]) as { error: any };
        
        if (error) throw error;
        
        await checkAndLinkUser(formData.email);
        
        toast({
          title: "Berhasil",
          description: "Siswa berhasil ditambahkan",
        });
      }
      
      setIsDialogOpen(false);
      setEditingSiswa(null);
      setFormData({ nama: '', nisn: '', email: '', rombel_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving siswa:', error);
      
      let errorMessage = "Gagal menyimpan data siswa";
      if (error.message && error.message.includes('timeout')) {
        errorMessage = "Koneksi timeout. Periksa koneksi internet dan coba lagi.";
      } else if (error.code === '23505') {
        errorMessage = "NISN sudah terdaftar";
      } else if (error.code === '23503') {
        errorMessage = "Rombel yang dipilih tidak valid";
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

  const handleEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({
      nama: siswa.nama,
      nisn: siswa.nisn,
      email: siswa.email || '',
      rombel_id: siswa.rombel_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;
    
    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Siswa berhasil dihapus",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus siswa",
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
            <PageBreadcrumb currentPage="Manajemen Siswa" className="mb-4" />
            
            <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsKenaikanDialogOpen(true)}
                  className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Kenaikan Kelas</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import Siswa</span>
                </Button>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Tambah Siswa</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa Baru'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingSiswa ? 'Edit informasi siswa' : 'Tambahkan siswa baru ke sistem'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nama">Nama Siswa</Label>
                        <Input
                          id="nama"
                          value={formData.nama}
                          onChange={(e) => setFormData({...formData, nama: e.target.value})}
                          placeholder="Nama lengkap siswa"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="nisn">NISN</Label>
                        <Input
                          id="nisn"
                          value={formData.nisn}
                          onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                          placeholder="Nomor Induk Siswa Nasional"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Google Siswa (Opsional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="siswa@smkn1bjm.sch.id"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Siswa akan otomatis login tanpa perlu dibuatkan akun manual jika mengisi ini.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="rombel_id">Rombel</Label>
                        <select
                          id="rombel_id"
                          value={formData.rombel_id}
                          onChange={(e) => setFormData({...formData, rombel_id: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        >
                          <option value="">Pilih Rombel</option>
                          {rombelList.map((rombel) => (
                            <option key={rombel.id} value={rombel.id}>
                              {rombel.nama_rombel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button type="submit" className="w-full">
                        {editingSiswa ? 'Update Siswa' : 'Tambah Siswa'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">Manajemen Siswa</h1>
                <p className="text-blue-100">Kelola data siswa di SMK Negeri 1 Banjarmasin</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6" />
                    <span>Daftar Siswa</span>
                  </CardTitle>
                  <CardDescription>Total {siswaList.length} siswa terdaftar</CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Cari nama, NISN, atau email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={selectedRombel}
                      onChange={(e) => setSelectedRombel(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="all">Semua Rombel</option>
                      {rombelList.map((rombel) => (
                        <option key={rombel.id} value={rombel.id}>
                          {rombel.nama_rombel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NISN</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rombel</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siswaList
                    .filter(siswa => {
                      // Filter by search query
                      const matchesSearch = 
                        siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        siswa.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (siswa.email && siswa.email.toLowerCase().includes(searchQuery.toLowerCase()));
                      
                      // Filter by rombel
                      const matchesRombel = selectedRombel === 'all' || siswa.rombel_id === selectedRombel;
                      
                      return matchesSearch && matchesRombel;
                    })
                    .map((siswa) => (
                    <TableRow key={siswa.id}>
                      <TableCell className="font-medium">{siswa.nisn}</TableCell>
                      <TableCell>{siswa.nama}</TableCell>
                      <TableCell>{siswa.email || '-'}</TableCell>
                      <TableCell>{siswa.rombel?.nama_rombel}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(siswa)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(siswa.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {siswaList.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data Siswa</h3>
                  <p className="text-gray-500">Silakan tambahkan siswa terlebih dahulu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <SiswaImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={fetchData}
        rombelList={rombelList}
      />
      
      <KenaikanKelasDialog
        isOpen={isKenaikanDialogOpen}
        onOpenChange={setIsKenaikanDialogOpen}
        onSuccess={fetchData}
        rombelList={rombelList}
      />
    </AppLayout>
  );
};

export default ManageSiswa;
