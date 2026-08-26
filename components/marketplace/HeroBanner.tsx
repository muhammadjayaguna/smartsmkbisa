"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BANNERS = [
  {
    title: 'Produk Karya Siswa SMKN 1',
    subtitle: 'Temukan produk & jasa berkualitas dari para pelajar kreatif Banjarmasin',
    cta: 'Belanja Sekarang',
    link: '/marketplace/products',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80',
  },
  {
    title: 'Siap Melayani dengan Profesional!',
    subtitle: 'Layanan IT terpercaya langsung dari siswa-siswi jurusan TKJ SMKN 1 Banjarmasin',
    cta: 'Lihat Layanan',
    link: '/marketplace/products?major=TKJ',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80',
  },
  {
    title: 'Belajar Sambil Berkarya 🔧',
    subtitle: 'Siswa SMKN 1 siap memperbaiki dan merawat perangkat elektronikmu dengan keahlian nyata',
    cta: 'Pesan Jasa',
    link: '/marketplace/products?category=Jasa',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80',
  },
  {
    title: 'Buka Toko Gratis!',
    subtitle: 'Daftar dan mulai jual produk atau jasa kamu ke seluruh komunitas sekolah',
    cta: 'Daftar Sekarang',
    link: '/register',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[current];

  return (
    <section className="group relative overflow-hidden rounded-xl mx-4 mt-4 md:mx-auto md:max-w-[1168px] md:rounded-2xl shadow-xl shadow-primary/5 transition-all">
      <div className="relative h-[180px] md:h-[380px]">
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={b.image}
              alt={b.title}
              className="h-full w-full object-cover"
              width={1168}
              height={380}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          </div>
        ))}

        <div className="container relative z-10 flex h-full flex-col items-start justify-center px-6 md:px-12">
          <span className="mb-3 inline-block rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground backdrop-blur-sm shadow-sm md:text-xs">
            SMKN 1 Banjarmasin
          </span>
          <h1 className="mb-3 max-w-lg font-display text-2xl font-extrabold text-white md:text-4xl leading-tight drop-shadow-md">
            {banner.title}
          </h1>
          <p className="mb-6 max-w-md text-xs text-white/90 md:text-base leading-relaxed drop-shadow-sm font-medium">
            {banner.subtitle}
          </p>
          <Link href={banner.link}
            className="rounded-full bg-accent px-6 py-3 text-xs font-bold text-accent-foreground shadow-lg transition-all hover:bg-accent/90 hover:scale-105 hover:shadow-accent/30 md:text-sm active:scale-95"
          >
            {banner.cta}
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => setCurrent((current - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition-all hover:bg-black/50 hover:scale-110 opacity-0 group-hover:opacity-100 md:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setCurrent((current + 1) % BANNERS.length)}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition-all hover:bg-black/50 hover:scale-110 opacity-0 group-hover:opacity-100 md:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );
};

export default HeroBanner;
