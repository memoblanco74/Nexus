import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, PieChart, Activity, Download, ShieldCheck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { isRTL, openPdfExport, t, bookings, invoices, inventory, patients } = useApp();

  const deptMap = new Map<string, number>();
  bookings.forEach((b) => {
    const name = (isRTL ? b.departmentAr : b.department) || '—';
    deptMap.set(name, (deptMap.get(name) || 0) + 1);
  });
  const byDepartment: { name: string; count: number }[] = Array.from(deptMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((x, y) => y.count - x.count);
  const maxCount = byDepartment[0]?.count || 1;

  const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingTotal = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);
  const lowStock = inventory.filter((i) => i.status === 'low' || i.status === 'critical').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

  const kpis = [
    { label: isRTL ? 'إجمالي المدفوع' : 'Paid Total', value: paidTotal.toLocaleString(), color: 'text-emerald-400' },
    { label: isRTL ? 'مستحق / متأخر' : 'Pending / Overdue', value: pendingTotal.toLocaleString(), color: 'text-amber-400' },
    { label: isRTL ? 'مواد منخفضة المخزون' : 'Low Stock Items', value: String(lowStock), color: 'text-red-400' },
    { label: isRTL ? 'حجوزات مؤكدة' : 'Confirmed Bookings', value: `${confirmed}/${bookings.length}`, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('nav.reports')}
            </h1>
            <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
              {t('vocab.reports_title')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('vocab.reports_subtitle')}
          </p>
        </div>

        <button
          onClick={() => openPdfExport('Comprehensive Operational Report')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
        >
          <Download className="h-4 w-4" />
          <span>{t('founder.export_pdf')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'الحجوزات حسب القسم' : 'Bookings by Section'}
          </h3>
          {byDepartment.length === 0 ? (
            <p className="text-xs text-slate-400">{isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
          ) : (
            <div className="space-y-3">
              {byDepartment.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{d.name}</span>
                    <span className="font-bold text-emerald-400">{d.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div style={{ width: `${(d.count / maxCount) * 100}%` }} className="h-full bg-blue-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'مؤشرات التشغيل' : 'Operational Metrics'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase">{k.label}</span>
                <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            {isRTL ? `عدد السجلات: ${patients.length}` : `Records: ${patients.length}`}
          </p>
        </div>
      </div>
    </div>
  );
};
