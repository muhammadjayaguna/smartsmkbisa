import Link from 'next/link';

import { Home, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentPage: string;
  className?: string;
}

// Route to label mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '/': 'Beranda',
  '/rombel': 'Absensi Siswa',
  '/absensi-guru': 'Absensi Guru Apel',
  '/simagang/peta-dudika': 'Peta Lokasi DUDIKA',
  '/simagang/absensi': 'Absensi Siswa Magang',
  '/simagang/laporan': 'Data Absensi Siswa Magang',
  '/jurnal-mengajar': 'Jurnal Mengajar',
  '/sisarpras/peminjaman-barang': 'Peminjaman Barang',
  '/sisarpras/peminjaman-ruangan': 'Peminjaman Ruangan',
  '/manage-rombel': 'Manajemen Rombel',
  '/manage-siswa': 'Manajemen Siswa',
  '/manage-users': 'Manajemen Pengguna',
  '/manage-pemberitahuan': 'Manajemen Pemberitahuan',
  '/reports': 'Laporan',
};

const PageBreadcrumb = ({ items, currentPage, className }: PageBreadcrumbProps) => {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center gap-1 hover:text-primary">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dasbor</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/#layanan" className="hover:text-primary">
              Layanan
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items?.map((item, index) => (
          <div key={index} className="contents">
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.path ? (
                <BreadcrumbLink asChild>
                  <Link href={item.path} className="hover:text-primary">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
        
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcrumb;
export { routeLabels };