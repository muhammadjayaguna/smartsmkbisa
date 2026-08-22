'use client'

export default function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-green-500 p-8 md:p-10">
      {/* Content */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Selamat Datang
          </h2>
          <p className="text-white text-sm md:text-base opacity-90 mb-3">
            SMK Negeri 1 Banjarmasin
          </p>
          <div className="text-white text-sm space-y-1">
            <p className="font-medium">Administrator</p>
            <p className="opacity-80">Sabtu, 18 Juli 2026</p>
          </div>
        </div>

        {/* Logo Circle */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-white">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
