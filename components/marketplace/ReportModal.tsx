"use client";

import { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productTitle?: string;
  reportedUserId?: string;
  reportedUserName?: string;
}

const REPORT_REASONS = [
  'Penipuan / Scam',
  'Barang tidak sesuai deskripsi',
  'Barang palsu / tiruan',
  'Harga tidak wajar',
  'Konten tidak pantas',
  'Penjual tidak merespon',
  'Barang rusak / cacat',
  'Lainnya',
];

const ReportModal = ({ isOpen, onClose, productId, productTitle, reportedUserId, reportedUserName }: ReportModalProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    if (!reason) {
      toast.error('Pilih alasan laporan');
      return;
    }
    if (!description.trim()) {
      toast.error('Tuliskan deskripsi laporan');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId || null,
      product_id: productId || null,
      reason,
      description: description.trim(),
    });

    if (error) {
      toast.error('Gagal mengirim laporan: ' + error.message);
    } else {
      toast.success('Laporan berhasil dikirim! Admin akan meninjau laporan Anda.');
      setReason('');
      setDescription('');
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-card shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-destructive">
            <Flag size={18} />
            <h2 className="text-base font-bold">Laporkan</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Context info */}
          {(productTitle || reportedUserName) && (
            <div className="rounded-lg bg-secondary p-3">
              {productTitle && (
                <p className="text-xs text-muted-foreground">
                  Produk: <span className="font-semibold text-foreground">{productTitle}</span>
                </p>
              )}
              {reportedUserName && (
                <p className="text-xs text-muted-foreground">
                  Penjual: <span className="font-semibold text-foreground">{reportedUserName}</span>
                </p>
              )}
            </div>
          )}

          {/* Reason selection */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">Alasan Laporan *</label>
            <div className="grid grid-cols-2 gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-all ${
                    reason === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-secondary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">Deskripsi Detail *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan masalah yang dialami secara detail..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-600" />
            <p className="text-[11px] leading-relaxed text-yellow-700">
              Laporan palsu atau penyalahgunaan fitur ini dapat mengakibatkan pembatasan akun Anda.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason || !description.trim()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
            ) : (
              <>
                <Flag size={14} /> Kirim Laporan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
