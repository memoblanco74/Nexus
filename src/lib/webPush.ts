import { supabase } from './supabaseClient';

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  typeof Notification !== 'undefined';

const urlBase64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const fetchPublicKey = async (): Promise<string | null> => {
  const { data, error } = await supabase.functions.invoke('send-push', { body: { action: 'public-key' } });
  if (error || !data?.publicKey) return null;
  return data.publicKey as string;
};

const saveSubscription = async (sub: PushSubscription) => {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return false;
  const { error } = await supabase.rpc('fn_save_push_subscription', {
    p_endpoint: json.endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
    p_ua: navigator.userAgent.slice(0, 200),
  });
  return !error;
};

export const subscribeToPush = async (): Promise<'ok' | 'unsupported' | 'denied' | 'failed'> => {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission !== 'granted') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = await fetchPublicKey();
      if (!key) return 'failed';
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    return (await saveSubscription(sub)) ? 'ok' : 'failed';
  } catch {
    return 'failed';
  }
};

export const unsubscribePush = async () => {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await supabase.rpc('fn_delete_push_subscription', { p_endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch {}
};
