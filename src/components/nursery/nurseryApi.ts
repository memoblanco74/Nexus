import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface Child {
  id: string;
  tenant_id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  father_name: string | null;
  father_phone: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_phone: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
}

export interface FeeItem {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string | null;
  category: 'tuition' | 'potty' | 'transport' | 'activity' | 'other';
  price: number;
  active: boolean;
}

export interface ChildFee {
  id: string;
  child_id: string;
  fee_item_id: string;
  price_override: number | null;
}

export interface Vaccination {
  id: string;
  child_id: string;
  vaccine_name: string;
  given_on: string | null;
  note: string | null;
}

export interface Payment {
  id: string;
  child_id: string;
  period: string;
  amount: number;
  paid_on: string;
  method: string | null;
  note: string | null;
}

export interface MealEntry {
  type: 'breakfast' | 'lunch' | 'snack';
  times: number;
  note: string;
}
export interface DiaperEntry {
  time: string;
  kind: 'wet' | 'dirty' | 'both';
}
export interface MedicineEntry {
  name: string;
  reason: string;
  time: string;
}
export interface NapEntry {
  from: string;
  to: string;
}
export interface ClothesEntry {
  time: string;
  note: string;
}

export interface DailyLog {
  id?: string;
  child_id: string;
  day: string;
  status: 'present' | 'absent';
  absence_reason: string;
  arrival_time: string;
  departure_time: string;
  received_by: string;
  departure_mode: 'pickup' | 'transport' | '';
  transport_supervisor: string;
  delivered_to: string;
  delivered_time: string;
  used_transport: boolean;
  supplies_brought: boolean;
  supplies_note: string;
  meals: MealEntry[];
  diapers: DiaperEntry[];
  medicines: MedicineEntry[];
  naps: NapEntry[];
  clothes: ClothesEntry[];
  daily_activities: string;
  break_time: string;
  fun_day: string;
  teacher_comment: string;
}

export const cairoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
export const monthOf = (day: string) => day.slice(0, 7);

export const emptyLog = (childId: string, day: string): DailyLog => ({
  child_id: childId,
  day,
  status: 'present',
  absence_reason: '',
  arrival_time: '',
  departure_time: '',
  received_by: '',
  departure_mode: '',
  transport_supervisor: '',
  delivered_to: '',
  delivered_time: '',
  used_transport: false,
  supplies_brought: false,
  supplies_note: '',
  meals: [],
  diapers: [],
  medicines: [],
  naps: [],
  clothes: [],
  daily_activities: '',
  break_time: '',
  fun_day: '',
  teacher_comment: '',
});

export const rowToLog = (row: any): DailyLog => ({
  ...emptyLog(row.child_id, row.day),
  id: row.id,
  status: row.status,
  absence_reason: row.absence_reason || '',
  arrival_time: row.arrival_time || '',
  departure_time: row.departure_time || '',
  received_by: row.received_by || '',
  departure_mode: row.departure_mode || '',
  transport_supervisor: row.transport_supervisor || '',
  delivered_to: row.delivered_to || '',
  delivered_time: row.delivered_time || '',
  used_transport: !!row.used_transport,
  supplies_brought: !!row.supplies_brought,
  supplies_note: row.supplies_note || '',
  meals: row.meals || [],
  diapers: row.diapers || [],
  medicines: row.medicines || [],
  naps: row.naps || [],
  clothes: row.clothes || [],
  daily_activities: row.daily_activities || '',
  break_time: row.break_time || '',
  fun_day: row.fun_day || '',
  teacher_comment: row.teacher_comment || '',
});

export const ageLabel = (birth: string | null, ar: boolean) => {
  if (!birth) return '';
  const b = new Date(birth);
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (ar) {
    if (y === 0) return `${m} شهر`;
    return m ? `${y} سنة و${m} شهر` : `${y} سنة`;
  }
  if (y === 0) return `${m} mo`;
  return m ? `${y}y ${m}m` : `${y}y`;
};

const KNOWN_FEES: Array<[string, string]> = [
  ['فول تايم', 'Full time'], ['بارت تايم', 'Part time'], ['بوتي تريننج', 'Potty training'],
  ['ترانسبورتيشن', 'Transportation'], ['أكتيفيتي', 'Activities'], ['مواصلات', 'Transportation'], ['أنشطة', 'Activities'],
];
const hasArabic = (v: string) => /[\u0600-\u06FF]/.test(v);
const norm = (v: string) => v.trim().toLowerCase();
export const feeName = (f: FeeItem, ar: boolean) => {
  const a = (f.name_ar || '').trim();
  const e = (f.name || '').trim();
  if (ar) {
    if (a) return a;
    if (e && hasArabic(e)) return e;
    const k = KNOWN_FEES.find(([, en]) => norm(en) === norm(e));
    return k ? k[0] : e;
  }
  if (e && !hasArabic(e)) return e;
  const src = a || e;
  const k = KNOWN_FEES.find(([arName]) => arName === src);
  return k ? k[1] : src;
};

export const phoneForWhatsApp = (raw: string | null | undefined) => {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '20' + d.slice(1);
  return d;
};

export const childDue = (childId: string, childFees: ChildFee[], items: FeeItem[]) => {
  const byId = new Map(items.map((i) => [i.id, i]));
  return childFees
    .filter((cf) => cf.child_id === childId)
    .reduce((sum, cf) => {
      const item = byId.get(cf.fee_item_id);
      if (!item || !item.active) return sum;
      return sum + Number(cf.price_override ?? item.price);
    }, 0);
};

export const useNurseryCore = (tenantId: string | undefined) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [childFees, setChildFees] = useState<ChildFee[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    const [c, f, cf, v, p] = await Promise.all([
      supabase.from('nursery_children').select('*').eq('tenant_id', tenantId).order('full_name'),
      supabase.from('nursery_fee_items').select('*').eq('tenant_id', tenantId).order('created_at'),
      supabase.from('nursery_child_fees').select('id, child_id, fee_item_id, price_override').eq('tenant_id', tenantId),
      supabase.from('nursery_vaccinations').select('id, child_id, vaccine_name, given_on, note').eq('tenant_id', tenantId),
      supabase.from('nursery_payments').select('id, child_id, period, amount, paid_on, method, note').eq('tenant_id', tenantId),
    ]);
    setChildren((c.data as Child[]) || []);
    setFeeItems(((f.data as any[]) || []).map((x) => ({ ...x, price: Number(x.price) })));
    setChildFees(((cf.data as any[]) || []).map((x) => ({ ...x, price_override: x.price_override === null ? null : Number(x.price_override) })));
    setVaccinations((v.data as Vaccination[]) || []);
    setPayments(((p.data as any[]) || []).map((x) => ({ ...x, amount: Number(x.amount) })));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { children, feeItems, childFees, vaccinations, payments, loading, reload };
};

export type NurseryCore = ReturnType<typeof useNurseryCore>;
