'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { DoorOpen, Plus, Loader2, Calendar, List } from "lucide-react";
import dynamic from "next/dynamic";
import PeminjamanRuanganForm, { PeminjamanRuanganFormData } from "@/components/peminjaman/PeminjamanRuanganForm";
import PeminjamanRuanganTable, { type PeminjamanRuangan as PeminjamanRuanganType } from "@/components/peminjaman/PeminjamanRuanganTable";

const RuanganCalendar = dynamic(() => import("@/components/peminjaman/RuanganCalendar"), { ssr: false });

import PageBreadcrumb from "@/components/common/PageBreadcrumb";

const PeminjamanRuangan = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeminjamanRuanganType | null>(null);
  const [formData, setFormData] = useState<PeminjamanRuanganFormData>({
    nama_ruangan: "", tanggal_peminjaman: format(new Date(), "yyyy-MM-dd"), mulai_jam: "1", sampai_jam: "2", nama_guru: "", kelas: "", nama_siswa: "", catatan: ""
  });

  const { data: peminjamanList = [], isLoading: isLoadingData } = useQuery({
    queryKey: ["peminjaman-ruangan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peminjaman_ruangan")
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PeminjamanRuanganType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PeminjamanRuanganFormData) => {
      const { error } = await supabase.from("peminjaman_ruangan").insert({
        ...data,
        mulai_jam: parseInt(data.mulai_jam),
        sampai_jam: parseInt(data.sampai_jam),
        user_id: user?.db_id || user?.id,
        status: 'Menunggu'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peminjaman-ruangan"] });
      toast({ title: 'Sukses', description: 'Pengajuan peminjaman berhasil dikirim' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Gagal mengajukan peminjaman: ' + error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PeminjamanRuanganFormData }) => {
      const { error } = await supabase
        .from("peminjaman_ruangan")
        .update({
          ...data,
          mulai_jam: parseInt(data.mulai_jam),
          sampai_jam: parseInt(data.sampai_jam)
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peminjaman-ruangan"] });
      toast({ title: 'Sukses', description: 'Data peminjaman berhasil diperbarui' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Gagal memperbarui peminjaman: ' + error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("peminjaman_ruangan").delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peminjaman-ruangan"] });
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
      nama_ruangan: "", tanggal_peminjaman: format(new Date(), "yyyy-MM-dd"), mulai_jam: "1", sampai_jam: "2", nama_guru: "", kelas: "", nama_siswa: "", catatan: ""
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

  const handleEdit = (item: PeminjamanRuanganType) => {
    setEditingItem(item);
    setFormData({
      nama_ruangan: item.nama_ruangan, tanggal_peminjaman: item.tanggal_peminjaman, mulai_jam: item.mulai_jam.toString(), sampai_jam: item.sampai_jam.toString(), nama_guru: item.nama_guru, kelas: item.kelas || "", nama_siswa: item.nama_siswa || "", catatan: item.catatan || ""
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
      <PageBreadcrumb items={[{ label: 'SiSarpras', path: '/sisarpras' }]} currentPage="Peminjaman Ruangan" className="mb-2" />
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Peminjaman Ruangan</h2>
            <p className="text-xs text-slate-500">Ajukan peminjaman ruangan lab/kelas</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button 
              className={`px-3 py-1.5 text-sm rounded-md flex items-center transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm font-semibold text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" /> Kalender
            </button>
            <button 
              className={`px-3 py-1.5 text-sm rounded-md flex items-center transition-all ${viewMode === 'table' ? 'bg-white shadow-sm font-semibold text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4 mr-2" /> Tabel
            </button>
          </div>
          <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajukan
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <PeminjamanRuanganForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEdit={!!editingItem}
        />
      )}

      {viewMode === 'calendar' ? (
        <RuanganCalendar
          data={peminjamanList}
          onDateClick={(dateStr) => {
            resetForm();
            setFormData(prev => ({ ...prev, tanggal_peminjaman: dateStr }));
            setIsFormOpen(true);
          }}
          onEventClick={(item) => handleEdit(item)}
        />
      ) : (
        <PeminjamanRuanganTable
          data={peminjamanList}
          isLoading={isLoadingData}
          onAddClick={handleAddClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default PeminjamanRuangan;
