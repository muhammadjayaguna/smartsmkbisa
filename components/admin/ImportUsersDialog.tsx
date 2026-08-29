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
import { UserRole } from '@/hooks/useUserRole';

interface ImportUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportUsersDialog({ isOpen, onOpenChange, onSuccess }: ImportUsersDialogProps) {
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
    // Basic mapping: Looking for common Dapodik headers
    // Example: Nama, NIP, NIK, NISN, Email, Role, Jenis PTK
    const usersToInsert = data.map(row => {
      // Find name
      const nama = row['Nama'] || row['Nama Lengkap'] || row['NAMA'] || '';
      
      // Determine Role
      let role: UserRole = 'tamu';
      const jenisPtk = (row['Jenis PTK'] || row['Jabatan'] || row['Role'] || '').toLowerCase();
      
      if (jenisPtk.includes('guru')) role = 'guru';
      else if (jenisPtk.includes('kepala sekolah')) role = 'kepala_sekolah';
      else if (jenisPtk.includes('operator') || jenisPtk.includes('tu')) role = 'operator';
      else if (row['NISN'] || row['nisn']) role = 'siswa';
      else if (row['Role']) {
        const rawRole = row['Role'].toLowerCase();
        if (['admin', 'guru', 'siswa', 'kepala_sekolah', 'operator', 'tamu'].includes(rawRole)) {
          role = rawRole as UserRole;
        }
      } else if (nama) {
        // Default fallback if it's a person
        role = 'siswa'; // Assuming mostly students if unspecified in a student sheet
      }

      // Generate a dummy email if not provided, for supabase uniqueness
      let email = row['Email'] || row['email'] || '';
      if (!email && nama) {
        const uniqueId = row['NISN'] || row['NIP'] || row['NIK'] || Math.floor(Math.random() * 1000000);
        const cleanName = nama.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        email = `${cleanName}.${uniqueId}@smk.id`;
      }

      return {
        nama,
        email: email.toLowerCase(),
        role
      };
    }).filter(u => u.nama && u.email); // Only keep valid rows

    return usersToInsert;
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

          const usersToInsert = processExcelData(jsonData);
          
          if (usersToInsert.length === 0) {
            toast({ title: 'Data kosong', description: 'Tidak ada data valid yang bisa diimpor dari file tersebut.', variant: 'destructive' });
            setIsProcessing(false);
            return;
          }

          setProgress(50);
          setStatusText(`Menyimpan ${usersToInsert.length} data pengguna...`);

          let successCount = 0;
          let errorCount = 0;

          // Process in small batches to avoid timeout/payload issues
          const batchSize = 50;
          for (let i = 0; i < usersToInsert.length; i += batchSize) {
            const batch = usersToInsert.slice(i, i + batchSize);
            
            for (const user of batch) {
              // 1. Insert into public.users
              const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                  nama: user.nama,
                  email: user.email,
                  // auth_id is intentionally left null. They can use "Aktifkan Email" later.
                })
                .select('id')
                .maybeSingle();

              if (userError) {
                // Usually unique constraint on email
                if (userError.code !== '23505') {
                  console.error('User Insert Error:', userError);
                }
                errorCount++;
                continue;
              }

              if (newUser) {
                // 2. Insert role
                const { error: roleError } = await supabase
                  .from('user_roles')
                  .insert({
                    user_id: newUser.id,
                    role: user.role
                  });
                
                if (roleError) {
                  console.error('Role Insert Error:', roleError);
                }
                successCount++;
              }
            }

            // Update progress
            setProgress(50 + Math.floor(((i + batchSize) / usersToInsert.length) * 50));
          }

          setProgress(100);
          setStatusText('Selesai!');
          
          toast({ 
            title: 'Import Selesai', 
            description: `Berhasil mengimpor ${successCount} data. Gagal/Duplikat: ${errorCount} data.`
          });

          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
            setFile(null);
            setProgress(0);
          }, 1000);

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
          <DialogTitle>Import Data Excel (Dapodik)</DialogTitle>
          <DialogDescription className="break-words">
            Unggah file Excel data guru atau siswa untuk menambahkannya ke dalam sistem.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600 text-center mb-1">
              Pilih file .xlsx atau .xls
            </p>
            <p className="text-xs text-slate-500 text-center mb-4 break-words px-4">
              Pastikan terdapat kolom Nama, Email, dan Role (opsional)
            </p>
            <Label htmlFor="excel-upload" className="cursor-pointer">
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">
                Jelajahi File
              </div>
            </Label>
            <Input 
              id="excel-upload" 
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
