import { useRef, useState, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export type ScanResult = {
  data: string;
  format: string;
  timestamp: number;
};

interface UseScannerOptions {
  onScan?: (data: string) => void;
}

export function useScanner(options: UseScannerOptions = {}) {
  const onScanRef = useRef(options.onScan);
  useEffect(() => { onScanRef.current = options.onScan; }, [options.onScan]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  // Incremented every time a camera session should be cancelled (StrictMode, facingMode change, unmount)
  const generationRef = useRef(0);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    // Clear srcObject so the video element releases the stream ZXing acquired
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setFlashlightOn(false);
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    // Wait up to 500ms for the video element to appear in the DOM
    // (it renders only after hasPermission becomes true)
    if (!videoRef.current) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1));
      if (!videoRef.current) return;
    }
    setScanError(null);

    const gen = ++generationRef.current;

    try {
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      // Scan every frame (default is 500ms delay between attempts)
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 0 });

      // Pick the best matching device for the requested facing mode
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (gen !== generationRef.current) return;

      if (devices.length === 0) {
        setScanError('No camera found');
        return;
      }

      const preferred =
        mode === 'environment'
          ? (devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[devices.length - 1])
          : (devices.find((d) => /front|user|face/i.test(d.label)) ?? devices[0]);

      let frameCount = 0;
      const controls = await reader.decodeFromVideoDevice(
        preferred.deviceId,
        videoRef.current,
        (result, error) => {
          if (gen !== generationRef.current) return;
          frameCount++;
          if (frameCount === 1 || frameCount % 60 === 0) {
            
          }
          if (result) {
            const data = result.getText();
            const format = BarcodeFormat[result.getBarcodeFormat()] ?? 'UNKNOWN';
            setLastResult({ data, format, timestamp: Date.now() });
            onScanRef.current?.(data);
            navigator.vibrate?.(200);
          }
          if (error && !/NotFoundException|notfound/i.test(error.name)) {
            console.warn('[useScanner] Decode error:', error);
          }
        }
      );

      if (gen !== generationRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
      setIsScanning(true);
    } catch (err) {
      if (gen !== generationRef.current) return;
      const msg = err instanceof Error ? err.message : 'Camera error';
      console.error('[useScanner] startCamera error:', msg, err);
      if (/permission|denied|notallowed/i.test(msg)) {
        setHasPermission(false);
      } else {
        setScanError(msg);
      }
    }
  }, []);

  useEffect(() => {
    if (hasPermission !== true) return;
    // Defer so no setState fires synchronously in the effect body
    console.log('[useScanner] useEffect: starting camera, hasPermission=', hasPermission, 'facingMode=', facingMode);
    const id = setTimeout(() => { void startCamera(facingMode); }, 0);
    return () => {
      clearTimeout(id);
      console.log('[useScanner] useEffect cleanup: stopping camera, gen=', generationRef.current);
      // Invalidate any in-flight startCamera before stopping
      generationRef.current++;
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, facingMode]);

  const requestPermission = useCallback(() => {
    // Don't pre-acquire and stop a stream — let decodeFromVideoDevice trigger
    // the browser permission dialog directly (avoids double-getUserMedia on mobile)
    setScanError(null);
    setHasPermission(true);
  }, []);

  const toggleFlashlight = useCallback(async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !flashlightOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setFlashlightOn(next);
    } catch {
      // Torch not supported — silently ignore
    }
  }, [flashlightOn]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  const scanFromImage = useCallback(async (file: File) => {
    setScanError(null);
    const url = URL.createObjectURL(file);
    try {
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });
      const result = await reader.decodeFromImageElement(img);
      const data = result.getText();
      const format = BarcodeFormat[result.getBarcodeFormat()] ?? 'UNKNOWN';
      setLastResult({ data, format, timestamp: Date.now() });
      onScanRef.current?.(data);
      navigator.vibrate?.(200);
    } catch {
      setScanError('No code found in image');
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  return {
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
  };
}
