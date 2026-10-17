import { supabase } from './supabaseClient';

const QUEUE_KEY = 'nexus_outbox_logs';
const EVT = 'nexus:outbox';

type Payload = Record<string, any> & { tenant_id: string; child_id: string; day: string };

const readQueue = (): Payload[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as Payload[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (q: Payload[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
};

export const isNetworkError = (e: { message?: string } | null | undefined) => {
  if (!e) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const m = (e.message || '').toLowerCase();
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed') || m.includes('network request failed') || m.includes('fetch');
};

export const pendingLogs = (tenantId?: string, day?: string) =>
  readQueue().filter((p) => (!tenantId || p.tenant_id === tenantId) && (!day || p.day === day));

export const pendingCount = () => readQueue().length;

export const onOutboxChange = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};

const enqueue = (payload: Payload) => {
  const q = readQueue();
  const i = q.findIndex((p) => p.child_id === payload.child_id && p.day === payload.day);
  if (i >= 0) q[i] = { ...q[i], ...payload };
  else q.push(payload);
  writeQueue(q);
};

export const upsertLogOfflineAware = async (payload: Payload): Promise<{ ok: boolean; queued: boolean; error?: string }> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    enqueue(payload);
    return { ok: true, queued: true };
  }
  const { error } = await supabase.from('nursery_daily_logs').upsert(payload, { onConflict: 'child_id,day' });
  if (!error) return { ok: true, queued: false };
  if (isNetworkError(error)) {
    enqueue(payload);
    return { ok: true, queued: true };
  }
  return { ok: false, queued: false, error: error.message };
};

let flushing = false;

export const flushOutbox = async (): Promise<number> => {
  if (flushing || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const item of readQueue()) {
      const { error } = await supabase.from('nursery_daily_logs').upsert(item, { onConflict: 'child_id,day' });
      if (error && isNetworkError(error)) break;
      const rest = readQueue().filter((p) => !(p.child_id === item.child_id && p.day === item.day));
      writeQueue(rest);
      if (!error) sent += 1;
    }
  } finally {
    flushing = false;
  }
  return sent;
};

export const cacheSet = (key: string, value: unknown) => {
  try {
    localStorage.setItem(`nexus_cache_${key}`, JSON.stringify(value));
  } catch { /* ignore */ }
};

export const cacheGet = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(`nexus_cache_${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
