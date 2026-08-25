"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Plus, Trash2, Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { streamChat, type Msg } from '@/lib/marketplace/ai-stream';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAIDraft } from '@/contexts/marketplace/AIDraftContext';
import { toast } from '@/hooks/marketplace/use-toast';
import ReactMarkdown from 'react-markdown';

interface AIChatPanelProps {
  type: 'shop' | 'seller' | 'tutor';
  icon: React.ReactNode;
  title: string;
  placeholder: string;
  emptyState: React.ReactNode;
  quickPrompts?: string[];
  getContext?: (query: string) => Promise<string | undefined>;
  sellerId?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const AIChatPanel = ({ type, icon, title, placeholder, emptyState, quickPrompts, getContext, sellerId }: AIChatPanelProps) => {
  const { user } = useAuth();
  const { setDescription } = useAIDraft();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.db_id || user.id)
      .eq('type', type)
      .order('updated_at', { ascending: false })
      .limit(30);
    setConversations(data || []);
  }, [user, type]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data as Msg[]);
      setConversationId(convId);
      setShowHistory(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('ai_conversations').delete().eq('id', convId);
    if (conversationId === convId) startNewChat();
    loadConversations();
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    await supabase.from('ai_messages').insert({ conversation_id: convId, role, content });
  };

  const ensureConversation = async (firstMessage: string): Promise<string> => {
    if (conversationId) return conversationId;
    if (!user) throw new Error('Login required');
    const convTitle = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.db_id || user.id, type, title: convTitle })
      .select('id')
      .single();
    if (error || !data) throw new Error('Failed to create conversation');
    setConversationId(data.id);
    loadConversations();
    return data.id;
  };

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    if (!user) {
      toast({ title: 'Silakan login terlebih dahulu', variant: 'destructive' });
      return;
    }
    const userMsg: Msg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const convId = await ensureConversation(msg);
      await saveMessage(convId, 'user', msg);
      const context = getContext ? await getContext(msg) : undefined;
      let assistantSoFar = '';
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };
      await streamChat({
        type, messages: newMessages, productContext: context, sellerId,
        onDelta: upsert,
        onDone: async () => {
          setLoading(false);
          if (assistantSoFar) {
            await saveMessage(convId, 'assistant', assistantSoFar);
            await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
          }
        },
        onError: (err) => { setLoading(false); toast({ title: 'Error', description: err, variant: 'destructive' }); },
      });
    } catch (e) {
      setLoading(false);
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '📋 Teks disalin ke clipboard' });
  };

  const useAsDescription = (text: string) => {
    setDescription(text);
    toast({ title: '✅ Deskripsi disimpan ke draft produk', description: 'Klik tombol "Buat Produk dari Draft AI" di atas' });
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <>
              <Button variant="ghost" size="sm" onClick={startNewChat} className="h-7 gap-1 text-xs">
                <Plus size={13} /> Baru
              </Button>
              <Button variant={showHistory ? 'secondary' : 'ghost'} size="sm" onClick={() => setShowHistory(!showHistory)} className="h-7 text-xs">
                Riwayat {conversations.length > 0 && `(${conversations.length})`}
              </Button>
            </>
          )}
        </div>
      </div>

      {showHistory ? (
        <ScrollArea className="flex-1 p-3">
          {conversations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Belum ada riwayat percakapan</p>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <div key={c.id} className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors ${conversationId === c.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} onClick={() => loadConversation(c.id)}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              {emptyState}
              {quickPrompts && quickPrompts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((q) => (
                    <button key={q} onClick={() => send(q)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">{q}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`group flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className={`rounded-xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-primary [&_a]:underline">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} className="text-primary hover:text-primary/80 underline font-medium">{children}</a>
                            ),
                          }}
                        >{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                  {m.role === 'assistant' && !loading && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(m.content)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <Copy size={10} /> Salin
                      </button>
                      {type === 'seller' && (
                        <button onClick={() => useAsDescription(m.content)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                          <FileText size={10} /> Pakai sebagai deskripsi
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Mengetik...
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>
      )}

      {!showHistory && (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-3">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} disabled={loading} className="flex-1" />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}><Send size={16} /></Button>
        </form>
      )}
    </div>
  );
};

export default AIChatPanel;
