import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { applyUpdate, currentBuildId, fetchLatestBuildId } from '../../lib/updateCheck';

const INTERVAL_MS = 60000;

export const UpdateBanner: React.FC = () => {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const found = useRef(false);
  const isAr = (document.documentElement.lang || 'ar') !== 'en';

  const check = useCallback(async () => {
    if (found.current) return;
    const mine = currentBuildId();
    if (!mine) return;
    const latest = await fetchLatestBuildId();
    if (latest && latest !== mine) {
      found.current = true;
      setAvailable(true);
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') check(); }, INTERVAL_MS);
    const onWake = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [check]);

  if (!available) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-[90] flex justify-center md:bottom-4" role="status">
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-blue-500/40 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur">
        <span className="min-w-0 text-xs font-semibold text-slate-100">{isAr ? 'في تحديث جديد للتطبيق' : 'A new version is available'}</span>
        <button
          disabled={busy}
          onClick={() => { setBusy(true); applyUpdate(); }}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
          {isAr ? 'إعادة التشغيل' : 'Restart'}
        </button>
      </div>
    </div>
  );
};
