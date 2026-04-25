"use client";

import { ScannerApp } from "@/components/scanner/ScannerApp";

export default function Home() {
  return (
    <main className="w-full min-h-dvh bg-black m-0 p-0 overflow-hidden text-neutral-50 selection:bg-none">
      <ScannerApp />
    </main>
  );
}
