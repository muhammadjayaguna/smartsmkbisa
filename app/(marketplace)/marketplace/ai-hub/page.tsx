"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Image, Store, GraduationCap, Bot, PackagePlus } from 'lucide-react';
import { AIDraftProvider, useAIDraft } from '@/contexts/marketplace/AIDraftContext';
import ChatAssistant from '@/components/marketplace/ai/ChatAssistant';
import SellerAssistant from '@/components/marketplace/ai/SellerAssistant';
import TutorChat from '@/components/marketplace/ai/TutorChat';
import AddProductModal from '@/components/marketplace/AddProductModal';

const AIHubInner = () => {
  const { draft, hasDraft, clearDraft } = useAIDraft();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Asisten AI untuk belanja, desain, jualan, dan belajar bisnis</p>
          </div>
        </div>
        {hasDraft && (
          <Button onClick={() => setShowModal(true)} className="gap-1.5 text-xs animate-fade-in">
            <PackagePlus size={14} /> Buat Produk dari Draft AI
          </Button>
        )}
      </div>

      {hasDraft && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
          <PackagePlus size={16} className="shrink-0 text-primary" />
          <div className="flex-1">
            <span className="font-medium">Draft AI tersimpan: </span>
            {draft.description && <span className="text-muted-foreground">Deskripsi ✓ </span>}
            {draft.imageUrl && <span className="text-muted-foreground">Gambar ✓</span>}
          </div>
          <button onClick={clearDraft} className="text-muted-foreground hover:text-foreground">Hapus draft</button>
        </div>
      )}

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shop" className="gap-1.5 text-xs">
            <ShoppingBag size={14} /> <span className="hidden sm:inline">Belanja</span>
          </TabsTrigger>
          <TabsTrigger value="seller" className="gap-1.5 text-xs">
            <Store size={14} /> <span className="hidden sm:inline">Seller</span>
          </TabsTrigger>
          <TabsTrigger value="tutor" className="gap-1.5 text-xs">
            <GraduationCap size={14} /> <span className="hidden sm:inline">Tutor</span>
          </TabsTrigger>
        </TabsList>
 
        <TabsContent value="shop"><ChatAssistant /></TabsContent>
        <TabsContent value="seller"><SellerAssistant /></TabsContent>
        <TabsContent value="tutor"><TutorChat /></TabsContent>
      </Tabs>

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); clearDraft(); }}
          initialDescription={draft.description}
          initialImageUrl={draft.imageUrl}
        />
      )}
    </div>
  );
};

const AIHub = () => (
  <AIDraftProvider>
    <AIHubInner />
  </AIDraftProvider>
);

export default AIHub;
