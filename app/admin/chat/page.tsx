'use client';


import React, { useState, useRef, useEffect } from 'react';
import { useAdminChat, ChatMessage } from '@/hooks/useAdminChat';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Sparkles, Trash2, Database, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminChat = () => {
    const { messages, loading, sendMessage, clearChat } = useAdminChat();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            sendMessage(input);
            setInput('');
        }
    };

    const suggestions = [
        "Siapa saja yang absen hari ini?",
        "Tampilkan guru yang absen lewat jam 8",
        "Ada berapa siswa yang sedang magang?",
        "Tampilkan jurnal mengajar kelas XI kemarin"
    ];

    return (
        <AppLayout>
            <div className="container mx-auto p-4 max-w-4xl h-[calc(100vh-120px)] flex flex-col">
                <Card className="flex-1 flex flex-col overflow-hidden border-2 border-blue-100 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">AI Chat Admin</CardTitle>
                                    <CardDescription className="text-blue-100 text-xs">
                                        Tanya apapun tentang data SMKN 1 Banjarmasin
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearChat}
                                className="text-white hover:bg-white/20"
                                title="Hapus Percakapan"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50 relative">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="bg-blue-100 p-6 rounded-full"
                                        >
                                            <Sparkles className="h-12 w-12 text-blue-600 animate-pulse" />
                                        </motion.div>
                                        <div className="max-w-md">
                                            <h3 className="text-xl font-semibold text-slate-800">Halo Admin!</h3>
                                            <p className="text-slate-500 mt-2">
                                                Saya adalah asisten AI yang siap membantu Anda menganalisis data absensi,
                                                jurnal, dan data sekolah lainnya secara real-time.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg cursor-pointer">
                                            {suggestions.map((text, i) => (
                                                <Button
                                                    key={i}
                                                    variant="outline"
                                                    className="text-sm justify-start h-auto py-3 px-4 bg-white hover:border-blue-400 hover:bg-blue-50"
                                                    onClick={() => sendMessage(text)}
                                                >
                                                    {text}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex max-w-[85%] space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                <div className={`p-2 rounded-lg h-fit ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                                    {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-slate-700" />}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                                        ? 'bg-blue-500 text-white rounded-tr-none'
                                                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                                                        }`}>
                                                        <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>

                                                        {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                                                            <div className="mt-3 bg-slate-50 rounded-lg p-2 border border-slate-200 overflow-x-auto shadow-inner">
                                                                <div className="flex items-center text-xs font-bold text-slate-500 mb-1">
                                                                    <Database className="h-3 w-3 mr-1" /> DATA HASIL QUERY
                                                                </div>
                                                                <table className="min-w-full text-xs text-slate-700">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200">
                                                                            {Object.keys(msg.data[0]).map(k => (
                                                                                <th key={k} className="px-2 py-1 text-left">{k}</th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {msg.data.slice(0, 5).map((row: any, ri: number) => (
                                                                            <tr key={ri} className="border-b border-slate-100 last:border-0">
                                                                                {Object.values(row).map((v: any, vi) => (
                                                                                    <td key={vi} className="px-2 py-1 max-w-[150px] truncate">
                                                                                        {typeof v === 'boolean' ? (v ? '✅' : '❌') : String(v)}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        ))}
                                                                        {msg.data.length > 5 && (
                                                                            <tr>
                                                                                <td colSpan={Object.keys(msg.data[0]).length} className="text-center py-1 italic text-slate-400">
                                                                                    ... dan {msg.data.length - 5} baris lainnya
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {msg.sql && (
                                                        <details className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600">
                                                            <summary className="flex items-center"><Code className="h-3 w-3 mr-1" /> View SQL</summary>
                                                            <pre className="mt-1 bg-slate-800 text-blue-300 p-2 rounded-md overflow-x-auto">
                                                                {msg.sql}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {loading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="flex space-x-3 items-center bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                            <div className="flex space-x-1">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></span>
                                            </div>
                                            <span className="text-sm text-slate-500 italic">AI sedang berpikir...</span>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <form onSubmit={handleSend} className="flex space-x-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tanyakan sesuatu tentang data..."
                                className="flex-1 focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <Button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
                                {loading ? <Sparkles className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                            AI can make mistakes. Check important info. Model: Llama 3.3 70B via Groq.
                        </p>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
};

export default AdminChat;
