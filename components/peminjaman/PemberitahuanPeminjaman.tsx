 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { AlertTriangle } from "lucide-react";
 
 const PemberitahuanPeminjaman = () => {
   return (
     <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
       <CardHeader className="pb-4">
         <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
           <AlertTriangle className="h-5 w-5" />
           PEMBERITAHUAN PEMINJAMAN BARANG
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-4 text-sm text-amber-900 dark:text-amber-200">
         <div className="space-y-3">
           <p className="flex gap-2">
             <span className="font-bold">1.</span>
             <span>Setiap peminjaman barang <strong>WAJIB</strong> izin terlebih dahulu kepada penanggung jawab. Peminjaman tanpa izin tidak diperbolehkan.</span>
           </p>
           <p className="flex gap-2">
             <span className="font-bold">2.</span>
             <span>Peminjam wajib mencatat dan melaporkan barang yang dipinjam, termasuk jumlah dan waktu peminjaman.</span>
           </p>
           <p className="flex gap-2">
             <span className="font-bold">3.</span>
             <span>Barang harus dikembalikan tepat waktu sesuai kesepakatan. Keterlambatan pengembalian tidak dibenarkan tanpa alasan yang jelas.</span>
           </p>
           <p className="flex gap-2">
             <span className="font-bold">4.</span>
             <span>Barang yang dipinjam harus dijaga dengan baik. Kerusakan atau kehilangan sepenuhnya menjadi tanggung jawab peminjam.</span>
           </p>
           <p className="flex gap-2">
             <span className="font-bold">5.</span>
             <span>Dilarang meminjamkan kembali barang kepada pihak lain tanpa izin penanggung jawab. Pelanggaran akan dikenakan sanksi.</span>
           </p>
         </div>
         <p className="pt-2 font-medium border-t border-amber-200 dark:border-amber-700">
           Demikian pemberitahuan ini dibuat untuk dipatuhi bersama.
         </p>
       </CardContent>
     </Card>
   );
 };
 
 export default PemberitahuanPeminjaman;