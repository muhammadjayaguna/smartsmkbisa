"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BANNERS = [
  {
    title: 'Produk Karya Siswa SMKN 1',
    subtitle: 'Temukan produk & jasa berkualitas dari para pelajar kreatif Banjarmasin',
    cta: 'Belanja Sekarang',
    link: '/products',
    image: '/banners/banner-tkj-demo.webp',
  },
  {
    title: 'Siap Melayani dengan Profesional!',
    subtitle: 'Layanan IT terpercaya langsung dari siswa-siswi jurusan TKJ SMKN 1 Banjarmasin',
    cta: 'Lihat Layanan',
    link: '/products?major=TKJ',
    image: '/banners/banner-tkj-service.webp',
  },
  {
    title: 'Belajar Sambil Berkarya 🔧',
    subtitle: 'Siswa SMKN 1 siap memperbaiki dan merawat perangkat elektronikmu dengan keahlian nyata',
    cta: 'Pesan Jasa',
    link: '/products?category=Jasa',
    image: '/banners/banner-tkj-repair.webp',
  },
  {
    title: 'Buka Toko Gratis!',
    subtitle: 'Daftar dan mulai jual produk atau jasa kamu ke seluruh komunitas sekolah',
    cta: 'Daftar Sekarang',
    link: '/register',
    image: '/banners/banner-buka-toko.jpg',
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
    <section className="relative overflow-hidden rounded-xl mx-4 mt-4 md:mx-auto md:max-w-[1168px]">
      <div className="relative h-[180px] md:h-[340px]">
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={b.image}
              alt={b.title}
              className="h-full w-full object-cover"
              width={1168}
              height={340}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
          </div>
        ))}

        <div className="container relative z-10 flex h-full flex-col items-start justify-center px-6 md:px-10">
          <span className="mb-2 inline-block rounded-md bg-accent/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            SMKN 1 Banjarmasin
          </span>
          <h1 className="mb-2 max-w-lg font-display text-xl font-extrabold text-primary-foreground md:text-3xl leading-tight">
            {banner.title}
          </h1>
          <p className="mb-4 max-w-md text-xs text-primary-foreground/80 md:text-sm leading-relaxed">
            {banner.subtitle}
          </p>
          <Link href={banner.link}
            className="rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 md:text-sm"
          >
            {banner.cta}
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? 'w-6 bg-primary-foreground' : 'w-2 bg-primary-foreground/40'
            }`}
          />
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => setCurrent((current - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/20 p-1.5 text-primary-foreground backdrop-blur-sm hover:bg-card/40"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => setCurrent((current + 1) % BANNERS.length)}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/20 p-1.5 text-primary-foreground backdrop-blur-sm hover:bg-card/40"
      >
        <ChevronRight size={18} />
      </button>
    </section>
  );
};

export default HeroBanner;
