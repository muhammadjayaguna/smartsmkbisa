import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'C:/Users/User/OneDrive/Documents/GitHub/smartsmkbisa';

const dirsToScan = [
  'app/(marketplace)',
  'app/admin/marketplace',
  'components/marketplace',
  'integrations/marketplace',
  'contexts/marketplace',
  'hooks/marketplace',
  'lib/marketplace'
];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, 'process.env.NEXT_PUBLIC_SUPABASE_URL');
  newContent = newContent.replace(/import\.meta\.env\.VITE_SUPABASE_PUBLISHABLE_KEY/g, 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  newContent = newContent.replace(/import\.meta\.env\.VITE_SUPABASE_PROJECT_ID/g, 'process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID');
  newContent = newContent.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated env vars in: ${filePath}`);
  }
}

function scanDir(dir) {
  const fullPath = path.join(TARGET_DIR, dir);
  if (!fs.existsSync(fullPath)) return;
  
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      processFile(entryPath);
    }
  }
}

dirsToScan.forEach(scanDir);
console.log('Env variables fixed.');
