export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-950 px-6 text-center">
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.111 8.111A6.003 6.003 0 003 12c0 1.657.672 3.157 1.757 4.243M12 12v.01M15.889 8.111A6.003 6.003 0 0121 12c0 1.657-.672 3.157-1.757 4.243M12 6a6 6 0 015.889 2.111" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Offline</h1>
      <p className="text-zinc-400 mb-8 max-w-sm text-sm">
        ScanIt needs a network connection for the camera and driver features. Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
