'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, UserRole } from '@/hooks/useUserRole';

export interface PengaturanGuru {
  id: string;
  guru_id: string;
  nama_sekolah: string;
  kkm: number;
  url_logo: string;
  url_kop_surat: string;
  nama_guru?: string;
  nip_guru: string;
  nama_kepala_sekolah: string;
  nip_kepala_sekolah: string;
  lokasi_penetapan: string;
  mata_pelajaran: string;
  jp_per_minggu: string;
  jenjang_sekolah: string;
  fase: string;
  teks_acuan_cp: string;
  is_guru_bk: boolean;
  pengumuman_siswa: string;
}

export interface AppSettings {
  id: number;
  url_logo: string;
  url_kop_surat: string;
  nama_sekolah?: string;
  npsn?: string;
  nama_kepala_sekolah?: string;
  nip_kepala_sekolah?: string;
}

interface SisminjarContextType {
  listMapel: PengaturanGuru[];
  activeMapel: PengaturanGuru | null;
  activeMapelId: string | null;
  setActiveMapelId: (id: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
  userRole: UserRole | null;
  roleLoading: boolean;
  appSettings: AppSettings | null;
}

const SisminjarContext = createContext<SisminjarContextType>({
  listMapel: [],
  activeMapel: null,
  activeMapelId: null,
  setActiveMapelId: () => {},
  loading: true,
  refreshData: async () => {},
  userRole: null,
  roleLoading: true,
  appSettings: null,
});

export const useSisminjar = () => useContext(SisminjarContext);

export const SisminjarProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const [listMapel, setListMapel] = useState<PengaturanGuru[]>([]);
  const [activeMapelId, setActiveMapelIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const fetchPengaturan = async () => {
    if (!user || !user.db_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('pengaturan_guru')
        .select('*')
        .eq('guru_id', user.db_id)
        .order('created_at', { ascending: true });

      const { data: appData, error: appError } = await supabase
        .from('pengaturan_aplikasi')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (appData) {
        setAppSettings(appData);
      }

      if (error) {
        console.error('Error fetching pengaturan_guru:', error);
      } else if (data) {
        setListMapel(data);
        
        // If we have data and no active mapel is selected (or active mapel is no longer in the list)
        if (data.length > 0) {
          const currentlyActive = data.find(m => m.id === activeMapelId);
          if (!currentlyActive) {
            // Restore from localStorage if available
            const savedId = localStorage.getItem('sisminjar_active_mapel_id');
            const savedMapel = data.find(m => m.id === savedId);
            if (savedMapel) {
              setActiveMapelIdState(savedMapel.id);
            } else {
              setActiveMapelIdState(data[0].id);
            }
          }
        } else {
          setActiveMapelIdState(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching pengaturan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengaturan();
  }, [user]);

  const setActiveMapelId = (id: string) => {
    setActiveMapelIdState(id);
    localStorage.setItem('sisminjar_active_mapel_id', id);
  };

  const activeMapel = listMapel.find(m => m.id === activeMapelId) || null;

  return (
    <SisminjarContext.Provider value={{
      listMapel,
      activeMapel,
      activeMapelId,
      setActiveMapelId,
      loading,
      refreshData: fetchPengaturan,
      userRole,
      roleLoading,
      appSettings,
    }}>
      {children}
    </SisminjarContext.Provider>
  );
};
