import React from 'react';
import { Flashlight, FlashlightOff, ImageIcon, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraControlsProps {
  flashlightOn: boolean;
  facingMode: 'environment' | 'user';
  onToggleFlashlight: () => void | Promise<void>;
  onToggleCamera: () => void;
  onPickImage: () => void;
}

export function CameraControls({ flashlightOn, facingMode, onToggleFlashlight, onToggleCamera, onPickImage }: CameraControlsProps) {
  return (
    <div className="absolute lg:bottom-12 bottom-8 left-0 w-full flex justify-center items-center gap-8 z-20 px-6">
      <Button
        variant="secondary"
        size="icon"
        className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
        onClick={() => void onToggleFlashlight()}
      >
        {flashlightOn ? (
          <Flashlight className="w-6 h-6 text-yellow-400" />
        ) : (
          <FlashlightOff className="w-6 h-6" />
        )}
      </Button>

      <Button
        variant="default"
        size="icon"
        className="w-16 h-16 rounded-full bg-primary/90 hover:bg-primary shadow-[0_0_20px_rgba(255,255,255,0.15)] text-primary-foreground border-4 border-black/20 transition-all active:scale-95 group"
        onClick={onPickImage}
      >
        <ImageIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
        onClick={onToggleCamera}
      >
        <SwitchCamera className={cn('w-6 h-6 transition-transform', facingMode === 'user' ? 'rotate-180' : '')} />
      </Button>
    </div>
  );
}

