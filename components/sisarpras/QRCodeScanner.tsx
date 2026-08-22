'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: any) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [scannerId] = useState(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    // We add a small delay to ensure DOM is ready and to prevent double init in React Strict Mode
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          scannerId,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true
          },
          false
        );

        scanner.render(
          (text) => {
            scanner.clear();
            onScanSuccess(text);
          },
          (error) => {
            if (onScanError) onScanError(error);
          }
        );

        return () => {
          scanner.clear().catch(e => console.error("Failed to clear scanner", e));
        };
      } catch (err) {
        console.error("Scanner init error", err);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [onScanSuccess, onScanError, scannerId]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-slate-200">
      <div id={scannerId} className="w-full min-h-[300px] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    </div>
  );
};

export default QRCodeScanner;
