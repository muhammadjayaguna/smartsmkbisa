import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { Bell, AlertTriangle, CheckCircle, Info, X, ChevronLeft, ChevronRight, Megaphone, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pemberitahuan {
  id: string;
  judul: string;
  isi: string;
  tipe: string;
  tanggal_mulai: string;
  created_at: string;
}

const tipeConfig = {
  info: {
    icon: Info,
    bgGradient: 'from-blue-500/10 via-blue-400/5 to-transparent',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-500',
    badgeBg: 'bg-blue-500/20 text-blue-600',
    glowColor: 'shadow-blue-500/20',
  },
  warning: {
    icon: AlertTriangle,
    bgGradient: 'from-amber-500/10 via-amber-400/5 to-transparent',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-500/20 text-amber-600',
    glowColor: 'shadow-amber-500/20',
  },
  success: {
    icon: CheckCircle,
    bgGradient: 'from-emerald-500/10 via-emerald-400/5 to-transparent',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/20 text-emerald-600',
    glowColor: 'shadow-emerald-500/20',
  },
  urgent: {
    icon: Bell,
    bgGradient: 'from-red-500/10 via-red-400/5 to-transparent',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-500',
    badgeBg: 'bg-red-500/20 text-red-600',
    glowColor: 'shadow-red-500/20',
  },
  quotes: {
    icon: Quote,
    bgGradient: 'from-purple-500/10 via-purple-400/5 to-transparent',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-500',
    badgeBg: 'bg-purple-500/20 text-purple-600',
    glowColor: 'shadow-purple-500/20',
  },
};

const tipeLabels = {
  info: 'Informasi',
  warning: 'Peringatan',
  success: 'Sukses',
  urgent: 'Penting',
  quotes: 'Quotes',
};

const PemberitahuanSection = () => {
  const [announcements, setAnnouncements] = useState<Pemberitahuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('pemberitahuan')
        .select('*')
        .eq('aktif', true)
        .lte('tanggal_mulai', new Date().toISOString())
        .or('tanggal_selesai.is.null,tanggal_selesai.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse">
          <div className="h-24 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length];
  const tipe = (currentAnnouncement.tipe as keyof typeof tipeConfig) || 'info';
  const config = tipeConfig[tipe] || tipeConfig.info;
  const Icon = config.icon;

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
  };

  return (
    <div className="mb-6">
      <Card className={cn(
        "relative overflow-hidden border-2 transition-all duration-500",
        "bg-white shadow-xl z-20",
        config.borderColor,
        config.glowColor,
        "hover:shadow-2xl"
      )}>
        {/* Animated background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-20",
            tipe === 'info' && "bg-primary/60",
            tipe === 'warning' && "bg-yellow-400",
            tipe === 'success' && "bg-green-400",
            tipe === 'urgent' && "bg-destructive/60",
            tipe === 'quotes' && "bg-purple-400",
          )} />
        </div>

        <CardContent className="relative p-4 md:p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center",
              "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-inner",
              currentAnnouncement.tipe === 'urgent' && "animate-pulse"
            )}>
              <Icon className={cn("w-6 h-6 md:w-7 md:h-7", config.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={cn("text-xs font-medium", config.badgeBg)} variant="secondary">
                  {tipeLabels[tipe] || 'Informasi'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(currentAnnouncement.tanggal_mulai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <h3 className="font-bold text-base md:text-lg text-foreground mb-1 line-clamp-1">
                {currentAnnouncement.judul}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
                {currentAnnouncement.isi}
              </p>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50"
                onClick={() => handleDismiss(currentAnnouncement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation dots & arrows */}
          {visibleAnnouncements.length > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrev}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden md:inline text-xs">Sebelumnya</span>
              </Button>

              <div className="flex items-center gap-1.5">
                {visibleAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      idx === currentIndex % visibleAnnouncements.length
                        ? cn("w-6", config.iconColor.replace('text-', 'bg-'))
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                className="h-8 px-2"
              >
                <span className="hidden md:inline text-xs">Berikutnya</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>

        {/* Megaphone decoration */}
        <div className="absolute -bottom-4 -left-4 opacity-5 pointer-events-none">
          <Megaphone className="w-24 h-24 md:w-32 md:h-32 rotate-12" />
        </div>
      </Card>
    </div>
  );
};

export default PemberitahuanSection;
