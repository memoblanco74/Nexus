import React, { useState } from 'react';
import { Check, Copy, Link2, MessageCircle, RefreshCw, Syringe, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { askConfirm } from '../../lib/dialog';
import { Badge, Modal, inputClass } from './ui';
import { Child, NurseryCore, VACCINE_SCHEDULE, Vaccination, addMonthsISO, cairoToday, daysUntil, phoneForWhatsApp } from './nurseryApi';

export const childPhone = (c: Child) => c.mother_phone || c.father_phone || c.guardian_phone || '';

export const portalLink = (token: string) => `${window.location.origin}${window.location.pathname}#/parent/${token}`;

export const openWhatsApp = (phone: string, text: string) => {
  window.open(`https://wa.me/${phoneForWhatsApp(phone)}?text=${encodeURIComponent(text)}`, '_blank');
};

export const AllergyAlert: React.FC<{ child: Child }> = ({ child }) => {
  const { isRTL } = useApp();
  if (!child.allergies && !child.health_notes) return null;
  return (
    <div className="space-y-1 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-[11px] text-red-200">
      {child.allergies && <p><b>{isRTL ? 'حساسية الأكل / الأدوية:' : 'Allergies:'}</b> {child.allergies}</p>}
      {child.health_notes && <p><b>{isRTL ? 'ملاحظات صحية:' : 'Health notes:'}</b> {child.health_notes}</p>}
    </div>
  );
};

export const PortalCard: React.FC<{ child: Child; core: NurseryCore }> = ({ child, core }) => {
  const { isRTL, showToast, activeTenant, language } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [busy, setBusy] = useState(false);
  const enabled = child.portal_enabled !== false;
  const link = child.portal_token ? portalLink(child.portal_token) : '';
  const nursery = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';

  const call = async (enable: boolean | null, regen: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc('fn_set_child_portal', { p_child_id: child.id, p_enabled: enable, p_regenerate: regen });
    setBusy(false);
    if (error) showToast(error.message);
    else core.reload();
  };

  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 p-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold text-white"><Link2 className="h-4 w-4 text-indigo-400" />{tx('بوابة ولي الأمر', 'Parent portal')}</h4>
        <Badge tone={enabled ? 'ok' : 'muted'}>{enabled ? tx('مفعّلة', 'Enabled') : tx('متوقفة', 'Disabled')}</Badge>
      </div>
      <p className="text-[11px] text-slate-400">{tx('لينك خاص بالطفل يشوف منه ولي الأمر تقرير اليوم والمدفوعات والتطعيمات من غير تسجيل دخول.', 'A private link where parents see daily reports, payments and vaccinations without signing in.')}</p>
      {link && enabled && (
        <div className="flex gap-2">
          <input readOnly dir="ltr" value={link} className={`${inputClass} text-[10px]`} onFocus={(e) => e.currentTarget.select()} />
          <button onClick={async () => { try { await navigator.clipboard.writeText(link); showToast(tx('تم نسخ اللينك', 'Link copied')); } catch { /* ignore */ } }} className="shrink-0 rounded-xl border border-slate-700 px-3 text-slate-300 hover:bg-slate-800"><Copy className="h-4 w-4" /></button>
        </div>
      )}
      <div className="flex flex-wrap gap-2" data-write="1">
        {link && enabled && childPhone(child) && (
          <button onClick={() => openWhatsApp(childPhone(child), tx(`أهلاً بحضرتك، ده اللينك الخاص بمتابعة ${child.full_name} في ${nursery} (تقارير اليوم والمدفوعات والتطعيمات): ${link}`, `Hello, here is the private link to follow ${child.full_name} at ${nursery}: ${link}`))} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"><MessageCircle className="h-3.5 w-3.5" />{tx('إرسال لولي الأمر', 'Send to parent')}</button>
        )}
        <button disabled={busy} onClick={() => call(!enabled, false)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">{enabled ? tx('إيقاف اللينك', 'Disable link') : tx('تفعيل اللينك', 'Enable link')}</button>
        <button disabled={busy} onClick={async () => { if (await askConfirm({ danger: true, title: tx('تغيير اللينك', 'Regenerate link'), message: tx('اللينك القديم هيبطل يشتغل. متأكد؟', 'The old link will stop working. Continue?') })) call(null, true); }} className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"><RefreshCw className="h-3.5 w-3.5" />{tx('لينك جديد', 'New link')}</button>
      </div>
    </div>
  );
};

export const VaccineSchedule: React.FC<{ child: Child; vaccinations: Vaccination[]; reload: () => Promise<void> | void }> = ({ child, vaccinations, reload }) => {
  const { isRTL, showToast, activeTenant, language } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [busy, setBusy] = useState(false);
  const nursery = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';
  const rows = [...vaccinations].sort((a, b) => (a.due_date || a.given_on || '').localeCompare(b.due_date || b.given_on || ''));

  const generate = async () => {
    if (!child.birth_date) { showToast(tx('سجّل تاريخ ميلاد الطفل الأول', 'Set the birth date first')); return; }
    const existing = new Set(vaccinations.map((v) => v.vaccine_name));
    const toAdd = VACCINE_SCHEDULE
      .map((v) => ({ name: isRTL ? v.ar : v.en, due: addMonthsISO(child.birth_date!, v.months) }))
      .filter((v) => !existing.has(v.name))
      .map((v) => ({ tenant_id: child.tenant_id, child_id: child.id, vaccine_name: v.name, due_date: v.due, given_on: null }));
    if (toAdd.length === 0) { showToast(tx('الجدول موجود بالفعل', 'Schedule already exists')); return; }
    setBusy(true);
    const { error } = await supabase.from('nursery_vaccinations').insert(toAdd);
    setBusy(false);
    if (error) showToast(error.message);
    else reload();
  };

  const markDone = async (v: Vaccination, done: boolean) => {
    const { error } = await supabase.from('nursery_vaccinations').update({ given_on: done ? cairoToday() : null }).eq('id', v.id);
    if (error) showToast(error.message);
    else reload();
  };

  const remove = async (v: Vaccination) => {
    const { error } = await supabase.from('nursery_vaccinations').delete().eq('id', v.id);
    if (error) showToast(error.message);
    else reload();
  };

  const status = (v: Vaccination) => {
    if (v.given_on) return { tone: 'ok' as const, text: tx(`اتعمل ${v.given_on}`, `Given ${v.given_on}`) };
    if (!v.due_date) return { tone: 'muted' as const, text: '' };
    const d = daysUntil(v.due_date);
    if (d < 0) return { tone: 'bad' as const, text: tx(`متأخر ${-d} يوم`, `${-d}d overdue`) };
    if (d <= 7) return { tone: 'warn' as const, text: d === 0 ? tx('النهارده', 'Today') : tx(`بعد ${d} يوم`, `in ${d}d`) };
    return { tone: 'muted' as const, text: v.due_date };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold text-white"><Syringe className="h-4 w-4 text-emerald-400" />{tx('جدول التطعيمات', 'Vaccination schedule')}</h4>
        <button data-write="1" disabled={busy} onClick={generate} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20">{tx('إنشاء الجدول المقترح', 'Generate suggested')}</button>
      </div>
      <p className="text-[10px] text-slate-500">{tx('الجدول مقترح حسب سن الطفل، راجعه مع طبيب الأطفال. تقدر تعدّل أو تحذف أي بند.', 'Suggested by age — confirm with the pediatrician. You can delete any item.')}</p>
      {rows.map((v) => {
        const st = status(v);
        const phone = childPhone(child);
        return (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <p className="text-white">{v.vaccine_name}</p>
              {v.due_date && <p className="text-[10px] text-slate-500">{tx('الموعد', 'Due')}: {v.due_date}</p>}
            </div>
            <Badge tone={st.tone}>{st.text}</Badge>
            <div className="flex items-center gap-1.5" data-write="1">
              {!v.given_on && phone && v.due_date && (
                <button title={tx('تذكير ولي الأمر', 'Remind parent')} onClick={() => openWhatsApp(phone, tx(`تذكير من ${nursery}: موعد تطعيم ${child.full_name} (${v.vaccine_name}) يوم ${v.due_date}.`, `Reminder from ${nursery}: ${child.full_name}'s vaccine (${v.vaccine_name}) is due on ${v.due_date}.`))} className="rounded-lg border border-emerald-500/40 p-1.5 text-emerald-300 hover:bg-emerald-500/10"><MessageCircle className="h-3.5 w-3.5" /></button>
              )}
              <button title={v.given_on ? tx('إلغاء', 'Undo') : tx('تم', 'Mark given')} onClick={() => markDone(v, !v.given_on)} className={`rounded-lg border p-1.5 ${v.given_on ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(v)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TEMPLATES = (nursery: string, ar: boolean) =>
  ar
    ? [
        { label: 'إجازة', text: `السلام عليكم، نفيدكم بأن ${nursery} ستكون في إجازة يوم ... وتعود الدراسة يوم ... كل عام وأنتم بخير.` },
        { label: 'إعلان', text: `السلام عليكم، إعلان هام من ${nursery}: ...` },
        { label: 'تذكير بالسداد', text: `السلام عليكم، تذكير ودي من ${nursery} بسداد اشتراك هذا الشهر. شكراً لتعاونكم.` },
      ]
    : [
        { label: 'Holiday', text: `Hello, ${nursery} will be closed on ... and reopens on ... Best wishes.` },
        { label: 'Announcement', text: `Hello, an important announcement from ${nursery}: ...` },
        { label: 'Payment reminder', text: `Hello, a friendly reminder from ${nursery} to settle this month's fee. Thank you.` },
      ];

export const BulkMessageModal: React.FC<{ children: Child[]; onClose: () => void }> = ({ children, onClose }) => {
  const { isRTL, activeTenant, language } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const nursery = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';
  const [text, setText] = useState('');
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const seen = new Set<string>();
  const targets = children.filter((c) => c.status === 'active').filter((c) => {
    const p = phoneForWhatsApp(childPhone(c));
    if (!p || seen.has(p)) return false;
    seen.add(p);
    return true;
  });

  return (
    <Modal title={tx('رسالة لأولياء الأمور', 'Message parents')} onClose={onClose}>
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES(nursery, isRTL).map((t) => (
          <button key={t.label} onClick={() => setText(t.text)} className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">{t.label}</button>
        ))}
      </div>
      <textarea rows={4} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder={tx('اكتب الرسالة...', 'Write the message...')} />
      <p className="text-[11px] text-slate-400">{tx(`هتتبعت لـ ${targets.length} ولي أمر (أرقام مكررة بتتحسب مرة). الإرسال واحد واحد عبر واتساب.`, `${targets.length} parents (duplicates counted once). Sent one by one via WhatsApp.`)} {tx('تم', 'Sent')}: {Object.keys(sent).length}</p>
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {targets.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2">
            <div className="min-w-0"><p className="truncate text-xs font-bold text-white">{c.full_name}</p><p dir="ltr" className="text-[10px] text-slate-500">{childPhone(c)}</p></div>
            <button disabled={!text.trim()} onClick={() => { openWhatsApp(childPhone(c), text.trim()); setSent((s) => ({ ...s, [c.id]: true })); }} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40 ${sent[c.id] ? 'border-slate-700 text-slate-400' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'}`}>{sent[c.id] ? tx('إعادة', 'Again') : tx('إرسال', 'Send')}</button>
          </div>
        ))}
        {targets.length === 0 && <p className="py-4 text-center text-xs text-slate-500">{tx('مفيش أرقام موبايل مسجلة', 'No phone numbers on file')}</p>}
      </div>
    </Modal>
  );
};
