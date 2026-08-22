
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    data?: any;
    sql?: string;
}

export const useAdminChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (prompt: string) => {
        if (!prompt.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('admin-ai-chat', {
                body: { prompt }
            });

            if (error) throw error;

            const aiMessage: ChatMessage = {
                role: 'ai',
                content: data.answer || "Saya telah memproses permintaan Anda.",
                data: data.data,
                sql: data.sql
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            toast({
                title: "Error",
                description: error.message || "Gagal menghubungi AI. Pastikan Edge Function sudah aktif.",
                variant: "destructive"
            });

            const errorMessage: ChatMessage = {
                role: 'ai',
                content: "Maaf, terjadi kesalahan saat memproses permintaan Anda."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => setMessages([]);

    return {
        messages,
        loading,
        sendMessage,
        clearChat
    };
};
