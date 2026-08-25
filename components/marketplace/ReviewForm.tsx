"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: string;
  userId: string;
  productTitle: string;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ productId, userId, productTitle, onReviewSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Pilih rating terlebih dahulu');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('reviews').upsert(
      {
        user_id: userId,
        product_id: productId,
        rating,
        comment: comment.trim(),
      },
      { onConflict: 'user_id,product_id' }
    );

    if (error) {
      toast.error('Gagal mengirim ulasan');
    } else {
      toast.success('Ulasan berhasil dikirim!');
      setSubmitted(true);
      onReviewSubmitted();
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="mt-3 rounded-sm border border-success/20 bg-success/5 p-3 text-center">
        <span className="text-xs font-medium text-success">✓ Ulasan terkirim. Terima kasih!</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-sm border border-border bg-secondary/50 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">Beri Ulasan</p>

      {/* Star rating */}
      <div className="mb-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHoverRating(i + 1)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={20}
              className={
                i < (hoverRating || rating)
                  ? 'fill-warning text-warning'
                  : 'text-muted-foreground/30'
              }
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Sangat Bagus'][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tulis ulasan kamu (opsional)..."
        rows={2}
        className="mb-2 w-full rounded-sm border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="rounded-sm bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
      </button>
    </div>
  );
};

export default ReviewForm;
