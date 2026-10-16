let pending: { kind: string; id: string } | null = null;
const EVT = 'nexus:pending-open';

export const requestOpen = (kind: string, id: string) => {
  pending = { kind, id };
  window.dispatchEvent(new Event(EVT));
};

export const takePending = (kind: string): string | null => {
  if (pending && pending.kind === kind) {
    const id = pending.id;
    pending = null;
    return id;
  }
  return null;
};

export const onPending = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};
