"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingCart, Award } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    stock: number;
    seller_id: string;
    profiles: { full_name: string } | null;
  };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const Cart = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [saldoSipoin, setSaldoSipoin] = useState(0);
  const [useSipoin, setUseSipoin] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('id, quantity, product:products(id, title, price, image_url, stock, seller_id, profiles:users(full_name:nama:nama))')
      .eq('user_id', user.db_id || user.id)
      .order('created_at', { ascending: false });

    const normalized = ((data as any[]) || []).map((item) => {
      const product = Array.isArray(item.product) ? item.product[0] : item.product;
      if (product) {
        product.profiles = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
      }
      return { ...item, product };
    });

    setItems(normalized.filter((i) => i.product));

    // Fetch saldo SiPoin
    const { data: poinData } = await supabase
      .from('poin_siswa')
      .select('jenis, poin')
      .eq('siswa_id', user.db_id || user.id);
      
    if (poinData) {
      let positif = 0, negatif = 0;
      poinData.forEach(p => {
        if (p.jenis === 'positif') positif += p.poin;
        else if (p.jenis === 'negatif') negatif += p.poin;
      });
      setSaldoSipoin(Math.max(0, positif - negatif));
    }

    setLoading(false);
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
    setItems(items.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    setItems(items.filter((i) => i.id !== itemId));
    toast.success('Item dihapus dari keranjang');
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const sipoinDiscountValue = 1000; // Rp 1.000 per 1 poin
  const maxPoinToUse = Math.min(saldoSipoin, Math.ceil(total / sipoinDiscountValue));
  const discountAmount = useSipoin ? maxPoinToUse * sipoinDiscountValue : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckingOut(true);

    // Create transactions for each item with proportional discount
    let remainingDiscount = discountAmount;
    const transactions = items.map((item) => {
      let itemTotal = item.product.price * item.quantity;
      let itemDiscount = 0;
      if (remainingDiscount > 0) {
        itemDiscount = Math.min(itemTotal, remainingDiscount);
        remainingDiscount -= itemDiscount;
      }
      return {
        buyer_id: user.db_id || user.id,
        seller_id: item.product.seller_id,
        product_id: item.product.id,
        quantity: item.quantity,
        amount: itemTotal - itemDiscount,
        status: 'pending',
      };
    });

    const { data: txData, error } = await supabase.from('transactions').insert(transactions).select('id, amount, product_id, seller_id, quantity');

    if (error || !txData?.length) {
      toast.error('Gagal membuat pesanan');
      setCheckingOut(false);
      return;
    }

    // Send automatic chat messages to each seller
    try {
      for (const tx of txData) {
        const item = items.find((i) => i.product.id === tx.product_id);
        if (!item) continue;
        const autoMessage = `🛒 *Pesanan Baru*\n\nHai! Saya baru saja memesan:\n📦 ${item.product.title}\n🔢 Jumlah: ${tx.quantity}\n💰 Total: ${formatPrice(tx.amount)}\n\nMohon informasi untuk koordinasi pengambilan/pengiriman barang. Terima kasih! 🙏`;
        await supabase.from('chat_messages').insert({
          sender_id: user.id,
          receiver_id: tx.seller_id,
          message: autoMessage,
          product_id: tx.product_id,
        });
      }
    } catch (chatErr) {
      console.error('Auto-chat error:', chatErr);
    }

    // Deduct SiPoin if used
    if (useSipoin && maxPoinToUse > 0) {
      await supabase.from('poin_siswa').insert({
        siswa_id: user.db_id || user.id,
        jenis: 'negatif',
        kategori: 'Marketplace',
        poin: maxPoinToUse,
        keterangan: 'Redeem diskon belanja di Marketplace',
        tanggal: new Date().toISOString().split('T')[0],
      });
    }

    // Skip Mayar if total is 0 (Fully paid with SiPoin)
    if (finalTotal === 0) {
       await supabase.from('transactions').update({ status: 'paid' }).in('id', txData.map(t => t.id));
       await supabase.from('cart_items').delete().eq('user_id', user.db_id || user.id);
       toast.success('Pesanan berhasil dibuat (Lunas dengan SiPoin)!');
       router.push('/dashboard');
       setCheckingOut(false);
       return;
    }

    // Generate Mayar payment
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      for (const tx of txData) {
        const res = await fetch(
          `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/create-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ transactionId: tx.id }),
          }
        );

        const result = await res.json();

        if (result.paymentLink) {
          // Clear cart and redirect to Mayar
          await supabase.from('cart_items').delete().eq('user_id', user.db_id || user.id);
          toast.success('Mengarahkan ke halaman pembayaran...');
          window.location.href = result.paymentLink;
          return;
        }
      }

      // Fallback if no payment link generated
      await supabase.from('cart_items').delete().eq('user_id', user.db_id || user.id);
      toast.success('Pesanan berhasil dibuat! Silakan cek dashboard untuk pembayaran.');
      router.push('/dashboard');
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Gagal membuat link pembayaran, pesanan tetap tersimpan.');
      await supabase.from('cart_items').delete().eq('user_id', user.db_id || user.id);
      router.push('/dashboard');
    }

    setCheckingOut(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="container py-6">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container py-4">
        <h1 className="mb-4 font-display text-base font-bold text-foreground">Keranjang Belanja</h1>

        {items.length === 0 ? (
          <div className="rounded-sm bg-card py-16 text-center">
            <ShoppingCart size={48} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Keranjang belanja kosong</p>
            <Link href="/products" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-sm border border-border bg-card p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.product.id}`} className="text-sm text-foreground hover:text-primary line-clamp-1">
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.product.profiles?.full_name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-primary">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                        <div className="flex items-center rounded-sm border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-muted-foreground hover:bg-secondary"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                            className="px-2 py-1 text-muted-foreground hover:bg-secondary"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="h-fit rounded-sm border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-bold text-foreground">Ringkasan Belanja</h3>
              <div className="mb-3 space-y-2 border-b border-border pb-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total ({items.length} produk)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {useSipoin && discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Diskon SiPoin (-{maxPoinToUse} Poin)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>
              <div className="mb-4 flex justify-between text-sm font-bold text-foreground">
                <span>Total Bayar</span>
                <span className="text-primary">{formatPrice(finalTotal)}</span>
              </div>
              
              {saldoSipoin > 0 && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-bold">SiPoin Tersedia: {saldoSipoin} Poin</span>
                  </div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-emerald-600">Gunakan poin (Maks {maxPoinToUse})</span>
                    <div className="relative inline-flex items-center">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={useSipoin}
                        onChange={() => setUseSipoin(!useSipoin)}
                      />
                      <div className="w-9 h-5 bg-emerald-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </div>
                  </label>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full rounded-sm bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {checkingOut ? 'Memproses...' : (finalTotal === 0 ? 'Bayar dengan SiPoin' : 'Checkout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
