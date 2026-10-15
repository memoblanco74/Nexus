import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, FileText, Loader2, Plus, Search, Send, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { SaveButton } from '../ui/SaveButton';
import { Badge, Field, Modal, cardClass, inputClass } from './ui';
import { buildReportHtml, renderReportPdf, sendReportViaWhatsApp } from './reportPdf';
import { Child, DailyLog, MealEntry, NurseryCore, cairoToday, emptyLog, rowToLog } from './nurseryApi';

const nowHHMM = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false });

const TimeField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const { isRTL } = useApp();
  return (
    <div className="flex gap-1">
      <input type="time" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={() => onChange(nowHHMM())} className="shrink-0 rounded-xl border border-slate-700 px-2 text-[10px] font-semibold text-slate-300 hover:bg-slate-800">
        {isRTL ? 'الآن' : 'Now'}
      </button>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div className="space-y-2 rounded-2xl border border-slate-800 p-3">
    <div className="flex items-center justify-between">
      <h4 className="text-xs font-bold text-white">{title}</h4>
      {action}
    </div>
    {children}
  </div>
);

const AddBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20">
    <Plus className="h-3 w-3" />
    {label}
  </button>
);

const RemoveBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-500/10">
    <Trash2 className="h-3.5 w-3.5" />
  </button>
);

const MEAL_TYPES: MealEntry['type'][] = ['breakfast', 'lunch', 'snack'];

const ReportEditor: React.FC<{
  child: Child;
  day: string;
  initial: DailyLog;
  onClose: () => void;
  onSaved: () => void;
}> = ({ child, day, initial, onClose, onSaved }) => {
  const { isRTL, activeTenant, showToast, language } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [log, setLog] = useState<DailyLog>(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [sending, setSending] = useState(false);
  const phones = useMemo(
    () =>
      [
        { key: 'mother', label: tx('الأم', 'Mother'), phone: child.mother_phone },
        { key: 'father', label: tx('الأب', 'Father'), phone: child.father_phone },
        { key: 'guardian', label: tx('ولي الأمر', 'Guardian'), phone: child.guardian_phone },
      ].filter((p) => p.phone),
    [child, isRTL]
  );
  const [recipient, setRecipient] = useState(phones[0]?.key || '');

  const set = <K extends keyof DailyLog>(k: K, v: DailyLog[K]) => setLog((l) => ({ ...l, [k]: v }));
  const meal = (type: MealEntry['type']) => log.meals.find((m) => m.type === type) || { type, times: 0, note: '' };
  const setMeal = (type: MealEntry['type'], patch: Partial<MealEntry>) =>
    setLog((l) => {
      const cur = l.meals.find((m) => m.type === type) || { type, times: 0, note: '' };
      const next = { ...cur, ...patch };
      return { ...l, meals: [...l.meals.filter((m) => m.type !== type), next] };
    });
  const mealLabel = (t: string) => (t === 'breakfast' ? tx('الإفطار', 'Breakfast') : t === 'lunch' ? tx('الغداء', 'Lunch') : tx('السناكس', 'Snacks'));

  const save = async (): Promise<boolean> => {
    const payload = {
      tenant_id: activeTenant!.id,
      child_id: child.id,
      day,
      status: log.status,
      absence_reason: log.status === 'absent' ? log.absence_reason || null : null,
      arrival_time: log.arrival_time || null,
      departure_time: log.departure_time || null,
      received_by: log.received_by || null,
      departure_mode: log.departure_mode || null,
      transport_supervisor: log.transport_supervisor || null,
      delivered_to: log.delivered_to || null,
      delivered_time: log.delivered_time || null,
      used_transport: log.used_transport,
      supplies_brought: log.supplies_brought,
      supplies_note: log.supplies_note || null,
      meals: log.meals.filter((m) => m.times > 0 || m.note),
      diapers: log.diapers,
      medicines: log.medicines,
      naps: log.naps,
      clothes: log.clothes,
      daily_activities: log.daily_activities || null,
      break_time: log.break_time || null,
      fun_day: log.fun_day || null,
      teacher_comment: log.teacher_comment || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('nursery_daily_logs').upsert(payload, { onConflict: 'child_id,day' });
    if (error) {
      showToast(error.message);
      return false;
    }
    setBaseline(JSON.stringify(log));
    onSaved();
    return true;
  };

  const sendPdf = async () => {
    setSending(true);
    try {
      const html = buildReportHtml(child, log, language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '', isRTL);
      const blob = await renderReportPdf(html);
      const target = phones.find((p) => p.key === recipient)?.phone || '';
      const msg = isRTL ? `تقرير ${child.full_name} ليوم ${day}` : `${child.full_name} report for ${day}`;
      const safeName = `${child.full_name.replace(/[\\/:*?"<>|\s]+/g, '_')}_${day}.pdf`;
      const result = await sendReportViaWhatsApp(blob, safeName, target, msg);
      if (result === 'downloaded') showToast(tx('اتحمّل الـ PDF وفتحنا واتساب، أرفق الملف في المحادثة', 'PDF downloaded and WhatsApp opened, attach the file to the chat'));
    } catch (e: any) {
      showToast(e?.message || 'Error');
    }
    setSending(false);
  };

  const dirty = JSON.stringify(log) !== baseline;

  return (
    <Modal
      wide
      title={`${child.full_name} — ${day}`}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={sendPdf}
            disabled={sending || dirty}
            title={dirty ? tx('احفظ الأول', 'Save first') : ''}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {tx('PDF واتساب', 'PDF via WhatsApp')}
          </button>
          <SaveButton signature={JSON.stringify(log)} baseline={baseline} onSave={save} label={tx('حفظ', 'Save')} className="px-5 py-2" />
        </>
      }
    >
      {phones.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{tx('إرسال التقرير إلى:', 'Send to:')}</span>
          <select className={`${inputClass} max-w-[14rem]`} value={recipient} onChange={(e) => setRecipient(e.target.value)}>
            {phones.map((p) => (
              <option key={p.key} value={p.key}>{`${p.label} — ${p.phone}`}</option>
            ))}
          </select>
        </div>
      )}
      {phones.length === 0 && <p className="text-[11px] text-amber-400">{tx('مفيش رقم موبايل مسجل لولي الأمر. أضفه من بيانات الطفل.', 'No parent phone saved for this child.')}</p>}

      <div className="grid grid-cols-2 gap-2">
        {(['present', 'absent'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => set('status', s)}
            className={`rounded-xl border py-2.5 text-xs font-bold ${
              log.status === s
                ? s === 'present'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-red-500 bg-red-500/20 text-red-300'
                : 'border-slate-800 text-slate-400'
            }`}
          >
            {s === 'present' ? tx('حاضر', 'Present') : tx('غائب', 'Absent')}
          </button>
        ))}
      </div>

      {log.status === 'absent' ? (
        <Field label={tx('سبب الغياب', 'Absence reason')}>
          <input className={inputClass} value={log.absence_reason} onChange={(e) => set('absence_reason', e.target.value)} />
        </Field>
      ) : (
        <>
          <Section title={tx('الوصول والانصراف', 'Arrival & departure')}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx('وصل الساعة', 'Arrival')}>
                <TimeField value={log.arrival_time} onChange={(v) => set('arrival_time', v)} />
              </Field>
              <Field label={tx('مشي الساعة', 'Departure')}>
                <TimeField value={log.departure_time} onChange={(v) => set('departure_time', v)} />
              </Field>
              <Field label={tx('طريقة الانصراف', 'Departure mode')} className="col-span-2">
                <select className={inputClass} value={log.departure_mode} onChange={(e) => set('departure_mode', e.target.value as DailyLog['departure_mode'])}>
                  <option value="">—</option>
                  <option value="pickup">{tx('استلمه من الحضانة', 'Picked up at nursery')}</option>
                  <option value="transport">{tx('توصيل للبيت (مواصلات)', 'Transport to home')}</option>
                </select>
              </Field>
              {log.departure_mode === 'pickup' && (
                <Field label={tx('مين استلمه', 'Received by')} className="col-span-2">
                  <input className={inputClass} value={log.received_by} onChange={(e) => set('received_by', e.target.value)} />
                </Field>
              )}
              {log.departure_mode === 'transport' && (
                <>
                  <Field label={tx('المشرف اللي هيوصله', 'Transport supervisor')} className="col-span-2">
                    <input className={inputClass} value={log.transport_supervisor} onChange={(e) => set('transport_supervisor', e.target.value)} />
                  </Field>
                  <Field label={tx('سلّمه لمين', 'Handed to')}>
                    <input className={inputClass} value={log.delivered_to} onChange={(e) => set('delivered_to', e.target.value)} />
                  </Field>
                  <Field label={tx('وقت التسليم', 'Handed at')}>
                    <TimeField value={log.delivered_time} onChange={(v) => set('delivered_time', v)} />
                  </Field>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-blue-500" checked={log.used_transport} onChange={(e) => set('used_transport', e.target.checked)} />
                {tx('استخدم المواصلات', 'Used transport')}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-blue-500" checked={log.supplies_brought} onChange={(e) => set('supplies_brought', e.target.checked)} />
                {tx('جاب سابلايز', 'Brought supplies')}
              </label>
            </div>
            {log.supplies_brought && <input className={inputClass} placeholder={tx('إيه اللي جابه؟', 'What was brought?')} value={log.supplies_note} onChange={(e) => set('supplies_note', e.target.value)} />}
          </Section>

          <Section title={tx('الوجبات', 'Meals')}>
            {MEAL_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-slate-300">{mealLabel(type)}</span>
                <input type="number" min={0} className={`${inputClass} max-w-[5rem] text-center`} value={meal(type).times || ''} placeholder={tx('مرات', 'times')} onChange={(e) => setMeal(type, { times: Math.max(0, Number(e.target.value) || 0) })} />
                <input className={inputClass} placeholder={tx('ملاحظة (اتغدى كويس، أكل نص...)', 'Note')} value={meal(type).note} onChange={(e) => setMeal(type, { note: e.target.value })} />
              </div>
            ))}
          </Section>

          <Section title={tx('الحفاضات', 'Diapers')} action={<AddBtn label={tx('إضافة', 'Add')} onClick={() => set('diapers', [...log.diapers, { time: nowHHMM(), kind: 'wet' }])} />}>
            {log.diapers.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="time" className={inputClass} value={d.time} onChange={(e) => set('diapers', log.diapers.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
                <select className={inputClass} value={d.kind} onChange={(e) => set('diapers', log.diapers.map((x, j) => (j === i ? { ...x, kind: e.target.value as any } : x)))}>
                  <option value="wet">{tx('بول', 'Wet')}</option>
                  <option value="dirty">{tx('براز', 'Dirty')}</option>
                  <option value="both">{tx('بول وبراز', 'Both')}</option>
                </select>
                <RemoveBtn onClick={() => set('diapers', log.diapers.filter((_, j) => j !== i))} />
              </div>
            ))}
          </Section>

          <Section title={tx('الدواء', 'Medicine')} action={<AddBtn label={tx('إضافة', 'Add')} onClick={() => set('medicines', [...log.medicines, { name: '', reason: '', time: nowHHMM() }])} />}>
            {log.medicines.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_6.5rem_auto] items-center gap-2">
                <input className={inputClass} placeholder={tx('اسم الدواء', 'Name')} value={m.name} onChange={(e) => set('medicines', log.medicines.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className={inputClass} placeholder={tx('ليه؟', 'Why?')} value={m.reason} onChange={(e) => set('medicines', log.medicines.map((x, j) => (j === i ? { ...x, reason: e.target.value } : x)))} />
                <input type="time" className={inputClass} value={m.time} onChange={(e) => set('medicines', log.medicines.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
                <RemoveBtn onClick={() => set('medicines', log.medicines.filter((_, j) => j !== i))} />
              </div>
            ))}
          </Section>

          <Section title={tx('النوم', 'Sleep')} action={<AddBtn label={tx('إضافة', 'Add')} onClick={() => set('naps', [...log.naps, { from: nowHHMM(), to: '' }])} />}>
            {log.naps.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{tx('نام', 'From')}</span>
                <input type="time" className={inputClass} value={n.from} onChange={(e) => set('naps', log.naps.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))} />
                <span className="text-[11px] text-slate-400">{tx('صحي', 'To')}</span>
                <input type="time" className={inputClass} value={n.to} onChange={(e) => set('naps', log.naps.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} />
                <RemoveBtn onClick={() => set('naps', log.naps.filter((_, j) => j !== i))} />
              </div>
            ))}
          </Section>

          <Section title={tx('تغيير الهدوم', 'Clothes changes')} action={<AddBtn label={tx('إضافة', 'Add')} onClick={() => set('clothes', [...log.clothes, { time: nowHHMM(), note: '' }])} />}>
            {log.clothes.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="time" className={`${inputClass} max-w-[7.5rem]`} value={c.time} onChange={(e) => set('clothes', log.clothes.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
                <input className={inputClass} placeholder={tx('السبب', 'Reason')} value={c.note} onChange={(e) => set('clothes', log.clothes.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                <RemoveBtn onClick={() => set('clothes', log.clothes.filter((_, j) => j !== i))} />
              </div>
            ))}
          </Section>

          <Section title={tx('اليوم الدراسي', 'School day')}>
            <Field label={tx('أخد إيه في اليوم الدراسي', 'What the child did')}>
              <textarea rows={2} className={inputClass} value={log.daily_activities} onChange={(e) => set('daily_activities', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx('البريك امتى', 'Break time')}>
                <input className={inputClass} value={log.break_time} onChange={(e) => set('break_time', e.target.value)} />
              </Field>
              <Field label={tx('Fun day', 'Fun day')}>
                <input className={inputClass} value={log.fun_day} onChange={(e) => set('fun_day', e.target.value)} />
              </Field>
            </div>
          </Section>
        </>
      )}

      <Field label={tx('رسالة المعلمة لولي الأمر (اختياري)', 'Teacher comment to parent (optional)')}>
        <textarea rows={3} className={inputClass} value={log.teacher_comment} onChange={(e) => set('teacher_comment', e.target.value)} />
      </Field>
    </Modal>
  );
};

export const NurseryDailyView: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, activeTenant, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [day, setDay] = useState(cairoToday());
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Child | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!activeTenant) return;
    const { data } = await supabase.from('nursery_daily_logs').select('*').eq('tenant_id', activeTenant.id).eq('day', day);
    const map: Record<string, DailyLog> = {};
    (data || []).forEach((r: any) => {
      map[r.child_id] = rowToLog(r);
    });
    setLogs(map);
  }, [activeTenant, day]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const active = core.children.filter((c) => c.status === 'active');
  const needle = q.trim().toLowerCase();
  const list = active.filter((c) => !needle || c.full_name.toLowerCase().includes(needle));
  const present = active.filter((c) => logs[c.id]?.status === 'present').length;
  const absent = active.filter((c) => logs[c.id]?.status === 'absent').length;

  const mark = async (child: Child, status: 'present' | 'absent') => {
    setBusyId(child.id);
    const existing = logs[child.id];
    const payload: any = { tenant_id: activeTenant!.id, child_id: child.id, day, status, updated_at: new Date().toISOString() };
    if (status === 'present' && !existing?.arrival_time && day === cairoToday()) payload.arrival_time = nowHHMM();
    const { error } = await supabase.from('nursery_daily_logs').upsert(payload, { onConflict: 'child_id,day' });
    setBusyId(null);
    if (error) {
      showToast(error.message);
      return;
    }
    loadLogs();
  };

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-white">
            <CalendarCheck className="h-5 w-5 text-emerald-400" />
            {tx('اليومية', 'Daily log')}
          </h1>
          <p className="mt-1 text-xs text-slate-400">{tx('حضور وغياب كل طفل وتقرير يومه', 'Attendance and daily report per child')}</p>
        </div>
        <input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} className={`${inputClass} max-w-[11rem]`} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`${cardClass} text-center`}>
          <p className="text-lg font-extrabold text-emerald-400">{present}</p>
          <p className="text-[11px] text-slate-400">{tx('حاضر', 'Present')}</p>
        </div>
        <div className={`${cardClass} text-center`}>
          <p className="text-lg font-extrabold text-red-400">{absent}</p>
          <p className="text-[11px] text-slate-400">{tx('غائب', 'Absent')}</p>
        </div>
        <div className={`${cardClass} text-center`}>
          <p className="text-lg font-extrabold text-amber-400">{Math.max(active.length - present - absent, 0)}</p>
          <p className="text-[11px] text-slate-400">{tx('لم يُسجَّل', 'Unmarked')}</p>
        </div>
      </div>

      <div className="relative">
        <Search className={`absolute top-2.5 h-4 w-4 text-slate-500 ${isRTL ? 'right-3' : 'left-3'}`} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx('بحث باسم الطفل...', 'Search child...')} className={`${inputClass} ${isRTL ? 'pr-9' : 'pl-9'}`} />
      </div>

      {core.loading ? (
        <p className="py-8 text-center text-xs text-slate-500">...</p>
      ) : list.length === 0 ? (
        <div className={`${cardClass} py-10 text-center text-xs text-slate-500`}>{tx('أضف أطفال أولًا من صفحة الأطفال', 'Add children first')}</div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => {
            const l = logs[c.id];
            return (
              <div key={c.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-3 !py-3`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{c.full_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {!l && <Badge tone="muted">{tx('لم يُسجَّل', 'Unmarked')}</Badge>}
                    {l?.status === 'present' && <Badge tone="ok">{tx('حاضر', 'Present')}{l.arrival_time ? ` ${l.arrival_time}` : ''}</Badge>}
                    {l?.status === 'absent' && <Badge tone="bad">{tx('غائب', 'Absent')}</Badge>}
                    {l?.departure_time && <Badge tone="muted">{tx('انصرف', 'Left')} {l.departure_time}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button data-write="1" disabled={busyId === c.id} onClick={() => mark(c, 'present')} className={`rounded-lg border p-2 ${l?.status === 'present' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`} title={tx('حاضر', 'Present')}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button data-write="1" disabled={busyId === c.id} onClick={() => mark(c, 'absent')} className={`rounded-lg border p-2 ${l?.status === 'absent' ? 'border-red-500 bg-red-500/20 text-red-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`} title={tx('غائب', 'Absent')}>
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditing(c)} className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20">
                    <FileText className="h-4 w-4" />
                    {tx('التقرير', 'Report')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ReportEditor
          key={editing.id + day}
          child={editing}
          day={day}
          initial={logs[editing.id] || emptyLog(editing.id, day)}
          onClose={() => setEditing(null)}
          onSaved={loadLogs}
        />
      )}
    </div>
  );
};
