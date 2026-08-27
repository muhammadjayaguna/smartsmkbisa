'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit2, Trash2, Package, QrCode, Camera, Download, FileText, FileSpreadsheet } from 'lucide-react';
import InventarisForm from './InventarisForm';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import QRCodeScanner from './QRCodeScanner';
import { useUserRole } from '@/hooks/useUserRole';

export default function InventarisTable() {
  const { role, isTeknisi } = useUserRole();
  const isManager = role === 'admin' || role === 'kepala_sekolah' || role === 'waka_sarpras' || isTeknisi;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [qrItem, setQrItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('inventaris_barang').select('*').order('created_at', { ascending: false });
    if (search) {
      query = query.or(`nama_barang.ilike.%${search}%,kode_barang.ilike.%${search}%,lokasi.ilike.%${search}%`);
    }
    const { data: inv, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setData(inv || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id: string) => {
    if(confirm('Yakin ingin menghapus data ini?')) {
      const { error } = await supabase.from('inventaris_barang').delete().eq('id', id);
      if(error) toast({ title: 'Error', description: 'Gagal menghapus data', variant: 'destructive' });
      else {
        toast({ title: 'Sukses', description: 'Data dihapus' });
        fetchData();
      }
    }
  }

  const exportToPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        doc.text("Laporan Inventaris Barang", 14, 15);
        const tableColumn = ["Kode", "Nama Barang", "Kategori", "Kondisi", "Lokasi", "Jml"];
        const tableRows = data.map(item => [
          item.kode_barang, item.nama_barang, item.kategori, item.kondisi, item.lokasi, item.jumlah
        ]);
        (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 20,
        });
        doc.save("Laporan_Inventaris.pdf");
      });
    });
  };

  const exportToExcel = () => {
    import('xlsx').then((XLSX) => {
      const exportData = data.map(item => ({
        'Kode Barang': item.kode_barang,
        'Nama Barang': item.nama_barang,
        'Kategori': item.kategori,
        'Merek': item.merek,
        'Kondisi': item.kondisi,
        'Lokasi': item.lokasi,
        'Jumlah': item.jumlah,
        'Tahun Masuk': item.tahun_masuk
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris");
      XLSX.writeFile(workbook, "Laporan_Inventaris.xlsx");
    });
  };

  const handleScan = async (decodedText: string) => {
    try {
      setIsScannerOpen(false); // Close scanner
      const parsed = JSON.parse(decodedText);
      if(parsed.type === 'inventaris' && parsed.id) {
        const item = data.find(i => i.id === parsed.id);
        if (item) {
          setScannedItem(item);
        } else {
          const { data: dbItem } = await supabase.from('inventaris_barang').select('*').eq('id', parsed.id).single();
          if (dbItem) setScannedItem(dbItem);
          else toast({ title: 'Tidak Ditemukan', description: 'Data barang tidak ditemukan di database.', variant: 'destructive' });
        }
      } else {
         toast({ title: 'QR Tidak Valid', description: 'Bukan QR Code inventaris yang valid.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'QR Tidak Valid', description: 'Format QR Code tidak dikenali.', variant: 'destructive' });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Cari barang atau kode..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap w-full sm:w-auto gap-2">
          <Button onClick={exportToPDF} variant="outline" className="w-full sm:w-auto hover:bg-slate-100 hover:text-red-600" title="Export PDF">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline" className="w-full sm:w-auto hover:bg-slate-100 hover:text-emerald-600" title="Export Excel">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button onClick={() => setIsScannerOpen(true)} variant="outline" className="w-full sm:w-auto hover:bg-slate-100">
            <Camera className="w-4 h-4 mr-2" /> Scan QR
          </Button>
          {isManager && (
            <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Tambah Barang
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Kode</th>
              <th className="px-6 py-4 font-semibold">Nama Barang</th>
              <th className="px-6 py-4 font-semibold">Kategori</th>
              <th className="px-6 py-4 font-semibold">Lokasi</th>
              <th className="px-6 py-4 font-semibold text-center">Kondisi</th>
              <th className="px-6 py-4 font-semibold text-center">Jumlah</th>
              <th className="px-6 py-4 font-semibold text-right">QR / Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Tidak ada data barang ditemukan</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-600">{item.kode_barang}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{item.nama_barang}</div>
                    <div className="text-xs text-slate-500">{item.merk} ({item.tahun_pengadaan})</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.kategori}</td>
                  <td className="px-6 py-4 text-slate-600">{item.lokasi || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-700' : 
                        item.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                    `}>
                      {item.kondisi}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-700">{item.jumlah}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setQrItem(item)} className="hover:text-indigo-600">
                        <QrCode className="w-4 h-4" />
                      </Button>
                      {isManager && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setIsFormOpen(true); }}>
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <InventarisForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchData} 
          editData={editingItem}
        />
      )}

      {qrItem && (
        <Dialog open={!!qrItem} onOpenChange={(open) => !open && setQrItem(null)}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="text-center">QR Code Inventaris</DialogTitle>
              <DialogDescription className="text-center">
                Scan kode ini untuk melihat detail barang atau melakukan peminjaman.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 inline-block">
                <QRCode 
                  value={JSON.stringify({ type: 'inventaris', id: qrItem.id })} 
                  size={200}
                />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-800">{qrItem.nama_barang}</p>
                <p className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block mt-1">
                  {qrItem.kode_barang}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isScannerOpen && (
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>Arahkan kamera ke QR Code Inventaris</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <QRCodeScanner 
                onScanSuccess={handleScan}
                onScanError={(err) => console.log('Scanner error:', err)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {scannedItem && (
        <Dialog open={!!scannedItem} onOpenChange={(open) => !open && setScannedItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detail Barang</DialogTitle>
              <DialogDescription>Hasil scan QR Code</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Nama Barang</p>
                    <p className="font-bold text-slate-800">{scannedItem.nama_barang}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Kode Barang</p>
                    <p className="font-mono text-sm bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block mt-1">{scannedItem.kode_barang}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Kategori</p>
                    <p className="text-sm font-medium text-slate-700">{scannedItem.kategori}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Kondisi</p>
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-block mt-1
                      ${scannedItem.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-700' : 
                        scannedItem.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                    `}>
                      {scannedItem.kondisi}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Lokasi</p>
                    <p className="text-sm font-medium text-slate-700">{scannedItem.lokasi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tahun Masuk</p>
                    <p className="text-sm font-medium text-slate-700">{scannedItem.tahun_masuk}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setScannedItem(null)}>Tutup</Button>
                <Button onClick={() => { 
                  setEditingItem(scannedItem); 
                  setIsFormOpen(true); 
                  setScannedItem(null); 
                }}>Edit Data</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
