
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, UserCheck, ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';

interface Rombel {
  id: string;
  nama_rombel: string;
  wali_kelas: string | null;
  tahun_ajaran: string | null;
}

const RombelList = () => {
  const router = useRouter();
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRombels();
  }, []);

  const fetchRombels = async () => {
    try {
      const { data, error } = await supabase
        .from('rombel')
        .select('*')
        .order('nama_rombel');

      if (error) throw error;
      setRombels(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data rombel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data rombel...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <PageBreadcrumb currentPage="Absensi Siswa" className="mb-4" />
          
          <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">Daftar Rombel</h1>
              <p className="text-blue-100">Pilih rombel untuk melakukan absensi siswa</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rombels.map((rombel) => (
            <Card key={rombel.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <Button
                    onClick={() => router.push(`/rombel/${rombel.id}`)}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Absen</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{rombel.nama_rombel}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">Wali Kelas:</span> {rombel.wali_kelas}</p>
                  <p><span className="font-semibold">Tahun Ajaran:</span> {rombel.tahun_ajaran}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push(`/rombel/${rombel.id}`)}
                >
                  Lihat Detail & Absen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {rombels.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data Rombel</h3>
              <p className="text-gray-500 mb-4">Silakan tambahkan rombel terlebih dahulu</p>
              <Button onClick={() => router.push('/manage-rombel')}>
                Kelola Rombel
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </AppLayout>
  );
};

export default RombelList;
