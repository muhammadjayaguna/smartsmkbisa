import fs from 'fs';
import path from 'path';

const SOURCE_DIR = 'C:/Users/User/OneDrive/Documents/GitHub/smkn-1-banjarmasin-marketplace/src';
const TARGET_DIR = 'C:/Users/User/OneDrive/Documents/GitHub/smartsmkbisa';

const mappings = [
  { type: 'lib', src: 'lib', dest: 'lib/marketplace' },
  { type: 'hooks', src: 'hooks', dest: 'hooks/marketplace' },
  { type: 'contexts', src: 'contexts', dest: 'contexts/marketplace' },
  { type: 'integrations', src: 'integrations', dest: 'integrations/marketplace' },
  { type: 'components', src: 'components', dest: 'components/marketplace', exclude: ['ui'] },
];

const pageMappings = {
  'Index.tsx': 'app/(marketplace)/marketplace/page.tsx',
  'Products.tsx': 'app/(marketplace)/marketplace/products/page.tsx',
  'ProductDetail.tsx': 'app/(marketplace)/marketplace/products/[id]/page.tsx',
  'Cart.tsx': 'app/(marketplace)/marketplace/cart/page.tsx',
  'Wishlist.tsx': 'app/(marketplace)/marketplace/wishlist/page.tsx',
  'Transactions.tsx': 'app/(marketplace)/marketplace/transactions/page.tsx',
  'Chat.tsx': 'app/(marketplace)/marketplace/chat/page.tsx',
  'AIHub.tsx': 'app/(marketplace)/marketplace/ai-hub/page.tsx',
  'Community.tsx': 'app/(marketplace)/marketplace/community/page.tsx',
  'SellerDashboard.tsx': 'app/(marketplace)/marketplace/seller/dashboard/page.tsx',
  'SellerProfile.tsx': 'app/(marketplace)/marketplace/seller/[id]/page.tsx',
  'AdminDashboard.tsx': 'app/admin/marketplace/page.tsx'
};

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function processContent(content, filePath) {
  let newContent = content;
  
  // Replace paths
  newContent = newContent.replace(/@\/components\/ui\//g, '@/components/ui/');
  newContent = newContent.replace(/@\/components\/(?!ui\/)/g, '@/components/marketplace/');
  newContent = newContent.replace(/@\/lib\//g, '@/lib/marketplace/');
  newContent = newContent.replace(/@\/hooks\//g, '@/hooks/marketplace/');
  newContent = newContent.replace(/@\/contexts\//g, '@/contexts/marketplace/');
  newContent = newContent.replace(/@\/integrations\//g, '@/integrations/marketplace/');
  
  // React Router to Next.js
  newContent = newContent.replace(/import\s*\{\s*Link[^}]*\}\s*from\s*['"]react-router-dom['"];?/g, "import Link from 'next/link';");
  
  if (newContent.includes('useNavigate')) {
    newContent = newContent.replace(/useNavigate/g, 'useRouter');
    if (!newContent.includes("import { useRouter } from 'next/navigation'")) {
        newContent = `import { useRouter } from 'next/navigation';\n` + newContent;
    }
  }
  
  // Remove react-router-dom imports that might still contain useRouter
  newContent = newContent.replace(/import\s*\{[^}]*useRouter[^}]*\}\s*from\s*['"]react-router-dom['"];?/g, "");
  // Generic remove react-router-dom
  newContent = newContent.replace(/import\s*\{[^}]*\}\s*from\s*['"]react-router-dom['"];?/g, "");
  
  // Fix Link `to` props
  newContent = newContent.replace(/<Link\s+([^>]*?)to=/g, '<Link $1href=');
  
  // Fix useNavigate instances
  newContent = newContent.replace(/const\s+navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
  newContent = newContent.replace(/navigate\(/g, 'router.push(');
  
  // Add "use client" if it's a context, hook, component
  if (filePath.endsWith('.tsx') || filePath.includes('/hooks/') || filePath.includes('/contexts/')) {
    if (!newContent.includes('"use client"') && !newContent.includes("'use client'")) {
      newContent = '"use client";\n\n' + newContent;
    }
  }

  return newContent;
}

function copyRecursive(srcDir, destDir, exclude = []) {
  ensureDirSync(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath, exclude);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(srcPath, 'utf8');
      const processed = processContent(content, destPath);
      fs.writeFileSync(destPath, processed);
      console.log(`Copied & transformed: ${destPath}`);
    }
  }
}

// 1. Copy mappings
mappings.forEach(mapping => {
  const src = path.join(SOURCE_DIR, mapping.src);
  const dest = path.join(TARGET_DIR, mapping.dest);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest, mapping.exclude || []);
  }
});

// 2. Copy pages
const pagesDir = path.join(SOURCE_DIR, 'pages');
if (fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir);
  pages.forEach(page => {
    if (pageMappings[page]) {
      const srcPath = path.join(pagesDir, page);
      const destPath = path.join(TARGET_DIR, pageMappings[page]);
      ensureDirSync(path.dirname(destPath));
      
      const content = fs.readFileSync(srcPath, 'utf8');
      const processed = processContent(content, destPath);
      fs.writeFileSync(destPath, processed);
      console.log(`Copied & transformed page: ${destPath}`);
    }
  });
}

console.log('Migration script completed.');
