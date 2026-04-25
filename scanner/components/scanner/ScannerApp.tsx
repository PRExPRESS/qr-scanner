import React, { useState, useRef } from 'react';
import { PermissionRequest } from './PermissionRequest';
import { useScanner } from '@/hooks/useScanner';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { CameraOverlay } from './CameraOverlay';
import { CameraControls } from './CameraControls';
import { ScanResultDrawer } from './ScanResultDrawer';
import { ConnectionSetup } from './ConnectionSetup';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScannerApp() {
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const socket = useSocketConnection();

  const {
    videoRef,
    hasPermission,
    isScanning,
    flashlightOn,
    facingMode,
    lastResult,
    scanError,
    requestPermission,
    toggleFlashlight,
    toggleCamera,
    clearResult,
    scanFromImage,
  } = useScanner({
    onScan: (data) => socket.emit('scan_data', data),
  });

  if (hasPermission === null || hasPermission === false) {
    return (
      <PermissionRequest
        onGrant={requestPermission}
        hasPermission={hasPermission}
      />
    );
  }

  if (showConnectionPanel) {
    return (
      <ConnectionSetup
        status={socket.status}
        serverUrl={socket.serverUrl}
        error={socket.error}
        onConnect={(url) => {
          socket.connect(url);
        }}
        onDisconnect={() => {
          socket.disconnect();
          setShowConnectionPanel(false);
        }}
      />
    );
  }

  return (
    <div className="relative h-dvh w-full bg-black overflow-hidden flex flex-col">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />

      {/* Dark vignette overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

      {/* Connection status badge — top-right */}
      <button
        onClick={() => setShowConnectionPanel(true)}
        className={cn(
          'absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all active:scale-95',
          socket.status === 'connected'
            ? 'bg-green-500/20 border-green-500/30 text-green-300'
            : socket.status === 'connecting'
            ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
            : socket.status === 'error' || socket.status === 'disconnected'
            ? 'bg-red-500/20 border-red-500/30 text-red-300'
            : 'bg-black/50 border-white/10 text-zinc-400'
        )}
      >
        {socket.status === 'connecting' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : socket.status === 'connected' ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {socket.status === 'connected'
          ? 'Connected'
          : socket.status === 'connecting'
          ? 'Connecting…'
          : socket.status === 'error'
          ? 'Error'
          : socket.status === 'disconnected'
          ? 'Reconnecting'
          : 'Not connected'}
      </button>

      {/* Hidden file input for gallery scanning */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void scanFromImage(file);
          e.target.value = '';
        }}
      />

      <CameraOverlay isScanning={isScanning} scanError={scanError} />

      <CameraControls
        flashlightOn={flashlightOn}
        facingMode={facingMode}
        onToggleFlashlight={toggleFlashlight}
        onToggleCamera={toggleCamera}
        onPickImage={() => fileInputRef.current?.click()}
      />

      <ScanResultDrawer
        result={lastResult}
        onClose={clearResult}
      />
    </div>
  );
}


