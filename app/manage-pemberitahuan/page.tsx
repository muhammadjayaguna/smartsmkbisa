'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import { Plus, Pencil, Trash2, Bell, AlertTriangle, CheckCircle, Info, Megaphone, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { getLocalDateString } from '@/lib/utils';

interface Pemberitahuan {
  id: string;
  judul: string;
  isi: string;
  tipe: string;
  aktif: boolean;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  created_at: string;
}

const tipeConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  urgent: { icon: Bell, color: 'text-red-500', bg: 'bg-red-500/10' },
  quotes: { icon: Quote, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const tipeLabels = {
  info: 'Informasi',
  warning: 'Peringatan',
  success: 'Sukses',
  urgent: 'Penting',
  quotes: 'Quotes',
};

const ManagePemberitahuan = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Pemberitahuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Pemberitahuan | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    tipe: 'info' as string,
    aktif: true,
    tanggal_mulai: getLocalDateString(),
    tanggal_selesai: '',
  });


  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pemberitahuan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pemberitahuan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenCreate = () => {
    setSelectedAnnouncement(null);
    setFormData({
      judul: '',
      isi: '',
      tipe: 'info',
      aktif: true,
      tanggal_mulai: getLocalDateString(),
      tanggal_selesai: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (announcement: Pemberitahuan) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      judul: announcement.judul,
      isi: announcement.isi,
      tipe: announcement.tipe,
      aktif: announcement.aktif,
      tanggal_mulai: announcement.tanggal_mulai.split('T')[0],
      tanggal_selesai: announcement.tanggal_selesai?.split('T')[0] || '',
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (announcement: Pemberitahuan) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.judul.trim() || !formData.isi.trim()) {
      toast({
        title: 'Validasi Gagal',
        description: 'Judul dan isi tidak boleh kosong',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        judul: formData.judul.trim(),
        isi: formData.isi.trim(),
        tipe: formData.tipe,
        aktif: formData.aktif,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai || null,
      };

      if (selectedAnnouncement) {
        const { error } = await supabase
          .from('pemberitahuan')
          .update(payload)
          .eq('id', selectedAnnouncement.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Pemberitahuan berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('pemberitahuan')
          .insert([payload]);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Pemberitahuan berhasil ditambahkan' });
      }

      setDialogOpen(false);
      fetchAnnouncements();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error saving announcement:', err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan pemberitahuan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pemberitahuan')
        .delete()
        .eq('id', selectedAnnouncement.id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Pemberitahuan berhasil dihapus' });
      setDeleteDialogOpen(false);
      fetchAnnouncements();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error deleting announcement:', err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus pemberitahuan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAktif = async (announcement: Pemberitahuan) => {
    try {
      const { error } = await supabase
        .from('pemberitahuan')
        .update({ aktif: !announcement.aktif })
        .eq('id', announcement.id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <PageBreadcrumb currentPage="Manajemen Pemberitahuan" className="mb-4" />

          {/* Header */}
          <Card className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Megaphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Manajemen Pemberitahuan</h1>
                    <p className="text-purple-100">Kelola pengumuman untuk semua pengguna</p>
                  </div>
                </div>
                <Button
                  onClick={handleOpenCreate}
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Baru
                </Button>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                <Megaphone className="w-40 h-40 rotate-12" />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pemberitahuan</CardTitle>
              <CardDescription>Total: {announcements.length} pemberitahuan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Belum ada pemberitahuan</p>
                  <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Pemberitahuan Pertama
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => {
                        const tipe = (announcement.tipe as keyof typeof tipeConfig) || 'info';
                        const config = tipeConfig[tipe] || tipeConfig.info;
                        const Icon = config.icon;
                        return (
                          <TableRow key={announcement.id}>
                            <TableCell>
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bg)}>
                                <Icon className={cn("w-5 h-5", config.color)} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium line-clamp-1">{announcement.judul}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{announcement.isi}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-sm">
                                <p>{new Date(announcement.tanggal_mulai).toLocaleDateString('id-ID')}</p>
                                {announcement.tanggal_selesai && (
                                  <p className="text-muted-foreground">
                                    s/d {new Date(announcement.tanggal_selesai).toLocaleDateString('id-ID')}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={announcement.aktif}
                                onCheckedChange={() => handleToggleAktif(announcement)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(announcement)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleOpenDelete(announcement)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedAnnouncement ? 'Edit Pemberitahuan' : 'Tambah Pemberitahuan Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi form di bawah ini untuk {selectedAnnouncement ? 'mengubah' : 'membuat'} pemberitahuan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="judul">Judul</Label>
              <Input
                id="judul"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Masukkan judul pemberitahuan"
              />
            </div>

            <div>
              <Label htmlFor="isi">Isi Pemberitahuan</Label>
              <Textarea
                id="isi"
                value={formData.isi}
                onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                placeholder="Masukkan isi pemberitahuan"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipe">Tipe</Label>
                <Select
                  value={formData.tipe}
                  onValueChange={(value: string) => setFormData({ ...formData, tipe: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">📘 Informasi</SelectItem>
                    <SelectItem value="warning">⚠️ Peringatan</SelectItem>
                    <SelectItem value="success">✅ Sukses</SelectItem>
                    <SelectItem value="urgent">🔔 Penting</SelectItem>
                    <SelectItem value="quotes">💬 Quotes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="aktif"
                  checked={formData.aktif}
                  onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
                />
                <Label htmlFor="aktif">Aktif</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                <Input
                  id="tanggal_mulai"
                  type="date"
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tanggal_selesai">Tanggal Selesai (Opsional)</Label>
                <Input
                  id="tanggal_selesai"
                  type="date"
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pemberitahuan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pemberitahuan "{selectedAnnouncement?.judul}"? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ManagePemberitahuan;
