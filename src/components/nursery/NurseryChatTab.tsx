import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircle, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ChatMsg, ChatPane } from './ChatPane';
import { cardClass, inputClass } from './ui';

interface Thread { child_id: string; full_name: string; class_id: string | null; last_body: string | null; last_at: string | null; last_kind: string | null; unread: number }

export const useChatUnread = (tenantId: string | undefined, enabled: boolean): number => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!tenantId || !enabled) { setN(0); return; }
    let alive = true;
    const run = async () => {
      const { data } = await supabase.rpc('fn_staff_chat_threads', { p_tenant: tenantId });
      if (alive && Array.isArray(data)) setN((data as Thread[]).reduce((s, t) => s + (t.unread || 0), 0));
    };
    run();
    const t = window.setInterval(run, 30000);
    return () => { alive = false; window.clearInterval(t); };
  }, [tenantId, enabled]);
  return n;
};

export const NurseryChatTab: React.FC = () => {
  const { isRTL, activeTenant, showToast } = useApp();
  const { can, profile } = useAuth();
  const tx = (a: string, e: string) => (isRTL ? a : e);
  const tenantId = activeTenant?.id;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [q, setQ] = useState('');
  const Back = isRTL ? ArrowRight : ArrowLeft;

  const loadThreads = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.rpc('fn_staff_chat_threads', { p_tenant: tenantId });
    if (Array.isArray(data)) setThreads(data as Thread[]);
    setLoaded(true);
  }, [tenantId]);

  useEffect(() => {
    loadThreads();
    const t = window.setInterval(loadThreads, 15000);
    return () => window.clearInterval(t);
  }, [loadThreads]);

  const loadMessages = useCallback(async () => {
    if (!selected) return;
    const { data } = await supabase.rpc('fn_staff_chat_messages', { p_child: selected });
    if (Array.isArray(data)) {
      const list = (data as any[]).map((m) => ({ id: m.id, kind: m.kind, name: m.name, role: m.role, body: m.body, at: m.at }) as ChatMsg);
      setMessages((prev) => (prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id ? prev : list));
      await supabase.rpc('fn_staff_chat_mark_read', { p_child: selected });
    }
  }, [selected]);

  useEffect(() => {
    setMessages([]);
    if (!selected) return;
    loadMessages();
    const t = window.setInterval(loadMessages, 6000);
    return () => window.clearInterval(t);
  }, [selected, loadMessages]);

  const send = async (text: string) => {
    if (!selected) return;
    const { error } = await supabase.rpc('fn_staff_chat_send', { p_child: selected, p_body: text });
    if (error) {
      const m = error.message || '';
      showToast(m.includes('READ_ONLY') ? tx('الاشتراك منتهٍ، المحادثة للقراءة فقط', 'Subscription expired; chat is read-only') : m.includes('NOT_ALLOWED') ? tx('ليس لديك صلاحية الرد', 'You cannot reply') : tx('تعذّر إرسال الرسالة', 'Could not send'));
      throw error;
    }
    await loadMessages();
    await loadThreads();
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return threads.filter((t) => !needle || t.full_name.toLowerCase().includes(needle));
  }, [threads, q]);
  const current = threads.find((t) => t.child_id === selected);
  const myName = profile?.fullName || profile?.username || '';

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className={`${selected ? 'hidden lg:block' : ''} space-y-2`}>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx('ابحث باسم الطفل...', 'Search by child name...')} className={`${inputClass} ps-9`} />
        </div>
        <div className="max-h-[65vh] space-y-2 overflow-y-auto">
          {loaded && list.length === 0 && <p className="py-10 text-center text-xs text-slate-500">{tx('لا توجد محادثات متاحة لك', 'No chats available to you')}</p>}
          {list.map((t) => (
            <button key={t.child_id} onClick={() => setSelected(t.child_id)} className={`${cardClass} flex w-full items-center gap-3 text-start transition hover:border-slate-600 ${selected === t.child_id ? 'border-blue-500/60' : ''}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-300"><MessageCircle className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">{t.full_name}</span>
                <span className="block truncate text-[11px] text-slate-400">{t.last_body ? `${t.last_kind === 'staff' ? tx('أنت/الحضانة: ', 'Nursery: ') : ''}${t.last_body}` : tx('لا توجد رسائل', 'No messages')}</span>
              </span>
              {t.unread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{t.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className={`${selected ? '' : 'hidden lg:flex'} lg:col-span-2`}>
        {selected && current ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800 lg:hidden"><Back className="h-4 w-4" /></button>
              <p className="text-sm font-bold text-white">{current.full_name}</p>
              <span className="text-[11px] text-slate-500">{tx('محادثة مشتركة مع الأب والأم وولي الأمر', 'Shared with father, mother and guardian')}</span>
            </div>
            <ChatPane messages={messages} isMine={(m) => m.kind === 'staff' && m.name === myName} onSend={send} ar={isRTL} tone="dark" canSend={can('chat.reply')} heightClass="h-[62vh]" />
          </div>
        ) : (
          <p className="m-auto py-20 text-center text-xs text-slate-500">{tx('اختر طفلاً لعرض المحادثة', 'Select a child to open the chat')}</p>
        )}
      </div>
    </div>
  );
};
