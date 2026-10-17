import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { buildReportHtml, renderReportPdf } from '../nursery/reportPdf';
import { Child, DailyLog, rowToLog } from '../nursery/nurseryApi';

interface PortalData {
  child: { full_name: string; birth_date: string | null; allergies: string | null };
  nursery: { name: string; name_ar: string | null } | null;
  logs: any[];
  payments: { period: string; due: number; paid: number }[];
  vaccinations: { vaccine_name: string; due_date: string | null; given_on: string | null }[];
}

export const ParentPortal: React.FC<{ token: string }> = ({ token }) => {
  const [ar, setAr] = useState(true);
  const [data, setData] = useState<PortalData | null | undefined>(undefined);
  const [tab, setTab] = useState<'report' | 'payments' | 'vaccines'>('report');
  const [day, setDay] = useState('');
  const [busy, setBusy] = useState(false);
  const tx = (a: string, e: string) => (ar ? a : e);

  useEffect(() => {
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.documentElement.lang = ar ? 'ar' : 'en';
  }, [ar]);

  useEffect(() => {
    supabase.rpc('fn_parent_portal', { p_token: token }).then(({ data: d }) => {
      const parsed = (d as PortalData) || null;
      setData(parsed);
      if (parsed?.logs?.length) setDay(parsed.logs[0].day);
    });
  }, [token]);

  const nurseryName = data?.nursery ? (ar ? data.nursery.name_ar || data.nursery.name : data.nursery.name) : '';
  const log: DailyLog | null = useMemo(() => {
    const row = data?.logs.find((l) => l.day === day);
    return row ? rowToLog(row) : null;
  }, [data, day]);
  const childObj = useMemo(() => ({ full_name: data?.child.full_name || '' } as Child), [data]);
  const html = useMemo(() => (log ? buildReportHtml(childObj, log, nurseryName, ar) : ''), [log, childObj, nurseryName, ar]);

  const downloadPdf = async () => {
    if (!html) return;
    setBusy(true);
    try {
      const blob = await renderReportPdf(html);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data!.child.full_name.replace(/\s+/g, '_')}_${day}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setBusy(false);
    }
  };

  const shell = 'min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans';

  if (data === undefined) return <div className={`${shell} flex items-center justify-center text-sm text-slate-500`}>...</div>;
  if (data === null)
    return (
      <div className={`${shell} flex items-center justify-center p-6 text-center`}>
        <div className="max-w-sm rounded-2xl bg-white p-6 shadow">
          <p className="text-base font-extrabold">{tx('اللينك غير صالح أو متوقف', 'This link is invalid or disabled')}</p>
          <p className="mt-2 text-xs text-slate-500">{tx('اطلب من الحضانة لينك جديد.', 'Ask the nursery for a new link.')}</p>
        </div>
      </div>
    );

  const monthName = (p: string) => new Date(p + '-01T00:00:00Z').toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const scale = typeof window !== 'undefined' ? Math.min(1, (window.innerWidth - 24) / 760) : 1;

  return (
    <div className={shell}>
      <div className="mx-auto max-w-3xl space-y-4 p-3 pb-12">
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-600 p-4 text-white shadow">
          <div>
            <p className="text-xs opacity-80">{nurseryName}</p>
            <h1 className="text-lg font-extrabold">{data.child.full_name}</h1>
          </div>
          <button onClick={() => setAr(!ar)} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold">{ar ? 'English' : 'عربي'}</button>
        </div>

        {data.child.allergies && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><b>{tx('حساسية مسجلة:', 'Allergies on file:')}</b> {data.child.allergies}</div>}

        <div className="flex gap-2">
          {(['report', 'payments', 'vaccines'] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${tab === k ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
              {k === 'report' ? tx('تقرير اليوم', 'Daily report') : k === 'payments' ? tx('المدفوعات', 'Payments') : tx('التطعيمات', 'Vaccines')}
            </button>
          ))}
        </div>

        {tab === 'report' && (
          <div className="space-y-3">
            {data.logs.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">{tx('لا توجد تقارير بعد', 'No reports yet')}</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <select value={day} onChange={(e) => setDay(e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                    {data.logs.map((l) => <option key={l.day} value={l.day}>{l.day}</option>)}
                  </select>
                  <button disabled={busy} onClick={downloadPdf} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{tx('تحميل PDF', 'Download PDF')}</button>
                </div>
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm" style={{ height: html ? undefined : 0 }}>
                  <div style={{ zoom: scale } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-2">
            {data.payments.map((p) => {
              const rest = Math.max(Number(p.due) - Number(p.paid), 0);
              const state = Number(p.due) === 0 ? 'none' : rest === 0 ? 'paid' : Number(p.paid) > 0 ? 'part' : 'unpaid';
              return (
                <div key={p.period} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-bold">{monthName(p.period)}</p>
                    <p className="text-[11px] text-slate-500">{tx('المطلوب', 'Due')} {Number(p.due).toLocaleString()} • {tx('المدفوع', 'Paid')} {Number(p.paid).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${state === 'paid' ? 'bg-emerald-100 text-emerald-700' : state === 'none' ? 'bg-slate-100 text-slate-500' : state === 'part' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {state === 'paid' ? tx('مدفوع', 'Paid') : state === 'none' ? tx('لا اشتراك', 'No fees') : `${tx('متبقي', 'Due')} ${rest.toLocaleString()}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'vaccines' && (
          <div className="space-y-2">
            {data.vaccinations.length === 0 && <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">{tx('لا توجد تطعيمات مسجلة', 'No vaccines on file')}</div>}
            {data.vaccinations.map((v, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-bold">{v.vaccine_name}</p>
                  {v.due_date && <p className="text-[11px] text-slate-500">{tx('الموعد', 'Due')}: {v.due_date}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${v.given_on ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{v.given_on ? `${tx('تم', 'Given')} ${v.given_on}` : tx('قادم', 'Upcoming')}</span>
              </div>
            ))}
          </div>
        )}
        <p className="pt-2 text-center text-[10px] text-slate-400">Nexus</p>
      </div>
    </div>
  );
};
