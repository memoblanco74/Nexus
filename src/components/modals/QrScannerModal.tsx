import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QrCode, X, CheckCircle2, ScanLine, Package, ArrowRight } from 'lucide-react';

export const QrScannerModal: React.FC = () => {
  const {
    isQrScannerOpen,
    setIsQrScannerOpen,
    inventory,
    adjustStock,
    isRTL,
    showToast,
  } = useApp();

  const [scannedItem, setScannedItem] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);

  if (!isQrScannerOpen) return null;

  const handleSimulateScan = (item: any) => {
    setScannedItem(item);
    setIsScanning(false);
  };

  const handleQuickDeduct = (item: any, count = 1) => {
    adjustStock(item.id, Math.max(0, item.stockLevel - count), `Barcode Scan (Quick Deduct -${count})`);
    showToast(isRTL ? `تم استقطاع ${count} وحدة بنجاح` : `Deducted ${count} ${item.unit}`);
    setIsQrScannerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              {isRTL ? 'ماسح الباركود ورمز الاستجابة السريعة QR' : 'Clinical Barcode & QR Scanner'}
            </h3>
          </div>
          <button
            onClick={() => setIsQrScannerOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isScanning ? (
          <div className="mt-4 space-y-4">
            {/* Viewfinder simulator */}
            <div className="relative flex flex-col items-center justify-center h-52 w-full rounded-2xl bg-slate-900/90 border-2 border-dashed border-blue-500/50 overflow-hidden">
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce" />
              <ScanLine className="h-14 w-14 text-blue-400/80 animate-pulse" />
              <p className="mt-2 text-xs text-slate-400 text-center px-4">
                {isRTL
                  ? 'وجّه الكاميرا نحو باركود الصنف الطبي أو انقر على أحد النماذج أدناه'
                  : 'Point camera at medication barcode or tap a quick-scan sample below'}
              </p>
            </div>

            {/* Quick-tap sample barcodes */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isRTL ? 'أصناف للاختبار السريع:' : 'Simulate Scanning Item:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {inventory.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSimulateScan(item)}
                    className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left text-xs hover:border-blue-500 hover:bg-slate-800/80 transition"
                  >
                    <span className="font-bold text-white truncate w-full">{item.nameEn}</span>
                    <span className="text-[10px] font-mono text-blue-400">{item.sku}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white mt-2">{scannedItem?.nameEn}</h4>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">{scannedItem?.sku}</p>
              <p className="text-xs text-slate-300 mt-2">
                Current Stock: <strong className="text-white">{scannedItem?.stockLevel} {scannedItem?.unit}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDeduct(scannedItem, 1)}
                className="rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {isRTL ? 'استقطاع وحدة واحدة (-1)' : 'Deduct 1 Unit (-1)'}
              </button>
              <button
                onClick={() => handleQuickDeduct(scannedItem, 5)}
                className="rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {isRTL ? 'استقطاع خمس وحدات (-5)' : 'Deduct 5 Units (-5)'}
              </button>
            </div>

            <button
              onClick={() => setIsScanning(true)}
              className="w-full rounded-xl border border-slate-800 py-2 text-xs text-slate-400 hover:text-white"
            >
              {isRTL ? 'مسح باركود آخر' : 'Scan Another Item'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const TenantSwitcherModal: React.FC = () => {
  const {
    isTenantModalOpen,
    setIsTenantModalOpen,
    tenants,
    activeTenant,
    setActiveTenant,
    addTenant,
    language,
    isRTL,
    showToast,
  } = useApp();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [plan, setPlan] = useState<'Basic' | 'Professional' | 'Enterprise' | 'Enterprise Plus'>('Enterprise');

  if (!isTenantModalOpen) return null;

  const handleSelectTenant = (t: any) => {
    setActiveTenant(t);
    setIsTenantModalOpen(false);
    showToast(isRTL ? `تم التبديل إلى ${t.nameAr}` : `Switched to ${t.name}`);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addTenant({
      name,
      nameAr: nameAr || name,
      code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9gE1JDWRLTujYuI4GLunAIgM2fACHm8E1ABKA-gyMCXQPPA9K4sO6vaTin4sZsA2Zf2QyqfP67tDlHsF_CCj1QkitgmKy1-RkccstCl825OACKHc8W7kvmN19ULpgqVhXUX799Hy4mWOEz3X_XPwW7vPgh-5wujpsEhBvGyMGW_-8DOggN9FOetKqBk-H-xBwqrz1klbx_ziRuyaDpWRjkB0JCnI_e4UHFaWef49XoNGq_KGhScj2uw',
      plan,
      status: 'Active',
      expiryDate: 'Dec 31, 2025',
      mrr: 95000,
      patientsCount: 350,
      todayBookings: 18,
      location: 'Riyadh Medical District',
    });

    setIsAddingNew(false);
    setIsTenantModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'إدارة المستأجرين والمراكز الطبية' : 'Switch Clinic Tenant & Organization'}
          </h3>
          <button
            onClick={() => setIsTenantModalOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isAddingNew ? (
          <div className="mt-4 space-y-3">
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {tenants.map((t) => {
                const isActive = activeTenant ? t.id === activeTenant.id : false;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTenant(t)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                      isActive
                        ? 'border-blue-500/60 bg-blue-600/10'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={t.logo} alt={t.name} className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-700" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">
                            {language === 'ar' ? t.nameAr : t.name}
                          </p>
                          {isActive && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{t.code} • {t.location}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        {t.plan}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1">${(t.mrr / 1000).toFixed(0)}k MRR</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                + {isRTL ? 'إضافة مستأجر / عيادة جديدة' : 'Provision New Clinic Tenant'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateTenant} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Clinic Name (English)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Al-Amal Specialized Hospital"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">اسم العيادة (عربي)</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مستشفى الأمل التخصصي"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Subscription Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Basic">Basic ($15k/mo)</option>
                <option value="Professional">Professional ($68k/mo)</option>
                <option value="Enterprise">Enterprise ($124k/mo)</option>
                <option value="Enterprise Plus">Enterprise Plus ($284k/mo)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Save & Provision
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ExportPdfModal: React.FC = () => {
  const {
    isPdfExportOpen,
    setIsPdfExportOpen,
    pdfExportTitle,
    activeTenant,
    financials,
    invoices,
    isRTL,
  } = useApp();

  if (!isPdfExportOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'معاينة المستند الطبي المعتمد' : 'Executive PDF Export & Print Preview'}
          </h3>
          <button
            onClick={() => setIsPdfExportOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Document Preview Area */}
        <div className="mt-4 rounded-xl bg-slate-900/90 p-6 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div>
              <h2 className="text-base font-extrabold text-white">{pdfExportTitle}</h2>
              <p className="text-[11px] text-blue-400 font-medium mt-0.5">
                {activeTenant ? `${activeTenant.name} (${activeTenant.code})` : ''} • Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-1 text-[10px] font-bold">
              OFFICIAL RECORD
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Total Revenue MTD</span>
              <p className="text-sm font-bold text-white mt-0.5">${financials.totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Net Operating Profit</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">${financials.netProfit.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Active EMR Files</span>
              <p className="text-sm font-bold text-white mt-0.5">1,248 Records</p>
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Recent Ledger Entries</span>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
              {invoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="p-2 flex justify-between bg-slate-950/60">
                  <span className="font-mono text-white">{inv.invoiceNumber} - {inv.clientName}</span>
                  <span className="font-bold text-emerald-400">${inv.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
          <button
            onClick={() => setIsPdfExportOpen(false)}
            className="rounded-xl border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md"
          >
            {isRTL ? 'طباعة / حفظ كـ PDF' : 'Print / Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
