'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Plus, Settings, Printer, Moon, Sun, ChevronDown, BookOpen, ChevronRight, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SettingsModal from './SettingsModal';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSisminjar } from './SisminjarContext';
import { useWali } from './WaliContext';
import { useAuth } from '@/hooks/useAuth';

interface SintesaHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SintesaHeader({ title, subtitle }: SintesaHeaderProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname() || '';
  const isWaliPage = pathname.includes('/wali-');
  const { listMapel, activeMapelId, setActiveMapelId, loading } = useSisminjar();
  const { listRombel, activeRombelId, setActiveRombelId, loadingWali } = useWali();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openSettingsAsNew, setOpenSettingsAsNew] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [listTahun, setListTahun] = useState<{id: string, nama: string}[]>([]);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Fetch tahun ajaran
    const fetchTahun = async () => {
      const { data } = await supabase.from('tahun_ajaran').select('*').order('nama', { ascending: false });
      if (data && data.length > 0) {
        setListTahun(data);
        const aktif = data.find(d => d.aktif);
        if (aktif) setTahunAjaran(aktif.nama);
        else setTahunAjaran(data[0].nama);
      }
    };
    fetchTahun();
  }, []);

  // Mapping logic for breadcrumbs and dynamic titles
  const getPageInfo = () => {
    if (pathname.includes('/ma')) return { group: 'Dokumen Mengajar', title: 'Modul Ajar (RPP)', subtitle: 'Penyusunan modul ajar cerdas berbasis AI' };
    if (pathname.includes('/asesmen')) return { group: 'Dokumen Mengajar', title: 'Instrumen Asesmen', subtitle: 'Penyusunan instrumen penilaian siswa' };
    if (pathname.includes('/p5')) return { group: 'Dokumen Mengajar', title: 'Modul Projek P5', subtitle: 'Perancangan modul projek penguatan profil pelajar' };
    if (pathname.includes('/cp')) return { group: 'Capaian & Tujuan', title: 'Capaian Pembelajaran', subtitle: 'Eksplorasi CP resmi dari Kemdikbud' };
    if (pathname.includes('/atp')) return { group: 'Capaian & Tujuan', title: 'Alur Tujuan Pembelajaran', subtitle: 'Penyusunan ATP dan KKTP mata pelajaran' };
    if (pathname.includes('/prota')) return { group: 'Capaian & Tujuan', title: 'Prota & Promes', subtitle: 'Program Tahunan dan Program Semester' };
    if (pathname.includes('/jurnal')) return { group: 'Administrasi Kelas', title: 'Jurnal Mengajar', subtitle: 'Catatan harian KBM dan materi kelas' };
    if (pathname.includes('/absensi')) return { group: 'Administrasi Kelas', title: 'Kehadiran Guru', subtitle: 'Rekam kehadiran apel/upacara harian' };
    if (pathname.includes('/penilaian')) return { group: 'Administrasi Kelas', title: 'Penilaian Tugas', subtitle: 'Buku nilai digital dan rekapitulasi' };
    if (pathname.includes('/remedial')) return { group: 'Administrasi Kelas', title: 'Program Remedial', subtitle: 'Tindak lanjut perbaikan nilai siswa' };
    if (pathname.includes('/siswa')) return { group: 'Guru Wali', title: 'Daftar Siswa', subtitle: 'Data profil siswa bimbingan' };
    if (pathname.includes('/sampul')) return { group: 'Utilitas', title: 'Sampul Perangkat', subtitle: 'Cetak cover dokumen administrasi' };
    
    return { group: 'Utama', title: title, subtitle: subtitle || '' };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center">
        <Link href="/" className="mr-4 text-slate-400 hover:text-slate-600 transition-colors">
          <Menu className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center text-[10px] text-slate-400 font-semibold mb-0.5 space-x-1 tracking-wide uppercase">
            <Link href="/" className="hover:text-teal-600 transition-colors">Dasbor</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/administrasi-guru" className="hover:text-teal-600 transition-colors">Sisminjar</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-teal-600">{pageInfo.group}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{pageInfo.title}</h1>
          <p className="text-[11px] text-slate-500">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        
        {/* Dropdown Pemilih Mapel atau Rombel */}
        {isWaliPage ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors"
              disabled={loadingWali || listRombel.length === 0}
            >
              <Users className="w-4 h-4" />
              <span>
                {loadingWali ? 'Memuat...' : 
                 listRombel.length === 0 ? 'Belum Ada Rombel' : 
                 listRombel.find(m => m.id === activeRombelId)?.nama_rombel || 'Pilih Rombel Binaan'}
              </span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {isDropdownOpen && listRombel.length > 0 && (
              <div className="absolute top-full mt-2 w-56 right-0 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rombel Binaan Aktif</p>
                </div>
                {listRombel.map(rombel => (
                  <button
                    key={rombel.id}
                    onClick={() => {
                      setActiveRombelId(rombel.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${activeRombelId === rombel.id ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'}`}
                  >
                    {rombel.nama_rombel}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => {
                if (listMapel.length === 0) {
                  setIsSettingsOpen(true);
                } else {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {loading ? 'Memuat...' : 
                 listMapel.length === 0 ? 'Buat Mapel Baru' : 
                 listMapel.find(m => m.id === activeMapelId)?.mata_pelajaran || 'Pilih Mapel Aktif'}
              </span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {isDropdownOpen && listMapel.length > 0 && (
              <div className="absolute top-full mt-2 w-56 right-0 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran Aktif</p>
                </div>
                {listMapel.map(mapel => (
                  <button
                    key={mapel.id}
                    onClick={() => {
                      setActiveMapelId(mapel.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex flex-col ${activeMapelId === mapel.id ? 'text-teal-600 font-bold bg-teal-50/50' : 'text-slate-700'}`}
                  >
                    <span>{mapel.mata_pelajaran}</span>
                    <span className="text-xs font-normal text-slate-400">{mapel.kelas || 'Semua Kelas'}</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-2 pt-2 px-2 space-y-1">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setOpenSettingsAsNew(true);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Buat Mapel Baru
                  </button>
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setOpenSettingsAsNew(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 py-2 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <Settings className="w-3 h-3" /> Kelola Mapel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-slate-500 hover:text-amber-500 hover:bg-amber-50"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors">
            <Printer className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            onClick={() => {
              setOpenSettingsAsNew(false);
              setIsSettingsOpen(true);
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => { setIsSettingsOpen(false); setOpenSettingsAsNew(false); }} 
        defaultNew={openSettingsAsNew} 
      />
    </header>
  );
}
