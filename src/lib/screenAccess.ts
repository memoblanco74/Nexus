import type { ScreenId } from '../types';

const BASE: Record<string, ScreenId[]> = {
  super_admin: ['super_admin', 'catalog', 'platform', 'settings'],
  founder: ['founder', 'projects', 'patients', 'bookings', 'inventory', 'accounting', 'reports', 'project_settings', 'settings', 'support'],
  assistant: ['assistant', 'patients', 'bookings', 'inventory', 'settings'],
};

const NURSERY: Record<string, ScreenId[]> = {
  founder: ['founder', 'patients', 'bookings', 'accounting', 'project_settings', 'settings', 'support'],
  assistant: ['assistant', 'patients', 'bookings', 'accounting', 'settings'],
};

export const ASSISTANT_ALWAYS: ScreenId[] = ['assistant', 'settings'];

export const assistantOptions = (systemKey: string): ScreenId[] =>
  (systemKey === 'nursery' ? NURSERY.assistant : BASE.assistant).filter((s) => !ASSISTANT_ALWAYS.includes(s));

export const screensFor = (role: string | undefined, systemKey: string, allowed?: string[] | null): ScreenId[] => {
  if (!role) return [];
  const list = systemKey === 'nursery' && NURSERY[role] ? NURSERY[role] : BASE[role] || [];
  if (role === 'assistant' && allowed) return list.filter((s) => ASSISTANT_ALWAYS.includes(s) || allowed.includes(s));
  return list;
};

export const NURSERY_SCREENS: ScreenId[] = ['founder', 'assistant', 'patients', 'bookings', 'accounting'];
