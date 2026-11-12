import React, { useEffect, useMemo, useState } from 'react';
import { Baby, CalendarCheck, CircleAlert, Cake, MessageCircle, Plus, Receipt, ShieldAlert, Syringe, TrendingDown, TrendingUp, UserCheck, UserCog, UserX, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { requestOpen } from '../../lib/pendingOpen';
import { cardClass } from './ui';
import { NurseryCore, cairoToday, childDue, daysUntil, monthOf } from './nurseryApi';
import { childPhone, openWhatsApp } from './NurseryExtras';

interface LogRow { child_id: string; status: string }
interface StaffRow { id: string; full_name: string; monthly_salary: number; active: boolean; raise_percent: number; raise_month: number | null; last_raise_on: string | null }
interface MoneyMonth { collected: number; expenses: number; salaries: number }

const prevMonth = (period: string) => {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const Delta: React.FC<{ cur: number; prev: number; goodWhenUp: boolean }> = ({ cur, prev, goodWhenUp }) => {
  if (!prev && !cur) return <span className="text-[10px] text-slate-500">—</span>;
  if (!prev) return <span className="text-[10px] text-slate-500">—</span>;
  const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  const good = goodWhenUp ? pct >= 0 : pct <= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>
      {pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
};

export const NurseryHome: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, activeTenant, setScreen, money } = useApp();
  const { can } = useAuth();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [staffAbsent, setStaffAbsent] = useState<string[]>([]);
  const [months, setMonths] = useState<{ cur: MoneyMonth; prev: MoneyMonth } | null>(null);
  const today = cairoToday();
  const period = monthOf(today);
  const lastPeriod = prevMonth(period);
  const tenantId = activeTenant?.id;

  const showAttendance = can('home.attendance');
  const showBirthdays = can('home.birthdays');
  const showQuick = can('home.quick_actions');
  const showAlerts = can('home.alerts');
  const showStaff = can('home.staff') && (can('staff.attendance') || can('staff.payroll'));
  const showMoney = can('home.money');
  const canWa = can('messages.send');

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('nursery_daily_logs')
      .select('child_id, status')
      .eq('tenant_id', tenantId)
      .eq('day', today)
      .then(({ data }) => setLogs((data as LogRow[]) || []));
  }, [tenantId, today]);

  useEffect(() => {
    if (!tenantId || !showStaff) return;
    Promise.all([
      supabase.from('nursery_staff').select('id, full_name, monthly_salary, active, raise_percent, raise_month, last_raise_on').eq('tenant_id', tenantId),
      supabase.from('nursery_staff_attendance').select('staff_id, status').eq('tenant_id', tenantId).eq('day', today),
    ]).then(([s, a]) => {
      setStaff(((s.data as any[]) || []).map((x) => ({ ...x, monthly_salary: Number(x.monthly_salary), raise_percent: Number(x.raise_percent || 0) })));
      setStaffAbsent(((a.data as any[]) || []).filter((r) => r.status === 'absent').map((r) => r.staff_id));
    });
  }, [tenantId, today, showStaff]);

  useEffect(() => {
    if (!tenantId || !showMoney) return;
    const from = `${lastPeriod}-01`;
    Promise.all([
      supabase.from('nursery_expenses').select('expense_date, total_amount').eq('tenant_id', tenantId).gte('expense_date', from),
      supabase.from('nursery_staff_payments').select('period, net, tax').eq('tenant_id', tenantId).in('period', [period, lastPeriod]),
    ]).then(([e, p]) => {
      const blank = (): MoneyMonth => ({ collected: 0, expenses: 0, salaries: 0 });
      const out = { cur: blank(), prev: blank() };
      core.payments.forEach((x) => {
        if (x.period === period) out.cur.collected += x.amount;
        else if (x.period === lastPeriod) out.prev.collected += x.amount;
      });
      ((e.data as any[]) || []).forEach((x) => {
        const m = monthOf(x.expense_date);
        if (m === period) out.cur.expenses += Number(x.total_amount);
        else if (m === lastPeriod) out.prev.expenses += Number(x.total_amount);
      });
      ((p.data as any[]) || []).forEach((x) => {
        const v = Number(x.net) + Number(x.tax || 0);
        if (x.period === period) out.cur.salaries += v;
        else if (x.period === lastPeriod) out.prev.salaries += v;
      });
      setMonths(out);
    });
  }, [tenantId, showMoney, period, lastPeriod, core.payments]);

  const active = core.children.filter((c) => c.status === 'active');
  const present = logs.filter((l) => l.status === 'present');
  const absent = logs.filter((l) => l.status === 'absent');
  const presentIds = new Set(present.map((l) => l.child_id));
  const statusOf = (id: string) => logs.find((l) => l.child_id === id)?.status;

  const owingRows = active
    .map((c) => {
      const due = childDue(c.id, core.childFees, core.feeItems);
      const paid = core.payments.filter((p) => p.child_id === c.id && p.period === period).reduce((s, p) => s + p.amount, 0);
      return { child: c, remaining: Math.max(due - paid, 0) };
    })
    .filter((x) => x.remaining > 0);
  const outstanding = owingRows.reduce((s, x) => s + x.remaining, 0);
  const topLate = [...owingRows].sort((a, b) => b.remaining - a.remaining).slice(0, 5);
  const unvaccinated = active.filter((c) => !core.vaccinations.some((v) => v.child_id === c.id)).length;

  const dueVaccines = core.vaccinations
    .filter((v) => !v.given_on && v.due_date && daysUntil(v.due_date) <= 7)
    .map((v) => ({ v, child: core.children.find((c) => c.id === v.child_id && c.status === 'active') }))
    .filter((x) => x.child)
    .sort((a, b) => (a.v.due_date || '').localeCompare(b.v.due_date || ''));
  const nurseryName = activeTenant ? (isRTL ? activeTenant.nameAr || activeTenant.name : activeTenant.name) : '';

  const classRows = useMemo(() => {
    const groups: Array<{ id: string; name: string; kids: typeof active }> = core.classes.map((k) => ({ id: k.id, name: k.name, kids: active.filter((c) => c.class_id === k.id) }));
    const none = active.filter((c) => !c.class_id);
    if (none.length > 0) groups.push({ id: 'none', name: tx('بدون فصل', 'No class'), kids: none });
    return groups;
  }, [core.classes, active, isRTL]);

  const birthdays = useMemo(() => {
    const base = new Date(`${today}T00:00:00`);
    return active
      .filter((c) => c.birth_date)
      .map((c) => {
        const [, m, d] = c.birth_date!.split('-').map(Number);
        let next = new Date(base.getFullYear(), m - 1, d);
        if (next < base) next = new Date(base.getFullYear() + 1, m - 1, d);
        const diff = Math.round((next.getTime() - base.getTime()) / 86400000);
        const age = next.getFullYear() - Number(c.birth_date!.slice(0, 4));
        return { child: c, diff, age };
      })
      .filter((x) => x.diff <= 6)
      .sort((a, b) => a.diff - b.diff);
  }, [active, today]);

  const allergyKids = active.filter((c) => presentIds.has(c.id) && c.allergies && can('children.health'));
  const emptyClasses = classRows.filter((g) => g.kids.length > 0 && logs.length > 0 && !g.kids.some((c) => presentIds.has(c.id)));

  const curMonthNum = Number(period.slice(5, 7));
  const raisesDue = staff.filter((s) => {
    if (!s.active || !(s.raise_percent > 0)) return false;
    if (s.last_raise_on && (Date.now() - new Date(s.last_raise_on).getTime()) / 86400000 < 300) return false;
    return !s.raise_month || curMonthNum >= s.raise_month;
  });
  const absentStaff = staff.filter((s) => s.active && staffAbsent.includes(s.id));

  const go = (kind: string, id: string, screen: 'patients' | 'bookings' | 'accounting') => {
    requestOpen(kind, id);
    setScreen(screen);
  };

  const tiles = [
    { icon: <Baby className="h-5 w-5 text-pink-400" />, label: tx('الأطفال المقيّدين', 'Enrolled children'), value: String(active.length), go: 'patients' as const },
    { icon: <UserCheck className="h-5 w-5 text-emerald-400" />, label: tx('حاضر اليوم', 'Present today'), value: String(present.length), go: 'bookings' as const },
    { icon: <UserX className="h-5 w-5 text-red-400" />, label: tx('غائب اليوم', 'Absent today'), value: String(absent.length), go: 'bookings' as const },
    { icon: <CalendarCheck className="h-5 w-5 text-amber-400" />, label: tx('لم يُسجَّل اليوم', 'Not marked today'), value: String(Math.max(active.length - present.length - absent.length, 0)), go: 'bookings' as const },
    { icon: <Wallet className="h-5 w-5 text-blue-400" />, label: tx('لم يدفعوا هذا الشهر', 'Unpaid this month'), value: String(owingRows.length), go: 'patients' as const },
    { icon: <CircleAlert className="h-5 w-5 text-orange-400" />, label: tx('بدون تطعيم مسجّل', 'No vaccination on file'), value: String(unvaccinated), go: 'patients' as const },
  ];

  const quick = [
    can('children.add') && { key: 'add', label: tx('إضافة طفل', 'Add child'), icon: <Plus className="h-4 w-4" />, run: () => go('add_child', '1', 'patients') },
    can('payments.collect') && { key: 'fee', label: tx('تحصيل اشتراك', 'Collect fee'), icon: <Wallet className="h-4 w-4" />, run: () => go('collect_fee', '1', 'patients') },
    can('expenses.add') && { key: 'exp', label: tx('تسجيل مصروف', 'Record expense'), icon: <Receipt className="h-4 w-4" />, run: () => go('add_expense', '1', 'accounting') },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: React.ReactNode; run: () => void }>;

  const net = (m: MoneyMonth) => m.collected - m.expenses - m.salaries;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">{tx('نظرة عامة على الحضانة', 'Nursery overview')}</h1>
        <p className="mt-1 text-xs text-slate-400">{nurseryName} • {today}</p>
      </div>

      {showQuick && quick.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q.key} data-write="1" onClick={q.run} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500">{q.icon}{q.label}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((t) => (
          <button key={t.label} onClick={() => setScreen(t.go)} className={`${cardClass} space-y-2 text-start transition hover:border-slate-600`}>
            {t.icon}
            <p className="text-2xl font-extrabold text-white">{t.value}</p>
            <p className="text-[11px] text-slate-400">{t.label}</p>
          </button>
        ))}
      </div>

      {showAttendance && classRows.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><Users className="h-4 w-4 text-blue-400" />{tx('الحضور حسب الفصل', 'Attendance by class')}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classRows.map((g) => {
              const p = g.kids.filter((c) => statusOf(c.id) === 'present').length;
              const a = g.kids.filter((c) => statusOf(c.id) === 'absent').length;
              const n = g.kids.length - p - a;
              return (
                <button key={g.id} onClick={() => go('daily_class', g.id, 'bookings')} className={`${cardClass} space-y-2 text-start transition hover:border-slate-600`}>
                  <p className="truncate text-sm font-bold text-white">{g.name} <span className="text-[11px] font-normal text-slate-500">({g.kids.length})</span></p>
                  <div className="flex gap-3 text-[11px] font-semibold">
                    <span className="text-emerald-400">{tx('حاضر', 'Present')} {p}</span>
                    <span className="text-red-400">{tx('غائب', 'Absent')} {a}</span>
                    <span className="text-amber-300">{tx('لم يُسجَّل', 'Unmarked')} {n}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showAlerts && (allergyKids.length > 0 || emptyClasses.length > 0) && (
        <div className={`${cardClass} space-y-2`}>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><ShieldAlert className="h-4 w-4 text-red-400" />{tx('تنبيهات اليوم', "Today's alerts")}</h3>
          {allergyKids.length > 0 && (
            <p className="text-xs text-slate-300">{tx(`${allergyKids.length} من الحاضرين عندهم حساسية:`, `${allergyKids.length} present children have allergies:`)} <span className="text-red-300">{allergyKids.map((c) => `${c.full_name} (${c.allergies})`).join('، ')}</span></p>
          )}
          {emptyClasses.length > 0 && (
            <p className="text-xs text-slate-300">{tx('فصول مفيهاش أي حاضر لحد دلوقتي:', 'Classes with nobody present so far:')} <span className="text-amber-300">{emptyClasses.map((g) => g.name).join('، ')}</span></p>
          )}
        </div>
      )}

      {showBirthdays && birthdays.length > 0 && (
        <div className={`${cardClass} space-y-2`}>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><Cake className="h-4 w-4 text-pink-400" />{tx('أعياد ميلاد الأسبوع', 'Birthdays this week')}</h3>
          {birthdays.map(({ child, diff, age }) => {
            const phone = childPhone(child);
            return (
              <div key={child.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{child.full_name}</p>
                  <p className="text-[11px] text-slate-400">{diff === 0 ? tx('النهارده', 'Today') : diff === 1 ? tx('بكرة', 'Tomorrow') : tx(`بعد ${diff} أيام`, `in ${diff} days`)} • {tx(`${age} سنة`, `turns ${age}`)}</p>
                </div>
                {canWa && phone && (
                  <button onClick={() => openWhatsApp(phone, tx(`كل سنة وطفلكم ${child.full_name} طيب من ${nurseryName} 🎂 عيد ميلاد سعيد!`, `Happy birthday to ${child.full_name} from ${nurseryName}! 🎂`))} className="shrink-0 rounded-lg border border-emerald-500/40 p-1.5 text-emerald-300 hover:bg-emerald-500/10"><MessageCircle className="h-3.5 w-3.5" /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {dueVaccines.length > 0 && can('children.health') && (
        <div className={`${cardClass} space-y-2`}>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><Syringe className="h-4 w-4 text-emerald-400" />{tx('تطعيمات قريبة أو متأخرة', 'Upcoming or overdue vaccines')}</h3>
          {dueVaccines.map(({ v, child }) => {
            const d = daysUntil(v.due_date!);
            const phone = childPhone(child!);
            return (
              <div key={v.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{child!.full_name}</p>
                  <p className="truncate text-[11px] text-slate-400">{v.vaccine_name}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-semibold ${d < 0 ? 'text-red-400' : 'text-amber-300'}`}>{d < 0 ? tx(`متأخر ${-d} يوم`, `${-d}d overdue`) : d === 0 ? tx('النهارده', 'Today') : tx(`بعد ${d} يوم`, `in ${d}d`)}</span>
                {canWa && phone && (
                  <button onClick={() => openWhatsApp(phone, tx(`تذكير من ${nurseryName}: موعد تطعيم ${child!.full_name} (${v.vaccine_name}) يوم ${v.due_date}.`, `Reminder from ${nurseryName}: ${child!.full_name}'s vaccine (${v.vaccine_name}) is due on ${v.due_date}.`))} className="shrink-0 rounded-lg border border-emerald-500/40 p-1.5 text-emerald-300 hover:bg-emerald-500/10"><MessageCircle className="h-3.5 w-3.5" /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showStaff && (absentStaff.length > 0 || raisesDue.length > 0) && (
        <div className={`${cardClass} space-y-2`}>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><UserCog className="h-4 w-4 text-blue-400" />{tx('الموظفين', 'Staff')}</h3>
          {absentStaff.length > 0 && <p className="text-xs text-slate-300">{tx('غايبين النهارده:', 'Absent today:')} <span className="text-red-300">{absentStaff.map((s) => s.full_name).join('، ')}</span></p>}
          {raisesDue.length > 0 && (
            <p className="text-xs text-slate-300">{tx('زيادة سنوية مستحقة:', 'Raises due:')} <span className="text-amber-300">{raisesDue.map((s) => `${s.full_name} (${s.raise_percent}%)`).join('، ')}</span></p>
          )}
        </div>
      )}

      {showMoney && months && (
        <div className={`${cardClass} space-y-3`}>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><Wallet className="h-4 w-4 text-amber-400" />{tx('هذا الشهر مقابل الشهر اللي فات', 'This month vs last month')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: tx('المحصّل', 'Collected'), cur: months.cur.collected, prev: months.prev.collected, good: true },
              { label: tx('المصروفات', 'Expenses'), cur: months.cur.expenses, prev: months.prev.expenses, good: false },
              { label: tx('المرتبات', 'Salaries'), cur: months.cur.salaries, prev: months.prev.salaries, good: false },
              { label: tx('صافي الربح', 'Net profit'), cur: net(months.cur), prev: net(months.prev), good: true },
            ].map((r) => (
              <div key={r.label} className="rounded-xl border border-slate-800 p-3">
                <p className="text-[10px] text-slate-500">{r.label}</p>
                <p className="text-sm font-extrabold text-white">{money(r.cur)}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] text-slate-500">{money(r.prev)}</span>
                  <Delta cur={r.cur} prev={r.prev} goodWhenUp={r.good} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">{tx('المحصّل من مدفوعات الاشتراكات، والمصروفات بالضريبة، والمرتبات الصافي المصروف + ضرائبها.', 'Collected from fee payments; expenses include tax; salaries are net paid plus tax.')}</p>
        </div>
      )}

      {showMoney && topLate.length > 0 && (
        <div className={`${cardClass} space-y-2`}>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white"><Wallet className="h-4 w-4 text-red-400" />{tx('أكتر المتأخرين في السداد', 'Top late payers')}</h3>
          {topLate.map(({ child, remaining }) => {
            const phone = childPhone(child);
            return (
              <div key={child.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
                <p className="min-w-0 flex-1 truncate font-bold text-white">{child.full_name}</p>
                <span className="shrink-0 font-bold text-red-400">{money(remaining)}</span>
                {canWa && phone && (
                  <button onClick={() => openWhatsApp(phone, tx(`السلام عليكم، تذكير ودي من ${nurseryName}: المتبقي من اشتراك ${child.full_name} عن شهر ${period} هو ${remaining} ج.م. شكراً لكم.`, `Hello, a friendly reminder from ${nurseryName}: the remaining fee for ${child.full_name} for ${period} is ${remaining} EGP. Thank you.`))} className="shrink-0 rounded-lg border border-emerald-500/40 p-1.5 text-emerald-300 hover:bg-emerald-500/10"><MessageCircle className="h-3.5 w-3.5" /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showMoney && (
        <div className={`${cardClass} flex items-center justify-between`}>
          <span className="text-xs text-slate-400">{tx('المتبقي تحصيله هذا الشهر', 'Outstanding this month')}</span>
          <span className="text-lg font-extrabold text-red-400">{money(outstanding)}</span>
        </div>
      )}
    </div>
  );
};
