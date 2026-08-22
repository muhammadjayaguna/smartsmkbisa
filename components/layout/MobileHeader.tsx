'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { LogOut, Menu, X, User, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const MobileHeader = () => {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await signOut();
      toast({
        title: "Berhasil",
        description: "Logout berhasil",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Gagal logout. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const menuItems = [
    { label: 'Profil Saya', path: null, icon: User },
    { label: 'Hapus Data Magang', path: '/direct-chat', icon: Settings },
  ];

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', color: 'bg-red-100 text-red-800' };
      case 'guru':
        return { label: 'Guru', color: 'bg-blue-100 text-blue-800' };
      case 'siswa':
        return { label: 'Siswa', color: 'bg-green-100 text-green-800' };
      default:
        return { label: 'User', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push('/')}
        >
          <img
            src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png"
            alt="Logo SMKN 1 Banjarmasin"
            className="h-8 w-8 mr-2"
          />
          <div>
            <h1 className="text-sm font-bold text-teal-700">Smart SMK</h1>
            <p className="text-[10px] text-muted-foreground">SMKN 1 Banjarmasin</p>
          </div>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b border-border bg-muted/50">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>

            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.email}
                  </p>
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                    roleBadge.color
                  )}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (item.path) {
                      router.push(item.path);
                      setIsOpen(false);
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-border mt-auto">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
                disabled={isLoggingOut}
              >
                <LogOut className={cn(
                  "h-4 w-4 mr-2",
                  isLoggingOut && "animate-spin"
                )} />
                {isLoggingOut ? 'Logout...' : 'Keluar'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default MobileHeader;
