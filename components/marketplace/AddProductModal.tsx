"use client";

import { useState } from 'react';
import { X, Upload, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  initialDescription?: string;
  initialImageUrl?: string;
}

const CATEGORIES = ['Barang', 'Jasa'];
const AI_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`;

const AddProductModal = ({ onClose, onSuccess, initialDescription = '', initialImageUrl = '' }: Props) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: initialDescription,
    price: '',
    category: 'Barang',
    stock: '1',
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAISuggest = async () => {
    if (!form.description.trim()) {
      toast.error('Tulis deskripsi terlebih dahulu');
      return;
    }
    setSuggesting(true);
    try {
      // Fetch similar products for price context
      const { data: products } = await supabase
        .from('products')
        .select('title, price, category')
        .eq('is_active', true)
        .limit(20);
      const productContext = products?.length
        ? products.map(p => `- ${p.title}: Rp${p.price.toLocaleString('id-ID')} (${p.category})`).join('\n')
        : undefined;

      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ type: 'suggest', description: form.description, productContext }),
      });

      if (!resp.ok) throw new Error('AI suggest failed');
      const suggestion = await resp.json();

      setForm(prev => ({
        ...prev,
        title: suggestion.title || prev.title,
        price: suggestion.price ? String(suggestion.price) : prev.price,
        category: suggestion.category || prev.category,
      }));
      toast.success('✨ Judul, harga, dan kategori berhasil di-suggest AI!');
    } catch (e) {
      toast.error('Gagal mendapatkan saran AI');
    } finally {
      setSuggesting(false);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          }, 'image/webp', 0.8);
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let imageUrl = '';

    if (image) {
      const compressedBlob = await compressImage(image);
      const ext = 'webp';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, compressedBlob, {
        contentType: 'image/webp'
      });
      if (uploadError) { toast.error('Gagal upload gambar'); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('products').insert({
      seller_id: user.db_id || user.id,
      title: form.title,
      description: form.description,
      price: parseInt(form.price),
      category: form.category,
      stock: parseInt(form.stock),
      image_url: imageUrl,
    });

    if (error) {
      toast.error('Gagal menambahkan produk');
    } else {
      toast.success('Produk berhasil ditambahkan!');
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-md rounded-sm bg-card shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-sm font-bold text-foreground">
            {initialDescription ? (
              <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> Buat Produk dari AI</span>
            ) : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Image */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Foto Produk</label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-sm border-2 border-dashed border-border p-4 hover:border-primary">
              {preview ? (
                <img src={preview} alt="Preview" className="h-32 w-32 rounded-sm object-cover" />
              ) : (
                <>
                  <Upload size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Klik untuk upload</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Description first — so AI can suggest from it */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Deskripsi
              {initialDescription && <span className="ml-1 text-primary text-[10px]">✨ dari AI</span>}
            </label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Jelaskan produk atau jasa Anda..." className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none" />
          </div>

          {/* AI Suggest Button */}
          {form.description.trim().length > 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAISuggest}
              disabled={suggesting}
              className="w-full gap-1.5 border-primary/30 text-primary hover:bg-primary/5 text-xs"
            >
              {suggesting ? (
                <><Loader2 size={13} className="animate-spin" /> AI sedang menganalisis...</>
              ) : (
                <><Wand2 size={13} /> Auto-suggest Judul, Harga & Kategori dari Deskripsi</>
              )}
            </Button>
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Nama Produk</label>
            <input type="text" value={form.title} onChange={set('title')} required placeholder="Contoh: Jasa Desain Logo" className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Harga (Rp)</label>
              <input type="number" value={form.price} onChange={set('price')} required min="0" placeholder="10000" className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Stok</label>
              <input type="number" value={form.stock} onChange={set('stock')} required min="0" className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Kategori</label>
            <select value={form.category} onChange={set('category')} className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-sm bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
