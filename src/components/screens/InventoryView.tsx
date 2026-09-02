import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import {
  Package,
  AlertTriangle,
  Zap,
  DollarSign,
  QrCode,
  Plus,
  Sliders,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    language,
    isRTL,
    inventory,
    autoDeductLogs,
    toggleAutoDeduct,
    setSelectedStockItem,
    setIsAdjustStockOpen,
    setIsQrScannerOpen,
    showToast,
    t,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedChartItem, setSelectedChartItem] = useState<InventoryItem>(
    inventory[0] || {}
  );

  const categories = ['All', 'Consumables', 'Pharmaceuticals', 'Radiology', 'PPE', 'Sanitation'];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      item.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowCriticalCount = inventory.filter(
    (i) => i.status === 'low' || i.status === 'critical'
  ).length;

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedStockItem(item);
    setIsAdjustStockOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('inventory.title')}
            </h1>
            <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
              {isRTL ? 'نظام الاستقطاع التلقائي نشط' : 'Smart Auto-Deduction Engine'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('inventory.subtitle')}
          </p>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/20 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition shadow-sm"
          >
            <QrCode className="h-4 w-4" />
            <span>{t('inventory.scan_qr')}</span>
          </button>

          <button
            onClick={() => {
              setSelectedStockItem(inventory[0]);
              setIsAdjustStockOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-700 dark:bg-slate-900 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <Sliders className="h-4 w-4 text-indigo-400" />
            <span>{t('inventory.adjust_stock')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tracked Items */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('inventory.total_items')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              1,248
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              +14
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'عبر ٦ مستودعات رئيسية' : 'Across 6 clinic departments'}
          </p>
        </div>

        {/* Low & Critical Stock */}
        <div className="glass-card rounded-2xl p-5 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('inventory.low_stock')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-400">
              {lowCriticalCount} {isRTL ? 'أصناف' : 'Items'}
            </h3>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
              {isRTL ? 'مطلوب إعادة طلب' : 'Reorder'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'سرنجات وليدوكائين تحت الحد الأدنى' : 'Lidocaine & Saline below min threshold'}
          </p>
        </div>

        {/* Auto-Deducted Today */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('inventory.auto_deducted_today')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              182 {isRTL ? 'وحدة' : 'Units'}
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              99.4%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'تم استقطاعها آلياً مع مواعيد المرضى' : 'Directly synced with clinical bookings'}
          </p>
        </div>

        {/* Avg Unit Cost */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('inventory.avg_cost')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              $4.85
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              -2.1%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {isRTL ? 'وفر في تكاليف الشراء الجماعي' : 'Bulk procurement savings'}
          </p>
        </div>
      </div>

      {/* Middle Grid: Purchase History Curve & Live Deduction Activity Log */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Purchase History & Price Tracking Chart (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                  {t('inventory.purchase_history')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isRTL ? 'متابعة تغير أسعار الموردين واستهلاك الوحدات' : 'Supplier price trends & unit consumption'}
                </p>
              </div>

              {/* Selector for chart item */}
              <select
                value={selectedChartItem.id}
                onChange={(e) => {
                  const itm = inventory.find((i) => i.id === e.target.value);
                  if (itm) setSelectedChartItem(itm);
                }}
                className="rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {language === 'ar' ? item.nameAr : item.nameEn} ({item.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Overview Callout */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/50 p-3 border border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {isRTL ? 'السعر الحالي للوحدة' : 'Current Unit Price'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold text-white">
                    ${selectedChartItem.unitCost?.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">/{selectedChartItem.unit}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {isRTL ? 'المورد المعتمد' : 'Verified Supplier'}
                </span>
                <p className="text-xs font-bold text-blue-400 mt-0.5">
                  {selectedChartItem.supplier || 'PharmaCorp Global'}
                </p>
              </div>
            </div>

            {/* Glowing SVG Price Chart */}
            <div className="mt-4 h-36 w-full relative pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                <defs>
                  <linearGradient id="priceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Background Grid Lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Area Fill */}
                <path
                  d="M 20 80 Q 100 40, 180 65 T 340 30 T 480 45 L 480 120 L 20 120 Z"
                  fill="url(#priceGrad)"
                />
                {/* Glowing Stroke Curve */}
                <path
                  d="M 20 80 Q 100 40, 180 65 T 340 30 T 480 45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                />

                {/* Data Points */}
                <circle cx="20" cy="80" r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                <circle cx="100" cy="50" r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                <circle cx="180" cy="65" r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                <circle cx="260" cy="45" r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                <circle cx="340" cy="30" r="4" fill="#60a5fa" stroke="#0f172a" strokeWidth="2" />
                <circle cx="480" cy="45" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Jan 2024</span>
            <span>Mar 2024</span>
            <span>May 2024</span>
            <span className="text-blue-400 font-semibold">Jul 2024 (Latest)</span>
          </div>
        </div>

        {/* Live Auto-Deduction Activity Log (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                  {t('inventory.auto_deduct_log')}
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium animate-pulse">
                {isRTL ? 'مباشر' : 'Live Stream'}
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-800/50">
              {autoDeductLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">
                        {language === 'ar' ? log.itemNameAr : log.itemName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {log.bookingId} • <span className="text-slate-500">{log.timeAgo}</span>
                      </p>
                      {log.reason && (
                        <p className="text-[10px] text-red-400 mt-0.5">{log.reason}</p>
                      )}
                    </div>
                  </div>

                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200">
                    -{log.units}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>{isRTL ? 'مربوط بجدول المواعيد' : 'Connected to Booking Engine'}</span>
            <span className="text-emerald-400 font-medium">99.8% SLA</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Inventory Master List */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              {t('inventory.inventory_master')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {filteredInventory.length} {isRTL ? 'أصناف مطابقة' : 'items cataloged'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Pills */}
            <div className="flex gap-1 overflow-x-auto p-0.5 rounded-lg bg-slate-900/60 border border-slate-800">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className={`absolute top-2 ${isRTL ? 'right-2.5' : 'left-2.5'} h-3.5 w-3.5 text-slate-400`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRTL ? 'بحث بالاسم أو SKU...' : 'Search item or SKU...'}
                className={`rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 ${
                  isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'
                } text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-3">{t('common.item')}</th>
                <th className="py-3 px-3">{t('common.sku')}</th>
                <th className="py-3 px-3">{t('common.category')}</th>
                <th className="py-3 px-3">{t('common.stock_level')}</th>
                <th className="py-3 px-3">{t('common.min_required')}</th>
                <th className="py-3 px-3">{t('common.unit_cost')}</th>
                <th className="py-3 px-3 text-center">{t('common.auto_deduct')}</th>
                <th className="py-3 px-3">{t('common.status')}</th>
                <th className="py-3 px-3 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredInventory.map((item) => {
                const stockPercent = Math.min(
                  Math.round((item.stockLevel / item.maxStock) * 100),
                  100
                );
                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">
                        {language === 'ar' ? item.nameAr : item.nameEn}
                      </p>
                      <span className="text-[10px] text-slate-500">{item.location}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {item.sku}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-bold text-white">
                            {item.stockLevel} {item.unit}
                          </span>
                          <span className="text-slate-500">/ {item.maxStock}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${stockPercent}%` }}
                            className={`h-full rounded-full ${
                              item.status === 'critical'
                                ? 'bg-red-500'
                                : item.status === 'low'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {item.minReq} {item.unit}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleAutoDeduct(item.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          item.autoDeduct ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                        title="Toggle Auto Deduct"
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            item.autoDeduct
                              ? isRTL ? '-translate-x-4' : 'translate-x-4'
                              : isRTL ? '-translate-x-1' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      {item.status === 'normal' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          {isRTL ? 'طبيعي' : 'Normal'}
                        </span>
                      )}
                      {item.status === 'low' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                          {isRTL ? 'منخفض' : 'Low'}
                        </span>
                      )}
                      {item.status === 'critical' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                          {isRTL ? 'حرج جداً' : 'Critical'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition"
                      >
                        {isRTL ? 'تعديل' : 'Adjust'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
