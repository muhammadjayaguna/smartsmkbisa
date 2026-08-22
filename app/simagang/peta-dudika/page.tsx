'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Map as MapIcon, Building, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dudika } from '@/components/prakerin/MapDudika';

// Dynamically import Map component to avoid SSR issues with Leaflet
const MapDudika = dynamic(() => import('@/components/prakerin/MapDudika'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200">
      <MapIcon className="h-12 w-12 text-slate-300" />
    </div>
  )
});

const PetaDudikaPage = () => {
  const [dudikas, setDudikas] = useState<Dudika[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('Semua Jurusan');
  const [selectedDudikaId, setSelectedDudikaId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDudikas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dudika')
        .select('*')
        .order('nama_perusahaan', { ascending: true });

      if (error) {
        // If table doesn't exist, we might get an error. Just set empty for now.
        if (error.code === '42P01') {
          console.warn('Table dudika not found. Please run SQL setup.');
          setDudikas([]);
        } else {
          throw error;
        }
      } else {
        setDudikas(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching dudika:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data DUDIKA.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDudikas();
  }, []);

  // Daftar Jurusan Resmi SMKN 1 Banjarmasin
  const JURUSAN_LIST = [
    'PM', // Pemasaran
    'AKL', // Akuntansi dan Keuangan Lembaga
    'MPLB', // Manajemen Perkantoran dan Layanan Bisnis
    'DKV', // Desain Komunikasi Visual
    'TJKT' // Teknik Jaringan Komputer dan Telekomunikasi
  ];

  const filteredDudikas = useMemo(() => {
    return dudikas.filter(dudika => {
      const matchesSearch = dudika.nama_perusahaan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            dudika.alamat.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesJurusan = jurusanFilter === 'Semua Jurusan' || 
                             (dudika.jurusan && dudika.jurusan.includes(jurusanFilter));
                             
      return matchesSearch && matchesJurusan;
    });
  }, [dudikas, searchQuery, jurusanFilter]);

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 pb-12">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <PageBreadcrumb currentPage="Peta DUDIKA" className="mb-6" />

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <MapIcon className="h-6 w-6" />
                </div>
                Peta Lokasi DUDIKA
              </h1>
              <p className="text-slate-500 mt-2 ml-14">
                Sebaran mitra Prakerin / PKL Industri
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={fetchDudikas} 
              disabled={loading}
              className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6 border-slate-200/60 shadow-sm overflow-hidden bg-white/80 backdrop-blur-xl">
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filter:</span>
                <Select value={jurusanFilter} onValueChange={setJurusanFilter}>
                  <SelectTrigger className="w-full md:w-[200px] bg-white">
                    <SelectValue placeholder="Pilih Jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua Jurusan">Semua Jurusan</SelectItem>
                    {JURUSAN_LIST.map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Cari nama perusahaan atau alamat..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200/60 focus-visible:ring-blue-500/20 w-full"
                />
              </div>
              
              <div className="w-full md:w-auto text-sm text-center md:text-right px-4 font-medium text-slate-600">
                <span className="text-blue-600 font-bold">{filteredDudikas.length}</span> DUDIKA ditemukan
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* The Map */}
            <div className="lg:col-span-2 h-[500px] md:h-[650px]">
              <MapDudika dudikas={filteredDudikas} selectedDudikaId={selectedDudikaId} />
            </div>

            {/* The List beside Map */}
            <Card className="border-slate-200/60 shadow-sm h-[500px] md:h-[650px] flex flex-col overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate-500" />
                  Daftar DUDIKA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-grow">
                <div className="divide-y divide-slate-100">
                  {filteredDudikas.length > 0 ? (
                    filteredDudikas.map((dudika) => (
                      <div 
                        key={dudika.id} 
                        className={`p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 cursor-pointer ${selectedDudikaId === dudika.id ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setSelectedDudikaId(dudika.id)}
                      >
                        <h3 className="font-semibold text-slate-800 text-sm flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${selectedDudikaId === dudika.id ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
                          {dudika.nama_perusahaan}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 ml-3.5">
                          {dudika.alamat}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <Building className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm">Tidak ada DUDIKA yang sesuai.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </>
  );
};

export default PetaDudikaPage;
