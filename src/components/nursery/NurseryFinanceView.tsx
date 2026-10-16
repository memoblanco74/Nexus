import React, { useMemo, useState } from 'react';
import { askConfirm } from '../../lib/dialog';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { SaveButton } from '../ui/SaveButton';
import { Badge, Field, Modal, cardClass, inputClass } from './ui';
import { Child, FeeItem, NurseryCore, cairoToday, childDue, feeName, monthOf, phoneForWhatsApp } from './nurseryApi';
import { renderReportPdf } from './reportPdf';

type Category = FeeItem['category'];

const CATEGORY_LABELS: Record<Category, [string, string]> = {
  tuition: ['اشتراك أساسي', 'Main tuition'],
  potty: ['بوتي تريننج', 'Potty training'],
  transport: ['مواصلات', 'Transport'],
  activity: ['أكتيفيتي', 'Activity'],
  other: ['أخرى', 'Other'],
};

const SUGGESTIONS: Array<{ name: string; name_ar: string; category: Category }> = [
  { name: 'Full time', name_ar: 'فول تايم', category: 'tuition' },
  { name: 'Part time', name_ar: 'بارت تايم', category: 'tuition' },
  { name: 'Potty training', name_ar: 'بوتي تريننج', category: 'potty' },
  { name: 'Transportation', name_ar: 'ترانسبورتيشن', category: 'transport' },
  { name: 'Activities', name_ar: 'أكتيفيتي', category: 'activity' },
];

const FeeRow: React.FC<{ item: FeeItem; canEdit: boolean; onChanged: () => void }> = ({ item, canEdit, onChanged }) => {
  const { isRTL, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const initial = { name_ar: feeName(item, true), name_en: feeName(item, false), price: String(item.price), active: item.active, category: item.category };
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));

  const save = async () => {
    const price = Number(form.price);
    if (!isFinite(price) || price < 0 || (!form.name_ar.trim() && !form.name_en.trim())) {
      showToast(tx('راجع الاسم والسعر', 'Check name and price'));
      return false;
    }
    const { error } = await supabase
      .from('nursery_fee_items')
      .update({ name: form.name_en.trim() || form.name_ar.trim(), name_ar: form.name_ar.trim() || form.name_en.trim(), price, active: form.active, category: form.category })
      .eq('id', item.id);
    if (error) {
      showToast(error.message);
      return false;
    }
    setBaseline(JSON.stringify(form));
    onChanged();
    return true;
  };

  const remove = async () => {
    if (!(await askConfirm({ danger: true, message: tx('حذف الاشتراك ده هيشيله من كل الأطفال المشتركين فيه. متأكد؟', 'This removes it from all children. Continue?') }))) return;
    const { error } = await supabase.from('nursery_fee_items').delete().eq('id', item.id);
    if (error) showToast(error.message);
    else onChanged();
  };

  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 p-3 sm:grid-cols-[1fr_9rem_7rem_auto_auto] sm:items-center">
      <div className="space-y-1.5">
        <input disabled={!canEdit} dir="rtl" className={inputClass} placeholder="الاسم بالعربي" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        <input disabled={!canEdit} dir="ltr" className={inputClass} placeholder="English name" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
      </div>
      <select disabled={!canEdit} className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <option key={c} value={c}>{CATEGORY_LABELS[c][isRTL ? 0 : 1]}</option>
        ))}
      </select>
      <input disabled={!canEdit} inputMode="decimal" className={`${inputClass} text-center`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <input type="checkbox" disabled={!canEdit} className="h-4 w-4 accent-blue-500" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        {tx('مفعّل', 'Active')}
      </label>
      {canEdit && (
        <div className="flex items-center gap-2" data-write="1">
          <SaveButton signature={JSON.stringify(form)} baseline={baseline} onSave={save} label={tx('حفظ', 'Save')} className="px-3 py-1.5" />
          <button onClick={remove} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const FeesTab: React.FC<{ core: NurseryCore; canEdit: boolean }> = ({ core, canEdit }) => {
  const { isRTL, activeTenant, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const p = Number(price);
    if ((!name.trim() && !nameEn.trim()) || !isFinite(p) || p < 0) {
      showToast(tx('اكتب اسم الاشتراك وسعره', 'Enter name and price'));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('nursery_fee_items').insert({ tenant_id: activeTenant!.id, name: nameEn.trim() || name.trim(), name_ar: name.trim() || nameEn.trim(), category, price: p });
    setBusy(false);
    if (error) {
      showToast(error.message);
      return;
    }
    setName('');
    setNameEn('');
    setPrice('');
    core.reload();
  };

  const addSuggestions = async () => {
    setBusy(true);
    const { error } = await supabase.from('nursery_fee_items').insert(SUGGESTIONS.map((s) => ({ ...s, tenant_id: activeTenant!.id, price: 0 })));
    setBusy(false);
    if (error) showToast(error.message);
    else core.reload();
  };

  return (
    <div className="space-y-4">
      {!canEdit && <p className="text-[11px] text-slate-400">{tx('تعديل الأسعار للمؤسس فقط.', 'Only the founder can edit prices.')}</p>}
      {core.feeItems.length === 0 && (
        <div className={`${cardClass} space-y-3 text-center`}>
          <p className="text-xs text-slate-400">{tx('لا توجد اشتراكات بعد.', 'No subscriptions yet.')}</p>
          {canEdit && (
            <button data-write="1" disabled={busy} onClick={addSuggestions} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
              {tx('إضافة الاشتراكات المقترحة (فول تايم، بارت تايم، بوتي تريننج، مواصلات، أكتيفيتي)', 'Add suggested subscriptions')}
            </button>
          )}
        </div>
      )}
      <div className="space-y-2">
        {core.feeItems.map((item) => (
          <FeeRow key={item.id + item.price + item.active + (item.name_ar || '') + (item.name || '') + item.category} item={item} canEdit={canEdit} onChanged={core.reload} />
        ))}
      </div>
      {canEdit && (
        <div data-write="1" className={`${cardClass} space-y-3`}>
          <h4 className="text-xs font-bold text-white">{tx('إضافة نوع اشتراك جديد', 'Add subscription type')}</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_9rem_7rem_auto]">
            <div className="space-y-1.5">
              <input dir="rtl" className={inputClass} placeholder="الاسم بالعربي" value={name} onChange={(e) => setName(e.target.value)} />
              <input dir="ltr" className={inputClass} placeholder="English name" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c][isRTL ? 0 : 1]}</option>
              ))}
            </select>
            <input className={`${inputClass} text-center`} inputMode="decimal" placeholder={tx('السعر', 'Price')} value={price} onChange={(e) => setPrice(e.target.value)} />
            <button onClick={add} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              {tx('إضافة', 'Add')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentModal: React.FC<{ child: Child; period: string; due: number; paid: number; core: NurseryCore; onClose: () => void }> = ({ child, period, due, paid, core, onClose }) => {
  const { isRTL, activeTenant, showToast, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [amount, setAmount] = useState(String(Math.max(due - paid, 0) || ''));
  const [date, setDate] = useState(cairoToday());
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const existing = core.payments.filter((p) => p.child_id === child.id && p.period === period);

  const add = async () => {
    const a = Number(amount);
    if (!isFinite(a) || a <= 0) {
      showToast(tx('اكتب مبلغ صحيح', 'Enter a valid amount'));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('nursery_payments').insert({
      tenant_id: activeTenant!.id,
      child_id: child.id,
      period,
      amount: a,
      paid_on: date,
      method: method || null,
      note: note || null,
    });
    setBusy(false);
    if (error) {
      showToast(error.message);
      return;
    }
    await core.reload();
    onClose();
  };

  const remove = async (id: string) => {
    if (!(await askConfirm({ danger: true, message: tx('حذف الدفعة دي؟', 'Delete this payment?') }))) return;
    const { error } = await supabase.from('nursery_payments').delete().eq('id', id);
    if (error) showToast(error.message);
    else core.reload();
  };

  return (
    <Modal title={`${child.full_name} — ${period}`} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-slate-800/60 p-2"><p className="text-slate-400">{tx('المطلوب', 'Due')}</p><p className="font-bold text-white">{money(due)}</p></div>
        <div className="rounded-xl bg-slate-800/60 p-2"><p className="text-slate-400">{tx('المدفوع', 'Paid')}</p><p className="font-bold text-emerald-400">{money(paid)}</p></div>
        <div className="rounded-xl bg-slate-800/60 p-2"><p className="text-slate-400">{tx('المتبقي', 'Remaining')}</p><p className="font-bold text-red-400">{money(Math.max(due - paid, 0))}</p></div>
      </div>
      {existing.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2 text-xs">
          <span className="font-bold text-white">{money(p.amount)}</span>
          <span className="text-slate-400">{p.paid_on}{p.method ? ` • ${p.method}` : ''}</span>
          <button data-write="1" onClick={() => remove(p.id)} className="text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <div data-write="1" className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tx('المبلغ', 'Amount')}><input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label={tx('تاريخ الدفع', 'Date')}><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={tx('طريقة الدفع', 'Method')}><input className={inputClass} placeholder={tx('كاش / انستاباي', 'Cash / InstaPay')} value={method} onChange={(e) => setMethod(e.target.value)} /></Field>
          <Field label={tx('ملاحظة', 'Note')}><input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <button onClick={add} disabled={busy} className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
          {tx('تسجيل الدفعة', 'Record payment')}
        </button>
      </div>
    </Modal>
  );
};

const childPhone = (c: Child) => c.mother_phone || c.father_phone || c.guardian_phone || '';

const reminderText = (name: string, period: string, remaining: number, nursery: string, ar: boolean) =>
  ar
    ? `السلام عليكم، تذكير ودي من ${nursery}: المتبقي من اشتراك ${name} عن شهر ${period} هو ${remaining} ج.م. برجاء السداد في أقرب وقت. شكراً لكم.`
    : `Hello, a friendly reminder from ${nursery}: the remaining fee for ${name} for ${period} is ${remaining} EGP. Please settle at your earliest convenience. Thank you.`;

const openReminder = (c: Child, period: string, remaining: number, nursery: string, ar: boolean) => {
  const digits = phoneForWhatsApp(childPhone(c));
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(reminderText(c.full_name, period, remaining, nursery, ar))}`, '_blank');
};

const RemindersModal: React.FC<{ rows: { child: Child; remaining: number }[]; period: string; nursery: string; onClose: () => void }> = ({ rows, period, nursery, onClose }) => {
  const { isRTL, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  return (
    <Modal title={tx(`تذكير المتأخرين — ${period}`, `Overdue reminders — ${period}`)} onClose={onClose}>
      <p className="text-[11px] text-slate-400">{tx('كل ضغطة بتفتح واتساب برسالة جاهزة لولي الأمر. تم إرسال', 'Each tap opens WhatsApp with a ready message. Sent')} {Object.keys(sent).length} / {rows.length}</p>
      <div className="space-y-2">
        {rows.map((r) => {
          const phone = childPhone(r.child);
          return (
            <div key={r.child.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{r.child.full_name}</p>
                <p className="text-[11px] text-slate-500"><span dir="ltr">{phone || tx('مفيش رقم', 'No phone')}</span> • {money(r.remaining)}</p>
              </div>
              {phone && (
                <button onClick={() => { openReminder(r.child, period, r.remaining, nursery, isRTL); setSent((x) => ({ ...x, [r.child.id]: true })); }} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${sent[r.child.id] ? 'border-slate-700 text-slate-400' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'}`}>
                  {sent[r.child.id] ? tx('إعادة', 'Again') : tx('واتساب', 'WhatsApp')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

const PaymentsTab: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [period, setPeriod] = useState(monthOf(cairoToday()));
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [paying, setPaying] = useState<string | null>(null);
  const [remindOpen, setRemindOpen] = useState(false);
  const { activeTenant, language } = useApp();
  const nurseryName = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';

  const rows = useMemo(
    () =>
      core.children
        .filter((c) => c.status === 'active')
        .map((c) => {
          const due = childDue(c.id, core.childFees, core.feeItems);
          const paid = core.payments.filter((p) => p.child_id === c.id && p.period === period).reduce((s, p) => s + p.amount, 0);
          return { child: c, due, paid, remaining: Math.max(due - paid, 0) };
        }),
    [core.children, core.childFees, core.feeItems, core.payments, period]
  );
  const totals = rows.reduce((a, r) => ({ due: a.due + r.due, paid: a.paid + r.paid }), { due: 0, paid: 0 });
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'paid' ? r.due > 0 && r.remaining === 0 : r.remaining > 0));
  const payingRow = rows.find((r) => r.child.id === paying) || null;
  const overdue = rows.filter((r) => r.remaining > 0);

  const exportOverdue = async () => {
    const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<div dir="${isRTL ? 'rtl' : 'ltr'}" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;padding:28px;width:760px;background:#fff">
      <h2 style="margin:0 0 4px;color:#1d4ed8">${esc(nurseryName)}</h2>
      <p style="margin:0 0 14px;font-size:12px;color:#475569">${tx('كشف المتأخرين عن شهر', 'Overdue statement for')} ${period} — ${tx('الإجمالي المتبقي', 'Total outstanding')}: <b>${overdue.reduce((a, r) => a + r.remaining, 0)}</b></p>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>${[tx('الطفل', 'Child'), tx('المطلوب', 'Due'), tx('المدفوع', 'Paid'), tx('المتبقي', 'Remaining'), tx('موبايل', 'Phone')].map((h) => `<th style="background:#1d4ed8;color:#fff;padding:6px;text-align:${isRTL ? 'right' : 'left'}">${h}</th>`).join('')}</tr></thead>
      <tbody>${overdue.map((r, i) => `<tr style="background:${i % 2 ? '#f1f5f9' : '#fff'}">${[esc(r.child.full_name), r.due, r.paid, r.remaining, esc(childPhone(r.child))].map((c) => `<td style="padding:5px 6px;border-bottom:1px solid #e2e8f0">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const blob = await renderReportPdf(html);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overdue-${period}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className={`${inputClass} max-w-[11rem]`} />
        <div className="flex gap-1.5">
          {(['all', 'unpaid', 'paid'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${filter === f ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400'}`}>
              {f === 'all' ? tx('الكل', 'All') : f === 'unpaid' ? tx('لم يدفع', 'Unpaid') : tx('دفع', 'Paid')}
            </button>
          ))}
        </div>
        {overdue.length > 0 && (
          <div className="flex gap-1.5">
            <button onClick={() => setRemindOpen(true)} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20">{tx('تذكير المتأخرين واتساب', 'Remind overdue')} ({overdue.length})</button>
            <button onClick={exportOverdue} className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20">{tx('كشف PDF', 'PDF statement')}</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className={`${cardClass} text-center`}><p className="text-sm font-extrabold text-white">{money(totals.due)}</p><p className="text-[11px] text-slate-400">{tx('المطلوب', 'Expected')}</p></div>
        <div className={`${cardClass} text-center`}><p className="text-sm font-extrabold text-emerald-400">{money(totals.paid)}</p><p className="text-[11px] text-slate-400">{tx('المحصّل', 'Collected')}</p></div>
        <div className={`${cardClass} text-center`}><p className="text-sm font-extrabold text-red-400">{money(Math.max(totals.due - totals.paid, 0))}</p><p className="text-[11px] text-slate-400">{tx('المتبقي', 'Outstanding')}</p></div>
      </div>
      {shown.length === 0 ? (
        <div className={`${cardClass} py-8 text-center text-xs text-slate-500`}>{tx('لا توجد نتائج', 'No results')}</div>
      ) : (
        <div className="space-y-2">
          {shown.map((r) => (
            <button key={r.child.id} onClick={() => setPaying(r.child.id)} className={`${cardClass} flex w-full items-center justify-between gap-3 !py-3 text-start transition hover:border-slate-600`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{r.child.full_name}</p>
                <p className="text-[11px] text-slate-400">{tx('المطلوب', 'Due')} {money(r.due)} • {tx('المدفوع', 'Paid')} {money(r.paid)}</p>
              </div>
              <Badge tone={r.due === 0 ? 'muted' : r.remaining === 0 ? 'ok' : r.paid > 0 ? 'warn' : 'bad'}>
                {r.due === 0 ? tx('بدون اشتراك', 'No fees') : r.remaining === 0 ? tx('مدفوع', 'Paid') : `${tx('متبقي', 'Due')} ${money(r.remaining)}`}
              </Badge>
            </button>
          ))}
        </div>
      )}
      {remindOpen && <RemindersModal rows={overdue} period={period} nursery={nurseryName} onClose={() => setRemindOpen(false)} />}
      {payingRow && <PaymentModal child={payingRow.child} period={period} due={payingRow.due} paid={payingRow.paid} core={core} onClose={() => setPaying(null)} />}
    </div>
  );
};

export const NurseryFinanceView: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL } = useApp();
  const { profile } = useAuth();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [tab, setTab] = useState<'payments' | 'fees'>('payments');
  const canEdit = profile?.roleCode === 'founder';

  return (
    <div className="space-y-5 pb-12">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-white">
          <Wallet className="h-5 w-5 text-amber-400" />
          {tx('الاشتراكات والمدفوعات', 'Fees & Payments')}
        </h1>
        <p className="mt-1 text-xs text-slate-400">{tx('متابعة دفع الاشتراك الشهري لكل طفل وإدارة أنواع الاشتراكات وأسعارها', 'Monthly payments and subscription prices')}</p>
      </div>
      <div className="flex gap-2">
        {(['payments', 'fees'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl border px-4 py-2 text-xs font-bold ${tab === k ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400'}`}>
            {k === 'payments' ? tx('المدفوعات الشهرية', 'Monthly payments') : tx('أنواع الاشتراكات والأسعار', 'Subscription types & prices')}
          </button>
        ))}
      </div>
      {tab === 'payments' ? <PaymentsTab core={core} /> : <FeesTab core={core} canEdit={canEdit} />}
    </div>
  );
};
