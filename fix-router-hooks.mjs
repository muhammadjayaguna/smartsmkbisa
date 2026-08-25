import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'C:/Users/User/OneDrive/Documents/GitHub/smartsmkbisa';

const dirsToScan = [
  'app/(marketplace)',
  'app/admin/marketplace',
  'components/marketplace',
  'contexts/marketplace',
  'hooks/marketplace'
];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  const usesSearchParams = content.includes('useSearchParams');
  const usesParams = content.includes('useParams');
  const usesLocation = content.includes('useLocation');

  if (usesSearchParams || usesParams || usesLocation) {
    // Collect what we need to import
    const imports = [];
    if (usesSearchParams) imports.push('useSearchParams');
    if (usesParams) imports.push('useParams');
    if (usesLocation) imports.push('useLocation');
    
    // Add import statement if not already there
    const importStatement = `import { ${imports.join(', ')} } from '@/hooks/marketplace/use-router-dom';\n`;
    
    if (!content.includes('from \'@/hooks/marketplace/use-router-dom\'') && !content.includes('from "@/hooks/marketplace/use-router-dom"')) {
      // Find where to insert (after "use client" if it exists)
      if (newContent.startsWith('"use client";') || newContent.startsWith("'use client';")) {
        const firstLineEnd = newContent.indexOf('\\n');
        newContent = newContent.replace(/("use client";?\\s*\\n)/, `$1${importStatement}`);
      } else {
        newContent = importStatement + newContent;
      }
    }
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Added missing imports in: ${filePath}`);
  }
}

function scanDir(dir) {
  const fullPath = path.join(TARGET_DIR, dir);
  if (!fs.existsSync(fullPath)) return;
  
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);
    // don't process the hook file itself
    if (entryPath.includes('use-router-dom.ts')) continue;
    
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      processFile(entryPath);
    }
  }
}

dirsToScan.forEach(scanDir);
console.log('Router hooks fixed.');
