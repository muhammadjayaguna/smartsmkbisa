import fs from 'fs';
import path from 'path';

const dir = path.join('c:', 'Users', 'User', 'OneDrive', 'Documents', 'GitHub', 'synapsesmk-dashboard', 'components', 'sisarpras');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('react-hot-toast')) {
    // Replace import
    content = content.replace(/import \{ toast \} from 'react-hot-toast';/g, "import { toast } from '@/components/ui/use-toast';");
    
    // Replace toast.success('msg') -> toast({ title: 'Sukses', description: 'msg' })
    content = content.replace(/toast\.success\((['"`])(.*?)\1\)/g, "toast({ title: 'Sukses', description: $1$2$1 })");
    
    // Replace toast.error('msg') -> toast({ title: 'Error', description: 'msg', variant: 'destructive' })
    content = content.replace(/toast\.error\((['"`])(.*?)\1\)/g, "toast({ title: 'Error', description: $1$2$1, variant: 'destructive' })");
    
    // Replace complex toast.error('Gagal... ' + error.message)
    content = content.replace(/toast\.error\((.*?)\)/g, (match, p1) => {
      if (p1.startsWith('{')) return match;
      return `toast({ title: 'Error', description: ${p1}, variant: 'destructive' })`;
    });
    
    // Replace complex toast.success
    content = content.replace(/toast\.success\((.*?)\)/g, (match, p1) => {
      if (p1.startsWith('{')) return match;
      return `toast({ title: 'Sukses', description: ${p1} })`;
    });

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed', file);
  }
}
