import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Scale } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { cairoToday } from '../nursery/nurseryApi';
import { inputClass } from '../nursery/ui';

interface Month { month: string; revenue: number; expenses: number; profit: number; categories: { name: string; amount: number }[] }

export const PnlCard: React.FC = () => {
  const { isRTL, activeTenant, money, showToast, isReadOnly, profile, refreshExpenses } = useApp() as any;
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const tenantId: string | undefined = activeTenant?.id;
  const [months, setMonths] = useState<Month[] | null>(null);
  const [sel, setSel] = useState(0);
  const [cat, setCat] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data, error } = await supabase.rpc('fn_monthly_pnl', { p_tenant_id: tenantId, p_months: 6 });
    if (error) { setMonths(null); return; }
    const arr = (data as Month[]) || [];
    setMonths(arr);
    setSel(arr.length - 1);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  if (!months || months.length === 0) return null;
  const cur = months[Math.min(sel, months.length - 1)];
  const max = Math.max(1, ...months.map((m) => Math.max(m.revenue, m.expenses)));
  const catMax = Math.max(1, ...cur.categories.map((c) => c.amount));

  const add = async () => {
    const n = Number(amount);
    if (!cat.trim() || !(n > 0)) return;
    setBusy(true);
    const { error } = await supabase.from('expenses').insert({ tenant_id: tenantId, category: cat.trim(), description: desc.trim() || cat.trim(), amount: n, expense_date: cairoToday(), created_by: profile?.id || null });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    setCat(''); setAmount(''); setDesc('');
    if (typeof refreshExpenses === 'function') refreshExpenses();
    load();
  };

  return (
    <div className="glass-panel space-y-4 rounded-2xl border border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Scale className="h-4 w-4 text-indigo-400" />{tx('الأرباح والخسائر الشهرية', 'Monthly profit & loss')}</h3>
      <div className="flex items-end gap-2 overflow-x-auto pb-1">
        {months.map((m, i) => (
          <button key={m.month} onClick={() => setSel(i)} className={`flex min-w-[3.5rem] flex-1 flex-col items-center gap-1 rounded-xl border p-2 ${i === sel ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800'}`}>
            <span className="flex h-16 items-end gap-1">
              <span style={{ height: `${(m.revenue / max) * 100}%` }} className="w-3 rounded-t bg-emerald-500" />
              <span style={{ height: `${(m.expenses / max) * 100}%` }} className="w-3 rounded-t bg-red-500" />
            </span>
            <span className="text-[10px] text-slate-400">{m.month.slice(5)}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-900/60 p-3"><p className="text-[10px] text-slate-500">{tx('الإيرادات', 'Revenue')}</p><p className="text-sm font-bold text-emerald-400">{money(cur.revenue)}</p></div>
        <div className="rounded-xl bg-slate-900/60 p-3"><p className="text-[10px] text-slate-500">{tx('المصروفات', 'Expenses')}</p><p className="text-sm font-bold text-red-400">{money(cur.expenses)}</p></div>
        <div className="rounded-xl bg-slate-900/60 p-3"><p className="text-[10px] text-slate-500">{tx('صافي الربح', 'Net profit')}</p><p className={`text-sm font-bold ${cur.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(cur.profit)}</p></div>
      </div>
      {cur.categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400">{tx('المصروفات حسب البند', 'Expenses by category')} — {cur.month}</p>
          {cur.categories.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between text-xs"><span className="text-slate-200">{c.name}</span><span className="font-bold text-amber-400">{money(c.amount)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div style={{ width: `${(c.amount / catMax) * 100}%` }} className="h-full rounded-full bg-amber-500" /></div>
            </div>
          ))}
        </div>
      )}
      {!isReadOnly && (
        <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3" data-write="1">
          <input list="exp-cats" className={`${inputClass} max-w-[9rem]`} placeholder={tx('البند (إيجار، كهرباء…)', 'Category')} value={cat} onChange={(e) => setCat(e.target.value)} />
          <datalist id="exp-cats">{(isRTL ? ['إيجار', 'كهرباء ومياه', 'مستلزمات', 'صيانة', 'تسويق', 'مرتبات', 'أخرى'] : ['Rent', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Salaries', 'Other']).map((c) => <option key={c} value={c} />)}</datalist>
          <input type="number" min="0" className={`${inputClass} max-w-[7rem]`} placeholder={tx('المبلغ', 'Amount')} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className={`${inputClass} max-w-[12rem]`} placeholder={tx('ملاحظة', 'Note')} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <button disabled={busy || !cat.trim() || !(Number(amount) > 0)} onClick={add} className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400"><Plus className="h-4 w-4" />{tx('تسجيل مصروف', 'Add expense')}</button>
        </div>
      )}
    </div>
  );
};
