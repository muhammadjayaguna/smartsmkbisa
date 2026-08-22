'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  attachment_url?: string;
  attachment_type?: string;
  created_at: string;
  read_at: string | null;
}

export const useDirectMessages = (receiverId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessageTimes, setLastMessageTimes] = useState<Record<string, string>>({});
  
  const receiverIdRef = useRef(receiverId);
  useEffect(() => { receiverIdRef.current = receiverId; }, [receiverId]);

  // Get current user's DB ID (public.users.id)
  useEffect(() => {
    const getDbUserId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (data) setDbUserId(data.id);
    };
    getDbUserId();
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!dbUserId || !receiverId) {
      if (!receiverId) setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('direct_messages' as any) as any)
        .select('*')
        .or(`and(sender_id.eq.${dbUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${dbUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
      
      // Mark as read when opening conversation
      if (receiverId) {
        await (supabase.from('direct_messages' as any) as any)
          .update({ read_at: new Date().toISOString() })
          .eq('receiver_id', dbUserId)
          .eq('sender_id', receiverId)
          .is('read_at', null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [dbUserId, receiverId]);

  // Global monitoring for all messages (presence + notifications)
  useEffect(() => {
    if (!dbUserId) return;

    // Use a unique channel ID to avoid "cannot add 'presence' callbacks... after 'subscribe()'" error
    // when multiple components mount `useDirectMessages` simultaneously in React StrictMode.
    const channelId = `global-chat-monitor-${dbUserId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId, {
      config: {
        presence: {
          key: dbUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.keys(state).forEach((key) => online.add(key));
        setOnlineUsers(online);
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${dbUserId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // If we're currently chatting with this sender, add to messages
          if (newMessage.sender_id === receiverIdRef.current) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            // Auto mark as read if active
            (supabase.from('direct_messages' as any) as any)
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMessage.id)
              .select()
              .then();
          } else {
            // Otherwise, increment unread count for this sender
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1
            }));
          }

          // Update last message time for this sender
          setLastMessageTimes(prev => ({
            ...prev,
            [newMessage.sender_id]: newMessage.created_at
          }));
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // Initial unread counts fetch
    const fetchInitialData = async () => {
      // Fetch unread counts
      const { data: unreadData } = await (supabase.from('direct_messages' as any) as any)
        .select('sender_id')
        .eq('receiver_id', dbUserId)
        .is('read_at', null);
      
      if (unreadData) {
        const counts: Record<string, number> = {};
        unreadData.forEach((msg: any) => {
          counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }

      // Fetch last message times for each contact
      // We'll get the latest message where current user is either sender or receiver for each other user
      const { data: recentMsgs } = await (supabase as any).rpc('get_recent_conversations', { 
        user_uuid: dbUserId 
      });

      if (recentMsgs) {
        const times: Record<string, string> = {};
        recentMsgs.forEach((chat: any) => {
          times[chat.other_user_id] = chat.last_message_at;
        });
        setLastMessageTimes(times);
      }
    };
    fetchInitialData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbUserId]);

  useEffect(() => {
    fetchMessages();
    
    // Clear unread count for the active user
    if (receiverId) {
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[receiverId];
        return next;
      });
    }
  }, [dbUserId, receiverId, fetchMessages]);

  const sendMessage = async (messageText: string, attachmentUrl?: string, attachmentType?: string) => {
    if (!dbUserId || !receiverId || (!messageText.trim() && !attachmentUrl)) return { data: null, error: 'Mandatory fields missing' };

    try {
      const { data, error } = await (supabase.from('direct_messages' as any) as any)
        .insert({
          sender_id: dbUserId,
          receiver_id: receiverId,
          message: messageText.trim(),
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically add to messages
      setMessages((prev) => [...prev, data as ChatMessage]);

      // Update last message time for the receiver
      setLastMessageTimes(prev => ({
        ...prev,
        [receiverId]: (data as ChatMessage).created_at
      }));

      return { data, error: null };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    onlineUsers,
    unreadCounts,
    lastMessageTimes,
    refetch: fetchMessages,
  };
};
