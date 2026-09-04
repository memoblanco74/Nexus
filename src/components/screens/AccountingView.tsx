import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';

export const AccountingView: React.FC = () => {
  const {
    language,
    isRTL,
    invoices,
    financials,
    updateInvoiceStatus,
    setIsCreateInvoiceOpen,
    openPdfExport,
    showToast,
    addExpense,
    t,
  } = useApp();

  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const handleAddExpense = () => {
    if (!expenseDescription.trim() || !expenseAmount) return;
    addExpense({
      category: expenseCategory || 'General',
      description: expenseDescription,
      amount: Number(expenseAmount),
      date: new Date().toISOString().slice(0, 10),
    });
    setExpenseCategory('');
    setExpenseDescription('');
    setExpenseAmount('');
    setIsExpenseFormOpen(false);
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.clientNameAr && inv.clientNameAr.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportExcel = () => {
    const headers = ['Invoice Number', 'Client Name', 'Amount (USD)', 'Status', 'Date', 'Due Date'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.clientName,
      inv.amount.toString(),
      inv.status,
      inv.date,
      inv.dueDate,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_medical_invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isRTL ? 'تم تصدير ملف الإكسيل المالي بنجاح' : 'Financial ledger exported to Excel/CSV');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('accounting.title')}
            </h1>
            <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              {isRTL ? 'معتمد وفق المعايير المحاسبية' : 'GAAP & IFRS Compliant'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('accounting.subtitle')}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{t('accounting.create_invoice')}</span>
          </button>

          <button
            onClick={() => setIsExpenseFormOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-700 dark:bg-slate-900 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span>{isRTL ? 'إضافة مصروف' : 'Add Expense'}</span>
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-700 dark:bg-slate-900 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>{t('accounting.export_excel')}</span>
          </button>

          <button
            onClick={() => openPdfExport('Nexus Medical Financial Ledger & Tax Audit')}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-700 dark:bg-slate-900 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>{t('founder.export_pdf')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Top Financial Metrics) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('accounting.total_income')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              ${financials.totalIncome.toLocaleString()}
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              {financials.incomeChange}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'يشمل الفحوصات والعمليات الجراحية' : 'Includes surgery & corporate screenings'}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('accounting.total_expenses')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              ${financials.totalExpenses.toLocaleString()}
            </h3>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
              {financials.expensesChange}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'المشتريات، الرواتب والتشغيل' : 'Procurement, payroll & clinic overhead'}
          </p>
        </div>

        {/* Net Profit (With Glowing Green Border) */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 via-slate-900/80 to-slate-950 p-5 shadow-xl shadow-emerald-500/10 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">
              {t('accounting.net_profit')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400">
              ${financials.netProfit.toLocaleString()}
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              {financials.profitChange}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {isRTL ? 'هامش ربح صافٍ بنسبة ٦٦٪' : '66.0% Net Operating Margin'}
          </p>
        </div>

        {/* Estimated Taxes (15% VAT) */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('accounting.estimated_taxes')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              ${financials.estimatedTaxes.toLocaleString()}
            </h3>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
              {financials.taxesChange}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'مستحقة في نهاية الربع الحالي' : 'Accrued for Q3 filing deadline'}
          </p>
        </div>
      </div>

      {/* Middle Section: P&L Interactive Bar Chart */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              {t('accounting.pnl')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isRTL
                ? 'مقارنة شهرية للإيرادات والمصروفات وصافي الأرباح'
                : 'Monthly breakdown of gross revenues, clinical expenses, and net profit'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-blue-600 to-indigo-500" />
              <span className="text-slate-300">{t('accounting.total_income')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-slate-700" />
              <span className="text-slate-300">{t('accounting.total_expenses')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">{t('accounting.net_profit')}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="mt-6 grid grid-cols-6 gap-3 items-end h-48 pt-4">
          {(() => {
            const chartMax = Math.max(
              1,
              ...financials.monthlyTrends.map((m) => Math.max(m.income, m.expenses, m.profit))
            );
            return financials.monthlyTrends.map((m) => {
            return (
              <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-36">
                  {/* Income bar */}
                  <div
                    style={{ height: `${m.barPct}%` }}
                    className="w-4 rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:brightness-125 transition-all"
                    title={`Income: $${m.income.toLocaleString()}`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${(m.expenses / chartMax) * 100}%` }}
                    className="w-4 rounded-t-md bg-slate-700 group-hover:bg-slate-600 transition-all"
                    title={`Expenses: $${m.expenses.toLocaleString()}`}
                  />
                  {/* Profit bar */}
                  <div
                    style={{ height: `${(m.profit / chartMax) * 100}%` }}
                    className="w-4 rounded-t-md bg-emerald-500 group-hover:bg-emerald-400 transition-all shadow-sm shadow-emerald-500/20"
                    title={`Profit: $${m.profit.toLocaleString()}`}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-slate-300 block">{m.month}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">${(m.profit / 1000).toFixed(0)}k</span>
                </div>
              </div>
            );
            });
          })()}
        </div>
      </div>

      {/* Bottom Section: Invoices Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              {t('accounting.recent_invoices')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {filteredInvoices.length} {isRTL ? 'فواتير مطابقة للتصفية' : 'invoices matching filters'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter tabs */}
            <div className="flex gap-1 rounded-lg bg-slate-900/60 p-0.5 border border-slate-800">
              {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? (isRTL ? 'الكل' : 'All') : st}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={`absolute top-2 ${isRTL ? 'right-2.5' : 'left-2.5'} h-3.5 w-3.5 text-slate-400`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRTL ? 'بحث برقم الفاتورة أو العميل...' : 'Search invoice or client...'}
                className={`rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 ${
                  isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'
                } text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-3">{t('common.invoice_no')}</th>
                <th className="py-3 px-3">{t('common.client')}</th>
                <th className="py-3 px-3">{t('common.amount')}</th>
                <th className="py-3 px-3">{t('common.date')}</th>
                <th className="py-3 px-3">{t('common.due_date')}</th>
                <th className="py-3 px-3">{t('common.status')}</th>
                <th className="py-3 px-3 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-200">
                      {language === 'ar' && inv.clientNameAr ? inv.clientNameAr : inv.clientName}
                    </p>
                  </td>
                  <td className="py-3 px-3 font-bold text-white text-sm">
                    ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{inv.date}</td>
                  <td className="py-3 px-3 text-slate-400">{inv.dueDate}</td>
                  <td className="py-3 px-3">
                    {inv.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        {isRTL ? 'مدفوعة' : 'Paid'}
                      </span>
                    )}
                    {inv.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        {isRTL ? 'قيد الانتظار' : 'Pending'}
                      </span>
                    )}
                    {inv.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                        <AlertCircle className="h-3 w-3" />
                        {isRTL ? 'متأخرة' : 'Overdue'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as any)}
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                      >
                        <option value="paid">{isRTL ? 'مدفوعة' : 'Paid'}</option>
                        <option value="pending">{isRTL ? 'معلقة' : 'Pending'}</option>
                        <option value="overdue">{isRTL ? 'متأخرة' : 'Overdue'}</option>
                      </select>
                      <button
                        onClick={() => openPdfExport(`Invoice ${inv.invoiceNumber} - ${inv.clientName}`)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        title="Print / PDF Invoice"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isExpenseFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">{isRTL ? 'إضافة مصروف جديد' : 'Add New Expense'}</h3>
            <input
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              placeholder={isRTL ? 'الفئة (مثال: إيجار، رواتب)' : 'Category (e.g. Rent, Payroll)'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder={isRTL ? 'الوصف' : 'Description'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder={isRTL ? 'المبلغ' : 'Amount'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsExpenseFormOpen(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
