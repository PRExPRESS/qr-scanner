import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export interface SocketConnection {
  status: ConnectionStatus;
  serverUrl: string | null;
  error: string | null;
  connect: (url: string) => void;
  disconnect: () => void;
  emit: (event: string, data: unknown) => void;
}

export function useSocketConnection(): SocketConnection {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setStatus('idle');
    setServerUrl(null);
    setError(null);
  }, []);

  const connect = useCallback((url: string) => {
    // Clean up any previous socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setStatus('connecting');
    setServerUrl(url);
    setError(null);

    const socket = io(url, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
      // Required for self-signed certs in a PWA context —
      // the user must have accepted the cert in browser first.
      rejectUnauthorized: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      setStatus('error');
      setError(err.message);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        // Intentional disconnect — already handled by `disconnect()`
        return;
      }
      setStatus('disconnected');
    });
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Auto-connect from URL search param ?server=<url> on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get('server');

    // Defer so it runs after render, avoiding sync setState-in-effect warnings
    if (serverParam) {
      const id = setTimeout(() => connect(serverParam), 0);
      return () => clearTimeout(id);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Do NOT expose socketRef.current directly during render — callers use `emit`
  return { status, serverUrl, error, connect, disconnect, emit };
}
