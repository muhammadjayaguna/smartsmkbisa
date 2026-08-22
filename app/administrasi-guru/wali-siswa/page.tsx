'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Phone, Mail, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useWali } from '@/components/administrasi-guru/WaliContext';

export default function WaliSiswaPage() {
  const { activeRombelId, activeRombel, loadingWali } = useWali();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!activeRombelId) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('siswa')
          .select('*')
          .eq('rombel_id', activeRombelId)
          .order('nama');
        
        if (data) setStudents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [activeRombelId]);

  const filteredStudents = students.filter(s => 
    s.nama?.toLowerCase().includes(search.toLowerCase()) || 
    s.nisn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">Siswa Bimbingan {activeRombel ? `- ${activeRombel.nama_rombel}` : ''}</h2>
            <p className="text-xs text-slate-500">Kelola profil dan biodata siswa di kelas Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            Cetak Biodata Kelas
          </Button>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-white" 
              placeholder="Cari nama atau NISN siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filter
          </Button>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold">No</th>
                  <th className="px-6 py-4 font-bold">NIS / NISN</th>
                  <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                  <th className="px-6 py-4 font-bold">L/P</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Kontak Ortu</th>
                  <th className="px-6 py-4 text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingWali || loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Memuat data siswa...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Belum ada siswa di kelas ini.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{student.nisn || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{student.nama}</td>
                      <td className="px-6 py-4 text-slate-600">{student.jenis_kelamin || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                          Aktif
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600 gap-2">
                          <Phone className="w-3.5 h-3.5" /> {student.no_telp_ortu || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100">
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
