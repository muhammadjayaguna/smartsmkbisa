'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Package, Plus, Loader2 } from "lucide-react";
import PeminjamanForm, { PeminjamanFormData } from "@/components/peminjaman/PeminjamanForm";
import PeminjamanTable, { type PeminjamanBarang as PeminjamanBarangType } from "@/components/peminjaman/PeminjamanTable";
import PemberitahuanPeminjaman from "@/components/peminjaman/PemberitahuanPeminjaman";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";

const PeminjamanBarang = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeminjamanBarangType | null>(null);
  const [formData, setFormData] = useState<PeminjamanFormData>({
    tanggal_peminjaman: format(new Date(), "yyyy-MM-dd"), nama_alat: "", mulai_jam: "1", sampai_jam: "2", nama_guru: "", kelas: "", nama_siswa: "", catatan: ""
  });

  const { data: peminjamanList = [], isLoading: isLoadingData } = useQuery({
    queryKey: ["peminjaman-barang"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peminjaman_barang")
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PeminjamanBarangType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PeminjamanFormData) => {
      const { error } = await supabase.from("peminjaman_barang").insert({
        ...data,
        mulai_jam: parseInt(data.mulai_jam),
        sampai_jam: parseInt(data.sampai_jam),
        user_id: user?.db_id || user?.id,
        status: 'Menunggu'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peminjaman-barang"] });
      toast({ title: 'Sukses', description: 'Pengajuan peminjaman berhasil dikirim' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Gagal mengajukan peminjaman: ' + error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PeminjamanFormData }) => {
      const { error } = await supabase
        .from("peminjaman_barang")
        .update({
          ...data,
          mulai_jam: parseInt(data.mulai_jam),
          sampai_jam: parseInt(data.sampai_jam)
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peminjaman-barang"] });
      toast({ title: 'Sukses', description: 'Data peminjaman berhasil diperbarui' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Gagal memperbarui peminjaman: ' + error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("peminjaman_barang").delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peminjaman-barang"] });
      toast({ title: 'Sukses', description: 'Data peminjaman berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Gagal menghapus data: ' + error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormData({
      tanggal_peminjaman: format(new Date(), "yyyy-MM-dd"), nama_alat: "", mulai_jam: "1", sampai_jam: "2", nama_guru: "", kelas: "", nama_siswa: "", catatan: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: PeminjamanBarangType) => {
    setEditingItem(item);
    setFormData({
      tanggal_peminjaman: item.tanggal_peminjaman, nama_alat: item.nama_alat, mulai_jam: item.mulai_jam.toString(), sampai_jam: item.sampai_jam.toString(), nama_guru: item.nama_guru, kelas: item.kelas || "", nama_siswa: item.nama_siswa || "", catatan: item.catatan || ""
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleAddClick = () => {
    resetForm();
    setIsFormOpen(true);
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageBreadcrumb currentPage="Peminjaman Barang" className="mb-2" />
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Peminjaman Barang</h2>
            <p className="text-xs text-slate-500">Ajukan peminjaman alat dan barang</p>
          </div>
        </div>
        <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Peminjaman
        </Button>
      </div>

      <PemberitahuanPeminjaman />

      {isFormOpen && (
        <PeminjamanForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEdit={!!editingItem}
        />
      )}

      <PeminjamanTable
        data={peminjamanList}
        isLoading={isLoadingData}
        onAddClick={handleAddClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default PeminjamanBarang;
