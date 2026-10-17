import React, { useEffect, useMemo, useState } from 'react';
import { onPending, takePending } from '../../lib/pendingOpen';
import { Baby, MessageCircle, Pencil, Plus, Search, Truck } from 'lucide-react';
import { AllergyAlert, BulkMessageModal, PortalCard, VaccineSchedule } from './NurseryExtras';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { SaveButton } from '../ui/SaveButton';
import { Badge, Field, Modal, cardClass, inputClass } from './ui';
import {
  Child,
  ageLabel,
  childDue,
  cairoToday,
  feeName,
  monthOf,
  NurseryCore,
} from './nurseryApi';

type ChildForm = Omit<Child, 'id' | 'tenant_id'>;

const blankForm: ChildForm = {
  full_name: '',
  birth_date: '',
  gender: '',
  address: '',
  father_name: '',
  father_phone: '',
  mother_name: '',
  mother_phone: '',
  guardian_name: '',
  guardian_relation: '',
  guardian_phone: '',
  notes: '',
  allergies: '',
  health_notes: '',
  status: 'active',
};

const toForm = (c: Child): ChildForm => ({
  full_name: c.full_name || '',
  birth_date: c.birth_date || '',
  gender: c.gender || '',
  address: c.address || '',
  father_name: c.father_name || '',
  father_phone: c.father_phone || '',
  mother_name: c.mother_name || '',
  mother_phone: c.mother_phone || '',
  guardian_name: c.guardian_name || '',
  guardian_relation: c.guardian_relation || '',
  guardian_phone: c.guardian_phone || '',
  notes: c.notes || '',
  allergies: c.allergies || '',
  health_notes: c.health_notes || '',
  status: c.status,
});

const ChildFormModal: React.FC<{ child: Child | null; onClose: () => void; onSaved: () => void }> = ({ child, onClose, onSaved }) => {
  const { isRTL, activeTenant, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const initial = useMemo(() => (child ? toForm(child) : blankForm), [child]);
  const [form, setForm] = useState<ChildForm>(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const set = (k: keyof ChildForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (): Promise<boolean> => {
    if (!form.full_name.trim()) {
      showToast(tx('اكتب اسم الطفل بالكامل', 'Enter the child full name'));
      return false;
    }
    const payload: any = {
      ...form,
      full_name: form.full_name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
    };
    const res = child
      ? await supabase.from('nursery_children').update(payload).eq('id', child.id)
      : await supabase.from('nursery_children').insert({ ...payload, tenant_id: activeTenant!.id });
    if (res.error) {
      showToast(res.error.message);
      return false;
    }
    setBaseline(JSON.stringify(form));
    onSaved();
    if (!child) onClose();
    return true;
  };

  return (
    <Modal
      wide
      title={child ? tx('تعديل بيانات الطفل', 'Edit child') : tx('إضافة طفل', 'Add child')}
      onClose={onClose}
      footer={<SaveButton signature={JSON.stringify(form)} baseline={child ? baseline : ''} onSave={save} label={tx('حفظ', 'Save')} className="px-5 py-2" />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={tx('الاسم الكامل للطفل', 'Full name')} className="sm:col-span-2">
          <input className={inputClass} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </Field>
        <Field label={tx('تاريخ الميلاد', 'Date of birth')}>
          <input type="date" className={inputClass} value={form.birth_date || ''} onChange={(e) => set('birth_date', e.target.value)} />
        </Field>
        <Field label={tx('النوع', 'Gender')}>
          <select className={inputClass} value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
            <option value="">—</option>
            <option value="male">{tx('ولد', 'Boy')}</option>
            <option value="female">{tx('بنت', 'Girl')}</option>
          </select>
        </Field>
        <Field label={tx('العنوان', 'Address')} className="sm:col-span-2">
          <input className={inputClass} value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label={tx('اسم الأب', 'Father name')}>
          <input className={inputClass} value={form.father_name || ''} onChange={(e) => set('father_name', e.target.value)} />
        </Field>
        <Field label={tx('موبايل الأب', 'Father phone')}>
          <input className={inputClass} inputMode="tel" value={form.father_phone || ''} onChange={(e) => set('father_phone', e.target.value)} />
        </Field>
        <Field label={tx('اسم الأم', 'Mother name')}>
          <input className={inputClass} value={form.mother_name || ''} onChange={(e) => set('mother_name', e.target.value)} />
        </Field>
        <Field label={tx('موبايل الأم', 'Mother phone')}>
          <input className={inputClass} inputMode="tel" value={form.mother_phone || ''} onChange={(e) => set('mother_phone', e.target.value)} />
        </Field>
        <Field label={tx('اسم ولي الأمر', 'Guardian name')}>
          <input className={inputClass} value={form.guardian_name || ''} onChange={(e) => set('guardian_name', e.target.value)} />
        </Field>
        <Field label={tx('صلة القرابة', 'Relation')}>
          <input className={inputClass} value={form.guardian_relation || ''} onChange={(e) => set('guardian_relation', e.target.value)} />
        </Field>
        <Field label={tx('موبايل ولي الأمر', 'Guardian phone')}>
          <input className={inputClass} inputMode="tel" value={form.guardian_phone || ''} onChange={(e) => set('guardian_phone', e.target.value)} />
        </Field>
        <Field label={tx('الحالة', 'Status')}>
          <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">{tx('مقيّد', 'Active')}</option>
            <option value="inactive">{tx('غير مقيّد', 'Inactive')}</option>
          </select>
        </Field>
        <Field label={tx('حساسية الأكل أو الأدوية', 'Food / medicine allergies')} className="sm:col-span-2">
          <input className={inputClass} value={form.allergies || ''} onChange={(e) => set('allergies', e.target.value)} placeholder={tx('مثال: حساسية بيض، لاكتوز', 'e.g. eggs, lactose')} />
        </Field>
        <Field label={tx('ملاحظات صحية (ربو، أنيميا، ...)', 'Health notes')} className="sm:col-span-2">
          <input className={inputClass} value={form.health_notes || ''} onChange={(e) => set('health_notes', e.target.value)} />
        </Field>
        <Field label={tx('ملاحظات عامة', 'General notes')} className="sm:col-span-2">
          <textarea rows={2} className={inputClass} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
};

const ChildDetailModal: React.FC<{ child: Child; core: NurseryCore; onClose: () => void }> = ({ child, core, onClose }) => {
  const { isRTL, showToast, money } = useApp();
  const { profile } = useAuth();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [vName, setVName] = useState('');
  const [vDate, setVDate] = useState(cairoToday());
  const [busy, setBusy] = useState(false);

  const vacc = core.vaccinations.filter((v) => v.child_id === child.id);
  const assigned = core.childFees.filter((cf) => cf.child_id === child.id);
  const items = core.feeItems.filter((i) => i.active);
  const period = monthOf(cairoToday());
  const due = childDue(child.id, core.childFees, core.feeItems);
  const paid = core.payments.filter((p) => p.child_id === child.id && p.period === period).reduce((s, p) => s + p.amount, 0);

  const run = async (fn: () => PromiseLike<{ error: any }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      showToast(error.message);
      return false;
    }
    await core.reload();
    return true;
  };

  const addVaccine = async () => {
    if (!vName.trim()) return;
    const ok = await run(() =>
      supabase.from('nursery_vaccinations').insert({ tenant_id: child.tenant_id, child_id: child.id, vaccine_name: vName.trim(), given_on: vDate || null })
    );
    if (ok) setVName('');
  };

  const toggleFee = async (itemId: string) => {
    const existing = assigned.find((a) => a.fee_item_id === itemId);
    if (existing) await run(() => supabase.from('nursery_child_fees').delete().eq('id', existing.id));
    else await run(() => supabase.from('nursery_child_fees').insert({ tenant_id: child.tenant_id, child_id: child.id, fee_item_id: itemId }));
  };

  const setOverride = async (cfId: string, value: string) => {
    const n = value.trim() === '' ? null : Number(value);
    if (n !== null && (!isFinite(n) || n < 0)) return;
    await run(() => supabase.from('nursery_child_fees').update({ price_override: n }).eq('id', cfId));
  };

  const parents = [
    [tx('الأب', 'Father'), child.father_name, child.father_phone],
    [tx('الأم', 'Mother'), child.mother_name, child.mother_phone],
    [child.guardian_relation ? `${tx('ولي الأمر', 'Guardian')} (${child.guardian_relation})` : tx('ولي الأمر', 'Guardian'), child.guardian_name, child.guardian_phone],
  ].filter((r) => r[1] || r[2]);

  return (
    <Modal wide title={child.full_name} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        {child.birth_date && <span>{ageLabel(child.birth_date, isRTL)}</span>}
        {child.address && <span>• {child.address}</span>}
        <Badge tone={vacc.length ? 'ok' : 'warn'}>{vacc.length ? tx('اتطعّم', 'Vaccinated') : tx('لم يُسجَّل تطعيم', 'No vaccination')}</Badge>
        <Badge tone={due === 0 ? 'muted' : paid >= due ? 'ok' : 'bad'}>
          {due === 0 ? tx('لا اشتراكات', 'No fees') : paid >= due ? tx('دافع هذا الشهر', 'Paid this month') : tx('لم يدفع هذا الشهر', 'Unpaid this month')}
        </Badge>
      </div>
      <AllergyAlert child={child} />
      {child.notes && <p className="rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-300">{child.notes}</p>}

      <div className="space-y-1">
        {parents.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2 text-xs">
            <span className="text-slate-400">{r[0]}</span>
            <span className="text-white">{r[1] || '—'}</span>
            <span dir="ltr" className="text-slate-300">{r[2] || ''}</span>
          </div>
        ))}
      </div>

      <VaccineSchedule child={child} vaccinations={vacc} reload={core.reload} />
      <div data-write="1" className="flex gap-2">
        <input className={inputClass} placeholder={tx('إضافة تطعيم يدوي (الاسم)', 'Add a vaccine manually')} value={vName} onChange={(e) => setVName(e.target.value)} />
        <input type="date" className={`${inputClass} max-w-[9rem]`} value={vDate} onChange={(e) => setVDate(e.target.value)} />
        <button onClick={addVaccine} disabled={busy || !vName.trim()} className="shrink-0 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-40">{tx('إضافة', 'Add')}</button>
      </div>

      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-xs font-bold text-white">
          <Truck className="h-4 w-4 text-blue-400" />
          {tx('اشتراكات الطفل', 'Child subscriptions')}
        </h4>
        {items.length === 0 && <p className="text-[11px] text-slate-500">{tx('المؤسس لسه ماضافش أنواع اشتراكات. من صفحة الاشتراكات والمدفوعات.', 'No subscription types yet. Add them from Fees & Payments.')}</p>}
        {items.map((item) => {
          const a = assigned.find((x) => x.fee_item_id === item.id);
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-2 text-xs">
              <input type="checkbox" data-write="1" checked={!!a} onChange={() => toggleFee(item.id)} className="h-4 w-4 accent-blue-500" />
              <span className="flex-1 text-white">{feeName(item, isRTL)}</span>
              {a ? (
                <input
                  key={a.id + String(a.price_override)}
                  defaultValue={a.price_override ?? ''}
                  placeholder={String(item.price)}
                  inputMode="decimal"
                  onBlur={(e) => {
                    if (e.target.value !== String(a.price_override ?? '')) setOverride(a.id, e.target.value);
                  }}
                  className={`${inputClass} max-w-[6rem] text-center`}
                />
              ) : (
                <span className="text-slate-500">{money(item.price)}</span>
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300">
          <span>{tx('الإجمالي الشهري', 'Monthly total')}</span>
          <span>{money(due)}</span>
        </div>
        {profile?.roleCode && <p className="text-[10px] text-slate-500">{tx('اكتب سعر خاص في الخانة لو الطفل له خصم، أو سيبها فاضية لسعر الاشتراك العام.', 'Type a custom price to override the default.')}</p>}
      </div>
      <PortalCard child={child} core={core} />
    </Modal>
  );
};

export const NurseryChildrenView: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Child | null | 'new'>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [bulkMsg, setBulkMsg] = useState(false);
  const period = monthOf(cairoToday());

  useEffect(() => {
    const check = () => {
      const id = takePending('child');
      if (id) setViewing(id);
    };
    check();
    return onPending(check);
  }, []);

  const needle = q.trim().toLowerCase();
  const list = core.children.filter((c) =>
    !needle ||
    [c.full_name, c.father_name, c.mother_name, c.guardian_name, c.father_phone, c.mother_phone, c.guardian_phone].some((v) => (v || '').toLowerCase().includes(needle))
  );
  const viewingChild = core.children.find((c) => c.id === viewing) || null;

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-white">
            <Baby className="h-5 w-5 text-pink-400" />
            {tx('الأطفال', 'Children')}
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-400">{core.children.length}</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">{tx('بيانات الأطفال وأولياء الأمور والتطعيمات والاشتراكات', 'Children, parents, vaccinations and subscriptions')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkMsg(true)} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20">
            <MessageCircle className="h-4 w-4" />
            {tx('رسالة لأولياء الأمور', 'Message parents')}
          </button>
          <button data-write="1" onClick={() => setEditing('new')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" />
            {tx('إضافة طفل', 'Add child')}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className={`absolute top-2.5 h-4 w-4 text-slate-500 ${isRTL ? 'right-3' : 'left-3'}`} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx('بحث بالاسم أو الموبايل...', 'Search name or phone...')} className={`${inputClass} ${isRTL ? 'pr-9' : 'pl-9'}`} />
      </div>

      {core.loading ? (
        <p className="py-8 text-center text-xs text-slate-500">...</p>
      ) : list.length === 0 ? (
        <div className={`${cardClass} py-10 text-center text-xs text-slate-500`}>{tx('لا يوجد أطفال بعد', 'No children yet')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const due = childDue(c.id, core.childFees, core.feeItems);
            const paid = core.payments.filter((p) => p.child_id === c.id && p.period === period).reduce((s, p) => s + p.amount, 0);
            const vacc = core.vaccinations.some((v) => v.child_id === c.id);
            const transportItem = core.feeItems.find((i) => i.category === 'transport');
            const usesTransport = !!transportItem && core.childFees.some((cf) => cf.child_id === c.id && core.feeItems.find((i) => i.id === cf.fee_item_id)?.category === 'transport');
            return (
              <div key={c.id} className={`${cardClass} cursor-pointer space-y-3 transition hover:border-slate-600`} onClick={() => setViewing(c.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{c.full_name}</p>
                    <p className="text-[11px] text-slate-400">{[ageLabel(c.birth_date, isRTL), c.status === 'inactive' ? tx('غير مقيّد', 'Inactive') : ''].filter(Boolean).join(' • ')}</p>
                    {c.allergies && <p className="mt-1 text-[10px] font-semibold text-red-400">⚠ {c.allergies}</p>}
                  </div>
                  <button
                    data-write="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                    }}
                    className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={vacc ? 'ok' : 'warn'}>{vacc ? tx('اتطعّم', 'Vaccinated') : tx('بدون تطعيم', 'No vaccine')}</Badge>
                  <Badge tone={due === 0 ? 'muted' : paid >= due ? 'ok' : 'bad'}>
                    {due === 0 ? tx('بدون اشتراك', 'No fees') : paid >= due ? tx('دافع الشهر', 'Paid') : `${tx('متبقي', 'Due')} ${money(Math.max(due - paid, 0))}`}
                  </Badge>
                  {usesTransport && <Badge tone="muted">{tx('مواصلات', 'Transport')}</Badge>}
                </div>
                <p dir="ltr" className="text-[11px] text-slate-400">{c.father_phone || c.mother_phone || c.guardian_phone || ''}</p>
              </div>
            );
          })}
        </div>
      )}

      {bulkMsg && <BulkMessageModal children={core.children} onClose={() => setBulkMsg(false)} />}

      {editing && (
        <ChildFormModal
          child={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => core.reload()}
        />
      )}
      {viewingChild && <ChildDetailModal child={viewingChild} core={core} onClose={() => setViewing(null)} />}
    </div>
  );
};
