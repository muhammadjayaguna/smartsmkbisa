'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { AlertTriangle, Loader2, Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EarlyWarningSystem() {
  const { isSiswa, loading: roleLoading } = useUserRole();
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading || isSiswa) return;
    
    async function fetchWarnings() {
      setLoading(true);
      try {
        // 1. Hitung tanggal batas (3 hari yang lalu)
        const today = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() - 3);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        // 2. Ambil semua siswa yang sedang magang (status Disetujui)
        const { data: pengajuanList, error: pError } = await supabase
          .from('pengajuan_magang')
          .select('id, siswa_id, updated_at, siswa(nama, nisn), dudika(nama_perusahaan)')
          .eq('status', 'Disetujui');

        if (pError) throw pError;
        if (!pengajuanList || pengajuanList.length === 0) {
          setWarnings([]);
          setLoading(false);
          return;
        }

        // 3. Ambil absensi dalam 3 hari terakhir
        const { data: absensiRecent, error: aError } = await supabase
          .from('absensi_siswa_magang')
          .select('siswa_id, tanggal')
          .gte('tanggal', cutoffStr);

        if (aError) throw aError;

        // 4. Filter siswa yang masuk peringatan
        const recentAbsenSiswaIds = new Set(absensiRecent?.map(a => a.siswa_id) || []);
        
        const flagged = pengajuanList.filter(p => {
          // Jika siswa sudah absen dalam 3 hari terakhir, aman.
          if (recentAbsenSiswaIds.has(p.siswa_id)) return false;
          
          // Jika siswa belum absen, tapi baru disetujui kurang dari 3 hari yang lalu, aman (belum masuk peringatan).
          const approvedDateStr = p.updated_at.split('T')[0];
          if (approvedDateStr > cutoffStr) return false;

          return true;
        });

        // 5. Coba cari tahu tanggal terakhir mereka absen (untuk informasi di UI)
        // Kita hanya fetch tanggal terakhir untuk siswa yang diflagged agar efisien.
        const warningsWithLastDate = await Promise.all(flagged.map(async (p) => {
          const { data: lastAbsensi } = await supabase
            .from('absensi_siswa_magang')
            .select('tanggal')
            .eq('siswa_id', p.siswa_id)
            .order('tanggal', { ascending: false })
            .limit(1)
            .maybeSingle();

          let diffDays = 3; // Default at least 3
          let lastDateLabel = 'Belum pernah absen';
          
          if (lastAbsensi && lastAbsensi.tanggal) {
            const lastDate = new Date(lastAbsensi.tanggal);
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            lastDateLabel = `${diffDays} hari yang lalu (${lastDate.toLocaleDateString('id-ID')})`;
          } else {
            // Hitung dari tanggal disetujui
            const approvedDate = new Date(p.updated_at);
            const diffTime = Math.abs(today.getTime() - approvedDate.getTime());
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            lastDateLabel = `Belum absen sejak disetujui (${diffDays} hari)`;
          }

          return {
            ...p,
            diffDays,
            lastDateLabel
          };
        }));

        // Urutkan dari yang paling lama tidak absen
        warningsWithLastDate.sort((a, b) => b.diffDays - a.diffDays);
        setWarnings(warningsWithLastDate);
        
      } catch (error) {
        console.error('Error fetching early warning data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWarnings();
  }, [roleLoading, isSiswa]);

  // Jika siswa, sembunyikan komponen
  if (roleLoading || isSiswa) return null;

  return (
    <Card className="border-red-200/60 shadow-sm bg-gradient-to-br from-red-50 to-rose-50 overflow-hidden">
      <div className="h-1 bg-red-500 w-full" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-full text-red-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-red-800">Sistem Peringatan Dini (EWS)</CardTitle>
            <CardDescription className="text-red-700/80">Siswa yang tidak memencet absensi magang &ge; 3 hari</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-red-400 h-6 w-6" />
          </div>
        ) : warnings.length === 0 ? (
          <div className="bg-white/60 p-4 rounded-lg border border-red-100 flex items-center gap-3 text-emerald-700">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-xl">👍</span>
            </div>
            <div>
              <p className="font-medium text-sm">Semua aman!</p>
              <p className="text-xs opacity-80">Tidak ada siswa magang yang bolos absen lebih dari 3 hari.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            {warnings.map(w => (
              <div key={w.id} className="bg-white/80 p-3 rounded-lg border border-red-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{w.siswa?.nama} <span className="font-normal text-slate-500">({w.siswa?.nisn})</span></h4>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">{w.dudika?.nama_perusahaan}</p>
                    <p className="text-xs text-red-600 mt-1 font-semibold bg-red-100/50 inline-block px-2 py-0.5 rounded">
                      ⚠️ {w.lastDateLabel}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center md:items-end md:flex-col gap-2">
                  {/* Contoh Aksi (Saat ini sekadar mockup tombol) */}
                  <Button size="sm" variant="outline" className="h-7 text-xs text-slate-600 border-slate-200 bg-white hover:bg-slate-50">
                    <MessageSquare className="h-3 w-3 mr-1" /> Hubungi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
