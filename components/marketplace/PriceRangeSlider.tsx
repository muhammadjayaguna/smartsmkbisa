"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

const PriceRangeSlider = ({ min, max, valueMin, valueMax, onChange }: PriceRangeSliderProps) => {
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);
  const trackRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalMin(valueMin);
    setLocalMax(valueMax);
  }, [valueMin, valueMax]);

  const emitChange = useCallback((newMin: number, newMax: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(newMin, newMax), 300);
  }, [onChange]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - 1000);
    setLocalMin(val);
    emitChange(val, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + 1000);
    setLocalMax(val);
    emitChange(localMin, val);
  };

  const leftPct = ((localMin - min) / (max - min)) * 100;
  const rightPct = ((localMax - min) / (max - min)) * 100;

  const formatPrice = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
    if (v >= 1000) return `${Math.round(v / 1000)}rb`;
    return String(v);
  };

  return (
    <div className="space-y-3">
      {/* Labels */}
      <div className="flex justify-between text-xs font-medium text-foreground">
        <span>Rp{localMin.toLocaleString('id-ID')}</span>
        <span>Rp{localMax.toLocaleString('id-ID')}</span>
      </div>

      {/* Slider track */}
      <div ref={trackRef} className="relative h-1.5 rounded-full bg-border">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={localMin}
          onChange={handleMinChange}
          className="price-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{ zIndex: localMin > max - 10000 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={localMax}
          onChange={handleMaxChange}
          className="price-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Rp{formatPrice(min)}</span>
        <span>Rp{formatPrice(max)}</span>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
