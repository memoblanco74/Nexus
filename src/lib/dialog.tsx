import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

type Req =
  | { kind: 'confirm'; title?: string; message: string; danger?: boolean; confirmText?: string; cancelText?: string; resolve: (v: boolean) => void }
  | { kind: 'prompt'; title?: string; message: string; defaultValue?: string; inputMode?: 'text' | 'numeric' | 'decimal'; confirmText?: string; cancelText?: string; resolve: (v: string | null) => void };

let push: ((r: Req) => void) | null = null;

const isAr = () => (document.documentElement.lang || 'ar').startsWith('ar');

export const askConfirm = (o: { title?: string; message: string; danger?: boolean; confirmText?: string; cancelText?: string }) =>
  new Promise<boolean>((resolve) => {
    if (!push) return resolve(window.confirm(o.message));
    push({ kind: 'confirm', ...o, resolve });
  });

export const askPrompt = (o: { title?: string; message: string; defaultValue?: string; inputMode?: 'text' | 'numeric' | 'decimal'; confirmText?: string; cancelText?: string }) =>
  new Promise<string | null>((resolve) => {
    if (!push) return resolve(window.prompt(o.message, o.defaultValue));
    push({ kind: 'prompt', ...o, resolve });
  });

export const DialogHost: React.FC = () => {
  const [queue, setQueue] = useState<Req[]>([]);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cur = queue[0];

  useEffect(() => {
    push = (r) => setQueue((q) => [...q, r]);
    return () => { push = null; };
  }, []);

  useEffect(() => {
    if (cur?.kind === 'prompt') {
      setValue(cur.defaultValue ?? '');
      setTimeout(() => inputRef.current?.select(), 30);
    }
  }, [cur]);

  if (!cur) return null;
  const ar = isAr();
  const done = (ok: boolean) => {
    if (cur.kind === 'confirm') cur.resolve(ok);
    else cur.resolve(ok ? value.trim() : null);
    setQueue((q) => q.slice(1));
  };
  const danger = cur.kind === 'confirm' && cur.danger;
  const title = cur.title || (danger ? (ar ? 'تأكيد الحذف' : 'Confirm deletion') : cur.kind === 'prompt' ? (ar ? 'إدخال قيمة' : 'Enter a value') : (ar ? 'تأكيد' : 'Confirm'));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => done(false)} dir={ar ? 'rtl' : 'ltr'}>
      <div
        className={`w-full max-w-sm space-y-4 rounded-2xl border bg-slate-950 p-5 shadow-2xl ${danger ? 'border-red-500/40' : 'border-blue-500/40'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') done(false); }}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>
            {danger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-white">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{cur.message}</p>
          </div>
          <button onClick={() => done(false)} className="rounded p-1 text-slate-500 hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        {cur.kind === 'prompt' && (
          <input
            ref={inputRef}
            autoFocus
            inputMode={cur.inputMode}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') done(true); }}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
        )}
        <div className="flex gap-2">
          <button onClick={() => done(true)} className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {cur.confirmText || (danger ? (ar ? 'حذف' : 'Delete') : (ar ? 'تأكيد' : 'Confirm'))}
          </button>
          <button onClick={() => done(false)} className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800">
            {cur.cancelText || (ar ? 'إلغاء' : 'Cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
