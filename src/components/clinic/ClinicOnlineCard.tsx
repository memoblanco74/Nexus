import React, { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, Link2, Pencil, Plus, RefreshCw, Stethoscope } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { askConfirm } from '../../lib/dialog';
import { Badge, Field, Modal, cardClass, inputClass } from '../nursery/ui';

export interface Doctor {
  id: string; name: string; name_ar: string | null; department: string | null; department_ar: string | null;
  work_days: number[]; start_time: string; end_time: string; slot_minutes: number; commission_percent: number; active: boolean;
}

const DAYS: Array<[number, string, string]> = [[6, 'سبت', 'Sat'], [0, 'أحد', 'Sun'], [1, 'اثنين', 'Mon'], [2, 'ثلاثاء', 'Tue'], [3, 'أربع', 'Wed'], [4, 'خميس', 'Thu'], [5, 'جمعة', 'Fri']];

export const pageLink = (kind: 'book' | 'queue', token: string) => `${window.location.origin}${window.location.pathname}#/${kind}/${token}`;

const DoctorForm: React.FC<{ doctor: Doctor | null; tenantId: string; onClose: () => void; onSaved: () => void }> = ({ doctor, tenantId, onClose, onSaved }) => {
  const { isRTL, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [f, setF] = useState({
    name: doctor?.name || '', name_ar: doctor?.name_ar || '', department: doctor?.department || '', department_ar: doctor?.department_ar || '',
    work_days: doctor?.work_days || [6, 0, 1, 2, 3, 4], start: (doctor?.start_time || '10:00').slice(0, 5), end: (doctor?.end_time || '18:00').slice(0, 5),
    slot: String(doctor?.slot_minutes ?? 20), commission: String(doctor?.commission_percent ?? 0), active: doctor?.active ?? true,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const slot = Number(f.slot);
    const commission = Number(f.commission || 0);
    if (!(f.name.trim() || f.name_ar.trim())) { showToast(tx('اكتب اسم الطبيب', 'Enter the doctor name')); return; }
    if (!(slot >= 5 && slot <= 240) || !(commission >= 0 && commission <= 100) || f.start >= f.end) { showToast(tx('راجع المواعيد ومدة الكشف والعمولة', 'Check hours, slot length and commission')); return; }
    setBusy(true);
    const payload = {
      name: f.name.trim() || f.name_ar.trim(), name_ar: f.name_ar.trim() || f.name.trim(), department: f.department.trim() || null, department_ar: f.department_ar.trim() || f.department.trim() || null,
      work_days: f.work_days, start_time: f.start, end_time: f.end, slot_minutes: slot, commission_percent: commission, active: f.active,
    };
    const { error } = doctor ? await supabase.from('clinic_doctors').update(payload).eq('id', doctor.id) : await supabase.from('clinic_doctors').insert({ ...payload, tenant_id: tenantId });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!doctor || !(await askConfirm({ danger: true, message: tx('حذف الطبيب؟ الحجوزات القديمة هتفضل موجودة.', 'Delete this doctor? Past bookings stay.') }))) return;
    const { error } = await supabase.from('clinic_doctors').delete().eq('id', doctor.id);
    if (error) showToast(error.message);
    else { onSaved(); onClose(); }
  };

  return (
    <Modal title={doctor ? tx('تعديل طبيب', 'Edit doctor') : tx('طبيب جديد', 'New doctor')} onClose={onClose}
      footer={<>{doctor && <button onClick={remove} className="rounded-xl border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10">{tx('حذف', 'Delete')}</button>}<button disabled={busy} onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">{tx('حفظ', 'Save')}</button></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={tx('الاسم (عربي)', 'Name (Arabic)')}><input className={inputClass} value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} /></Field>
        <Field label={tx('الاسم (إنجليزي)', 'Name (English)')}><input className={inputClass} dir="ltr" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={tx('التخصص (عربي)', 'Specialty (Arabic)')}><input className={inputClass} value={f.department_ar} onChange={(e) => setF({ ...f, department_ar: e.target.value })} /></Field>
        <Field label={tx('التخصص (إنجليزي)', 'Specialty (English)')}><input className={inputClass} dir="ltr" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></Field>
      </div>
      <Field label={tx('أيام العمل', 'Working days')}>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map(([d, ar, en]) => (
            <button key={d} type="button" onClick={() => setF({ ...f, work_days: f.work_days.includes(d) ? f.work_days.filter((x) => x !== d) : [...f.work_days, d] })} className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${f.work_days.includes(d) ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-slate-700 text-slate-400'}`}>{isRTL ? ar : en}</button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label={tx('من', 'From')}><input type="time" className={inputClass} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
        <Field label={tx('إلى', 'To')}><input type="time" className={inputClass} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
        <Field label={tx('مدة الكشف (دقيقة)', 'Slot (min)')}><input className={inputClass} inputMode="numeric" value={f.slot} onChange={(e) => setF({ ...f, slot: e.target.value })} /></Field>
        <Field label={tx('عمولة %', 'Commission %')}><input className={inputClass} inputMode="decimal" value={f.commission} onChange={(e) => setF({ ...f, commission: e.target.value })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" className="h-4 w-4 accent-blue-500" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />{tx('يستقبل حجوزات', 'Accepting bookings')}</label>
    </Modal>
  );
};

export const ClinicOnlineCard: React.FC = () => {
  const { isRTL, activeTenant, showToast, refreshTenants, language } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editing, setEditing] = useState<Doctor | null | 'new'>(null);
  const [busy, setBusy] = useState(false);
  const tenantId = activeTenant?.id;
  const token = activeTenant?.publicToken;
  const enabled = !!activeTenant?.onlineBookingEnabled;

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('clinic_doctors').select('*').eq('tenant_id', tenantId).order('name');
    setDoctors(((data as any[]) || []).map((d) => ({ ...d, commission_percent: Number(d.commission_percent) })));
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  if (!activeTenant || !tenantId) return null;

  const call = async (enable: boolean | null, regen: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc('fn_set_online_booking', { p_tenant_id: tenantId, p_enabled: enable, p_regenerate: regen });
    setBusy(false);
    if (error) showToast(error.message);
    else refreshTenants();
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); showToast(tx('تم نسخ اللينك', 'Link copied')); } catch { /* ignore */ } };

  const bookLink = token ? pageLink('book', token) : '';
  const queueLink = token ? pageLink('queue', token) : '';

  return (
    <div className={`${cardClass} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Stethoscope className="h-4 w-4 text-emerald-400" />{tx('الأطباء والحجز أونلاين', 'Doctors & online booking')}</h3>
        <button data-write="1" onClick={() => setEditing('new')} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500"><Plus className="h-3.5 w-3.5" />{tx('طبيب', 'Doctor')}</button>
      </div>

      {doctors.length === 0 ? <p className="text-[11px] text-slate-500">{tx('ضيف الأطباء بمواعيدهم عشان المرضى يحجزوا من اللينك.', 'Add doctors with their hours so patients can book from the link.')}</p> : (
        <div className="space-y-2">
          {doctors.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{language === 'ar' ? d.name_ar || d.name : d.name} <span className="font-normal text-slate-500">{language === 'ar' ? d.department_ar || d.department : d.department}</span></p>
                <p className="text-[10px] text-slate-500">{d.start_time.slice(0, 5)}–{d.end_time.slice(0, 5)} • {d.slot_minutes} {tx('دقيقة', 'min')} • {tx('عمولة', 'Commission')} {d.commission_percent}%</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!d.active && <Badge tone="muted">{tx('متوقف', 'Off')}</Badge>}
                <button data-write="1" onClick={() => setEditing(d)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-slate-800 p-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-xs font-bold text-white"><Link2 className="h-4 w-4 text-indigo-400" />{tx('لينك الحجز للمرضى', 'Patient booking link')}</h4>
          <Badge tone={enabled ? 'ok' : 'muted'}>{enabled ? tx('مفعّل', 'Enabled') : tx('متوقف', 'Disabled')}</Badge>
        </div>
        <p className="text-[11px] text-slate-400">{tx('المريض يختار الطبيب والميعاد الفاضي ويسجّل اسمه وموبايله، والحجز بيظهر عندك "قيد المراجعة" لتأكيده.', 'Patients pick a doctor and a free slot; the booking appears as pending for you to confirm.')}</p>
        {enabled && bookLink && (
          <div className="flex gap-2">
            <input readOnly dir="ltr" value={bookLink} className={`${inputClass} text-[10px]`} onFocus={(e) => e.currentTarget.select()} />
            <button onClick={() => copy(bookLink)} className="shrink-0 rounded-xl border border-slate-700 px-3 text-slate-300 hover:bg-slate-800"><Copy className="h-4 w-4" /></button>
            <a href={bookLink} target="_blank" rel="noreferrer" className="flex shrink-0 items-center rounded-xl border border-slate-700 px-3 text-slate-300 hover:bg-slate-800"><ExternalLink className="h-4 w-4" /></a>
          </div>
        )}
        <div className="flex flex-wrap gap-2" data-write="1">
          <button disabled={busy} onClick={() => call(!enabled, false)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">{enabled ? tx('إيقاف الحجز أونلاين', 'Disable') : tx('تفعيل الحجز أونلاين', 'Enable')}</button>
          <button disabled={busy} onClick={async () => { if (await askConfirm({ danger: true, message: tx('اللينكات القديمة (الحجز وشاشة الانتظار) هتبطل تشتغل. متأكد؟', 'Old links (booking and queue screen) will stop working. Continue?') })) call(null, true); }} className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"><RefreshCw className="h-3.5 w-3.5" />{tx('لينك جديد', 'New link')}</button>
        </div>
        {queueLink && (
          <div className="border-t border-slate-800 pt-2">
            <p className="mb-1 text-[11px] text-slate-400">{tx('شاشة دور الانتظار (افتحها على شاشة في الاستقبال):', 'Queue display screen (open on a reception screen):')}</p>
            <div className="flex gap-2">
              <input readOnly dir="ltr" value={queueLink} className={`${inputClass} text-[10px]`} onFocus={(e) => e.currentTarget.select()} />
              <button onClick={() => copy(queueLink)} className="shrink-0 rounded-xl border border-slate-700 px-3 text-slate-300 hover:bg-slate-800"><Copy className="h-4 w-4" /></button>
              <a href={queueLink} target="_blank" rel="noreferrer" className="flex shrink-0 items-center rounded-xl border border-slate-700 px-3 text-slate-300 hover:bg-slate-800"><ExternalLink className="h-4 w-4" /></a>
            </div>
          </div>
        )}
      </div>

      {editing && <DoctorForm doctor={editing === 'new' ? null : editing} tenantId={tenantId} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
};
