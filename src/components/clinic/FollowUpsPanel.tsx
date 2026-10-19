import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { cairoToday, phoneForWhatsApp } from '../nursery/nurseryApi';
import { Badge } from '../nursery/ui';

interface Row { id: string; title: string; follow_up_date: string; patients: { full_name: string | null; name_ar: string | null; phone: string | null } | null }

export const FollowUpsPanel: React.FC = () => {
  const { isRTL, activeTenant, language, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [rows, setRows] = useState<Row[]>([]);
  const tenantId = activeTenant?.id;
  const clinic = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';

  const load = useCallback(async () => {
    if (!tenantId) return;
    const lim = new Date(Date.now() + 3 * 86400000);
    const limit = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(lim);
    const { data, error } = await supabase.from('patient_records').select('id, title, follow_up_date, patients(full_name, name_ar, phone)').eq('tenant_id', tenantId).eq('follow_up_done', false).not('follow_up_date', 'is', null).lte('follow_up_date', limit).order('follow_up_date');
    setRows(error ? [] : ((data as any[]) || []));
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  if (rows.length === 0) return null;
  const today = cairoToday();

  const remind = (r: Row) => {
    const p = r.patients;
    const phone = p?.phone || '';
    if (!phone) { showToast(tx('مفيش رقم موبايل للمريض', 'No phone number')); return; }
    const name = (isRTL ? p?.name_ar : p?.full_name) || p?.full_name || '';
    const msg = isRTL ? `أهلاً ${name}، تذكير من ${clinic} بميعاد المتابعة يوم ${r.follow_up_date}. نتمنى لك الشفاء العاجل.` : `Hello ${name}, a reminder from ${clinic} about your follow-up on ${r.follow_up_date}. Wishing you a speedy recovery.`;
    window.open(`https://wa.me/${phoneForWhatsApp(phone)}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const done = async (r: Row) => {
    const { error } = await supabase.from('patient_records').update({ follow_up_done: true }).eq('id', r.id);
    if (error) showToast(error.message);
    else load();
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-300"><CalendarClock className="h-4 w-4" />{tx(`متابعات مستحقة (${rows.length})`, `Follow-ups due (${rows.length})`)}</h3>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs">
            <span className="min-w-0 truncate font-semibold text-white">{(isRTL ? r.patients?.name_ar : r.patients?.full_name) || r.patients?.full_name || '—'} <span className="font-normal text-slate-500">• {r.follow_up_date}</span></span>
            <span className="flex shrink-0 items-center gap-1.5" data-write="1">
              {r.follow_up_date < today && <Badge tone="bad">{tx('متأخرة', 'Overdue')}</Badge>}
              <button onClick={() => remind(r)} className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"><MessageCircle className="h-3.5 w-3.5" />{tx('تذكير', 'Remind')}</button>
              <button onClick={() => done(r)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800" title={tx('تمت', 'Done')}><Check className="h-3.5 w-3.5" /></button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
