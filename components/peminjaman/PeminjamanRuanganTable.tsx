 import { format } from "date-fns";
 import { id } from "date-fns/locale";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { DoorOpen, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
 
 export interface PeminjamanRuangan {
   id: string;
   tanggal_peminjaman: string;
   nama_ruangan: string;
   mulai_jam: number;
   sampai_jam: number;
   nama_guru: string;
   kelas: string | null;
   nama_siswa: string | null;
   catatan: string | null;
   status: string | null;
   created_at: string;
 }
 
 interface PeminjamanRuanganTableProps {
   data: PeminjamanRuangan[] | undefined;
   isLoading: boolean;
   onAddClick: () => void;
   onEdit: (item: PeminjamanRuangan) => void;
   onDelete: (id: string) => void;
   isDeleting: boolean;
  isAdmin?: boolean;
 }
 
const PeminjamanRuanganTable = ({ data, isLoading, onAddClick, onEdit, onDelete, isDeleting, isAdmin = false }: PeminjamanRuanganTableProps) => {
   return (
     <Card className="shadow-lg">
       <CardHeader>
         <CardTitle className="text-lg">Daftar Peminjaman</CardTitle>
         <CardDescription>Riwayat peminjaman barang</CardDescription>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex justify-center items-center py-12">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         ) : data && data.length > 0 ? (
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Tanggal</TableHead>
                   <TableHead>Nama Ruangan</TableHead>
                   <TableHead>Jam</TableHead>
                   <TableHead>Kelas</TableHead>
                   <TableHead>Nama Siswa</TableHead>
                   <TableHead>Nama Guru</TableHead>
                   <TableHead>Catatan</TableHead>
                  {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                 </TableRow>
               </TableHeader>
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
                     <TableCell>{item.kelas || "-"}</TableCell>
                     <TableCell>{item.nama_siswa || "-"}</TableCell>
                     <TableCell>{item.nama_guru}</TableCell>
                     <TableCell className="max-w-[200px] truncate">
                       {item.catatan || "-"}
                     </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Peminjaman?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data peminjaman "{item.nama_ruangan}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(item.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Hapus"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
         ) : (
           <div className="text-center py-12">
             <DoorOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
             <p className="text-muted-foreground">Belum ada data peminjaman</p>
             <Button variant="outline" className="mt-4" onClick={onAddClick}>
               <Plus className="h-4 w-4 mr-2" />
               Ajukan Peminjaman Pertama
             </Button>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default PeminjamanRuanganTable;