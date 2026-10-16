import React, { useState } from 'react';
import { CalendarPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  tenantId: string;
  tenantName: string;
  discountPercent?: number;
  onClose: () => void;
}

export const RenewSubscriptionModal: React.FC<Props> = ({ tenantId, tenantName, discountPercent = 0, onClose }) => {
  const { isRTL, tenants, tenantAccess, renewSubscription, money } = useApp();
  const [months, setMonths] = useState(1);
  const [paid, setPaid] = useState('');
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);

  const tenant = tenants.find((t) => t.id === tenantId);
  const access = tenantAccess(tenant);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const base = access.expiresOn && access.expiresOn > today ? access.expiresOn : today;
  const preview = (() => {
    const d = new Date(base + 'T00:00:00Z');
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
    return d.toISOString().slice(0, 10);
  })();

  const monthly = tenant?.mrr || 0;
  const gross = monthly * months;
  const discountValue = gross * (discountPercent / 100);
  const total = Math.round((gross - discountValue) * 100) / 100;

  const pickCustom = (v: string) => {
    const digits = v
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[^0-9]/g, '');
    setCustom(digits);
    const n = Number(digits);
    if (n >= 1 && n <= 120) setMonths(n);
  };

  const confirm = async () => {
    setBusy(true);
    const paidNum = paid.trim() === '' ? total : Number(paid);
    if (!Number.isFinite(paidNum) || paidNum < 0) return;
    const res = await renewSubscription(tenantId, months, paidNum, total);
    setBusy(false);
    if (res) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <CalendarPlus className="h-4 w-4 text-emerald-400" />
            {isRTL ? 'تجديد الاشتراك' : 'Renew subscription'}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs font-semibold text-slate-200">{tenantName}</p>
        <div className="rounded-xl bg-slate-900/60 p-3 text-[11px] text-slate-400">
          {access.expiresOn
            ? isRTL
              ? `ينتهي حاليًا: ${access.expiresOn}${access.daysLeft < 0 ? ' (منتهي)' : ` (متبقي ${access.daysLeft} يوم)`}`
              : `Currently ends: ${access.expiresOn}${access.daysLeft < 0 ? ' (expired)' : ` (${access.daysLeft} day(s) left)`}`
            : isRTL ? 'لا يوجد تاريخ انتهاء مسجل' : 'No end date recorded'}
        </div>
        <div>
          <p className="mb-2 text-[11px] text-slate-400">{isRTL ? 'عدد الأشهر المدفوعة' : 'Months paid'}</p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMonths(m);
                  setCustom('');
                }}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  months === m && !custom ? 'bg-emerald-600 text-white' : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            inputMode="numeric"
            value={custom}
            onChange={(e) => pickCustom(e.target.value)}
            placeholder={isRTL ? 'أو اكتب عدد آخر' : 'Or enter another number'}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-slate-200">
          <div className="flex justify-between"><span className="text-slate-400">{isRTL ? 'السعر الشهري' : 'Monthly price'}</span><span>{money(monthly, 2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">{isRTL ? `× ${months} شهر` : `× ${months} month(s)`}</span><span>{money(gross, 2)}</span></div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-emerald-300"><span>{isRTL ? `خصم ${discountPercent}%` : `Discount ${discountPercent}%`}</span><span>- {money(discountValue, 2)}</span></div>
          )}
          <div className="flex justify-between border-t border-blue-500/30 pt-1.5 text-sm font-extrabold text-white"><span>{isRTL ? 'المطلوب من المشترك' : 'Amount due'}</span><span>{money(total, 2)}</span></div>
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">{isRTL ? 'المبلغ المحصّل فعلياً (اتركه فارغاً = المطلوب)' : 'Amount actually received (empty = amount due)'}</span>
          <input inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={String(total)} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        </div>
        <p className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {isRTL ? `هيتجدد حتى ${preview}` : `Will be renewed until ${preview}`}
        </p>
        <button
          onClick={confirm}
          disabled={busy}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {isRTL ? `تأكيد التجديد (${months} شهر)` : `Confirm renewal (${months} mo)`}
        </button>
      </div>
    </div>
  );
};
