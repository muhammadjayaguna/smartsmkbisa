// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Shield, User, GraduationCap, ArrowLeft, KeyRound, Check, FileSpreadsheet, UploadCloud, UserCheck, Search, Filter, Users, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { UserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import ImportUsersDialog from '@/components/admin/ImportUsersDialog';

interface User {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  created_at: string;
  auth_id: string;
}

const updateUserSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  role: z.enum(['admin', 'guru', 'siswa', 'kepala_sekolah', 'operator', 'tamu'])
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

const ManageUsers = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [reactivateEmailInput, setReactivateEmailInput] = useState('');
  const [reactivatePasswordInput, setReactivatePasswordInput] = useState('');
  const [reactivateNameInput, setReactivateNameInput] = useState('');
  const [reactivateRoleInput, setReactivateRoleInput] = useState<UserRole>('guru');
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      nama: '',
      email: '',
      role: 'guru'
    }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1) Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, auth_id, nama, email, created_at')
        .order('nama');

      if (usersError) throw usersError;

      // 2) Fetch roles (no FK relationship exists, so we merge manually)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleByUserId = new Map<string, UserRole>();
      (rolesData ?? []).forEach((r: any) => {
        if (r?.user_id && r?.role) roleByUserId.set(r.user_id, r.role as UserRole);
      });

      const formattedUsers: User[] = (usersData ?? []).map((u: any) => ({
        id: u.id,
        auth_id: u.auth_id,
        nama: u.nama,
        email: u.email,
        role: roleByUserId.get(u.id) ?? 'tamu',
        created_at: u.created_at,
      }));

      setUsers(formattedUsers);
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengguna',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: UpdateUserForm) => {
    if (!editingUser) return;

    // Validate form data
    if (!data.nama.trim()) {
      toast({ title: "Error", description: "Nama harus diisi", variant: "destructive" });
      return;
    }
    if (!data.email.trim()) {
      toast({ title: "Error", description: "Email harus diisi", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      toast({ title: "Error", description: "Format email tidak valid", variant: "destructive" });
      return;
    }

    if (data.email.trim() !== editingUser.email) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.trim())
        .neq('id', editingUser.id);
      if (checkError) {
        toast({ title: "Error", description: "Gagal memeriksa email yang sudah ada", variant: "destructive" });
        return;
      }
      if (existingUser && existingUser.length > 0) {
        toast({ title: "Error", description: "Email sudah digunakan oleh pengguna lain", variant: "destructive" });
        return;
      }
    }

    setUpdateLoading(true);
    try {
      const { error: userError } = await Promise.race([
        supabase
          .from('users')
          .update({ nama: data.nama.trim(), email: data.email.trim() })
          .eq('id', editingUser.id),
        new Promise<{ error: any }>((_, reject) => setTimeout(() => reject(new Error('Database timeout saat update user')), 15000))
      ]) as { error: any };

      if (userError) throw userError;

      if (editingUser.id) {
        // Find existing role using users.id
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', editingUser.id)
          .maybeSingle();

        let roleError = null;
        if (existingRole) {
          const { error } = await supabase
            .from('user_roles')
            .update({ role: data.role })
            .eq('user_id', editingUser.id);
          roleError = error;
        } else {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: editingUser.id, role: data.role });
          roleError = error;
        }

        if (roleError) throw roleError;
      }

      toast({
        title: "Berhasil",
        description: editingUser.auth_id
          ? "Data pengguna berhasil diperbarui"
          : "Profil pengguna berhasil diperbarui (role tidak bisa diubah karena akun belum terhubung).",
      });

      setEditingUser(null);
      setIsEditDialogOpen(false);
      form.reset();
      fetchUsers();
    } catch (error: any) {
      let errorMessage = "Gagal memperbarui pengguna";
      if (error.message.includes('timeout')) errorMessage = "Koneksi timeout. Periksa koneksi internet dan coba lagi.";
      else if (error.code === '23505') errorMessage = "Email sudah digunakan oleh pengguna lain";
      else if (error.message) errorMessage = error.message;
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteUser = async (userId: string, authId: string, nama: string, email: string) => {
    if (!authId) {
      toast({ title: "Error", description: "Tidak dapat menghapus user tanpa auth_id melalui sistem ini.", variant: "destructive" });
      return;
    }
    setDeleteLoading(userId);
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke('delete-user', { body: { userId: authId } });
      if (invokeError) throw new Error(invokeError.message || 'Gagal menghapus user via Edge Function');
      if (result?.error) throw new Error(result.error);
      toast({ title: "Berhasil", description: `Pengguna ${nama} (${email}) berhasil dihapus sepenuhnya dari sistem.` });
      await fetchUsers();
      if (currentUser && currentUser.id === authId) {
        setTimeout(async () => { await supabase.auth.signOut(); router.push('/auth'); }, 1000);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal menghapus pengguna", variant: "destructive" });
    } finally {
      setDeleteLoading(null);
    }
  };

  const reactivateEmail = async () => {
    const email = reactivateEmailInput.trim();
    const password = reactivatePasswordInput.trim();
    const nama = reactivateNameInput.trim();

    if (!email) { toast({ title: "Error", description: "Email wajib diisi", variant: "destructive" }); return; }
    if (!password) { toast({ title: "Error", description: "Password wajib diisi", variant: "destructive" }); return; }
    if (password.length < 6) { toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" }); return; }
    if (!nama) { toast({ title: "Error", description: "Nama wajib diisi", variant: "destructive" }); return; }

    setReactivateLoading(true);
    try {
      const { data: existingUser, error: userCheckError } = await supabase.from('users').select('id, email').eq('email', email).maybeSingle();
      if (userCheckError && userCheckError.code !== 'PGRST116') throw userCheckError;
      if (existingUser) {
        toast({ title: "Info", description: `Email ${email} sudah terdaftar dalam sistem dan aktif. Tidak dapat didaftarkan ulang.` });
        setReactivateLoading(false); return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email, password: password, options: { emailRedirectTo: redirectUrl, data: { nama: nama } }
      });
      if (signUpError) throw signUpError;

      if (signUpData.user && reactivateRoleInput !== 'guru') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { error: roleUpdateError } = await supabase.from('user_roles').upsert({ user_id: signUpData.user.id, role: reactivateRoleInput }, { onConflict: 'user_id' });
        if (roleUpdateError) console.error('Failed to update role:', roleUpdateError);
      }

      toast({ title: "Berhasil", description: `User ${nama} (${email}) berhasil didaftarkan dengan role ${getRoleLabel(reactivateRoleInput)}. User dapat langsung login dengan password yang ditetapkan.` });
      setIsReactivateDialogOpen(false);
      setReactivateEmailInput(''); setReactivatePasswordInput(''); setReactivateNameInput(''); setReactivateRoleInput('guru');
      await fetchUsers();
    } catch (error: any) {
      let errorMessage = "Gagal mendaftarkan ulang email";
      if (error.message?.includes('already registered')) errorMessage = "Email sudah terdaftar di sistem autentikasi. Hubungi administrator untuk bantuan lebih lanjut.";
      else if (error.message) errorMessage = error.message;
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setReactivateLoading(false);
    }
  };

  const resetUserPassword = async () => {
    if (!resetPasswordUser || !resetPasswordUser.auth_id) { toast({ title: "Error", description: "User tidak valid", variant: "destructive" }); return; }
    const password = resetPasswordInput.trim();
    if (!password) { toast({ title: "Error", description: "Password wajib diisi", variant: "destructive" }); return; }
    if (password.length < 6) { toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" }); return; }

    setResetPasswordLoading(true);
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: resetPasswordUser.auth_id, newPassword: password },
      });
      if (invokeError) throw new Error(invokeError.message || 'Gagal reset password');
      if (result?.error) throw new Error(result.error);

      toast({ title: "Berhasil", description: `Password untuk ${resetPasswordUser.nama} (${resetPasswordUser.email}) berhasil direset.` });
      setIsResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setResetPasswordInput('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal reset password", variant: "destructive" });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-destructive/15 text-destructive border-destructive/20';
      case 'guru': return 'bg-primary/15 text-primary border-primary/20';
      case 'kepala_sekolah': return 'bg-secondary text-secondary-foreground border-border';
      case 'operator': return 'bg-accent text-accent-foreground border-border';
      case 'siswa': return 'bg-muted text-foreground border-border';
      case 'tamu': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'guru': return 'Guru';
      case 'kepala_sekolah': return 'Kepala Sekolah';
      case 'operator': return 'Operator';
      case 'siswa': return 'Siswa';
      case 'tamu': return 'Tamu';
      default: return role;
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.reset({ nama: user.nama, email: user.email, role: user.role });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false); setEditingUser(null); form.reset();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <PageBreadcrumb currentPage="Manajemen Pengguna" className="mb-4" />
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Manajemen Pengguna</h1>
                    <p className="text-primary-foreground/80 text-sm md:text-lg">Kelola data pengguna sistem</p>
                  </div>
                  <Users className="h-10 w-10 md:h-16 md:w-16 text-primary-foreground/70" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Daftar Pengguna</CardTitle>
                    <CardDescription>Kelola role dan data pengguna yang sudah terdaftar</CardDescription>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Cari nama atau email..."
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
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="all">Semua Role</option>
                        <option value="admin">Admin</option>
                        <option value="guru">Guru</option>
                        <option value="siswa">Siswa</option>
                        <option value="kepala_sekolah">Kepala Sekolah</option>
                        <option value="operator">Operator</option>
                      </select>
                    </div>

                    <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200">
                      <UploadCloud className="h-4 w-4" />
                      <span className="hidden sm:inline">Import Excel</span>
                    </Button>
                    <Button onClick={() => setIsReactivateDialogOpen(true)} variant="outline" className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <span>Aktifkan Email</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Memuat data pengguna...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Pengguna</h3>
                    <p className="text-gray-500">Belum ada pengguna yang terdaftar dalam sistem</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Tanggal Dibuat</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter(user => {
                            // Filter by search query
                            const matchesSearch = 
                              user.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
                            
                            // Filter by role
                            const matchesRole = selectedRole === 'all' || user.role === selectedRole;
                            
                            return matchesSearch && matchesRole;
                          })
                          .map((user) => {
                          const canManageRole = Boolean(user.auth_id);
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.nama}</TableCell>
                              <TableCell className="max-w-[220px] truncate">{user.email}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge className={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                                  {!canManageRole && <Badge variant="outline" className="text-muted-foreground">Belum terhubung</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>{new Date(user.created_at).toLocaleDateString('id-ID')}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} disabled={!canManageRole} className="text-primary" title={!canManageRole ? 'User ini belum terhubung ke akun login' : 'Edit user'}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {canManageRole && (
                                    <Button variant="outline" size="sm" onClick={() => { setResetPasswordUser(user); setIsResetPasswordDialogOpen(true); }} className="text-amber-600" title="Reset password">
                                      <KeyRound className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {user.email !== 'kunbobo42@gmail.com' && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={deleteLoading === user.id} className="text-destructive">
                                          <Trash2 className={`h-4 w-4 ${deleteLoading === user.id ? 'animate-spin' : ''}`} />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Konfirmasi Hapus Pengguna</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Apakah Anda yakin ingin menghapus pengguna <strong>{user.nama}</strong>?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Batal</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteUser(user.id, user.auth_id ?? '', user.nama, user.email)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus Pengguna</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
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

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Pengguna</DialogTitle>
                <DialogDescription>Perbarui informasi dan role pengguna</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(updateUser)} className="space-y-4">
                  <FormField control={form.control} name="nama" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl><Input placeholder="Masukkan nama" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="Masukkan email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="guru">Guru</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="kepala_sekolah">Kepala Sekolah</SelectItem>
                          <SelectItem value="siswa">Siswa</SelectItem>
                          <SelectItem value="tamu">Tamu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseEditDialog}>Batal</Button>
                    <Button type="submit" disabled={updateLoading}>{updateLoading ? 'Menyimpan...' : 'Perbarui Pengguna'}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <ImportUsersDialog 
            isOpen={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
            onSuccess={fetchUsers}
          />

          <Dialog open={isReactivateDialogOpen} onOpenChange={setIsReactivateDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Daftarkan Ulang Email</DialogTitle>
                <DialogDescription>Daftarkan ulang email yang sebelumnya dihapus dengan password baru</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reactivate-name">Nama Lengkap</Label>
                  <Input id="reactivate-name" type="text" placeholder="Masukkan nama lengkap" value={reactivateNameInput} onChange={(e) => setReactivateNameInput(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="reactivate-email">Email</Label>
                  <Input id="reactivate-email" type="email" placeholder="Masukkan email" value={reactivateEmailInput} onChange={(e) => setReactivateEmailInput(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="reactivate-password">Password Baru</Label>
                  <Input id="reactivate-password" type="password" placeholder="Masukkan password" value={reactivatePasswordInput} onChange={(e) => setReactivatePasswordInput(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="reactivate-role">Role</Label>
                  <Select value={reactivateRoleInput} onValueChange={(value) => setReactivateRoleInput(value as UserRole)}>
                    <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="guru">Guru</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="kepala_sekolah">Kepala Sekolah</SelectItem>
                      <SelectItem value="siswa">Siswa</SelectItem>
                      <SelectItem value="tamu">Tamu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsReactivateDialogOpen(false)} disabled={reactivateLoading}>Batal</Button>
                  <Button onClick={reactivateEmail} disabled={reactivateLoading}>{reactivateLoading ? 'Mendaftarkan...' : 'Daftarkan User'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>Reset password untuk user {resetPasswordUser?.nama}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reset-password">Password Baru</Label>
                  <Input id="reset-password" type="password" placeholder="Masukkan password baru" value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} disabled={resetPasswordLoading}>Batal</Button>
                  <Button onClick={resetUserPassword} disabled={resetPasswordLoading}>{resetPasswordLoading ? 'Menyimpan...' : 'Reset Password'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </AppLayout>
  );
};

export default ManageUsers;