'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const BackgroundMusic = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element
        const audio = new Audio('/audio/Tulus - Monokrom - [musicmu1.blogspot.co.id].mp3');
        audio.loop = true;
        audio.volume = 0.4; // Set a moderate volume
        audioRef.current = audio;

        // Cleanup on unmount
        return () => {
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Play audio - this will work after first user interaction
            audioRef.current.play().catch(error => {
                console.error("Audio playback failed:", error);
            });
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="fixed bottom-20 left-4 z-[60] md:bottom-6 md:left-6">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={togglePlay}
                            className={cn(
                                "w-12 h-12 rounded-full border-2 shadow-lg transition-all duration-300",
                                "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md",
                                isPlaying ? "border-green-500 text-green-600 animate-pulse" : "border-slate-300 text-slate-500",
                                "hover:scale-110 active:scale-95"
                            )}
                        >
                            {isPlaying ? (
                                <Volume2 className="w-6 h-6" />
                            ) : (
                                <VolumeX className="w-6 h-6" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{isPlaying ? 'Matikan Musik' : 'Putar Musik Latar'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export default BackgroundMusic;
