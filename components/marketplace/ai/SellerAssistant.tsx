"use client";

import { Store } from 'lucide-react';
import AIChatPanel from './AIChatPanel';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const QUICK_PROMPTS = [
  '📊 Analisis penjualan toko saya',
  '📦 Cek produk stok rendah',
  '💡 Buatkan listing produk baru untuk: ',
  '🔍 Riset harga kompetitor untuk: ',
  '📈 Strategi meningkatkan penjualan',
  '✍️ Buatkan caption Instagram untuk produk saya',
];

const SellerAssistant = () => {
  const { user } = useAuth();

  return (
    <AIChatPanel
      type="seller"
      icon={<Store size={18} className="text-primary" />}
      title="Konsultan Bisnis AI"
      placeholder="Tanya tentang jualan, minta analisis, atau buat listing..."
      sellerId={user?.id}
      quickPrompts={QUICK_PROMPTS}
      emptyState={
        <div>
          <Store size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p>Saya konsultan bisnis AI Anda! 🚀</p>
          <p className="mt-1 text-muted-foreground">Bisa analisis penjualan, buat listing produk, dan riset kompetitor.</p>
        </div>
      }
    />
  );
};

export default SellerAssistant;
