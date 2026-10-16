import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';
import { exportPaymentsPdf, exportPaymentsXlsx, fetchPayments } from '../../lib/paymentsExport';

interface Reports {
  monthly: { month: string; revenue: number; renewals: number; new_tenants: number }[];
  by_system: { name_ar: string; name_en: string; count: number }[];
  source: { referral: number; direct: number };
  renewal: { eligible: number; renewed: number };
  expiring: { id: string; name: string; expires_on: string; days: number; mrr: number }[];
}

const Bars: React.FC<{ items: { label: string; value: number }[]; color: string; unit?: string }> = ({ items, color, unit }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex h-40 items-end gap-1.5" dir="ltr">
      {items.map((i) => (
        <div key={i.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[9px] font-semibold text-slate-300">{i.value > 0 ? Math.round(i.value).toLocaleString() : ''}{i.value > 0 ? unit || '' : ''}</span>
          <div className="w-full rounded-t-md" style={{ height: `${Math.max(2, (i.value / max) * 100)}%`, background: color, opacity: i.value > 0 ? 1 : 0.25 }} />
          <span className="text-[9px] text-slate-500">{i.label}</span>
        </div>
      ))}
    </div>
  );
};

const Split: React.FC<{ rows: { label: string; value: number; color: string }[] }> = ({ rows }) => {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-[11px] text-slate-300"><span>{r.label}</span><span>{r.value} ({Math.round((r.value / total) * 100)}%)</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.color }} /></div>
        </div>
      ))}
    </div>
  );
};

export const AdminReports: React.FC<{ onRenew: (id: string, name: string) => void }> = ({ onRenew }) => {
  const { isRTL, showToast } = useApp();
  const [data, setData] = useState<Reports | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc('fn_admin_reports').then(({ data: d }) => { if (d) setData(d as Reports); });
  }, []);

  const doExport = async (kind: 'xlsx' | 'pdf') => {
    setBusy(true);
    try {
      const rows = await fetchPayments(null);
      if (rows.length === 0) { showToast(isRTL ? 'لا توجد مدفوعات للتصدير' : 'No payments to export'); return; }
      const name = `nexus-payments-${new Date().toISOString().slice(0, 10)}`;
      if (kind === 'xlsx') await exportPaymentsXlsx(rows, isRTL, name);
      else await exportPaymentsPdf(rows, isRTL, name, isRTL ? 'سجل مدفوعات المشتركين' : 'Subscriber payments');
    } catch (e: any) {
      showToast(e?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return null;
  const monthLabel = (m: string) => m.slice(5);
  const rate = data.renewal.eligible > 0 ? Math.round((data.renewal.renewed / data.renewal.eligible) * 100) : 0;
  const card = 'glass-card rounded-2xl p-4';
  const title = 'mb-3 text-xs font-bold text-slate-300';

  return (
    <div className="space-y-4">
      {data.expiring.length > 0 && (
        <div className={`${card} border-amber-500/30`}>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-amber-300"><AlertTriangle className="h-4 w-4" />{isRTL ? 'اشتراكات قاربت على الانتهاء' : 'Subscriptions expiring soon'}</h3>
          <div className="space-y-2">
            {data.expiring.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{e.name}</p>
                  <p className={`text-[11px] ${e.days < 0 ? 'text-red-400' : e.days <= 1 ? 'text-red-300' : 'text-amber-300'}`}>
                    {e.days < 0 ? (isRTL ? `منتهي منذ ${-e.days} يوم` : `Expired ${-e.days}d ago`) : e.days === 0 ? (isRTL ? 'ينتهي اليوم' : 'Ends today') : (isRTL ? `متبقي ${e.days} يوم` : `${e.days} day(s) left`)} · {e.expires_on}
                  </p>
                </div>
                <button onClick={() => onRenew(e.id, e.name)} className="shrink-0 rounded-lg bg-emerald-600/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30">{isRTL ? 'تجديد' : 'Renew'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${card} lg:col-span-2`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300"><BarChart3 className="h-4 w-4 text-blue-400" />{isRTL ? 'الإيرادات الشهرية (آخر 12 شهر)' : 'Monthly revenue (last 12 months)'}</h3>
            <div className="flex gap-1.5">
              <button disabled={busy} onClick={() => doExport('xlsx')} className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-50"><Download className="h-3.5 w-3.5" />Excel</button>
              <button disabled={busy} onClick={() => doExport('pdf')} className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-600/30 disabled:opacity-50"><FileText className="h-3.5 w-3.5" />PDF</button>
            </div>
          </div>
          <Bars items={data.monthly.map((m) => ({ label: monthLabel(m.month), value: Number(m.revenue) }))} color="#3b82f6" />
          <p className="mt-2 text-[10px] text-slate-500">{isRTL ? 'تصدير سجل مدفوعات كل المشتركين.' : 'Exports the payments of all subscribers.'}</p>
        </div>

        <div className={card}>
          <h3 className={title}>{isRTL ? 'معدل التجديد' : 'Renewal rate'}</h3>
          <p className="text-3xl font-extrabold text-emerald-400">{rate}%</p>
          <p className="mt-1 text-[11px] text-slate-500">{isRTL ? `${data.renewal.renewed} جددوا من ${data.renewal.eligible} انتهت فترتهم المجانية` : `${data.renewal.renewed} renewed of ${data.renewal.eligible} past the free period`}</p>
        </div>

        <div className={card}>
          <h3 className={title}>{isRTL ? 'التجديدات والمشتركون الجدد شهرياً' : 'Renewals & new subscribers per month'}</h3>
          <Bars items={data.monthly.map((m) => ({ label: monthLabel(m.month), value: Number(m.renewals) }))} color="#10b981" />
          <p className="mt-2 text-[10px] text-slate-500">{isRTL ? 'عدد التجديدات' : 'Renewals'} · {isRTL ? 'جدد هذا الشهر' : 'New this month'}: {data.monthly[data.monthly.length - 1]?.new_tenants ?? 0}</p>
        </div>

        <div className={card}>
          <h3 className={title}>{isRTL ? 'المشتركون حسب النظام' : 'Subscribers by system'}</h3>
          <Split rows={data.by_system.map((s, i) => ({ label: isRTL ? s.name_ar : s.name_en, value: Number(s.count), color: ['#3b82f6', '#10b981', '#f59e0b', '#a855f7'][i % 4] }))} />
        </div>

        <div className={card}>
          <h3 className={title}>{isRTL ? 'مصدر الاشتراكات' : 'Subscription source'}</h3>
          <Split rows={[
            { label: isRTL ? 'عن طريق كود دعوة' : 'Via referral code', value: Number(data.source.referral), color: '#a855f7' },
            { label: isRTL ? 'مباشر' : 'Direct', value: Number(data.source.direct), color: '#3b82f6' },
          ]} />
        </div>
      </div>
    </div>
  );
};
