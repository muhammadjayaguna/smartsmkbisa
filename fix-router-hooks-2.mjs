import fs from 'fs';
import path from 'path';

const files = [
  'app/(marketplace)/marketplace/transactions/page.tsx',
  'app/(marketplace)/marketplace/chat/page.tsx',
  'app/(marketplace)/marketplace/products/page.tsx',
  'app/(marketplace)/marketplace/products/[id]/page.tsx',
  'app/(marketplace)/marketplace/seller/[id]/page.tsx',
  'components/marketplace/MobileBottomNav.tsx'
];

for (const file of files) {
  const filePath = path.join('C:/Users/User/OneDrive/Documents/GitHub/smartsmkbisa', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // determine what to import
    const imports = [];
    if (content.includes('useSearchParams')) imports.push('useSearchParams');
    if (content.includes('useParams')) imports.push('useParams');
    if (content.includes('useLocation')) imports.push('useLocation');
    
    if (imports.length > 0 && !content.includes('use-router-dom')) {
      const importLine = `import { ${imports.join(', ')} } from '@/hooks/marketplace/use-router-dom';\n`;
      let newContent = content;
      
      if (newContent.startsWith('"use client";') || newContent.startsWith("'use client';")) {
        newContent = newContent.replace(/^("use client";?|'use client';?)\s*/, `$1\n${importLine}`);
      } else {
        newContent = importLine + newContent;
      }
      
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', file);
    }
  }
}
