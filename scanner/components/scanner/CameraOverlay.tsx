import React from 'react';
import { ScanLine, AlertTriangle } from 'lucide-react';

interface CameraOverlayProps {
  isScanning: boolean;
  scanError: string | null;
}

export function CameraOverlay({ isScanning, scanError }: CameraOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col pt-[15dvh] items-center text-white z-10">
      <div className="mb-8 text-center px-4">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Scan Code</h1>
        <p className="text-sm text-zinc-300 font-medium">Align QR or barcode within the frame</p>
      </div>

      {/* Target frame */}
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Corner Borders */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl"></div>

        {/* Animated Scanning Line — only visible while scanning */}
        {isScanning && (
          <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_15px_4px_rgba(255,255,255,0.4)] animate-scan-line"></div>
        )}
      </div>

      <div className="mt-8 text-center backdrop-blur-md bg-black/40 py-2 px-6 rounded-full border border-white/10 flex items-center gap-2">
        {scanError ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium tracking-wide text-red-300">{scanError}</span>
          </>
        ) : isScanning ? (
          <>
            <ScanLine className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium tracking-wide">Scanning…</span>
          </>
        ) : (
          <>
            <ScanLine className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium tracking-wide text-zinc-400">Starting camera…</span>
          </>
        )}
      </div>
    </div>
  );
}
