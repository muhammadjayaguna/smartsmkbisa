import fs from 'fs';

const files = [
  'components/layout/MobileHeader.tsx',
  'components/layout/Navbar.tsx',
  'components/common/BackgroundMusic.tsx',
  'app/direct-chat/page.tsx',
  'app/rombel/[id]/page.tsx',
  'app/absensi-guru/page.tsx',
  'app/data-absensi-siswa-magang/page.tsx',
  'app/peminjaman-barang/page.tsx',
  'hooks/useAuth.tsx',
  'hooks/useDirectMessages.ts',
  'hooks/useUserRole.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    if (!content.includes("'use client'") && !content.includes('"use client"')) {
      fs.writeFileSync(file, "'use client';\n" + content);
      console.log('Added use client to', file);
    }
  }
});
