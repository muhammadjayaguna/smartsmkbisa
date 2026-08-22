'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RombelWali {
  id: string;
  nama_rombel: string;
  tahun_ajaran: string;
  wali_kelas: string;
}

interface WaliContextType {
  listRombel: RombelWali[];
  activeRombel: RombelWali | null;
  activeRombelId: string | null;
  setActiveRombelId: (id: string) => void;
  loadingWali: boolean;
  refreshWaliData: () => Promise<void>;
}

const WaliContext = createContext<WaliContextType>({
  listRombel: [],
  activeRombel: null,
  activeRombelId: null,
  setActiveRombelId: () => {},
  loadingWali: true,
  refreshWaliData: async () => {},
});

export const useWali = () => useContext(WaliContext);

export const WaliProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [listRombel, setListRombel] = useState<RombelWali[]>([]);
  const [activeRombelIdState, setActiveRombelIdState] = useState<string | null>(null);
  const [loadingWali, setLoadingWali] = useState(true);

  const fetchRombelWali = async () => {
    if (!user || !user.db_id) {
      setLoadingWali(false);
      return;
    }
    setLoadingWali(true);
    try {
      // Kita ambil semua rombel karena nama wali_kelas itu teks manual (bukan uuid).
      // Biarkan guru yang memilih rombel binaannya dari seluruh rombel.
      const { data, error } = await supabase
        .from('rombel')
        .select('*')
        .order('nama_rombel', { ascending: true });

      if (error) {
        console.error('Error fetching rombel:', error);
      } else if (data) {
        setListRombel(data);
        
        if (data.length > 0) {
          const currentlyActive = data.find(m => m.id === activeRombelIdState);
          if (!currentlyActive) {
            const savedId = localStorage.getItem('wali_active_rombel_id');
            const savedRombel = data.find(m => m.id === savedId);
            if (savedRombel) {
              setActiveRombelIdState(savedRombel.id);
            } else {
              // Otomatis pilih rombel pertama
              setActiveRombelIdState(data[0].id);
            }
          }
        } else {
          setActiveRombelIdState(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching rombel:', err);
    } finally {
      setLoadingWali(false);
    }
  };

  useEffect(() => {
    fetchRombelWali();
  }, [user]);

  const setActiveRombelId = (id: string) => {
    setActiveRombelIdState(id);
    localStorage.setItem('wali_active_rombel_id', id);
  };

  const activeRombel = listRombel.find(m => m.id === activeRombelIdState) || null;

  return (
    <WaliContext.Provider value={{
      listRombel,
      activeRombel,
      activeRombelId: activeRombelIdState,
      setActiveRombelId,
      loadingWali,
      refreshWaliData: fetchRombelWali
    }}>
      {children}
    </WaliContext.Provider>
  );
};
