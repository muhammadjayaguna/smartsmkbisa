'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Loader2, ArrowRightLeft } from 'lucide-react';

interface Rombel {
  id: string;
  nama_rombel: string;
}

interface KenaikanKelasDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  rombelList: Rombel[];
}

export default function KenaikanKelasDialog({ isOpen, onOpenChange, onSuccess, rombelList }: KenaikanKelasDialogProps) {
  const [sourceRombel, setSourceRombel] = useState('');
  const [targetRombel, setTargetRombel] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  // Fetch count when source rombel changes
  useEffect(() => {
    const fetchCount = async () => {
      if (!sourceRombel) {
        setStudentCount(null);
        return;
      }
      const { count, error } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true })
        .eq('rombel_id', sourceRombel);

      if (!error && count !== null) {
        setStudentCount(count);
      }
    };
    fetchCount();
  }, [sourceRombel]);

  const handleProcess = async () => {
    if (!sourceRombel || !targetRombel) {
      toast({ title: 'Gagal', description: 'Pilih kelas asal dan kelas tujuan terlebih dahulu.', variant: 'destructive' });
      return;
    }

    if (sourceRombel === targetRombel) {
      toast({ title: 'Gagal', description: 'Kelas asal dan kelas tujuan tidak boleh sama.', variant: 'destructive' });
      return;
    }

    if (studentCount === 0) {
      toast({ title: 'Gagal', description: 'Tidak ada siswa di kelas asal yang dipilih.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('siswa')
        .update({ rombel_id: targetRombel })
        .eq('rombel_id', sourceRombel);

      if (error) throw error;

      toast({ 
        title: 'Berhasil', 
        description: `${studentCount} siswa berhasil dipindahkan ke kelas tujuan.` 
      });

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setSourceRombel('');
        setTargetRombel('');
        setStudentCount(null);
      }, 1000);

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Gagal memproses', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getRombelName = (id: string) => rombelList.find(r => r.id === id)?.nama_rombel || '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pindah / Kenaikan Kelas Massal</DialogTitle>
          <DialogDescription>
            Pindahkan semua siswa dari satu kelas ke kelas lainnya secara instan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="source_rombel" className="text-destructive mb-2 block">1. Pilih Kelas Asal</Label>
              <select
                id="source_rombel"
                value={sourceRombel}
                onChange={(e) => setSourceRombel(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-red-50 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- Pilih Kelas Asal --</option>
                {rombelList.map((rombel) => (
                  <option key={`source-${rombel.id}`} value={rombel.id}>
                    {rombel.nama_rombel}
                  </option>
                ))}
              </select>
              {studentCount !== null && (
                <p className="text-xs text-muted-foreground mt-1 text-red-600">
                  Jumlah siswa di kelas ini: <strong>{studentCount} orang</strong>
                </p>
              )}
            </div>

            <div className="flex justify-center py-2">
              <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                <ArrowRightLeft className="h-5 w-5 rotate-90 sm:rotate-0" />
              </div>
            </div>

            <div>
              <Label htmlFor="target_rombel" className="text-indigo-600 mb-2 block">2. Pilih Kelas Tujuan</Label>
              <select
                id="target_rombel"
                value={targetRombel}
                onChange={(e) => setTargetRombel(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-indigo-50 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Kelas Tujuan --</option>
                {rombelList.map((rombel) => (
                  <option key={`target-${rombel.id}`} value={rombel.id}>
                    {rombel.nama_rombel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sourceRombel && targetRombel && sourceRombel !== targetRombel && studentCount !== 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Peringatan:</strong> Anda akan memindahkan <strong>{studentCount}</strong> siswa dari kelas <strong>{getRombelName(sourceRombel)}</strong> ke kelas <strong>{getRombelName(targetRombel)}</strong>. Tindakan ini tidak dapat dibatalkan secara otomatis (Anda harus memindahkannya manual jika salah).
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Batal
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={!sourceRombel || !targetRombel || sourceRombel === targetRombel || studentCount === 0 || isProcessing} 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Pindahkan Siswa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
