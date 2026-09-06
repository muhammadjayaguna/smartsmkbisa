'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, Trophy, BrainCircuit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AiSipoinInsightsProps {
  dataSiswa: any[];
}

export default function AiSipoinInsights({ dataSiswa }: AiSipoinInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    if (dataSiswa.length === 0) {
      setError('Tidak ada data siswa untuk dianalisis.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai-sipoin-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSiswa }),
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.error || 'Terjadi kesalahan saat memproses data AI.');
      }
      
      setInsights(resData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!insights && !isLoading) {
      fetchInsights();
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpen}
        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-500/30"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Analisis AI
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                      <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">SiAjar AI Insights</h3>
                      <p className="text-violet-100 text-sm opacity-90">Deteksi Dini & Analisis Kedisiplinan Siswa</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 relative">
                      <div className="absolute inset-0 border-4 border-violet-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-slate-500 font-medium">Gemini sedang menganalisis data {dataSiswa.length} siswa...</p>
                    <p className="text-xs text-slate-400 mt-1">Mencari pola pelanggaran dan prestasi</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Gagal menganalisis</h4>
                      <p className="text-sm mt-1">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchInsights} className="mt-3 border-red-200 text-red-600 hover:bg-red-100">
                        Coba Lagi
                      </Button>
                    </div>
                  </div>
                ) : insights ? (
                  <div className="space-y-6">
                    {/* Ringkasan */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ringkasan Eksekutif</h4>
                      <p className="text-slate-700 leading-relaxed text-sm">{insights.ringkasan}</p>
                    </div>

                    {/* Siswa Perhatian Khusus */}
                    {insights.siswa_perhatian_khusus && insights.siswa_perhatian_khusus.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-red-600 mb-3">
                          <AlertTriangle className="w-4 h-4" /> Perlu Perhatian Khusus (Deteksi Dini)
                        </h4>
                        <div className="space-y-3">
                          {insights.siswa_perhatian_khusus.map((siswa: any, idx: number) => (
                            <div key={idx} className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                              <h5 className="font-bold text-red-800">{siswa.nama}</h5>
                              <p className="text-xs text-red-600/80 mt-1"><span className="font-semibold text-red-700">Alasan:</span> {siswa.alasan}</p>
                              <div className="mt-2 text-xs bg-white rounded-lg p-2 border border-red-50 text-slate-700">
                                <span className="font-bold text-amber-600">Saran Tindakan:</span> {siswa.saran_tindakan}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Siswa Apresiasi */}
                    {insights.siswa_apresiasi && insights.siswa_apresiasi.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-600 mb-3">
                          <Trophy className="w-4 h-4" /> Apresiasi Prestasi
                        </h4>
                        <div className="space-y-3">
                          {insights.siswa_apresiasi.map((siswa: any, idx: number) => (
                            <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                              <h5 className="font-bold text-emerald-800">{siswa.nama}</h5>
                              <p className="text-xs text-emerald-600/80 mt-1"><span className="font-semibold text-emerald-700">Alasan:</span> {siswa.alasan}</p>
                              <div className="mt-2 text-xs bg-white rounded-lg p-2 border border-emerald-50 text-slate-700">
                                <span className="font-bold text-emerald-600">Saran Apresiasi:</span> {siswa.saran_tindakan}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rekomendasi Umum */}
                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">Rekomendasi Kebijakan Sekolah</h4>
                      <p className="text-violet-800/80 leading-relaxed text-sm">{insights.rekomendasi_umum}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
