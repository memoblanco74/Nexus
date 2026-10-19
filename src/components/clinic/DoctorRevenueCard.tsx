import React, { useCallback, useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { cairoToday } from '../nursery/nurseryApi';
import { inputClass } from '../nursery/ui';

interface Row { doctor: string; invoices_count: number; total: number; commission_percent: number; commission: number }

export const DoctorRevenueCard: React.FC = () => {
  const { isRTL, activeTenant, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const tenantId = activeTenant?.id;
  const today = cairoToday();
  const [from, setFrom] = useState(today.slice(0, 8) + '01');
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data, error } = await supabase.rpc('fn_doctor_revenue', { p_tenant_id: tenantId, p_from: from, p_to: to });
    setRows(error ? null : ((data as Row[]) || []));
  }, [tenantId, from, to]);
  useEffect(() => { load(); }, [load]);

  if (rows === null) return null;
  const totalAll = rows.reduce((s, r) => s + Number(r.total), 0);
  const commAll = rows.reduce((s, r) => s + Number(r.commission), 0);

  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-slate-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Stethoscope className="h-4 w-4 text-emerald-400" />{tx('إيراد الأطباء والعمولات', 'Doctor revenue & commission')}</h3>
        <div className="flex items-center gap-2">
          <input type="date" className={`${inputClass} !w-auto`} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-slate-500">→</span>
          <input type="date" className={`${inputClass} !w-auto`} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {rows.length === 0 ? <p className="text-xs text-slate-400">{tx('لا توجد فواتير مدفوعة في الفترة', 'No paid invoices in this period')}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500"><th className="py-1 text-start">{tx('الطبيب', 'Doctor')}</th><th>{tx('الفواتير', 'Invoices')}</th><th>{tx('الإيراد', 'Revenue')}</th><th>%</th><th>{tx('العمولة', 'Commission')}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.doctor} className="border-t border-slate-800 text-center text-slate-200">
                  <td className="py-1.5 text-start font-semibold text-white">{r.doctor}</td><td>{r.invoices_count}</td><td>{money(Number(r.total))}</td><td>{Number(r.commission_percent)}</td><td className="font-bold text-amber-400">{money(Number(r.commission))}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-700 text-center font-bold text-white"><td className="py-1.5 text-start">{tx('الإجمالي', 'Total')}</td><td /><td>{money(totalAll)}</td><td /><td className="text-amber-400">{money(commAll)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
