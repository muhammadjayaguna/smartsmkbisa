'use client'

import { Search, BellRing, Settings } from 'lucide-react'

export default function TopHeader() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Absensi Digital</p>
            <p className="text-xs text-gray-500">SMK Negeri 1 Banjarmasin</p>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* User Email */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span>kunbobo42@gmail.com</span>
          </div>

          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600 hover:text-gray-900" />
          </button>

          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
            <BellRing className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>

          {/* AI Chat Button */}
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors hidden sm:block">
            AI Chat
          </button>

          {/* Logout Button */}
          <button className="px-3 py-1.5 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
