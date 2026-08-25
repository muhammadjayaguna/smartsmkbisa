"use client";
import { useSearchParams } from '@/hooks/marketplace/use-router-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { Send, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface ChatUser {
  id: string;
  full_name: string;
  major: string;
  lastMessage?: string;
  unread?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const Chat = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(searchParams.get('to'));
  const [selectedUserProfile, setSelectedUserProfile] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchChatUsers();
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      fetchSelectedUserProfile();
      markAsRead();
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inactivity timer for redirection
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        router.push('/');
      }, 3 * 60 * 1000); // 3 minutes
    };

    // Events that count as activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    resetTimer(); // Start timer

    return () => {
      clearTimeout(timer);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [router]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === selectedUser) {
          setMessages((prev) => [...prev, msg]);
          markAsRead();
        }
        fetchChatUsers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUser]);

  const fetchChatUsers = async () => {
    if (!user) return;
    setLoading(true);

    // Get all unique users from chat messages
    const { data: sentMsgs } = await supabase
      .from('chat_messages')
      .select('receiver_id')
      .eq('sender_id', user.id);

    const { data: receivedMsgs } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('receiver_id', user.id);

    const userIds = new Set<string>();
    sentMsgs?.forEach((m) => userIds.add(m.receiver_id));
    receivedMsgs?.forEach((m) => userIds.add(m.sender_id));

    // If navigated with ?to= param, add that user
    const toUser = searchParams.get('to');
    if (toUser && toUser !== user.id) userIds.add(toUser);

    if (userIds.size === 0) {
      setChatUsers([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name:nama')
      .in('id', Array.from(userIds));

    setChatUsers((profiles || []) as ChatUser[]);
    setLoading(false);
  };

  const fetchSelectedUserProfile = async () => {
    if (!selectedUser) return;
    const { data } = await supabase.from('users').select('id, full_name:nama').eq('id', selectedUser).single();
    if (data) setSelectedUserProfile(data as ChatUser);
  };

  const fetchMessages = async () => {
    if (!user || !selectedUser) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    setMessages((data || []) as Message[]);
  };

  const markAsRead = async () => {
    if (!user || !selectedUser) return;
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUser)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUser || !newMessage.trim()) return;

    const msg = {
      sender_id: user.id,
      receiver_id: selectedUser,
      message: newMessage.trim(),
      product_id: searchParams.get('product') || null,
    };

    const { data, error } = await supabase.from('chat_messages').insert(msg).select().single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setNewMessage('');
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-secondary">
      {/* User list */}
      <div className={`${selectedUser ? 'hidden md:block' : ''} w-full border-r border-border bg-card md:w-72`}>
        <div className="border-b border-border p-3">
          <h2 className="font-display text-sm font-bold text-foreground">Chat</h2>
        </div>
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Memuat...</div>
          ) : chatUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Belum ada percakapan</div>
          ) : (
            chatUsers.map((cu) => (
              <button
                key={cu.id}
                onClick={() => setSelectedUser(cu.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-secondary ${
                  selectedUser === cu.id ? 'bg-secondary' : ''
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {cu.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{cu.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">{cu.major}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
              <button onClick={() => setSelectedUser(null)} className="md:hidden text-muted-foreground">
                <ArrowLeft size={18} />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {selectedUserProfile?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{selectedUserProfile?.full_name || 'Loading...'}</p>
                <p className="text-[10px] text-muted-foreground">{selectedUserProfile?.major}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-xs ${
                      msg.sender_id === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground'
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`mt-1 text-[9px] ${msg.sender_id === user.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-border bg-card p-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 rounded-sm border border-input bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-sm bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Pilih percakapan untuk mulai chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
