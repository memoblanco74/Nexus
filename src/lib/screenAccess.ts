import type { ScreenId } from '../types';

const BASE: Record<string, ScreenId[]> = {
  super_admin: ['super_admin', 'catalog', 'platform', 'settings'],
  founder: ['founder', 'projects', 'patients', 'bookings', 'inventory', 'accounting', 'reports', 'assistants', 'settings', 'support'],
  assistant: ['assistant', 'patients', 'bookings', 'inventory', 'settings'],
};

const NURSERY: Record<string, ScreenId[]> = {
  founder: ['founder', 'patients', 'bookings', 'accounting', 'assistants', 'settings', 'support'],
  assistant: ['assistant', 'patients', 'bookings', 'accounting', 'settings'],
};

export const screensFor = (role: string | undefined, systemKey: string): ScreenId[] => {
  if (!role) return [];
  if (systemKey === 'nursery' && NURSERY[role]) return NURSERY[role];
  return BASE[role] || [];
};

export const NURSERY_SCREENS: ScreenId[] = ['founder', 'assistant', 'patients', 'bookings', 'accounting'];
