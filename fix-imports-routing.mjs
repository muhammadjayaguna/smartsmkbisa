import fs from 'fs';
import path from 'path';

const dirsToProcess = ['app', 'components', 'hooks', 'utils'];
const basePath = 'C:/Users/User/OneDrive/Documents/GitHub/synapsesmk-dashboard';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Fix Supabase imports
  content = content.replace(/@\/integrations\/supabase\/client/g, '@/lib/supabase/client');
  
  // 2. Fix react-router-dom imports -> next/navigation and next/link
  // Replace useNavigate
  if (content.includes('useNavigate')) {
    content = content.replace(/import\s+{.*useNavigate.*}\s+from\s+['"]react-router-dom['"];?/g, (match) => {
      // If there are other things imported from react-router-dom, we should be careful.
      // For simplicity, we just add next/navigation import and remove useNavigate from the match.
      return `import { useRouter } from 'next/navigation';\n` + match.replace('useNavigate', '').replace(/,\s*}/, '}').replace(/{\s*,/, '{');
    });
    // If it was the only import and it became empty: import {} from 'react-router-dom'
    content = content.replace(/import\s+{\s*}\s+from\s+['"]react-router-dom['"];?\n?/g, '');
    
    // Replace hook call
    content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const router = useRouter();');
    
    // Replace navigate(...) with router.push(...)
    content = content.replace(/navigate\(/g, 'router.push(');
  }

  // Replace Link
  if (content.includes('import { Link } from "react-router-dom"') || content.includes("import { Link } from 'react-router-dom'")) {
    content = content.replace(/import\s+{\s*Link\s*}\s+from\s+['"]react-router-dom['"];?/g, `import Link from 'next/link';`);
  } else if (content.includes('Link') && content.includes('react-router-dom')) {
    // Mixed imports like import { Link, useNavigate } from 'react-router-dom';
    content = content.replace(/import\s+{(.*)Link(.*)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1, p2) => {
      const remaining = [p1, p2].join('').replace(/,\s*,/g, ',').replace(/{\s*,/, '{').replace(/,\s*}/, '}').trim();
      let res = `import Link from 'next/link';\n`;
      if (remaining !== '{}') {
        res += `import {${remaining}} from 'react-router-dom';`;
      }
      return res;
    });
  }
  
  // Change <Link to="..."> to <Link href="...">
  content = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

for (const dir of dirsToProcess) {
  const fullDirPath = path.join(basePath, dir);
  if (fs.existsSync(fullDirPath)) {
    processDirectory(fullDirPath);
  }
}
