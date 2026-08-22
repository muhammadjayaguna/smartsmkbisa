 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { DoorOpen, Calendar, Clock, User, FileText, Loader2, GraduationCap, Users } from "lucide-react";
 
 export interface PeminjamanRuanganFormData {
   tanggal_peminjaman: string;
   nama_ruangan: string;
   mulai_jam: string;
   sampai_jam: string;
   nama_guru: string;
   kelas: string;
   nama_siswa: string;
   catatan: string;
 }
 
 interface PeminjamanRuanganFormProps {
   formData: PeminjamanRuanganFormData;
   setFormData: (data: PeminjamanRuanganFormData) => void;
   onSubmit: (e: React.FormEvent) => void;
   onCancel: () => void;
   isLoading: boolean;
   isEdit?: boolean;
 }
 
 const jamOptions = Array.from({ length: 12 }, (_, i) => i + 1);
 
 const PeminjamanRuanganForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, isEdit = false }: PeminjamanRuanganFormProps) => {
   return (
     <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/50 backdrop-blur">
       <CardHeader className="pb-4">
         <CardTitle className="text-lg flex items-center gap-2">
           <FileText className="h-5 w-5 text-primary" />
           {isEdit ? "Edit Peminjaman" : "Form Peminjaman Baru"}
         </CardTitle>
         <CardDescription>
           {isEdit ? "Ubah data peminjaman ruangan" : "Isi form berikut untuk mengajukan peminjaman ruangan"}
         </CardDescription>
       </CardHeader>
       <CardContent>
         <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Tanggal Peminjaman */}
           <div className="space-y-2">
             <Label htmlFor="tanggal" className="flex items-center gap-2">
               <Calendar className="h-4 w-4 text-primary" />
               Tanggal Peminjaman
             </Label>
             <Input
               id="tanggal"
               type="date"
               value={formData.tanggal_peminjaman}
               onChange={(e) => setFormData({ ...formData, tanggal_peminjaman: e.target.value })}
               className="border-primary/20 focus:border-primary"
               required
             />
           </div>
 
           {/* Nama Alat */}
           <div className="space-y-2">
             <Label htmlFor="nama_ruangan" className="flex items-center gap-2">
               <DoorOpen className="h-4 w-4 text-primary" />
               Nama Ruangan
             </Label>
             <Input
               id="nama_ruangan"
               placeholder="Contoh: Lab Komputer 1, Aula, dll"
               value={formData.nama_ruangan}
               onChange={(e) => setFormData({ ...formData, nama_ruangan: e.target.value })}
               className="border-primary/20 focus:border-primary"
               required
             />
           </div>
 
           {/* Mulai Jam */}
           <div className="space-y-2">
             <Label htmlFor="mulai_jam" className="flex items-center gap-2">
               <Clock className="h-4 w-4 text-primary" />
               Mulai Jam Ke
             </Label>
             <Select
               value={formData.mulai_jam}
               onValueChange={(value) => setFormData({ ...formData, mulai_jam: value })}
             >
               <SelectTrigger className="border-primary/20 focus:border-primary">
                 <SelectValue placeholder="Pilih jam" />
               </SelectTrigger>
               <SelectContent>
                 {jamOptions.map((jam) => (
                   <SelectItem key={jam} value={jam.toString()}>
                     Jam ke-{jam}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Sampai Jam */}
           <div className="space-y-2">
             <Label htmlFor="sampai_jam" className="flex items-center gap-2">
               <Clock className="h-4 w-4 text-primary" />
               Sampai Jam Ke
             </Label>
             <Select
               value={formData.sampai_jam}
               onValueChange={(value) => setFormData({ ...formData, sampai_jam: value })}
             >
               <SelectTrigger className="border-primary/20 focus:border-primary">
                 <SelectValue placeholder="Pilih jam" />
               </SelectTrigger>
               <SelectContent>
                 {jamOptions.map((jam) => (
                   <SelectItem key={jam} value={jam.toString()}>
                     Jam ke-{jam}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Nama Guru */}
           <div className="space-y-2">
             <Label htmlFor="nama_guru" className="flex items-center gap-2">
               <User className="h-4 w-4 text-primary" />
               Nama Guru
             </Label>
             <Input
               id="nama_guru"
               placeholder="Nama guru peminjam"
               value={formData.nama_guru}
               onChange={(e) => setFormData({ ...formData, nama_guru: e.target.value })}
               className="border-primary/20 focus:border-primary"
               required
             />
           </div>
 
           {/* Kelas */}
           <div className="space-y-2">
             <Label htmlFor="kelas" className="flex items-center gap-2">
               <GraduationCap className="h-4 w-4 text-primary" />
               Kelas
             </Label>
             <Input
               id="kelas"
               placeholder="Contoh: X TJKT 1, XI DKV 2"
               value={formData.kelas}
               onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
               className="border-primary/20 focus:border-primary"
             />
           </div>
 
           {/* Nama Siswa */}
           <div className="space-y-2">
             <Label htmlFor="nama_siswa" className="flex items-center gap-2">
               <Users className="h-4 w-4 text-primary" />
               Nama Siswa
             </Label>
             <Input
               id="nama_siswa"
               placeholder="Nama siswa yang meminjam"
               value={formData.nama_siswa}
               onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
               className="border-primary/20 focus:border-primary"
             />
           </div>
 
           {/* Catatan */}
           <div className="space-y-2 md:col-span-2">
             <Label htmlFor="catatan" className="flex items-center gap-2">
               <FileText className="h-4 w-4 text-primary" />
               Catatan (Kegiatan/dll)
             </Label>
             <Textarea
               id="catatan"
               placeholder="Contoh: Untuk kegiatan praktikum IPA kelas 10"
               value={formData.catatan}
               onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
               className="border-primary/20 focus:border-primary min-h-[80px]"
             />
           </div>
 
           {/* Buttons */}
           <div className="md:col-span-2 flex justify-end gap-3 pt-4">
             <Button type="button" variant="outline" onClick={onCancel}>
               Batal
             </Button>
             <Button
               type="submit"
               disabled={isLoading}
               className="bg-gradient-to-r from-primary to-primary/80"
             >
               {isLoading ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Menyimpan...
                 </>
               ) : isEdit ? (
                 "Simpan Perubahan"
               ) : (
                 "Ajukan Peminjaman"
               )}
             </Button>
           </div>
         </form>
       </CardContent>
     </Card>
   );
 };
 
 export default PeminjamanRuanganForm;