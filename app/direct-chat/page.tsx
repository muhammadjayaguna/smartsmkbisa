'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages, ChatMessage } from '@/hooks/useDirectMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User as UserIcon, MessageSquare, Search, ArrowLeft, Paperclip, File, X, Image as ImageIcon, Download } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  nama: string;
  email: string;
  auth_id: string;
}

const DirectChat = () => {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    loading: messagesLoading, 
    onlineUsers, 
    unreadCounts,
    lastMessageTimes
  } = useDirectMessages(selectedUser?.id || null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Idle redirection logic (2 minutes)
  useEffect(() => {
    const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
    let idleTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        toast({
          title: "Sesi Berakhir",
          description: "Anda telah tidak aktif selama 2 menit. Mengalihkan ke beranda...",
        });
        router.push('/');
      }, IDLE_TIMEOUT);
    };

    // Events that count as activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'click'
    ];

    // Initialize timer
    resetTimer();

    // Add listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser) return;

      // Get current user's DB ID
      const { data: currentUserData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      
      if (currentUserData) setCurrentDbUserId(currentUserData.id);

      // Get all other users
      const { data: usersData } = await (supabase.from('users' as any) as any)
        .select('*')
        .neq('auth_id', authUser.id)
        .order('nama');
      
      if (usersData) setUsers(usersData);
    };

    fetchData();
  }, [authUser]);

  const filteredUsers = users
    .filter(user => 
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const unreadA = unreadCounts[a.id] || 0;
      const unreadB = unreadCounts[b.id] || 0;
      
      // 1. Unread first
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadA === 0 && unreadB > 0) return 1;
      
      // 2. Last message time (newest first)
      const timeA = lastMessageTimes[a.id] || '';
      const timeB = lastMessageTimes[b.id] || '';
      
      if (timeA && timeB) {
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      }
      if (timeA) return -1;
      if (timeB) return 1;
      
      // 3. Name
      return a.nama.localeCompare(b.nama);
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 20MB
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Maksimal ukuran file adalah 20MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string } | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${currentDbUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return { url: publicUrl, type: file.type };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Gagal mengunggah file",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !selectedUser) return;

    const textToSend = messageInput;
    const fileToUpload = selectedFile;
    
    setMessageInput('');
    setSelectedFile(null);
    setFilePreview(null);
    
    let attachmentUrl = undefined;
    let attachmentType = undefined;

    if (fileToUpload) {
      const uploadResult = await uploadFile(fileToUpload);
      if (uploadResult) {
        attachmentUrl = uploadResult.url;
        attachmentType = uploadResult.type;
      } else {
        // If upload fails, restore input
        setMessageInput(textToSend);
        setSelectedFile(fileToUpload);
        return;
      }
    }
    
    const { error } = await sendMessage(textToSend, attachmentUrl, attachmentType);
    if (error) {
      setMessageInput(textToSend);
      console.error('Failed to send:', error);
    }
  };

  const renderAttachment = (msg: ChatMessage) => {
    if (!msg.attachment_url) return null;

    if (msg.attachment_type?.startsWith('image/')) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border bg-background/50 max-w-sm">
          <img 
            src={msg.attachment_url} 
            alt="Attachment" 
            className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.attachment_url, '_blank')}
          />
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border bg-background/50 text-foreground">
        <div className="p-2 rounded-md bg-primary/10">
          <File className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-medium truncate">File Attachment</p>
          <p className="text-[10px] opacity-60 uppercase">{msg.attachment_type?.split('/').pop() || 'FILE'}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={(e) => {
            e.stopPropagation();
            window.open(msg.attachment_url, '_blank');
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] bg-background overflow-hidden">
        <div className="container mx-auto px-4 pt-4 pb-2 flex-none">
          <PageBreadcrumb currentPage="Pesan Langsung" />
        </div>
        
        <div className="flex-1 container mx-auto px-4 pb-4 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
            {/* User List Section */}
            <Card className={`w-full md:w-80 flex-none flex flex-col overflow-hidden ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
              <CardHeader className="py-4 border-bottom">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Kontak
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari nama..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col p-2 space-y-1">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => {
                        const isOnline = onlineUsers.has(user.id);
                        const unreadCount = unreadCounts[user.id] || 0;
                        
                        return (
                          <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors relative ${
                              selectedUser?.id === user.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                            }`}
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10 border">
                                <AvatarFallback>{user.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold text-sm truncate">{user.nama}</p>
                                {unreadCount > 0 && (
                                  <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]" variant="destructive">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate opacity-70">
                                {isOnline ? 'Aktif sekarang' : 'Offline'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Tidak ada kontak ditemukan</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area Section */}
            <Card className={`flex-1 flex flex-col overflow-hidden ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
              {selectedUser ? (
                <>
                  <CardHeader className="py-3 border-b flex flex-row items-center gap-4 bg-muted/20">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden" 
                      onClick={() => setSelectedUser(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback>{selectedUser.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {onlineUsers.has(selectedUser.id) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <CardTitle className="text-base font-bold truncate">{selectedUser.nama}</CardTitle>
                        <p className="text-[10px] text-muted-foreground">
                          {onlineUsers.has(selectedUser.id) ? (
                            <span className="text-green-600 font-medium">Online</span>
                          ) : (
                            <span>Offline</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea ref={scrollRef} className="h-full p-4">
                      <div className="flex flex-col space-y-4 pt-2">
                        {messages.length > 0 ? (
                          messages.map((msg) => {
                            const isMe = msg.sender_id === currentDbUserId;
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                    isMe
                                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                                      : 'bg-muted rounded-tl-none border'
                                  }`}
                                >
                                  {msg.message && <p className="mb-1">{msg.message}</p>}
                                  {renderAttachment(msg)}
                                  <p className={`text-[10px] mt-1.5 opacity-60 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground h-full opacity-50">
                            <MessageSquare className="h-12 w-12 mb-2" />
                            <p className="text-sm">Belum ada percakapan</p>
                            <p className="text-xs">Mulai kirim pesan sekarang</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <div className="p-4 border-t bg-muted/5">
                    {selectedFile && (
                      <div className="mb-3 flex items-center gap-3 p-2 rounded-lg bg-background border relative animate-in slide-in-from-bottom-2">
                        {filePreview ? (
                          <div className="h-12 w-12 rounded overflow-hidden border">
                            <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center border">
                            <File className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Tulis pesan..."
                        className="flex-1 shadow-none focus-visible:ring-1"
                        disabled={isUploading}
                      />
                      <Button type="submit" size="icon" disabled={(!messageInput.trim() && !selectedFile) || isUploading}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground bg-muted/10">
                  <div className="p-8 rounded-full bg-muted/50 mb-4 animate-pulse">
                    <MessageSquare className="h-20 w-20 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">Direct Chat</h3>
                  <p className="text-sm">Pilih kontak di sebelah kiri untuk memulai obrolan</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DirectChat;
