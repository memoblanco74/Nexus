import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { askConfirm } from '../../lib/dialog';
import { cardClass, inputClass } from './ui';
import { cairoToday, monthOf } from './nurseryApi';

interface Exp { id: string; expense_date: string; category: string; description: string | null; net_amount: number; tax_percent: number; tax_amount: number; total_amount: number }

const CATS_AR = ['إيجار', 'كهرباء ومياه', 'غذاء ووجبات', 'مستلزمات وأدوات', 'نظافة', 'صيانة', 'مواصلات', 'تسويق', 'أخرى'];
const CATS_EN = ['Rent', 'Utilities', 'Food & meals', 'Supplies', 'Cleaning', 'Maintenance', 'Transport', 'Marketing', 'Other'];
const lastDay = (period: string) => { const [y, m] = period.split('-').map(Number); return new Date(y, m, 0).getDate(); };
const round2 = (n: number) => Math.round(n * 100) / 100;

export const NurseryExpensesTab: React.FC = () => {
  const { isRTL, activeTenant, showToast, money, isReadOnly } = useApp();
  const { profile } = useAuth();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const tenantId = activeTenant?.id || '';
  const [period, setPeriod] = useState(monthOf(cairoToday()));
  const [rows, setRows] = useState<Exp[]>([]);
  const [salary, setSalary] = useState<{ gross: number; tax: number }>({ gross: 0, tax: 0 });
  const [date, setDate] = useState(cairoToday());
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');
  const [net, setNet] = useState('');
  const [taxPct, setTaxPct] = useState(() => { try { return localStorage.getItem('nx_exp_tax') || '0'; } catch { return '0'; } });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const from = `${period}-01`;
    const to = `${period}-${String(lastDay(period)).padStart(2, '0')}`;
    const [e, p] = await Promise.all([
      supabase.from('nursery_expenses').select('*').eq('tenant_id', tenantId).gte('expense_date', from).lte('expense_date', to).order('expense_date', { ascending: false }),
      supabase.from('nursery_staff_payments').select('net, tax').eq('tenant_id', tenantId).eq('period', period),
    ]);
    setFailed(!!e.error);
    setRows(((e.data as any[]) || []).map((x) => ({ ...x, net_amount: Number(x.net_amount), tax_percent: Number(x.tax_percent), tax_amount: Number(x.tax_amount), total_amount: Number(x.total_amount) })));
    const pr = (p.data as any[]) || [];
    setSalary({ gross: pr.reduce((n, x) => n + Number(x.net || 0) + Number(x.tax || 0), 0), tax: pr.reduce((n, x) => n + Number(x.tax || 0), 0) });
  }, [tenantId, period]);
  useEffect(() => { load(); }, [load]);

  const preview = useMemo(() => {
    const n = Number(net) || 0;
    const pct = Number(taxPct) || 0;
    const tax = round2((n * pct) / 100);
    return { tax, total: round2(n + tax) };
  }, [net, taxPct]);

  const add = async () => {
    const n = Number(net);
    const pct = Number(taxPct) || 0;
    if (!cat.trim() || !(n > 0) || pct < 0 || pct >= 100) { showToast(tx('راجع البند والمبلغ ونسبة الضريبة', 'Check category, amount and tax %')); return; }
    setBusy(true);
    const { error } = await supabase.from('nursery_expenses').insert({ tenant_id: tenantId, expense_date: date, category: cat.trim(), description: desc.trim() || null, net_amount: n, tax_percent: pct, tax_amount: preview.tax, total_amount: preview.total, created_by: profile?.id || null });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    try { localStorage.setItem('nx_exp_tax', String(pct)); } catch { /* ignore */ }
    setNet(''); setDesc('');
    load();
  };

  const remove = async (x: Exp) => {
    const ok = await askConfirm({ message: tx('حذف المصروف ده؟', 'Delete this expense?'), danger: true, confirmText: tx('حذف', 'Delete') });
    if (!ok) return;
    const { error } = await supabase.from('nursery_expenses').delete().eq('id', x.id);
    if (error) showToast(error.message);
    else load();
  };

  const totalExp = rows.reduce((n, r) => n + r.total_amount, 0);
  const totalTax = rows.reduce((n, r) => n + r.tax_amount, 0);
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.category, (m.get(r.category) || 0) + r.total_amount));
    if (salary.gross > 0) m.set(tx('مرتبات', 'Salaries'), salary.gross);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows, salary.gross, isRTL]);
  const catMax = Math.max(1, ...byCat.map(([, v]) => v));
  const grand = totalExp + salary.gross;

  if (failed) return <p className={`${cardClass} text-center text-xs text-slate-500`}>{tx('جدول المصروفات غير جاهز بعد في قاعدة البيانات.', 'The expenses table is not ready in the database yet.')}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Receipt className="h-4 w-4 text-amber-400" />{tx('المصروفات اليومية', 'Daily expenses')}</h3>
        <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className={`${inputClass} max-w-[11rem]`} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`${cardClass} text-center`}><p className="text-[10px] text-slate-500">{tx('مصروفات يومية', 'Expenses')}</p><p className="text-sm font-extrabold text-amber-400">{money(totalExp)}</p></div>
        <div className={`${cardClass} text-center`}><p className="text-[10px] text-slate-500">{tx('منها ضرائب', 'of which tax')}</p><p className="text-sm font-extrabold text-red-400">{money(totalTax)}</p></div>
        <div className={`${cardClass} text-center`}><p className="text-[10px] text-slate-500">{tx('مرتبات (إجمالي)', 'Salaries (gross)')}</p><p className="text-sm font-extrabold text-blue-400">{money(salary.gross)}</p></div>
        <div className={`${cardClass} text-center`}><p className="text-[10px] text-slate-500">{tx('إجمالي الشهر', 'Month total')}</p><p className="text-sm font-extrabold text-white">{money(grand)}</p></div>
      </div>

      {!isReadOnly && (
        <div className={`${cardClass} space-y-3`} data-write="1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input type="date" className={inputClass} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <input list="nx-exp-cats" className={inputClass} placeholder={tx('البند', 'Category')} value={cat} onChange={(e) => setCat(e.target.value)} />
            <input className={inputClass} inputMode="decimal" placeholder={tx('المبلغ قبل الضريبة', 'Amount before tax')} value={net} onChange={(e) => setNet(e.target.value)} />
            <div className="flex items-center gap-1.5">
              <input className={inputClass} inputMode="decimal" placeholder="%" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} />
              <button type="button" onClick={() => setTaxPct('14')} className="shrink-0 rounded-lg border border-slate-700 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800">14%</button>
              <button type="button" onClick={() => setTaxPct('0')} className="shrink-0 rounded-lg border border-slate-700 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800">0</button>
            </div>
          </div>
          <datalist id="nx-exp-cats">{(isRTL ? CATS_AR : CATS_EN).map((c) => <option key={c} value={c} />)}</datalist>
          <input className={inputClass} placeholder={tx('ملاحظة (اختياري)', 'Note (optional)')} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-300">{tx('الضريبة', 'Tax')}: <b className="text-red-300">{money(preview.tax)}</b> • {tx('الإجمالي', 'Total')}: <b className="text-white">{money(preview.total)}</b></p>
            <button disabled={busy || !cat.trim() || !(Number(net) > 0)} onClick={add} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400"><Plus className="h-4 w-4" />{tx('تسجيل مصروف', 'Add expense')}</button>
          </div>
        </div>
      )}

      {byCat.length > 0 && (
        <div className={`${cardClass} space-y-2`}>
          <p className="text-xs font-bold text-slate-300">{tx('حسب البند', 'By category')}</p>
          {byCat.map(([name, v]) => (
            <div key={name} className="space-y-1">
              <div className="flex justify-between text-xs"><span className="text-slate-200">{name}</span><span className="font-bold text-amber-400">{money(v)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div style={{ width: `${(v / catMax) * 100}%` }} className="h-full rounded-full bg-amber-500" /></div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{r.category}{r.description ? ` — ${r.description}` : ''}</p>
              <p className="text-[10px] text-slate-500">{r.expense_date}{r.tax_amount > 0 ? ` • ${tx('ضريبة', 'tax')} ${r.tax_percent}% (${money(r.tax_amount)})` : ''}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <b className="text-amber-300">{money(r.total_amount)}</b>
              <button data-write="1" onClick={() => remove(r)} className="rounded-lg border border-red-500/40 p-1.5 text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className={`${cardClass} text-center text-xs text-slate-500`}>{tx('لا توجد مصروفات في هذا الشهر.', 'No expenses this month.')}</p>}
      </div>
    </div>
  );
};
