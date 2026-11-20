import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ChatMsg, ChatPane, roleLabel } from '../nursery/ChatPane';

interface Identity { name: string; role: 'father' | 'mother' | 'guardian' }

const idKey = (token: string) => `nx_parent_identity_${token}`;
export const seenKey = (token: string) => `nx_parent_seen_${token}`;

const load = (token: string): Identity | null => {
  try {
    const raw = localStorage.getItem(idKey(token));
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
};

export const parseMsgs = (raw: any[]): ChatMsg[] => (raw || []).map((m) => ({ id: m.id, kind: m.kind, name: m.name, role: m.role, body: m.body, at: m.at }));

export const ParentChat: React.FC<{ token: string; ar: boolean; onSeen: () => void }> = ({ token, ar, onSeen }) => {
  const tx = (a: string, e: string) => (ar ? a : e);
  const [identity, setIdentity] = useState<Identity | null>(() => load(token));
  const [names, setNames] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('fn_parent_chat_list', { p_token: token });
    if (Array.isArray(data)) {
      const list = parseMsgs(data);
      setMessages((prev) => (prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id ? prev : list));
      const lastStaff = [...list].reverse().find((m) => m.kind === 'staff');
      try { if (lastStaff) localStorage.setItem(seenKey(token), lastStaff.at); } catch { /* ignore */ }
      onSeen();
    }
  }, [token, onSeen]);

  useEffect(() => {
    supabase.rpc('fn_parent_chat_names', { p_token: token }).then(({ data }) => {
      if (data && typeof data === 'object') setNames(data as Record<string, string>);
    });
  }, [token]);

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 6000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const pickRole = (r: Identity['role']) => {
    const id: Identity = { name: (names[r] || '').trim(), role: r };
    try { localStorage.setItem(idKey(token), JSON.stringify(id)); } catch { /* ignore */ }
    setIdentity(id);
    setError('');
  };

  const send = async (text: string) => {
    if (!identity) return;
    const { error: err } = await supabase.rpc('fn_parent_chat_send', { p_token: token, p_name: identity.name, p_role: identity.role, p_body: text });
    if (err) {
      const m = err.message || '';
      setError(m.includes('READ_ONLY') ? tx('اشتراك الحضانة منتهٍ، لا يمكن إرسال رسائل الآن.', 'The nursery subscription has expired; messaging is unavailable.') : m.includes('RATE_LIMIT') ? tx('أرسلت رسائل كثيرة، انتظر قليلاً.', 'Too many messages, please wait a moment.') : tx('تعذّر إرسال الرسالة.', 'Could not send the message.'));
      throw err;
    }
    setError('');
    await refresh();
  };

  if (!identity) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-extrabold text-slate-800">{tx('محادثة مع الحضانة', 'Chat with the nursery')}</p>
        <p className="text-xs leading-relaxed text-slate-500">{tx('هذه المحادثة مشتركة بين الأب والأم وولي الأمر، ويراها العاملون المسؤولون عن الطفل. اختر صفتك لتظهر رسائلك باسمك المسجّل لدى الحضانة.', 'This chat is shared by the father, mother and guardian, and seen by the staff responsible for the child. Choose who you are; your registered name will be used.')}</p>
        <div className="flex gap-2">
          {(['father', 'mother', 'guardian'] as const).map((r) => (
            <button key={r} onClick={() => pickRole(r)} className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 active:bg-indigo-600 active:text-white">{roleLabel(r, ar)}{names[r] ? <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{names[r]}</span> : null}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ChatPane messages={messages} isMine={(m) => m.kind === 'parent' && m.role === identity.role} onSend={send} ar={ar} tone="light" heightClass="h-[62vh]" />
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
};
