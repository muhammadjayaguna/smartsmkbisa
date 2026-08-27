'use client';

import React, { useEffect, useState } from 'react';
import { Eye, Users, Book, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

interface GuruData {
  id: string;
  nama: string;
  jurnal_count: number;
}

export default function MonitoringGuruPage() {
  const [guruList, setGuruList] = useState<GuruData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get all guru users
        const { data: users } = await supabase
          .from('users')
          .select('id, nama')
          .eq('role', 'guru')
          .order('nama');

        if (users) {
          // Get journal counts for today
          const guruIds = users.map(u => u.id);
          const { data: jurnals } = await supabase
            .from('jurnal_mengajar')
            .select('guru_id')
            .eq('tanggal', today)
            .in('guru_id', guruIds);

          const jurnalCounts = new Map<string, number>();
          (jurnals || []).forEach(j => {
            jurnalCounts.set(j.guru_id, (jurnalCounts.get(j.guru_id) || 0) + 1);
          });

          setGuruList(users.map(u => ({
            id: u.id,
            nama: u.nama || 'Tanpa Nama',
            jurnal_count: jurnalCounts.get(u.id) || 0,
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sudahInput = guruList.filter(g => g.jurnal_count > 0).length;
  const belumInput = guruList.filter(g => g.jurnal_count === 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Eye className="w-7 h-7" /> Monitoring Guru
        </h2>
        <p className="text-violet-100 text-sm mt-1">Pantau aktivitas dan kinerja guru secara real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{loading ? '...' : guruList.length}</p>
              <p className="text-xs text-slate-500">Total Guru</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-green-600">{loading ? '...' : sudahInput}</p>
              <p className="text-xs text-slate-500">Sudah Input Jurnal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-red-600">{loading ? '...' : belumInput}</p>
              <p className="text-xs text-slate-500">Belum Input Jurnal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guru List */}
      <div>
        <h3 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">Daftar Guru Hari Ini</h3>
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : guruList.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Belum ada data guru terdaftar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {guruList.map((guru) => (
              <Card key={guru.id} className="border-0 shadow-sm rounded-xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                      {guru.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{guru.nama}</p>
                      <p className="text-[10px] text-slate-400">{guru.jurnal_count} jurnal hari ini</p>
                    </div>
                  </div>
                  <div>
                    {guru.jurnal_count > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Sudah Input
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Belum Input
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
