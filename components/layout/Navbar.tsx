'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, GraduationCap, Bot, MessageSquare, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { useDirectMessages } from '@/hooks/useDirectMessages';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { unreadCounts } = useDirectMessages(null);

  const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);

    try {
      await signOut();
      toast({
        title: "Berhasil",
        description: "Logout berhasil",
      });
    } catch (error: unknown) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Gagal logout. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

    return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => router.push('/')}>
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 p-2 rounded-xl shadow-inner mr-3 group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png"
                alt="Logo SMKN 1 Banjarmasin"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 to-cyan-700 tracking-tight group-hover:from-sky-600 group-hover:to-cyan-600 transition-colors">Smart SMK</h1>
              <p className="text-xs font-medium text-slate-500">SMK Negeri 1 Banjarmasin</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/direct-chat')}
                className="relative text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 px-3 md:px-4 transition-colors"
              >
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:block font-medium">Chat</span>
                  {totalUnread > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-[10px] bg-red-500 hover:bg-red-600 text-white border-2 border-white shadow-sm animate-pulse" 
                    >
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </Badge>
                  )}
                </div>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 w-10 p-0 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {user.email === 'kunbobo42@gmail.com' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/chat')}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full h-10 px-3 md:px-4 transition-colors"
                >
                  <Bot className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:block font-medium">AI Chat</span>
                </Button>
              )}

              <div className="w-px h-6 bg-slate-200 mx-2"></div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-full h-10 px-4 transition-all"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:block font-medium">
                  {isLoggingOut ? 'Keluar...' : 'Keluar'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
