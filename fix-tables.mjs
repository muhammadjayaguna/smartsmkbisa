import fs from 'fs';

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  // Fix query user filtering
  content = content.replace(/query = query.eq\('pelapor_id', user\.id\);/g, "query = query.eq('pelapor_id', user.db_id || user.id);");
  content = content.replace(/query = query.eq\('pengaju_id', user\.id\);/g, "query = query.eq('pengaju_id', user.db_id || user.id);");
  
  // Fix auth.users to users
  content = content.replace(/auth\.users\(email\)/g, "users(nama, email)");
  
  // Fix table cell displaying email to use nama if available
  // In LaporanKerusakanTable.tsx: {item.pelapor?.email?.split('@')[0]}
  // In PengadaanTable.tsx: {item.pengaju?.email?.split('@')[0]}
  content = content.replace(/\{item\.pelapor\?\.email\?\.split\('@'\)\[0\]\}/g, "{item.pelapor?.nama || item.pelapor?.email?.split('@')[0]}");
  content = content.replace(/\{item\.pengaju\?\.email\?\.split\('@'\)\[0\]\}/g, "{item.pengaju?.nama || item.pengaju?.email?.split('@')[0]}");

  fs.writeFileSync(file, content, 'utf-8');
}

fixFile('c:/Users/User/OneDrive/Documents/GitHub/synapsesmk-dashboard/components/sisarpras/LaporanKerusakanTable.tsx');
fixFile('c:/Users/User/OneDrive/Documents/GitHub/synapsesmk-dashboard/components/sisarpras/PengadaanTable.tsx');

console.log('Fixed tables');
