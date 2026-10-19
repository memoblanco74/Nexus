import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, ListOrdered, SkipForward, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { cairoToday } from '../nursery/nurseryApi';
import { Badge, inputClass } from '../nursery/ui';
import { pageLink } from './ClinicOnlineCard';

interface Ticket { id: string; number: number; patient_name: string | null; doctor_name: string | null; status: 'waiting' | 'serving' | 'done' | 'skipped' }

export const QueuePanel: React.FC = () => {
  const { isRTL, activeTenant, bookings, showToast, isReadOnly } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [name, setName] = useState('');
  const [doctor, setDoctor] = useState('');
  const [busy, setBusy] = useState(false);
  const tenantId = activeTenant?.id;

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('queue_tickets').select('id, number, patient_name, doctor_name, status').eq('tenant_id', tenantId).eq('day', cairoToday()).order('number');
    setTickets((data as Ticket[]) || []);
  }, [tenantId]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 8000);
    return () => clearInterval(t);
  }, [load]);

  if (!tenantId) return null;

  const today = cairoToday();
  const todayBookings = bookings.filter((b) => b.scheduledAt && b.status !== 'cancelled' && new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date(b.scheduledAt)) === today);
  const serving = tickets.find((t) => t.status === 'serving');
  const waiting = tickets.filter((t) => t.status === 'waiting');

  const add = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('fn_queue_add', { p_tenant_id: tenantId, p_patient: name, p_doctor: doctor, p_booking_id: null });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    setName('');
    load();
  };
  const next = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('fn_queue_next', { p_tenant_id: tenantId });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    if (data === null) showToast(tx('لا يوجد منتظرين', 'Nobody is waiting'));
    load();
  };
  const setStatus = async (t: Ticket, status: Ticket['status']) => {
    const { error } = await supabase.from('queue_tickets').update({ status }).eq('id', t.id);
    if (error) showToast(error.message);
    else load();
  };

  const link = activeTenant?.publicToken ? pageLink('queue', activeTenant.publicToken) : '';

  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-slate-800 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><ListOrdered className="h-4 w-4 text-indigo-400" />{tx('دور الانتظار', 'Waiting queue')}</h3>
        {link && <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"><ExternalLink className="h-3.5 w-3.5" />{tx('فتح شاشة العرض', 'Open display screen')}</a>}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900/60 p-3">
        <div className="text-center">
          <p className="text-[10px] text-slate-500">{tx('الدور الحالي', 'Now serving')}</p>
          <p className="text-4xl font-black text-emerald-400">{serving ? serving.number : '—'}</p>
        </div>
        <div className="min-w-0 flex-1 text-xs text-slate-300">
          {serving ? <p className="truncate font-semibold text-white">{serving.patient_name || tx('بدون اسم', 'No name')}{serving.doctor_name ? ` • ${serving.doctor_name}` : ''}</p> : <p className="text-slate-500">{tx('لا يوجد مريض داخل الكشف', 'No patient in consultation')}</p>}
          <p className="text-slate-500">{tx(`في الانتظار: ${waiting.length}`, `Waiting: ${waiting.length}`)}</p>
        </div>
        <button data-write="1" disabled={busy || isReadOnly} onClick={next} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"><SkipForward className="h-4 w-4" />{tx('نداء التالي', 'Call next')}</button>
      </div>

      <div className="flex flex-wrap gap-2" data-write="1">
        <input list="queue-names" className={`${inputClass} max-w-[14rem]`} placeholder={tx('اسم المريض (أو اختار من حجوزات اليوم)', 'Patient name')} value={name} onChange={(e) => setName(e.target.value)} />
        <datalist id="queue-names">{todayBookings.map((b) => <option key={b.id} value={isRTL ? b.patientNameAr : b.patientName} />)}</datalist>
        <input className={`${inputClass} max-w-[10rem]`} placeholder={tx('الطبيب (اختياري)', 'Doctor (optional)')} value={doctor} onChange={(e) => setDoctor(e.target.value)} />
        <button disabled={busy} onClick={add} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">{tx('إضافة للدور', 'Add to queue')}</button>
      </div>

      {tickets.filter((t) => t.status === 'waiting' || t.status === 'serving').length > 0 && (
        <div className="space-y-1.5">
          {tickets.filter((t) => t.status === 'waiting' || t.status === 'serving').map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2"><b className="text-base text-white">{t.number}</b><span className="truncate text-slate-300">{t.patient_name || '—'}{t.doctor_name ? ` • ${t.doctor_name}` : ''}</span></span>
              <span className="flex shrink-0 items-center gap-1.5" data-write="1">
                {t.status === 'serving' ? <><Badge tone="ok">{tx('داخل الكشف', 'In consultation')}</Badge><button onClick={() => setStatus(t, 'done')} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"><UserCheck className="h-3.5 w-3.5" />{tx('إنهاء', 'Done')}</button></> : <button onClick={() => setStatus(t, 'skipped')} className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800">{tx('تخطي', 'Skip')}</button>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
