'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Book, FileText, Target, Calendar, BarChart2, Layers, 
  FlaskConical, FileEdit, Sprout, BookOpen, ClipboardList, CheckSquare, 
  Trophy, Activity, Users, HeartHandshake, TrendingUp, Phone, FileCheck, Brain,
  GraduationCap, Clock, Star, AlertCircle, Eye, Settings, Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, UserRole } from '@/hooks/useUserRole';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

// ─── Menu per Role ─────────────────────────────────────────────────

const guruMenu: MenuGroup[] = [
  { group: 'UTAMA', items: [
    { name: 'Dashboard', path: '/administrasi-guru', icon: LayoutDashboard },
  ]},
  { group: 'KURIKULUM', items: [
    { name: 'Halaman Sampul', path: '/administrasi-guru/sampul', icon: Book },
    { name: 'Capaian Pembelajaran', path: '/administrasi-guru/cp', icon: Layers },
    { name: 'Alur Tujuan Pemb.', path: '/administrasi-guru/atp', icon: FileText },
    { name: 'Prota & Promes', path: '/administrasi-guru/prota', icon: Calendar },
    { name: 'KKTP', path: '/administrasi-guru/kktp', icon: Target },
    { name: 'Kalender Pendidikan', path: '/administrasi-guru/kalender', icon: BarChart2 },
  ]},
  { group: 'DOKUMEN MENGAJAR', items: [
    { name: 'Modul Ajar (MA)', path: '/administrasi-guru/ma', icon: FileEdit },
    { name: 'Modul Projek P5', path: '/administrasi-guru/p5', icon: Sprout },
    { name: 'Bahan Ajar', path: '/administrasi-guru/bahan-ajar', icon: BookOpen },
    { name: 'Instrumen Asesmen', path: '/administrasi-guru/asesmen', icon: ClipboardList },
  ]},
  { group: 'ADMINISTRASI KELAS', items: [
    { name: 'Absensi Siswa', path: '/administrasi-guru/absensi-siswa', icon: Users },
    { name: 'Absensi Guru Apel', path: '/administrasi-guru/absensi', icon: CheckSquare },
    { name: 'Laporan Absensi Guru', path: '/administrasi-guru/laporan-absensi', icon: FileCheck },
    { name: 'Jurnal Mengajar', path: '/administrasi-guru/jurnal', icon: Book },
    { name: 'Penilaian Tugas', path: '/administrasi-guru/penilaian', icon: Trophy },
    { name: 'Program Remedial', path: '/administrasi-guru/remedial', icon: Activity },
    { name: 'Analisis Kompetensi', path: '/administrasi-guru/analisis', icon: FlaskConical },
  ]},
  { group: 'GURU WALI', items: [
    { name: 'Program & Jadwal', path: '/administrasi-guru/wali-jadwal', icon: Target },
    { name: 'Siswa Bimbingan', path: '/administrasi-guru/wali-siswa', icon: Users },
    { name: 'Pembinaan & Jurnal', path: '/administrasi-guru/wali-pembinaan', icon: HeartHandshake },
    { name: 'Pantau Akademik', path: '/administrasi-guru/wali-akademik', icon: TrendingUp },
    { name: 'Log Komunikasi', path: '/administrasi-guru/wali-komunikasi', icon: Phone },
    { name: 'Laporan & Evaluasi', path: '/administrasi-guru/wali-laporan', icon: FileCheck },
    { name: 'Pemetaan Pola Pikir', path: '/administrasi-guru/wali-mindset', icon: Brain },
  ]}
];

const siswaMenu: MenuGroup[] = [
  { group: 'UTAMA', items: [
    { name: 'Dashboard', path: '/administrasi-guru', icon: LayoutDashboard },
  ]},
  { group: 'AKADEMIK SAYA', items: [
    { name: 'Nilai Saya', path: '/administrasi-guru/nilai-saya', icon: Star },
    { name: 'Jadwal Pelajaran', path: '/administrasi-guru/jadwal-saya', icon: Calendar },
    { name: 'Absensi Saya', path: '/administrasi-guru/absensi-saya', icon: CheckSquare },
  ]},
];

const kepalaSekolahMenu: MenuGroup[] = [
  { group: 'UTAMA', items: [
    { name: 'Dashboard', path: '/administrasi-guru', icon: LayoutDashboard },
  ]},
  { group: 'MONITORING', items: [
    { name: 'Monitoring Guru', path: '/administrasi-guru/monitoring-guru', icon: Eye },
    { name: 'Laporan Sekolah', path: '/administrasi-guru/laporan-sekolah', icon: BarChart2 },
  ]},
  { group: 'REVIEW KURIKULUM', items: [
    { name: 'Capaian Pembelajaran', path: '/administrasi-guru/cp', icon: Layers },
    { name: 'Alur Tujuan Pemb.', path: '/administrasi-guru/atp', icon: FileText },
    { name: 'Prota & Promes', path: '/administrasi-guru/prota', icon: Calendar },
  ]},
  { group: 'REKAP DATA', items: [
    { name: 'Rekap Absensi', path: '/administrasi-guru/rekap-absen', icon: FileCheck },
    { name: 'Laporan Absensi Guru', path: '/administrasi-guru/laporan-absensi', icon: CheckSquare },
    { name: 'Analisis Kompetensi', path: '/administrasi-guru/analisis', icon: FlaskConical },
  ]},
];

const adminMenu: MenuGroup[] = [
  { group: 'UTAMA', items: [
    { name: 'Dashboard', path: '/administrasi-guru', icon: LayoutDashboard },
  ]},
  // Admin gets all guru menus
  ...guruMenu.filter(g => g.group !== 'UTAMA'),
  // Plus monitoring extras
  { group: 'MONITORING & ADMIN', items: [
    { name: 'Monitoring Guru', path: '/administrasi-guru/monitoring-guru', icon: Eye },
    { name: 'Laporan Sekolah', path: '/administrasi-guru/laporan-sekolah', icon: BarChart2 },
  ]},
];

// ─── Role metadata ─────────────────────────────────────────────────

const roleConfig: Record<string, { label: string; badge: string; badgeColor: string }> = {
  admin:           { label: 'Administrator',   badge: 'ADMIN',    badgeColor: 'bg-red-100 text-red-700' },
  kepala_sekolah:  { label: 'Kepala Sekolah',  badge: 'KEPSEK',   badgeColor: 'bg-amber-100 text-amber-700' },
  guru:            { label: 'Guru Pengampu',   badge: 'GURU',     badgeColor: 'bg-teal-100 text-teal-700' },
  siswa:           { label: 'Siswa',           badge: 'SISWA',    badgeColor: 'bg-blue-100 text-blue-700' },
};

function getMenuForRole(role: UserRole | null): MenuGroup[] {
  switch (role) {
    case 'admin':          return adminMenu;
    case 'kepala_sekolah': return kepalaSekolahMenu;
    case 'siswa':          return siswaMenu;
    default:               return guruMenu; // guru, kajur, waka_sarpras, etc.
  }
}

// ─── Component ─────────────────────────────────────────────────────

export default function SintesaSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { role } = useUserRole();

  const menuItems = getMenuForRole(role);
  const config = roleConfig[role || 'guru'] || roleConfig.guru;

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 flex justify-center items-center border-b border-slate-200">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-teal-600 flex items-center justify-center p-2 mb-2 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="text-teal-700 font-bold text-lg text-center leading-tight">Sisminjar</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase text-center">Sistem Administrasi<br/>Mengajar</span>
          {/* Role Badge */}
          <span className={`mt-2 text-[10px] font-bold px-3 py-1 rounded-full ${config.badgeColor}`}>
            {config.badge}
          </span>
        </div>
      </div>

      <div className="flex-1 py-4">
        {menuItems.map((group, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-6 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{group.group}</h3>
            <ul>
              {group.items.map((item, itemIdx) => {
                const isActive = pathname === item.path;
                return (
                  <li key={itemIdx} className="px-3 mb-1">
                    <Link href={item.path}>
                      <div className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-emerald-500 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}>
                        <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-100 rounded-xl p-3 flex flex-col">
          <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Sekolah & Pengguna</span>
          <span className="text-sm font-bold text-slate-800">SMK Negeri 1</span>
          <span className="text-xs text-slate-500 mt-0.5">{user?.nama || 'Pengguna'}</span>
          <span className={`mt-1.5 text-[10px] font-semibold ${config.badgeColor} px-2 py-0.5 rounded w-fit`}>
            {config.label}
          </span>
        </div>
        <div className="text-center mt-4">
          <p className="text-[10px] text-slate-400">© 2026 Sisminjar</p>
        </div>
      </div>
    </aside>
  );
}
