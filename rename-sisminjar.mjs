import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'components/common/FloatingMascot.tsx',
  'components/home/Dashboard.tsx',
  'components/administrasi-guru/SintesaHeader.tsx',
  'components/administrasi-guru/SintesaSidebar.tsx',
  'app/administrasi-guru/page.tsx',
  'app/administrasi-guru/wali-mindset/page.tsx',
];

const basePath = process.cwd();

for (const relPath of filesToUpdate) {
  const fullPath = path.join(basePath, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace text in FloatingMascot
    if (relPath.includes('FloatingMascot.tsx')) {
      content = content.replace(/>Sisminjar \(Administrasi Guru\)</g, '>SiAjar (Administrasi Guru)<');
    }
    
    // Replace text in Dashboard
    if (relPath.includes('Dashboard.tsx')) {
      content = content.replace(/'Sisminjar'/g, "'SiAjar'");
    }
    
    // Replace text in SintesaHeader
    if (relPath.includes('SintesaHeader.tsx')) {
      content = content.replace(/>Sisminjar<\/Link>/g, '>SiAjar</Link>');
    }
    
    // Replace text in SintesaSidebar
    if (relPath.includes('SintesaSidebar.tsx')) {
      content = content.replace(/>Sisminjar<\/span>/g, '>SiAjar</span>');
      content = content.replace(/© 2026 Sisminjar/g, '© 2026 SiAjar');
    }
    
    // Replace text in administrasi-guru/page.tsx
    if (relPath.includes('administrasi-guru/page.tsx')) {
      content = content.replace(/di Sisminjar —/g, 'di SiAjar —');
      content = content.replace(/>Admin Sisminjar</g, '>Admin SiAjar<');
      content = content.replace(/fitur Sisminjar/g, 'fitur SiAjar');
    }
    
    // Replace text in wali-mindset/page.tsx
    if (relPath.includes('wali-mindset')) {
      content = content.replace(/Sisminjar akan segera/g, 'SiAjar akan segera');
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated UI text in ${relPath}`);
  }
}
