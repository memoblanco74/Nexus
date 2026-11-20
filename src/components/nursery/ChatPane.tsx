import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

export interface ChatMsg {
  id: string;
  kind: 'parent' | 'staff';
  name: string;
  role: string;
  body: string;
  at: string;
}

const ROLE_AR: Record<string, string> = { father: 'الأب', mother: 'الأم', guardian: 'ولي الأمر', founder: 'الإدارة', staff: 'الحضانة' };
const ROLE_EN: Record<string, string> = { father: 'Father', mother: 'Mother', guardian: 'Guardian', founder: 'Management', staff: 'Nursery' };

export const roleLabel = (role: string, ar: boolean) => (ar ? ROLE_AR : ROLE_EN)[role] || role;

const timeOf = (iso: string, ar: boolean) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const t = d.toLocaleTimeString(ar ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? t : `${d.toLocaleDateString('en-GB')} ${t}`;
};

export const ChatPane: React.FC<{
  messages: ChatMsg[];
  isMine: (m: ChatMsg) => boolean;
  onSend: (text: string) => Promise<void>;
  ar: boolean;
  tone: 'light' | 'dark';
  canSend?: boolean;
  heightClass?: string;
}> = ({ messages, isMine, onSend, ar, tone, canSend = true, heightClass = 'h-[60vh]' }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const tx = (a: string, e: string) => (ar ? a : e);
  const light = tone === 'light';

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      await onSend(v);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex ${heightClass} flex-col overflow-hidden rounded-2xl ${light ? 'bg-white shadow-sm' : 'border border-slate-800 bg-slate-950/60'}`}>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className={`mt-10 text-center text-xs ${light ? 'text-slate-400' : 'text-slate-500'}`}>{tx('لا توجد رسائل بعد. ابدأ المحادثة.', 'No messages yet. Start the conversation.')}</p>}
        {messages.map((m) => {
          const mine = isMine(m);
          const bubble = mine
            ? light ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
            : m.kind === 'staff'
              ? light ? 'bg-emerald-50 text-slate-800' : 'bg-emerald-500/15 text-emerald-100'
              : light ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-100';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${bubble}`}>
                <p className={`mb-0.5 text-[10px] font-bold ${mine ? 'text-white/80' : light ? 'text-slate-500' : 'text-slate-400'}`}>
                  {m.name ? `${m.name} • ` : ''}{roleLabel(m.role, ar)}
                </p>
                <p className="whitespace-pre-wrap break-words text-xs leading-relaxed" dir="auto">{m.body}</p>
                <p className={`mt-1 text-[9px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>{timeOf(m.at, ar)}</p>
              </div>
            </div>
          );
        })}
      </div>
      {canSend ? (
        <form onSubmit={submit} className={`flex items-center gap-2 border-t p-2 ${light ? 'border-slate-100' : 'border-slate-800'}`}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            placeholder={tx('اكتب رسالتك...', 'Type your message...')}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none ${light ? 'border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500' : 'border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:border-blue-500'}`}
          />
          <button type="submit" disabled={busy || !text.trim()} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40 ${light ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className={`border-t p-3 text-center text-[11px] ${light ? 'border-slate-100 text-slate-400' : 'border-slate-800 text-slate-500'}`}>{tx('ليس لديك صلاحية الرد في هذه المحادثة.', 'You do not have permission to reply.')}</p>
      )}
    </div>
  );
};
