import React from 'react';
import { Camera, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionRequestProps {
  onGrant: () => void;
  hasPermission: boolean | null;
}

export function PermissionRequest({ onGrant, hasPermission }: PermissionRequestProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-950 px-6 text-center">
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
        <Camera className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Camera Access Required</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">
        To scan QR codes and barcodes, we need access to your device's camera. Your camera is only used for scanning.
      </p>

      {hasPermission === false && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-3 mb-8 text-left max-w-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">Camera access was denied. Please enable it in your browser settings to continue.</p>
        </div>
      )}

      <Button size="lg" onClick={onGrant} className="w-full max-w-xs font-semibold">
        Allow Camera Access
      </Button>
    </div>
  );
}
