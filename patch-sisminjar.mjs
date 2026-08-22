import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/User/OneDrive/Documents/GitHub/synapsesmk-dashboard/app/administrasi-guru';

function walkDir(currentDir) {
  let results = [];
  const list = fs.readdirSync(currentDir);
  list.forEach(file => {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else {
      if (fullPath.endsWith('page.tsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walkDir(dir);

files.forEach(file => {
  // Skip the ones we already did
  if (file.replace(/\\/g, '/').endsWith('app/administrasi-guru/page.tsx')) return;
  if (file.replace(/\\/g, '/').endsWith('app/administrasi-guru/cp/page.tsx')) return;

  let content = fs.readFileSync(file, 'utf8');

  // Check if it fetches pengaturan_guru
  if (!content.includes('pengaturan_guru')) return;

  console.log('Patching', file);

  // 1. Import
  if (!content.includes('useSisminjar')) {
    content = content.replace(
      "import { useAuth } from '@/hooks/useAuth';",
      "import { useAuth } from '@/hooks/useAuth';\nimport { useSisminjar } from '@/components/administrasi-guru/SisminjarContext';"
    );
  }

  // 2. State
  content = content.replace(
    /const \[pengaturan,\s*setPengaturan\]\s*=\s*useState<any>\(null\);/g,
    'const { activeMapel, loading: contextLoading } = useSisminjar();'
  );

  // 3. Loading check
  content = content.replace(
    /if\s*\(\s*loading\s*\)\s*\{/g,
    'if (loading || contextLoading) {'
  );
  // One liner
  content = content.replace(
    /if\s*\(\s*loading\s*\)\s*return/g,
    'if (loading || contextLoading) return'
  );

  // 4. Fetch Block Removal
  // We need to carefully remove the block
  const fetchRegex = /\/\/\s*Fetch pengaturan guru[\s\S]*?maybeSingle\(\);\s*if\s*\(pgData\)\s*\{\s*setPengaturan\(pgData\);\s*\}/;
  content = content.replace(fetchRegex, '');
  
  // Alternative fetch block if it doesn't match above exactly
  const fetchRegex2 = /const\s*\{\s*data\s*:\s*pgData\s*\}\s*=\s*await\s*supabase[\s\S]*?maybeSingle\(\);\s*if\s*\(pgData\)\s*\{\s*setPengaturan\(pgData\);\s*\}/;
  content = content.replace(fetchRegex2, '');
  
  // Or maybe they just called it `data`? Let's check `sampul/page.tsx`
  const fetchRegex3 = /const\s*\{\s*data\s*,\s*error\s*\}\s*=\s*await\s*supabase[\s\S]*?from\('pengaturan_guru'\)[\s\S]*?maybeSingle\(\);\s*if\s*\(data\)\s*\{\s*setPengaturan\(data\);\s*\}/;
  content = content.replace(fetchRegex3, '');

  const fetchRegex4 = /const\s*\{\s*data\s*\}\s*=\s*await\s*supabase[\s\S]*?from\('pengaturan_guru'\)[\s\S]*?maybeSingle\(\);\s*if\s*\(data\)\s*setPengaturan\(data\);/;
  content = content.replace(fetchRegex4, '');

  // 5. Replace pengaturan?. with activeMapel?.
  content = content.replace(/pengaturan\?\./g, 'activeMapel?.');
  // Sometimes it's without question mark
  content = content.replace(/pengaturan\./g, 'activeMapel.');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Done!');
