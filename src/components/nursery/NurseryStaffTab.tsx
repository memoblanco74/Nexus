import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, TrendingUp, Wallet } from 'lucide-react';
import { askConfirm } from '../../lib/dialog';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Badge, Field, Modal, cardClass, inputClass } from './ui';
import { cairoToday, monthOf } from './nurseryApi';

interface Staff { id: string; full_name: string; job_title: string | null; phone: string | null; monthly_salary: number; active: boolean; tax_percent?: number; raise_percent?: number; raise_month?: number | null; last_raise_on?: string | null }
interface Att { staff_id: string; day: string; status: 'present' | 'absent' | 'late' | 'leave' }
interface Pay { id: string; staff_id: string; period: string; base: number; deduction: number; bonus: number; net: number; tax?: number; paid_on: string }
interface Hist { id: string; staff_id: string; old_salary: number; new_salary: number; percent: number; applied_on: string }

const STATUS: Array<{ key: Att['status']; ar: string; en: string; cls: string }> = [
  { key: 'present', ar: 'حاضر', en: 'Present', cls: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' },
  { key: 'late', ar: 'متأخر', en: 'Late', cls: 'border-amber-500/50 bg-amber-500/15 text-amber-300' },
  { key: 'absent', ar: 'غائب', en: 'Absent', cls: 'border-red-500/50 bg-red-500/15 text-red-300' },
  { key: 'leave', ar: 'إجازة', en: 'Leave', cls: 'border-blue-500/50 bg-blue-500/15 text-blue-300' },
];

const lastDay = (period: string) => {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

const StaffForm: React.FC<{ staff: Staff | null; tenantId: string; onClose: () => void; onSaved: () => void }> = ({ staff, tenantId, onClose, onSaved }) => {
  const { isRTL, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [form, setForm] = useState({ full_name: staff?.full_name || '', job_title: staff?.job_title || '', phone: staff?.phone || '', salary: String(staff?.monthly_salary ?? ''), tax: String(staff?.tax_percent ?? ''), raise: String(staff?.raise_percent ?? ''), raiseMonth: String(staff?.raise_month ?? ''), active: staff?.active ?? true });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const salary = Number(form.salary || 0);
    if (!form.full_name.trim() || !isFinite(salary) || salary < 0) { showToast(tx('راجع الاسم والمرتب', 'Check name and salary')); return; }
    const tax = Number(form.tax || 0);
    const raise = Number(form.raise || 0);
    if (!(tax >= 0 && tax < 100) || !(raise >= 0 && raise <= 100)) { showToast(tx('راجع نسبة الضريبة ونسبة الزيادة', 'Check tax and raise percentages')); return; }
    setBusy(true);
    const payload: Record<string, unknown> = { full_name: form.full_name.trim(), job_title: form.job_title.trim() || null, phone: form.phone.trim() || null, monthly_salary: salary, active: form.active };
    if (staff || tax > 0 || raise > 0 || form.raiseMonth) {
      payload.tax_percent = tax;
      payload.raise_percent = raise;
      payload.raise_month = form.raiseMonth ? Number(form.raiseMonth) : null;
    }
    const { error } = staff ? await supabase.from('nursery_staff').update(payload).eq('id', staff.id) : await supabase.from('nursery_staff').insert({ ...payload, tenant_id: tenantId });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    onSaved();
    onClose();
  };

  return (
    <Modal title={staff ? tx('تعديل موظف', 'Edit staff') : tx('موظف جديد', 'New staff')} onClose={onClose} footer={<button disabled={busy} onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">{tx('حفظ', 'Save')}</button>}>
      <Field label={tx('الاسم', 'Name')}><input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
      <Field label={tx('الوظيفة', 'Job title')}><input className={inputClass} placeholder={tx('مدرسة / مساعدة / سائق', 'Teacher / Assistant / Driver')} value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></Field>
      <Field label={tx('الموبايل', 'Phone')}><input className={inputClass} dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label={tx('المرتب الشهري (ج.م)', 'Monthly salary (EGP)')}><input className={inputClass} inputMode="decimal" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label={tx('ضريبة المرتب %', 'Salary tax %')}><input className={inputClass} inputMode="decimal" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></Field>
        <Field label={tx('الزيادة السنوية %', 'Annual raise %')}><input className={inputClass} inputMode="decimal" value={form.raise} onChange={(e) => setForm({ ...form, raise: e.target.value })} /></Field>
        <Field label={tx('شهر الزيادة', 'Raise month')}>
          <select className={inputClass} value={form.raiseMonth} onChange={(e) => setForm({ ...form, raiseMonth: e.target.value })}>
            <option value="">—</option>
            {Array.from({ length: 12 }, (_, k) => k + 1).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-blue-500" />{tx('على رأس العمل', 'Currently employed')}</label>
    </Modal>
  );
};

const PayModal: React.FC<{ staff: Staff; period: string; tenantId: string; suggested: number; existing: Pay | undefined; onClose: () => void; onSaved: () => void }> = ({ staff, period, tenantId, suggested, existing, onClose, onSaved }) => {
  const { isRTL, showToast, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [deduction, setDeduction] = useState(String(existing?.deduction ?? suggested));
  const [bonus, setBonus] = useState(String(existing?.bonus ?? 0));
  const [busy, setBusy] = useState(false);
  const gross = Math.max(0, Number(staff.monthly_salary) - (Number(deduction) || 0) + (Number(bonus) || 0));
  const taxPct = Number(staff.tax_percent || 0);
  const tax = Math.round(gross * taxPct) / 100;
  const net = Math.max(0, gross - tax);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from('nursery_staff_payments').upsert({ tenant_id: tenantId, staff_id: staff.id, period, base: staff.monthly_salary, deduction: Number(deduction) || 0, bonus: Number(bonus) || 0, net, ...(tax > 0 || existing?.tax ? { tax } : {}), paid_on: cairoToday() }, { onConflict: 'staff_id,period' });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    onSaved();
    onClose();
  };

  return (
    <Modal title={`${tx('صرف مرتب', 'Pay salary')} — ${staff.full_name}`} onClose={onClose} footer={<button disabled={busy} onClick={save} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{tx('تأكيد الصرف', 'Confirm payment')} — {money(net)}</button>}>
      <p className="text-xs text-slate-400">{tx('المرتب الأساسي', 'Base salary')}: <b className="text-white">{money(Number(staff.monthly_salary))}</b> • {period}</p>
      <Field label={tx('خصومات (غياب / جزاءات)', 'Deductions')}><input className={inputClass} inputMode="decimal" value={deduction} onChange={(e) => setDeduction(e.target.value)} /></Field>
      <Field label={tx('مكافآت / إضافي', 'Bonus')}><input className={inputClass} inputMode="decimal" value={bonus} onChange={(e) => setBonus(e.target.value)} /></Field>
      {taxPct > 0 && <p className="text-xs text-slate-300">{tx(`ضريبة المرتب ${taxPct}%`, `Salary tax ${taxPct}%`)}: <b className="text-amber-300">{money(tax)}</b> • {tx('الصافي', 'Net')}: <b className="text-white">{money(net)}</b></p>}
      <p className="text-[10px] text-slate-500">{tx('الخصم المقترح محسوب من أيام الغياب (المرتب ÷ 26 لكل يوم) وتقدر تعدله.', 'Suggested deduction is absent days × (salary ÷ 26). You can edit it.')}</p>
    </Modal>
  );
};

export const NurseryStaffTab: React.FC = () => {
  const { isRTL, activeTenant, showToast, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const tenantId = activeTenant?.id || '';
  const [staff, setStaff] = useState<Staff[]>([]);
  const [att, setAtt] = useState<Att[]>([]);
  const [pays, setPays] = useState<Pay[]>([]);
  const [day, setDay] = useState(cairoToday());
  const [period, setPeriod] = useState(monthOf(cairoToday()));
  const [editing, setEditing] = useState<Staff | null | 'new'>(null);
  const [paying, setPaying] = useState<Staff | null>(null);
  const { can, profile } = useAuth();
  const isFounder = profile?.roleCode === 'founder';
  const canAtt = can('staff.attendance');
  const canPay = can('staff.payroll');
  const views = (['attendance', 'payroll', 'raises'] as const).filter((k) => (k === 'attendance' ? canAtt : k === 'payroll' ? canPay : isFounder && canPay));
  const [viewSel, setView] = useState<'attendance' | 'payroll' | 'raises'>('attendance');
  const view = views.includes(viewSel) ? viewSel : views[0] || 'attendance';
  const [hist, setHist] = useState<Hist[]>([]);
  const [bulkPct, setBulkPct] = useState('');
  const [busyRaise, setBusyRaise] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const from = `${period}-01`;
    const to = `${period}-${String(lastDay(period)).padStart(2, '0')}`;
    const [s, a, p] = await Promise.all([
      supabase.from('nursery_staff').select('*').eq('tenant_id', tenantId).order('full_name'),
      supabase.from('nursery_staff_attendance').select('staff_id, day, status').eq('tenant_id', tenantId).gte('day', from).lte('day', to),
      supabase.from('nursery_staff_payments').select('*').eq('tenant_id', tenantId).eq('period', period),
    ]);
    const h = await supabase.from('nursery_salary_history').select('id, staff_id, old_salary, new_salary, percent, applied_on').eq('tenant_id', tenantId).order('applied_on', { ascending: false }).limit(30);
    setHist(h.error ? [] : ((h.data as any[]) || []).map((x) => ({ ...x, old_salary: Number(x.old_salary), new_salary: Number(x.new_salary), percent: Number(x.percent) })));
    setStaff(((s.data as any[]) || []).map((x) => ({ ...x, monthly_salary: Number(x.monthly_salary), tax_percent: Number(x.tax_percent || 0), raise_percent: Number(x.raise_percent || 0) })));
    setAtt((a.data as Att[]) || []);
    setPays(((p.data as any[]) || []).map((x) => ({ ...x, base: Number(x.base), deduction: Number(x.deduction), bonus: Number(x.bonus), net: Number(x.net) })));
  }, [tenantId, period]);

  useEffect(() => { load(); }, [load]);

  const mark = async (s: Staff, status: Att['status']) => {
    const { error } = await supabase.from('nursery_staff_attendance').upsert({ tenant_id: tenantId, staff_id: s.id, day, status }, { onConflict: 'staff_id,day' });
    if (error) showToast(error.message);
    else load();
  };

  const active = staff.filter((s) => s.active);
  const stats = useMemo(() => {
    const m: Record<string, { present: number; late: number; absent: number; leave: number }> = {};
    att.forEach((a) => {
      const o = (m[a.staff_id] = m[a.staff_id] || { present: 0, late: 0, absent: 0, leave: 0 });
      o[a.status] += 1;
    });
    return m;
  }, [att]);
  const totalNet = pays.reduce((n, p) => n + p.net, 0);
  const totalTax = pays.reduce((n, p) => n + Number(p.tax || 0), 0);
  const curMonth = Number(monthOf(cairoToday()).slice(5, 7));
  const raiseDue = (s: Staff) => {
    if (!s.active || !(Number(s.raise_percent) > 0)) return false;
    if (s.last_raise_on && (Date.now() - new Date(s.last_raise_on).getTime()) / 86400000 < 300) return false;
    return !s.raise_month || curMonth >= s.raise_month;
  };
  const applyRaise = async (ids: string[], percent: number | null, force: boolean) => {
    setBusyRaise(true);
    const { data, error } = await supabase.rpc('fn_apply_salary_raise', { p_tenant_id: tenantId, p_staff_ids: ids, p_percent: percent, p_force: force });
    setBusyRaise(false);
    if (error) { showToast(error.message); return; }
    showToast(tx(`تم تطبيق الزيادة على ${data} موظف`, `Raise applied to ${data} staff`));
    setBulkPct('');
    load();
  };
  const staffName = (id: string) => staff.find((x) => x.id === id)?.full_name || '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {views.map((k) => (
            <button key={k} onClick={() => setView(k)} className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${view === k ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400'}`}>{k === 'attendance' ? tx('الحضور اليومي', 'Daily attendance') : k === 'payroll' ? tx('المرتبات', 'Payroll') : tx('الزيادة السنوية', 'Annual raises')}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {view === 'raises' ? null : view === 'attendance' ? <input type="date" value={day} onChange={(e) => { if (e.target.value) { setDay(e.target.value); setPeriod(monthOf(e.target.value)); } }} className={`${inputClass} max-w-[11rem]`} /> : <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className={`${inputClass} max-w-[11rem]`} />}
          {isFounder && <button data-write="1" onClick={() => setEditing('new')} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"><Plus className="h-4 w-4" />{tx('موظف', 'Staff')}</button>}
        </div>
      </div>

      {staff.length === 0 && <p className={`${cardClass} text-center text-xs text-slate-500`}>{tx('لسه ماضفتش موظفين (مدرسين، مساعدات، سائقين).', 'No staff yet.')}</p>}

      {view === 'attendance' && active.map((s) => {
        const cur = att.find((a) => a.staff_id === s.id && a.day === day)?.status;
        return (
          <div key={s.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{s.full_name}</p>
              <p className="text-[11px] text-slate-500">{s.job_title || '—'}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" data-write="1">
              {STATUS.map((st) => (
                <button key={st.key} onClick={() => mark(s, st.key)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${cur === st.key ? st.cls : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>{isRTL ? st.ar : st.en}</button>
              ))}
              {isFounder && <button onClick={() => setEditing(s)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        );
      })}

      {view === 'payroll' && (
        <>
          {staff.map((s) => {
            const st = stats[s.id] || { present: 0, late: 0, absent: 0, leave: 0 };
            const paid = pays.find((p) => p.staff_id === s.id);
            const suggested = Math.round((s.monthly_salary / 26) * st.absent);
            return (
              <div key={s.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{s.full_name} {!s.active && <Badge tone="muted">{tx('متوقف', 'Inactive')}</Badge>}</p>
                  <p className="text-[11px] text-slate-500">{tx('حضور', 'P')} {st.present} • {tx('تأخير', 'L')} {st.late} • {tx('غياب', 'A')} {st.absent} • {tx('إجازة', 'Lv')} {st.leave} • {money(s.monthly_salary)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {paid ? <Badge tone="ok">{tx('تم الصرف', 'Paid')} {money(paid.net)}</Badge> : <Badge tone="warn">{tx(`المقترح ${money(Math.max(0, s.monthly_salary - suggested))}`, `Suggested ${money(Math.max(0, s.monthly_salary - suggested))}`)}</Badge>}
                  <button data-write="1" onClick={() => setPaying(s)} className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"><Wallet className="h-3.5 w-3.5" />{paid ? tx('تعديل', 'Edit') : tx('صرف', 'Pay')}</button>
                </div>
              </div>
            );
          })}
          {staff.length > 0 && <p className="text-xs text-slate-400">{tx('إجمالي الصافي المصروف هذا الشهر', 'Net paid this month')}: <b className="text-white">{money(totalNet)}</b>{totalTax > 0 && <> • {tx('ضرائب المرتبات', 'Salary tax')}: <b className="text-amber-300">{money(totalTax)}</b></>}</p>}
        </>
      )}

      {view === 'raises' && (
        <div className="space-y-3">
          <div className={`${cardClass} space-y-2`}>
            <p className="flex items-center gap-2 text-xs font-bold text-white"><TrendingUp className="h-4 w-4 text-emerald-400" />{tx('زيادة سنوية موحّدة لكل الموظفين', 'Apply one raise to all active staff')}</p>
            <div className="flex flex-wrap gap-2" data-write="1">
              <input className={`${inputClass} max-w-[8rem]`} inputMode="decimal" placeholder="%" value={bulkPct} onChange={(e) => setBulkPct(e.target.value)} />
              <button disabled={busyRaise || !(Number(bulkPct) > 0)} onClick={async () => { if (await askConfirm({ message: tx(`تطبيق زيادة ${bulkPct}% على كل الموظفين على رأس العمل؟`, `Apply a ${bulkPct}% raise to all active staff?`), confirmText: tx('تطبيق', 'Apply') })) applyRaise(active.map((x) => x.id), Number(bulkPct), true); }} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400">{tx('تطبيق على الكل', 'Apply to all')}</button>
            </div>
            <p className="text-[10px] text-slate-500">{tx('أو حدّد نسبة لكل موظف من زر التعديل، وهتظهر هنا لما ييجي شهرها.', 'Or set a % per employee in the edit form; they appear here when due.')}</p>
          </div>
          {active.map((s) => {
            const due = raiseDue(s);
            const pct = Number(s.raise_percent || 0);
            return (
              <div key={s.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{s.full_name}</p>
                  <p className="text-[11px] text-slate-500">{money(s.monthly_salary)} • {pct > 0 ? `${pct}%${s.raise_month ? ` • ${tx('شهر', 'month')} ${s.raise_month}` : ''}` : tx('بدون نسبة زيادة', 'No raise set')}{s.last_raise_on ? ` • ${tx('آخر زيادة', 'last')} ${s.last_raise_on}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pct > 0 && <Badge tone={due ? 'warn' : 'muted'}>{due ? tx(`مستحقة → ${money(Math.round(s.monthly_salary * (1 + pct / 100) * 100) / 100)}`, `Due → ${money(Math.round(s.monthly_salary * (1 + pct / 100) * 100) / 100)}`) : tx('مش مستحقة', 'Not due')}</Badge>}
                  <button data-write="1" disabled={busyRaise || !due} onClick={() => applyRaise([s.id], null, false)} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40">{tx('تطبيق', 'Apply')}</button>
                  <button data-write="1" onClick={() => setEditing(s)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
          {hist.length > 0 && (
            <div className={cardClass}>
              <p className="mb-2 text-xs font-bold text-slate-300">{tx('سجل الزيادات', 'Raise history')}</p>
              <div className="space-y-1.5">
                {hist.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
                    <span className="min-w-0 truncate">{staffName(h.staff_id)} • {h.applied_on}</span>
                    <span className="shrink-0">{money(h.old_salary)} → <b className="text-emerald-300">{money(h.new_salary)}</b> ({h.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editing && <StaffForm staff={editing === 'new' ? null : editing} tenantId={tenantId} onClose={() => setEditing(null)} onSaved={load} />}
      {paying && <PayModal staff={paying} period={period} tenantId={tenantId} suggested={Math.round((paying.monthly_salary / 26) * (stats[paying.id]?.absent || 0))} existing={pays.find((p) => p.staff_id === paying.id)} onClose={() => setPaying(null)} onSaved={load} />}
    </div>
  );
};
