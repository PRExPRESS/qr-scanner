import React from 'react';
import { ScanResult } from '@/hooks/useScanner';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Share2, CheckCircle2, QrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ScanResultDrawerProps {
  result: ScanResult | null;
  onClose: () => void;
}

export function ScanResultDrawer({ result, onClose }: ScanResultDrawerProps) {
  const isUrl = result?.data.startsWith('http://') || result?.data.startsWith('https://');

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.data);
      // We could add a toast here. For now it's simple.
    }
  };

  const handleShare = () => {
    if (result && navigator.share) {
      navigator.share({
        title: 'Scanned Result',
        text: result.data,
      }).catch(console.error);
    }
  };

  return (
    <Drawer open={!!result} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-zinc-950 border-zinc-800 text-zinc-50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <DrawerTitle className="text-xl">Scan Successful</DrawerTitle>
            <DrawerDescription className="text-zinc-400">
              {result?.format || 'Unknown Format'} Code detected
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pt-0">
            <Card className="bg-zinc-900 border-zinc-800 p-4 wrap-break-word flex items-start gap-3">
              <div className="mt-1">
                <QrCode className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-zinc-200 font-medium leading-relaxed">{result?.data}</p>
                <div className="text-xs text-zinc-500 mt-2 flex items-center gap-2">
                  <span>{result?.timestamp ? new Date(result.timestamp).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            </Card>
          </div>

          <DrawerFooter className="flex flex-row justify-between pt-2">
            <Button variant="outline" className="flex-1 bg-transparent border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            {isUrl && (
              <Button className="flex-1" onClick={() => result && window.open(result.data, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </Button>
            )}
            {!isUrl && (
              <Button className="flex-1" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
