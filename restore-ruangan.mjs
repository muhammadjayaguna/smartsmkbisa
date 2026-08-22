import fs from 'fs';
import path from 'path';

const file = 'c:/Users/User/OneDrive/Documents/GitHub/synapsesmk-dashboard/components/peminjaman/PeminjamanRuanganTable.tsx';
let content = fs.readFileSync(file, 'utf-8');

const targetStr = `               </TableHeader>
                     <TableCell>{item.kelas || "-"}</TableCell>`;

const replacementStr = `               </TableHeader>
               <TableBody>
                 {data.map((item) => (
                   <TableRow key={item.id} className="hover:bg-muted/50">
                     <TableCell className="font-medium">
                       {format(new Date(item.tanggal_peminjaman), "dd MMM yyyy", { locale: id })}
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <DoorOpen className="h-4 w-4 text-primary" />
                         {item.nama_ruangan}
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline" className="font-mono">
                         Jam {item.mulai_jam} - {item.sampai_jam}
                       </Badge>
                     </TableCell>
                     <TableCell>{item.kelas || "-"}</TableCell>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(file, content, 'utf-8');
console.log('Restored TableBody and cells');
