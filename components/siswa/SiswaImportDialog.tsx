import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SiswaImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  rombelList: Array<{ id: string; nama_rombel: string }>;
}

const SiswaImportDialog = ({ open, onOpenChange, onImportComplete, rombelList }: SiswaImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const downloadTemplate = () => {
    // Create CSV template with proper format
    const headers = ['nama', 'nisn', 'email', 'nama_rombel'];
    const examples = [
      'Ahmad Rizki,1234567890,ahmad@smkn1bjm.sch.id,XII TJKT 1',
      'Siti Nurhaliza,1234567891,,XII DKV 1',
      'Budi Santoso,1234567892,,XII AKL 1'
    ];

    const rombelComments = rombelList.map(r => `# ${r.nama_rombel}`);

    const csvContent = [
      headers.join(','),
      '# Contoh data (hapus baris ini saat mengisi data):',
      ...examples,
      '',
      '# Daftar Rombel yang tersedia:',
      ...rombelComments,
      '',
      '# Format: nama,nisn,email,nama_rombel',
      '# Pastikan nama rombel sesuai dengan daftar di atas',
      '# Jangan gunakan tanda koma (,) dalam nama siswa'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_siswa.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template berhasil diunduh",
      description: "Silakan isi template dan upload kembali",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Reset previous errors
      setImportErrors([]);
      setShowErrors(false);

      // Validate file type
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        toast({
          title: "Error",
          description: "Hanya file CSV yang diizinkan",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file terlalu besar. Maksimal 5MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const processCSV = async (csvText: string) => {
    // Clean the CSV text
    const cleanText = csvText.trim();
    if (!cleanText) {
      throw new Error('File CSV kosong');
    }

    // Split into lines and clean each line
    const allLines = cleanText.split(/\r?\n/).map(line => line.trim());

    // Filter out empty lines, comments, and header
    const dataLines = allLines.filter(line => {
      const isEmpty = !line;
      const isComment = line.startsWith('#');
      const isHeader = line.toLowerCase().includes('nama,nisn') && line.toLowerCase().includes('nama_rombel');
      const isExample = line.includes('Contoh data') || line.includes('hapus baris ini');

      return !isEmpty && !isComment && !isHeader && !isExample;
    });

    if (dataLines.length === 0) {
      throw new Error('Tidak ada data siswa yang valid dalam file. Pastikan format: nama,nisn,email,nama_rombel');
    }

    const siswaData: Array<{ nama: string; nisn: string; email: string | null; rombel_id: string }> = [];
    const errors: string[] = [];
    const processedNisn = new Set(); // To check for duplicates

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const lineNumber = i + 1;

      // Split by comma and clean each part
      const parts = line.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));

      if (parts.length !== 3 && parts.length !== 4) {
        const error = `Baris ${lineNumber}: Format tidak valid "${line}". Harus ada 3 atau 4 kolom`;
        errors.push(error);
        continue;
      }

      let nama, nisn, email, nama_rombel;
      if (parts.length === 3) {
        [nama, nisn, nama_rombel] = parts;
        email = '';
      } else {
        [nama, nisn, email, nama_rombel] = parts;
      }

      // Validate required fields
      if (!nama || nama.length < 2) {
        const error = `Baris ${lineNumber}: Nama "${nama}" tidak valid atau terlalu pendek (minimal 2 karakter)`;
        errors.push(error);
        continue;
      }

      if (!nisn || nisn.length < 8) {
        const error = `Baris ${lineNumber}: NISN "${nisn}" tidak valid (minimal 8 digit)`;
        errors.push(error);
        continue;
      }

      if (!nama_rombel) {
        const error = `Baris ${lineNumber}: Nama rombel tidak boleh kosong`;
        errors.push(error);
        continue;
      }

      if (email && email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        const error = `Baris ${lineNumber}: Format email "${email}" tidak valid`;
        errors.push(error);
        continue;
      }

      // Check for duplicate NISN in current batch
      if (processedNisn.has(nisn)) {
        const error = `Baris ${lineNumber}: NISN ${nisn} duplikat dalam file`;
        errors.push(error);
        continue;
      }
      processedNisn.add(nisn);

      // Validate NISN format (should be numeric)
      if (!/^\d+$/.test(nisn)) {
        const error = `Baris ${lineNumber}: NISN "${nisn}" harus berupa angka`;
        errors.push(error);
        continue;
      }

      // Find rombel by name (case insensitive)
      const rombel = rombelList.find(r =>
        r.nama_rombel.toLowerCase().trim() === nama_rombel.toLowerCase().trim()
      );

      if (!rombel) {
        const availableRombel = rombelList.map(r => r.nama_rombel).join(', ');
        const error = `Baris ${lineNumber}: Rombel "${nama_rombel}" tidak ditemukan. Rombel tersedia: ${availableRombel}`;
        errors.push(error);
        continue;
      }

      siswaData.push({
        nama: nama.trim(),
        nisn: nisn.trim(),
        email: email ? email.trim() : null,
        rombel_id: rombel.id
      });
    }

    return { siswaData, errors };
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Pilih file terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Additional file validation
    if (file.size === 0) {
      toast({
        title: "Error",
        description: "File kosong atau tidak valid",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    setImportErrors([]);

    try {
      const text = await file.text();

      if (!text || text.trim().length === 0) {
        throw new Error('File kosong atau tidak dapat dibaca');
      }

      const { siswaData, errors } = await processCSV(text);

      // Store errors for display
      setImportErrors(errors);

      if (errors.length > 0) {
        setShowErrors(true);

        if (siswaData.length === 0) {
          toast({
            title: "Error",
            description: `Tidak ada data valid untuk diimport. ${errors.length} error ditemukan. Klik "Lihat Detail Error" untuk informasi lengkap.`,
            variant: "destructive",
          });
          return;
        } else {
          toast({
            title: "Warning",
            description: `${errors.length} baris memiliki error. ${siswaData.length} siswa akan diimport. Klik "Lihat Detail Error" untuk informasi lengkap.`,
            variant: "destructive",
          });
        }
      }

      if (siswaData.length === 0) {
        toast({
          title: "Error",
          description: "Tidak ada data valid untuk diimport",
          variant: "destructive",
        });
        return;
      }

      // Check for existing NISN in database
      const existingNisn = await Promise.race([
        supabase
          .from('siswa')
          .select('nisn')
          .in('nisn', siswaData.map(s => s.nisn)),
        new Promise<{ data: { nisn: string }[] | null; error: unknown }>((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout saat cek NISN')), 15000)
        )
      ]) as { data: { nisn: string }[] | null; error: unknown };

      if (existingNisn.data && existingNisn.data.length > 0) {
        const duplicateNisn = existingNisn.data.map(s => s.nisn);
        const filteredData = siswaData.filter(s => !duplicateNisn.includes(s.nisn));

        if (filteredData.length === 0) {
          toast({
            title: "Error",
            description: "Semua NISN sudah ada dalam database",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Warning",
          description: `${duplicateNisn.length} NISN sudah ada dalam database. ${filteredData.length} siswa baru akan ditambahkan.`,
        });

        // Use filtered data
        siswaData.splice(0, siswaData.length, ...filteredData);
      }

      // Insert siswa data in batches to avoid timeout
      const batchSize = 50;
      let totalInserted = 0;

      for (let i = 0; i < siswaData.length; i += batchSize) {
        const batch = siswaData.slice(i, i + batchSize);

        const { error } = await Promise.race([
          supabase
            .from('siswa')
            .insert(batch),
          new Promise<{ error: { code?: string; message?: string } | null }>((_, reject) =>
            setTimeout(() => reject(new Error(`Database timeout pada batch ${Math.floor(i / batchSize) + 1}`)), 20000)
          )
        ]) as { error: { code?: string; message?: string } | null };

        if (error) {
          let errorMessage = `Error pada batch ${Math.floor(i / batchSize) + 1}`;
          if (error.code === '23505') {
            errorMessage += ': NISN sudah terdaftar';
          } else if (error.code === '23503') {
            errorMessage += ': Rombel tidak valid';
          } else {
            errorMessage += `: ${error.message}`;
          }

          throw new Error(errorMessage);
        }

        totalInserted += batch.length;

        // Add small delay between batches to prevent overwhelming the database
        if (i + batchSize < siswaData.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Auto-link imported students
      for (const s of siswaData) {
        if (s.email) {
          const { data: userData } = await supabase
            .from('users')
            .select('auth_id')
            .eq('email', s.email)
            .maybeSingle();
            
          if (userData && userData.auth_id) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('id')
              .eq('user_id', userData.auth_id)
              .maybeSingle();
              
            if (!roleData) {
              await supabase
                .from('user_roles')
                .insert({ user_id: userData.auth_id, role: 'siswa' });
            }
          }
        }
      }

      toast({
        title: "Berhasil",
        description: `${totalInserted} siswa berhasil ditambahkan${errors.length > 0 ? ` (${errors.length} baris diabaikan karena error)` : ''}`,
      });

      onImportComplete();
      onOpenChange(false);
      setFile(null);
      setImportErrors([]);
      setShowErrors(false);

    } catch (error: unknown) {
      const err = error as Error;
      let errorMessage = "Gagal mengupload data siswa";
      if (err.message?.includes('timeout')) {
        errorMessage = "Koneksi timeout. Periksa koneksi internet dan coba lagi.";
      } else if (err.message?.includes('tidak dapat dibaca')) {
        errorMessage = "File tidak dapat dibaca. Pastikan file dalam format CSV yang benar.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Import Data Siswa</span>
          </DialogTitle>
          <DialogDescription>
            Download template, isi data siswa, lalu upload kembali
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {showErrors && importErrors.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-red-800 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Detail Error ({importErrors.length})</span>
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrors(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <ul className="text-sm text-red-700 space-y-1">
                  {importErrors.map((error, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Download Template Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">1. Download Template</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download template CSV untuk mengisi data siswa
            </p>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Template CSV</span>
            </Button>
          </div>

          {/* Upload Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">2. Upload Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Upload template yang sudah diisi
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="file-upload">Pilih File CSV</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                />
              </div>

              {file && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex-1 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? 'Mengupload...' : 'Upload Data'}</span>
                </Button>

                {importErrors.length > 0 && !showErrors && (
                  <Button
                    onClick={() => setShowErrors(true)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Lihat Detail Error</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Petunjuk Penggunaan:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Format: nama,nisn,nama_rombel</li>
                  <li>NISN harus berupa angka minimal 8 digit</li>
                  <li>Nama rombel harus sesuai dengan daftar yang tersedia</li>
                  <li>Baris yang dimulai dengan # akan diabaikan</li>
                  <li>Jangan gunakan tanda koma dalam nama siswa</li>
                  <li>File maksimal 5MB</li>
                  <li>NISN yang sudah ada akan dilewati</li>
                  <li>Hapus baris contoh sebelum mengisi data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Available Rombel List */}
          {rombelList.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Daftar Rombel Tersedia:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {rombelList.map((rombel) => (
                  <div key={rombel.id} className="text-gray-600">
                    • {rombel.nama_rombel}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiswaImportDialog;