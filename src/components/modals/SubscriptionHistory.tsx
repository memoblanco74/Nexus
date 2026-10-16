import React, { useEffect, useState } from 'react';
import { Download, FileText, History, X } from 'lucide-react';
import { exportPaymentsPdf, exportPaymentsXlsx, fetchPayments } from '../../lib/paymentsExport';
import { supabase } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';

interface Row {
  id: string; months: number; previous_end: string | null; new_end: string | null;
  amount_due: number | null; amount_paid: number | null; payment_method: string | null;
  reference: string | null; paid_at: string; sender_name: string | null; note: string | null;
}

export const fmtDateTime = (iso: string, isRTL: boolean) =>
  new Date(iso).toLocaleString(isRTL ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' });

export const SubscriptionHistoryList: React.FC<{ tenantId: string; reloadKey?: number }> = ({ tenantId, reloadKey }) => {
  const { isRTL, money } = useApp();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setRows(null);
    supabase.rpc('fn_subscription_history', { p_tenant_id: tenantId }).then(({ data, error }) => {
      if (error) { setErr(error.message); setRows([]); } else setRows((data as Row[]) || []);
    });
  }, [tenantId, reloadKey]);

  const [busy, setBusy] = useState(false);
  const doExport = async (kind: 'xlsx' | 'pdf') => {
    setBusy(true);
    try {
      const all = await fetchPayments(tenantId);
      const name = `nexus-payments-${new Date().toISOString().slice(0, 10)}`;
      if (kind === 'xlsx') await exportPaymentsXlsx(all, isRTL, name);
      else await exportPaymentsPdf(all, isRTL, name, isRTL ? 'سجل المدفوعات' : 'Payments history');
    } catch (e: any) {
      setErr(e?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  if (rows === null) return <p className="text-xs text-slate-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>;
  if (err) return <p className="text-xs text-red-400">{err}</p>;
  if (rows.length === 0) return <p className="text-xs text-slate-400">{isRTL ? 'لا توجد مدفوعات مسجلة بعد' : 'No payments recorded yet'}</p>;

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <button disabled={busy} onClick={() => doExport('xlsx')} className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-50"><Download className="h-3.5 w-3.5" />Excel</button>
        <button disabled={busy} onClick={() => doExport('pdf')} className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-600/30 disabled:opacity-50"><FileText className="h-3.5 w-3.5" />PDF</button>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="space-y-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-emerald-300">{r.amount_paid != null ? money(Number(r.amount_paid), 2) : '—'}</span>
            <span className="text-[11px] text-slate-400">{fmtDateTime(r.paid_at, isRTL)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
            <span>{isRTL ? 'الطريقة' : 'Method'}: <b className="text-slate-200">{r.payment_method || '—'}</b></span>
            {r.reference && <span>{isRTL ? 'المرجع' : 'Ref'}: <b dir="ltr" className="text-slate-200">{r.reference}</b></span>}
            {r.sender_name && <span>{isRTL ? 'المحوّل' : 'Sender'}: <b className="text-slate-200">{r.sender_name}</b></span>}
          </div>
          <div className="text-[11px] text-slate-400">
            {isRTL ? `تجديد ${r.months} شهر — حتى ${r.new_end || '—'}` : `${r.months} month(s) — until ${r.new_end || '—'}`}
            {r.amount_due != null && Number(r.amount_due) !== Number(r.amount_paid) ? (isRTL ? ` (المطلوب ${money(Number(r.amount_due), 2)})` : ` (due ${money(Number(r.amount_due), 2)})`) : ''}
          </div>
          {r.note && <div className="text-[11px] text-slate-500">{r.note}</div>}
        </div>
      ))}
    </div>
  );
};

export const SubscriptionHistoryModal: React.FC<{ tenantId: string; tenantName: string; onClose: () => void }> = ({ tenantId, tenantName, onClose }) => {
  const { isRTL } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pb-20" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white"><History className="h-4 w-4 text-blue-400" />{isRTL ? 'سجل المدفوعات' : 'Payment history'}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs font-semibold text-slate-200">{tenantName}</p>
        <SubscriptionHistoryList tenantId={tenantId} />
      </div>
    </div>
  );
};
