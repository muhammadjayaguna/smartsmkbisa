"use client";

import { useState } from 'react';
import { Bot, X, ShoppingBag, Store, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { AIDraftProvider } from '@/contexts/marketplace/AIDraftContext';
import ChatAssistant from './ChatAssistant';
import SellerAssistant from './SellerAssistant';
import TutorChat from './TutorChat';

const FloatingAIChat = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-5 md:right-5 md:h-14 md:w-14"
        aria-label="AI Assistant"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-14 z-50 mx-auto max-h-[70vh] w-full animate-fade-in rounded-t-xl border border-border bg-card shadow-2xl md:inset-x-auto md:bottom-20 md:right-5 md:left-auto md:w-[360px] md:max-w-[calc(100vw-2.5rem)] md:rounded-xl">
          <AIDraftProvider>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">AI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <Tabs defaultValue="shop" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border bg-transparent px-2">
                <TabsTrigger value="shop" className="gap-1 text-[10px] data-[state=active]:bg-secondary">
                  <ShoppingBag size={12} /> Belanja
                </TabsTrigger>
                <TabsTrigger value="seller" className="gap-1 text-[10px] data-[state=active]:bg-secondary">
                  <Store size={12} /> Seller
                </TabsTrigger>
                <TabsTrigger value="tutor" className="gap-1 text-[10px] data-[state=active]:bg-secondary">
                  <GraduationCap size={12} /> Tutor
                </TabsTrigger>
              </TabsList>

              <div className="h-[400px]">
                <TabsContent value="shop" className="mt-0 h-full"><ChatAssistant /></TabsContent>
                <TabsContent value="seller" className="mt-0 h-full"><SellerAssistant /></TabsContent>
                <TabsContent value="tutor" className="mt-0 h-full"><TutorChat /></TabsContent>
              </div>
            </Tabs>
          </AIDraftProvider>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
