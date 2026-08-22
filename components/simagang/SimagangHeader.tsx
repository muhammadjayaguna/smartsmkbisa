'use client';

import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface SimagangHeaderProps {
  title: string;
}

export default function SimagangHeader({ title }: SimagangHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30 h-16 flex items-center justify-between px-6 no-print">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-slate-800 hidden md:block">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-800">{user.user_metadata?.name || user.email}</p>
              <p className="text-xs text-slate-500 capitalize">{user.user_metadata?.role || 'User'}</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <button 
              onClick={() => signOut()}
              className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link href="/auth" className="text-sm font-medium text-teal-600 hover:text-teal-800">
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
