const BASE = import.meta.env.BASE_URL;

export const currentBuildId = (): string => (typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '');

export const fetchLatestBuildId = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${BASE}version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return typeof data.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
};

export const applyUpdate = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
  const url = new URL(window.location.href);
  url.searchParams.set('_v', Date.now().toString(36));
  window.location.replace(url.toString());
};
