'use client'
import Link from 'next/link';
export default function QuickAccessFooter() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
      <p className="text-sm text-gray-600 mb-6">Akses fitur yang sering digunakan</p>

      {/* Button Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Link href="/administrasi-guru/absensi-siswa" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
          <span>⬇</span>
          Mulai Absensi Siswa
        </Link>
        <button className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
          Absensi Upacara
        </button>
        <button className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
          Absensi Siswa Magang
        </button>
        <button className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
          Jurnal Mengajar
        </button>
        <button className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
          Peminjaman Barang
        </button>
        <button className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
          Lihat Laporan
        </button>
        <button className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
          Kelola Siswa
        </button>
        <button className="px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
          Tanya AI Admin
        </button>
      </div>
    </div>
  )
}
