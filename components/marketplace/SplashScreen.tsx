"use client";

import { useState, useEffect } from 'react';
import logo from '@/assets/logo.png';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(onFinish, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`absolute h-48 w-48 rounded-full border border-primary-foreground/10 transition-all duration-1000 ease-out ${
            phase !== 'enter' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          style={{ transitionDelay: '200ms' }}
        />
        <div
          className={`absolute h-72 w-72 rounded-full border border-primary-foreground/5 transition-all duration-1000 ease-out ${
            phase !== 'enter' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          style={{ transitionDelay: '400ms' }}
        />
        <div
          className={`absolute h-96 w-96 rounded-full border border-primary-foreground/[0.03] transition-all duration-1000 ease-out ${
            phase !== 'enter' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          style={{ transitionDelay: '600ms' }}
        />
      </div>

      {/* Logo */}
      <div
        className={`relative z-10 transition-all duration-700 ease-out ${
          phase !== 'enter' ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-75 opacity-0'
        }`}
      >
        <div className="relative">
          <div className="absolute -inset-3 animate-pulse rounded-2xl bg-primary-foreground/10 blur-xl" />
          <img src={logo} alt="Logo" className="relative h-20 w-20 rounded-2xl object-cover shadow-2xl" />
        </div>
      </div>

      {/* Title */}
      <h1
        className={`relative z-10 mt-6 font-display text-2xl font-bold tracking-tight text-primary-foreground transition-all duration-700 ease-out ${
          phase !== 'enter' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        style={{ transitionDelay: '300ms' }}
      >
        SMKN 1 Mall
      </h1>
      <p
        className={`relative z-10 mt-1.5 text-xs tracking-widest text-primary-foreground/60 uppercase transition-all duration-700 ease-out ${
          phase !== 'enter' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        style={{ transitionDelay: '500ms' }}
      >
        Marketplace Kewirausahaan
      </p>

      {/* Loading bar */}
      <div
        className={`relative z-10 mt-8 h-0.5 w-32 overflow-hidden rounded-full bg-primary-foreground/10 transition-all duration-500 ${
          phase !== 'enter' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDelay: '700ms' }}
      >
        <div className="splash-loader h-full rounded-full bg-primary-foreground/60" />
      </div>
    </div>
  );
};

export default SplashScreen;
