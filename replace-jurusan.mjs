import fs from 'fs';
import path from 'path';

const replacements = [
  {
    file: 'components/siswa/SiswaImportDialog.tsx',
    search: "'Ahmad Rizki,1234567890,ahmad@smkn1bjm.sch.id,XII RPL 1',",
    replace: "'Ahmad Rizki,1234567890,ahmad@smkn1bjm.sch.id,XII TJKT 1',"
  },
  {
    file: 'components/siswa/SiswaImportDialog.tsx',
    search: "'Siti Nurhaliza,1234567891,,XII RPL 2',",
    replace: "'Siti Nurhaliza,1234567891,,XII DKV 1',"
  },
  {
    file: 'components/siswa/SiswaImportDialog.tsx',
    search: "'Budi Santoso,1234567892,,XII TKJ 1'",
    replace: "'Budi Santoso,1234567892,,XII AKL 1'"
  },
  {
    file: 'components/sisarpras/RuanganForm.tsx',
    search: 'placeholder="Contoh: R-X-RPL-1"',
    replace: 'placeholder="Contoh: R-X-TJKT-1"'
  },
  {
    file: 'components/sisarpras/RuanganForm.tsx',
    search: 'placeholder="Lab Rekayasa Perangkat Lunak 1"',
    replace: 'placeholder="Lab Teknik Jaringan Komputer dan Telekomunikasi 1"'
  },
  {
    file: 'components/sisarpras/LaporanKerusakanForm.tsx',
    search: 'placeholder="Lab RPL 1, Meja Guru"',
    replace: 'placeholder="Lab TJKT 1, Meja Guru"'
  },
  {
    file: 'components/sisarpras/InventarisForm.tsx',
    search: 'placeholder="Lab RPL 1"',
    replace: 'placeholder="Lab TJKT 1"'
  },
  {
    file: 'app/manage-rombel/page.tsx',
    search: 'placeholder="Contoh: X RPL 1"',
    replace: 'placeholder="Contoh: X TJKT 1"'
  },
  {
    file: 'components/peminjaman/PeminjamanRuanganForm.tsx',
    search: 'placeholder="Contoh: X RPL 1, XI TKJ 2"',
    replace: 'placeholder="Contoh: X TJKT 1, XI DKV 2"'
  },
  {
    file: 'components/peminjaman/PeminjamanForm.tsx',
    search: 'placeholder="Contoh: X RPL 1, XI TKJ 2"',
    replace: 'placeholder="Contoh: X TJKT 1, XI DKV 2"'
  },
  {
    file: 'app/administrasi-guru/jurnal/page.tsx',
    search: 'placeholder="Contoh: XI RPL 1"',
    replace: 'placeholder="Contoh: XI TJKT 1"'
  }
];

const basePath = path.join('c:', 'Users', 'User', 'OneDrive', 'Documents', 'GitHub', 'synapsesmk-dashboard');

for (const req of replacements) {
  const filePath = path.join(basePath, req.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(req.search)) {
      content = content.replace(req.search, req.replace);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Replaced in ${req.file}`);
    } else {
      console.log(`Not found in ${req.file}`);
    }
  } else {
    console.log(`File not found: ${req.file}`);
  }
}
