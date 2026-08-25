"use client";

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-9 w-9 rounded-lg" />
            <div>
              <span className="font-display text-sm font-bold text-foreground">SMKN 1 Mall</span>
              <span className="block text-[10px] text-muted-foreground">Banjarmasin</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Platform marketplace karya siswa SMK Negeri 1 Banjarmasin untuk memfasilitasi kewirausahaan dan kreativitas pelajar.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <GraduationCap size={12} />
            <span>Pendidikan Berbasis Kewirausahaan</span>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Layanan</h4>
          <div className="space-y-2.5">
            <Link href="/products" className="block text-xs text-muted-foreground hover:text-primary">Semua Produk</Link>
            <Link href="/products?category=Barang" className="block text-xs text-muted-foreground hover:text-primary">Barang</Link>
            <Link href="/products?category=Jasa" className="block text-xs text-muted-foreground hover:text-primary">Jasa</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Jurusan</h4>
          <div className="space-y-2.5">
            {['TKJ', 'Multimedia', 'Akuntansi', 'Pemasaran', 'Perkantoran'].map((m) => (
              <Link key={m} href={`/products?major=${m}`} className="block text-xs text-muted-foreground hover:text-primary">{m}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Informasi</h4>
          <div className="space-y-2.5">
            <Link href="/about" className="block text-xs text-muted-foreground hover:text-primary">Tentang Kami</Link>
            <Link href="/register" className="block text-xs text-muted-foreground hover:text-primary">Daftar Penjual</Link>
          </div>
          <div className="mt-4 rounded-lg bg-secondary p-3">
            <p className="text-[10px] font-semibold text-foreground">📍 SMK Negeri 1 Banjarmasin</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Jl. Brigjend H. Hasan Basry, Banjarmasin</p>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-[11px] text-muted-foreground">
        &copy; {new Date().getFullYear()} Marketplace SMK Negeri 1 Banjarmasin. Dibangun untuk pendidikan kewirausahaan.
      </div>
    </div>
  </footer>
);

export default Footer;
