import React, { useState } from 'react';
import { Wifi, WifiOff, Loader2, Link2, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConnectionStatus } from '@/hooks/useSocketConnection';
import { cn } from '@/lib/utils';

interface ConnectionSetupProps {
  status: ConnectionStatus;
  serverUrl: string | null;
  error: string | null;
  onConnect: (url: string) => void;
  onDisconnect: () => void;
  setShowConnectionPanel: (show: boolean) => void;
}

export function ConnectionSetup({
  status,
  serverUrl,
  error,
  onConnect,
  onDisconnect,
  setShowConnectionPanel,
}: ConnectionSetupProps) {
  const [inputUrl, setInputUrl] = useState(serverUrl ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (trimmed) onConnect(trimmed);
    window.location.href = '/'; 
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-zinc-950 px-6 text-center">
      <button
        onClick={() => setShowConnectionPanel(false)}
        className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300',
          status === 'connected' ? 'bg-green-500/20' : 'bg-zinc-900'
        )}
      >
        {status === 'connecting' && (
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        )}
        {status === 'connected' && (
          <Wifi className="w-10 h-10 text-green-400" />
        )}
        {(status === 'idle' || status === 'disconnected') && (
          <WifiOff className="w-10 h-10 text-zinc-400" />
        )}
        {status === 'error' && (
          <ShieldAlert className="w-10 h-10 text-red-400" />
        )}
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        {status === 'connected' ? 'Connected' : 'Connect to Driver'}
      </h1>

      <p className="text-zinc-400 mb-8 max-w-sm text-sm">
        {status === 'connected'
          ? `Linked to ${serverUrl}`
          : 'Enter the ngrok URL for the driver (e.g. https://xxxx.ngrok-free.app). Start the driver with npm run dev, then expose it with ngrok http 3001.'}
      </p>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-3 mb-6 text-left max-w-sm w-full">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Connection failed</p>
            <p className="text-red-300/80">{error}</p>
            {error.toLowerCase().includes('cert') && (
              <p className="mt-2 text-zinc-400">
                If using a self-signed certificate, open{' '}
                <span className="text-primary font-mono">{serverUrl}</span> in
                your browser and accept the security warning first.
              </p>
            )}
          </div>
        </div>
      )}

      {status !== 'connected' ? (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://192.168.x.x:3000"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-primary rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={status === 'connecting' || !inputUrl.trim()}
            className="w-full font-semibold"
          >
            {status === 'connecting' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting…
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </form>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          <Card className="bg-zinc-900 border-zinc-800 p-3 text-left flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-zinc-300 text-sm truncate">{serverUrl}</span>
          </Card>
          <Button
            variant="outline"
            size="lg"
            onClick={onDisconnect}
            className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
}
