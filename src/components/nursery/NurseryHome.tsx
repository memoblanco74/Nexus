import React, { useEffect, useState } from 'react';
import { Baby, CalendarCheck, CircleAlert, UserCheck, UserX, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { cardClass } from './ui';
import { NurseryCore, cairoToday, childDue, monthOf } from './nurseryApi';

export const NurseryHome: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, activeTenant, setScreen, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [counts, setCounts] = useState({ present: 0, absent: 0 });
  const today = cairoToday();
  const period = monthOf(today);

  useEffect(() => {
    if (!activeTenant) return;
    supabase
      .from('nursery_daily_logs')
      .select('status')
      .eq('tenant_id', activeTenant.id)
      .eq('day', today)
      .then(({ data }) => {
        const rows = (data as Array<{ status: string }>) || [];
        setCounts({ present: rows.filter((r) => r.status === 'present').length, absent: rows.filter((r) => r.status === 'absent').length });
      });
  }, [activeTenant, today]);

  const active = core.children.filter((c) => c.status === 'active');
  const owing = active
    .map((c) => {
      const due = childDue(c.id, core.childFees, core.feeItems);
      const paid = core.payments.filter((p) => p.child_id === c.id && p.period === period).reduce((s, p) => s + p.amount, 0);
      return Math.max(due - paid, 0);
    })
    .filter((x) => x > 0);
  const outstanding = owing.reduce((s, x) => s + x, 0);
  const unvaccinated = active.filter((c) => !core.vaccinations.some((v) => v.child_id === c.id)).length;

  const tiles = [
    { icon: <Baby className="h-5 w-5 text-pink-400" />, label: tx('الأطفال المقيّدين', 'Enrolled children'), value: String(active.length), go: 'patients' as const },
    { icon: <UserCheck className="h-5 w-5 text-emerald-400" />, label: tx('حاضر اليوم', 'Present today'), value: String(counts.present), go: 'bookings' as const },
    { icon: <UserX className="h-5 w-5 text-red-400" />, label: tx('غائب اليوم', 'Absent today'), value: String(counts.absent), go: 'bookings' as const },
    { icon: <CalendarCheck className="h-5 w-5 text-amber-400" />, label: tx('لم يُسجَّل اليوم', 'Not marked today'), value: String(Math.max(active.length - counts.present - counts.absent, 0)), go: 'bookings' as const },
    { icon: <Wallet className="h-5 w-5 text-blue-400" />, label: tx('لم يدفعوا هذا الشهر', 'Unpaid this month'), value: String(owing.length), go: 'accounting' as const },
    { icon: <CircleAlert className="h-5 w-5 text-orange-400" />, label: tx('بدون تطعيم مسجّل', 'No vaccination on file'), value: String(unvaccinated), go: 'patients' as const },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">{tx('نظرة عامة على الحضانة', 'Nursery overview')}</h1>
        <p className="mt-1 text-xs text-slate-400">{activeTenant ? (isRTL ? activeTenant.nameAr || activeTenant.name : activeTenant.name) : ''} • {today}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((t) => (
          <button key={t.label} onClick={() => setScreen(t.go)} className={`${cardClass} space-y-2 text-start transition hover:border-slate-600`}>
            {t.icon}
            <p className="text-2xl font-extrabold text-white">{t.value}</p>
            <p className="text-[11px] text-slate-400">{t.label}</p>
          </button>
        ))}
      </div>
      <div className={`${cardClass} flex items-center justify-between`}>
        <span className="text-xs text-slate-400">{tx('المتبقي تحصيله هذا الشهر', 'Outstanding this month')}</span>
        <span className="text-lg font-extrabold text-red-400">{money(outstanding)}</span>
      </div>
    </div>
  );
};
