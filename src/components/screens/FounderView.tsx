import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  CalendarPlus,
  FilePlus,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const FounderView: React.FC = () => {
  const {
    language,
    isRTL,
    invoices,
    patients,
    bookings,
    inventory,
    financials,
    setIsAddPatientOpen,
    setIsNewBookingOpen,
    setIsCreateInvoiceOpen,
    openPdfExport,
    t,
  } = useApp();

  const criticalInventoryCount = inventory.filter((i) => i.status === 'critical').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('founder.welcome')}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
              <Sparkles className="h-3 w-3" />
              {isRTL ? 'المؤسس الطبي' : 'Clinic Founder'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('founder.subtitle')}
          </p>
        </div>

        {/* 3 Prominent Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('founder.add_patient')}</span>
          </button>

          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-700/80 dark:bg-slate-900/90 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <CalendarPlus className="h-4 w-4 text-indigo-400" />
            <span>{t('founder.new_booking')}</span>
          </button>

          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-700/80 dark:bg-slate-900/90 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <FilePlus className="h-4 w-4 text-emerald-400" />
            <span>{t('founder.gen_invoice')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row (4 Cards, 1st Card has prominent glow) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue (MTD) with glowing border */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/50 bg-gradient-to-b from-blue-950/40 via-slate-900/80 to-slate-950 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300">
              {t('founder.rev_mtd')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              $124,500
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              +12.5%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {isRTL ? 'مقارنة بالشهر الماضي (١١٠,٦٠٠ $)' : 'vs last month ($110,600)'}
          </p>
        </div>

        {/* Today's Bookings */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('founder.today_bookings')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              42
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              +8%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? '٣٦ تم تأكيدها، ٦ في الانتظار' : '36 confirmed, 6 checked in'}
          </p>
        </div>

        {/* Monthly Patients */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('founder.monthly_patients')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              1,248
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              +14%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? '١٨٢ مريضاً جديداً هذا الشهر' : '182 first-time consultations'}
          </p>
        </div>

        {/* Inventory Alerts */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('founder.inventory_alerts')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-400">
              {criticalInventoryCount} {isRTL ? 'أصناف' : 'Items'}
            </h3>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
              {isRTL ? 'حرج' : 'Critical'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'سرنجات، ليدوكائين، محلول ملحي' : 'Syringes, Lidocaine, Saline'}
          </p>
        </div>
      </div>

      {/* Financial Overview & Chart Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* P&L Visual Breakdown (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                {t('founder.financial_overview')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isRTL ? 'الأرباح والخسائر والتدفقات النقدية اللحظية' : 'Real-time profit & loss distribution'}
              </p>
            </div>
            <button
              onClick={() => openPdfExport('Founder Clinic Financial Brief')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t('founder.export_pdf')}</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60">
              <span className="text-[11px] text-slate-400">{t('accounting.total_income')}</span>
              <p className="text-lg font-bold text-white mt-1">$124,500</p>
              <span className="text-[10px] text-emerald-400">+12.5%</span>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60">
              <span className="text-[11px] text-slate-400">{t('accounting.total_expenses')}</span>
              <p className="text-lg font-bold text-white mt-1">$42,300</p>
              <span className="text-[10px] text-slate-400">+4.2%</span>
            </div>
            <div className="rounded-xl bg-emerald-950/30 p-3 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 font-semibold">{t('accounting.net_profit')}</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">$82,200</p>
              <span className="text-[10px] text-emerald-400 font-bold">+18% YTD</span>
            </div>
          </div>

          {/* Mini Monthly Trend Bars */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{isRTL ? 'اتجاه الإيرادات مقابل المصروفات (آخر ٦ أشهر)' : 'Monthly Income vs Expense Ratio'}</span>
              <span className="text-[11px] text-blue-400 font-medium">66% Net Margin</span>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end h-28 pt-4">
              {financials.monthlyTrends.map((m) => (
                <div key={m.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-20">
                    <div
                      style={{ height: `${m.barPct}%` }}
                      className="w-3 rounded-t-sm bg-gradient-to-t from-blue-600 to-indigo-500"
                      title={`Income: $${m.income.toLocaleString()}`}
                    />
                    <div
                      style={{ height: `${m.lossPct * 0.4}%` }}
                      className="w-3 rounded-t-sm bg-slate-700"
                      title={`Expense: $${m.expense?.toLocaleString() || '30k'}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Invoices Table (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                {t('accounting.recent_invoices')}
              </h3>
              <button
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                + {isRTL ? 'فاتورة' : 'New'}
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-800/50">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : inv.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {inv.clientName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">${inv.amount.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-500">{inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>{invoices.length} {isRTL ? 'فواتير مسجلة' : 'Total Invoices'}</span>
            <button
              onClick={() => openPdfExport('All Clinic Invoices Archive')}
              className="text-blue-400 font-semibold hover:underline"
            >
              {isRTL ? 'عرض الكل' : 'View Full Ledger'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
