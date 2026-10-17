import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { flushOutbox, onOutboxChange, pendingCount } from '../../lib/offlineQueue';

export const OfflineBanner: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [pending, setPending] = useState(pendingCount());

  useEffect(() => {
    const up = async () => {
      setOnline(true);
      const n = await flushOutbox();
      if (n > 0) showToast(isRTL ? `تمت مزامنة ${n} تعديل` : `${n} change(s) synced`);
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    const off = onOutboxChange(() => setPending(pendingCount()));
    const timer = setInterval(() => { if (pendingCount() > 0) flushOutbox(); }, 30000);
    if (pendingCount() > 0) flushOutbox();
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      off();
      clearInterval(timer);
    };
  }, [isRTL]);

  if (online && pending === 0) return null;
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-1.5 text-[11px] font-bold ${online ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
      <span className="flex items-center gap-2">
        {online ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudOff className="h-3.5 w-3.5" />}
        {online
          ? (isRTL ? `جاري مزامنة ${pending} تعديل...` : `Syncing ${pending} change(s)...`)
          : (isRTL ? `غير متصل بالإنترنت — التعديلات هتتحفظ على الجهاز وتتزامن لما النت يرجع${pending ? ` (${pending} معلّق)` : ''}` : `Offline — changes are saved on this device and will sync later${pending ? ` (${pending} pending)` : ''}`)}
      </span>
      {online && pending > 0 && <button onClick={() => flushOutbox()} className="rounded bg-white/20 px-2 py-0.5">{isRTL ? 'مزامنة الآن' : 'Sync now'}</button>}
    </div>
  );
};
