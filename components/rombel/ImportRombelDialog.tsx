'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Loader2, UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportRombelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportRombelDialog({ isOpen, onOpenChange, onSuccess }: ImportRombelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        toast({ title: 'Format tidak didukung', description: 'Harap unggah file Excel (.xlsx atau .xls)', variant: 'destructive' });
        e.target.value = '';
        setFile(null);
      }
    }
  };

  const processExcelData = (data: any[]) => {
    const rombelToInsert = data.map(row => {
      // Find Rombel Name
      const nama_rombel = row['Nama Rombel'] || row['nama_rombel'] || row['Rombongan Belajar'] || row['Rombel'] || row['Kelas'] || '';
      
      // Find Wali Kelas
      const wali_kelas = row['Wali Kelas'] || row['wali_kelas'] || row['Wali'] || '-';
      
      // Find Tahun Ajaran
      const tahun_ajaran = row['Tahun Ajaran'] || row['tahun_ajaran'] || '2024/2025';

      return {
        nama_rombel: nama_rombel.toString().trim(),
        wali_kelas: wali_kelas.toString().trim(),
        tahun_ajaran: tahun_ajaran.toString().trim()
      };
    }).filter(r => r.nama_rombel); // Must have at least rombel name

    // Remove completely identical duplicates from the excel sheet itself
    const uniqueRombel = Array.from(new Set(rombelToInsert.map(r => JSON.stringify(r)))).map(str => JSON.parse(str));

    return uniqueRombel;
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: 'Pilih file', description: 'Harap pilih file Excel terlebih dahulu', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setStatusText('Membaca file Excel...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setProgress(30);
          setStatusText('Memproses data...');

          const rombelData = processExcelData(jsonData);
          
          if (rombelData.length === 0) {
            toast({ title: 'Data kosong', description: 'Tidak ada data rombel yang valid di file tersebut.', variant: 'destructive' });
            setIsProcessing(false);
            return;
          }

          setProgress(50);
          setStatusText(`Menyimpan ${rombelData.length} data rombel...`);

          let successCount = 0;
          let errorCount = 0;

          // Insert directly to database
          // Since we might hit unique constraints (duplicate rombel names), we process them one by one or in small batches
          const batchSize = 50;
          for (let i = 0; i < rombelData.length; i += batchSize) {
            const batch = rombelData.slice(i, i + batchSize);
            
            for (const rombel of batch) {
              const { error: insertError } = await supabase
                .from('rombel')
                .insert(rombel);

              if (insertError) {
                // Ignore unique constraint errors silently (duplicate names)
                if (insertError.code === '23505') {
                  errorCount++;
                } else {
                  console.error('Insert Error:', insertError);
                  errorCount++;
                }
              } else {
                successCount++;
              }
            }
            
            setProgress(50 + Math.floor(((i + batchSize) / rombelData.length) * 50));
          }

          setProgress(100);
          setStatusText('Selesai!');
          
          toast({ 
            title: 'Import Selesai', 
            description: `Berhasil mengimpor ${successCount} rombel baru. (Dilewati/Duplikat: ${errorCount})`
          });

          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
            setFile(null);
            setProgress(0);
          }, 1500);

        } catch (error: any) {
          console.error(error);
          toast({ title: 'Gagal memproses', description: error.message, variant: 'destructive' });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsBinaryString(file);

    } catch (error: any) {
      setIsProcessing(false);
      toast({ title: 'Gagal', description: 'Terjadi kesalahan saat membaca file', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import Rombel (Excel)</DialogTitle>
          <DialogDescription className="break-words">
            Unggah file Excel data Dapodik untuk menambahkan daftar Rombel secara massal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600 text-center mb-1">
              Pilih file .xlsx atau .xls
            </p>
            <p className="text-xs text-slate-500 text-center mb-4 break-words px-4">
              Kolom yang dibaca: Nama Rombel/Kelas, Wali Kelas (opsional), Tahun Ajaran (opsional)
            </p>
            <Label htmlFor="excel-upload-rombel" className="cursor-pointer">
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">
                Jelajahi File
              </div>
            </Label>
            <Input 
              id="excel-upload-rombel" 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-md border border-indigo-100 max-w-full">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={!file || isProcessing} className="bg-indigo-600 hover:bg-indigo-700">
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" />
                Mulai Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
