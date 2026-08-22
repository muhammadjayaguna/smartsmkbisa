import fs from 'fs';
import path from 'path';

const sourceDir = 'C:/Users/User/OneDrive/Documents/GitHub/smart-smkn1bjm-absensi/src/pages';
const targetDir = 'C:/Users/User/OneDrive/Documents/GitHub/synapsesmk-dashboard/app';

const pageMappings = [
  { src: 'AbsensiGuru.tsx', dest: 'absensi-guru/page.tsx' },
  { src: 'AbsensiSiswaMagang.tsx', dest: 'absensi-siswa-magang/page.tsx' },
  { src: 'AdminChat.tsx', dest: 'admin/chat/page.tsx' },
  { src: 'DataAbsensiSiswaMagang.tsx', dest: 'data-absensi-siswa-magang/page.tsx' },
  { src: 'DirectChat.tsx', dest: 'direct-chat/page.tsx' },
  { src: 'JurnalMengajar.tsx', dest: 'jurnal-mengajar/page.tsx' },
  { src: 'ManagePemberitahuan.tsx', dest: 'manage-pemberitahuan/page.tsx' },
  { src: 'ManageRombel.tsx', dest: 'manage-rombel/page.tsx' },
  { src: 'ManageSiswa.tsx', dest: 'manage-siswa/page.tsx' },
  { src: 'ManageUsers.tsx', dest: 'manage-users/page.tsx' },
  { src: 'NotFound.tsx', dest: 'not-found.tsx' },
  { src: 'PeminjamanBarang.tsx', dest: 'peminjaman-barang/page.tsx' },
  { src: 'Reports.tsx', dest: 'reports/page.tsx' },
  { src: 'RombelDetail.tsx', dest: 'rombel/[id]/page.tsx' },
  { src: 'Index.tsx', dest: 'auth-login/page.tsx' } // Just an assumption, we can review it later
];

for (const mapping of pageMappings) {
  const srcPath = path.join(sourceDir, mapping.src);
  const destPath = path.join(targetDir, mapping.dest);
  
  if (fs.existsSync(srcPath)) {
    const content = fs.readFileSync(srcPath, 'utf-8');
    // Ensure 'use client' is at the top
    let newContent = content;
    if (!newContent.startsWith("'use client'") && !newContent.startsWith('"use client"')) {
      newContent = "'use client';\n\n" + newContent;
    }
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, newContent);
    console.log(`Migrated ${mapping.src} to ${mapping.dest}`);
  } else {
    console.warn(`Source file not found: ${srcPath}`);
  }
}
