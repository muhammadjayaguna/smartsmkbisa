import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'C:/Users/User/OneDrive/Documents/GitHub/smartsmkbisa';

const dirsToScan = [
  'app/(marketplace)',
  'app/admin/marketplace',
  'components/marketplace',
  'contexts/marketplace',
  'hooks/marketplace',
  'lib/marketplace'
];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // 1. Replace AuthContext import
  if (newContent.includes('@/contexts/marketplace/AuthContext')) {
    newContent = newContent.replace(
      /import\s*\{\s*useAuth\s*\}\s*from\s*['"]@\/contexts\/marketplace\/AuthContext['"];?/g,
      "import { useAuth } from '@/hooks/useAuth';\nimport { useUserRole } from '@/hooks/useUserRole';"
    );
  }
  
  // Also remove layout's AuthProvider
  if (filePath.endsWith('layout.tsx') && newContent.includes('AuthProvider')) {
    newContent = newContent.replace(/import\s*\{\s*AuthProvider\s*\}\s*from\s*['"]@\/contexts\/marketplace\/AuthContext['"];?\n?/g, '');
    newContent = newContent.replace(/<AuthProvider>/g, '');
    newContent = newContent.replace(/<\/AuthProvider>/g, '');
  }

  // 2. Fix useAuth destructuring
  const useAuthRegex = /const\s+\{([^}]+)\}\s*=\s*useAuth\(\);/g;
  newContent = newContent.replace(useAuthRegex, (match, vars) => {
    const varList = vars.split(',').map(v => v.trim()).filter(Boolean);
    const authVars = [];
    const roleVars = [];
    
    varList.forEach(v => {
      if (v === 'role' || v === 'isAdmin') {
        roleVars.push(v);
      } else {
        // user, session, loading, signOut
        authVars.push(v);
      }
    });

    let res = '';
    if (authVars.length > 0) res += `const { ${authVars.join(', ')} } = useAuth();\n  `;
    if (roleVars.length > 0) res += `const { ${roleVars.join(', ')} } = useUserRole();`;
    return res.trim();
  });

  // 3. Fix Supabase Queries
  // Profiles to Users
  newContent = newContent.replace(/\.from\(['"]profiles['"]\)/g, ".from('users')");
  
  // Aliases for full_name
  newContent = newContent.replace(/profiles\(full_name\)/g, "profiles:users(full_name:nama)");
  newContent = newContent.replace(/profiles!([^()]+)\(full_name\)/g, "profiles:users!$1(full_name:nama)");
  newContent = newContent.replace(/buyer:profiles!([^()]+)\(full_name\)/g, "buyer:users!$1(full_name:nama)");
  newContent = newContent.replace(/seller:profiles!([^()]+)\(full_name\)/g, "seller:users!$1(full_name:nama)");
  newContent = newContent.replace(/user:profiles!([^()]+)\(full_name\)/g, "user:users!$1(full_name:nama)");
  newContent = newContent.replace(/reporter:profiles!([^()]+)\(full_name\)/g, "reporter:users!$1(full_name:nama)");
  newContent = newContent.replace(/reported_user:profiles!([^()]+)\(full_name\)/g, "reported_user:users!$1(full_name:nama)");
  
  // When selecting directly from users
  newContent = newContent.replace(/\.select\(['"](.*?)['"](.*?)\)/g, (match, cols, rest) => {
    // only modify if we suspect it's querying users (since we already replaced .from('profiles') to .from('users'))
    let newCols = cols;
    if (newCols.includes('full_name')) {
      newCols = newCols.replace(/\bfull_name\b/g, 'full_name:nama');
    }
    // Remove columns that don't exist in users table
    newCols = newCols.replace(/,\s*avatar_url/g, '');
    newCols = newCols.replace(/avatar_url\s*,?/g, '');
    newCols = newCols.replace(/,\s*major/g, '');
    newCols = newCols.replace(/major\s*,?/g, '');
    newCols = newCols.replace(/,\s*class_name/g, '');
    newCols = newCols.replace(/class_name\s*,?/g, '');
    newCols = newCols.replace(/,\s*is_verified/g, '');
    newCols = newCols.replace(/is_verified\s*,?/g, '');
    
    // clean up dangling commas
    newCols = newCols.replace(/,\s*,/g, ',');
    newCols = newCols.replace(/,\s*$/g, '');
    
    return `.select('${newCols}'${rest})`;
  });

  // 4. Fix user.id -> (user.db_id || user.id)
  // This is tricky, we only want to do it in supabase queries or where we use it for foreign keys.
  // We'll look for common patterns:
  newContent = newContent.replace(/\.eq\(['"]user_id['"],\s*user\.id\)/g, ".eq('user_id', user.db_id || user.id)");
  newContent = newContent.replace(/\.eq\(['"]seller_id['"],\s*user\.id\)/g, ".eq('seller_id', user.db_id || user.id)");
  newContent = newContent.replace(/\.eq\(['"]buyer_id['"],\s*user\.id\)/g, ".eq('buyer_id', user.db_id || user.id)");
  newContent = newContent.replace(/user_id:\s*user\.id/g, "user_id: user.db_id || user.id");
  newContent = newContent.replace(/buyer_id:\s*user\.id/g, "buyer_id: user.db_id || user.id");
  newContent = newContent.replace(/seller_id:\s*user\.id/g, "seller_id: user.db_id || user.id");
  
  // Wait, some places use `session.user.id`. In useAuth, we don't have session.user, we just use user.id.
  newContent = newContent.replace(/session\?.user\?.id/g, "(user?.db_id || user?.id)");
  newContent = newContent.replace(/session\?.user/g, "user");
  newContent = newContent.replace(/session\.user\.id/g, "(user.db_id || user.id)");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Integrated: ${filePath}`);
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
console.log('Auth and Schema Integration Script Completed.');
