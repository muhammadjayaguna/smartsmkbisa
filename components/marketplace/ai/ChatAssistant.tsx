"use client";

import { ShoppingBag } from 'lucide-react';
import AIChatPanel from './AIChatPanel';

const QUICK_PROMPTS = [
  '🔥 Produk trending minggu ini',
  '🔍 Cari jasa desain grafis',
  '💰 Produk termurah kategori Barang',
  '⭐ Produk rating tertinggi',
  '📊 Statistik marketplace',
];

const ChatAssistant = () => {
  return (
    <AIChatPanel
      type="shop"
      icon={<ShoppingBag size={18} className="text-primary" />}
      title="Asisten Belanja AI"
      placeholder="Cari produk, minta rekomendasi, atau tanya apa saja..."
      quickPrompts={QUICK_PROMPTS}
      emptyState={
        <div>
          <ShoppingBag size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p>Halo! Saya asisten belanja pintar SMKN 1 Mall 🛍️</p>
          <p className="mt-1 text-muted-foreground">Saya bisa mencari produk, cek harga, dan rekomendasikan yang terbaik!</p>
        </div>
      }
    />
  );
};

export default ChatAssistant;
