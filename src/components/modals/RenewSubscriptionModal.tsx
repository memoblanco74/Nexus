import React, { useState } from 'react';
import { CalendarPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parsePaymentMessage } from '../../lib/paymentParse';

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
  const [msg, setMsg] = useState('');
  const [method, setMethod] = useState('InstaPay');
  const [reference, setReference] = useState('');
  const [sender, setSender] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toLocaleString('sv-SE', { timeZone: 'Africa/Cairo' }).slice(0, 16).replace(' ', 'T'));
  const [note, setNote] = useState('');
  const [filled, setFilled] = useState('');

  const onPasteMsg = (v: string) => {
    setMsg(v);
    const p = parsePaymentMessage(v);
    const got: string[] = [];
    if (p.amount) {
      setPaid(p.amount);
      got.push(isRTL ? 'المبلغ' : 'amount');
      const unit = (tenants.find((t) => t.id === tenantId)?.mrr || 0) * (1 - discountPercent / 100);
      const amt = Number(p.amount);
      if (unit > 0 && amt > 0) {
        let m = Math.round(amt / unit);
        if (m < 1) m = 1;
        if (m > 120) m = 120;
        const exact = Math.abs(unit * m - amt) < 0.5;
        setMonths(m);
        setCustom([1, 3, 6, 12].includes(m) ? '' : String(m));
        got.push(isRTL ? `عدد الأشهر (${m})${exact ? '' : ' تقريبي'}` : `months (${m})${exact ? '' : ', approx.'}`);
      }
    }
    if (p.reference) { setReference(p.reference); got.push(isRTL ? 'المرجع' : 'reference'); }
    if (p.sender) { setSender(p.sender); got.push(isRTL ? 'المحوّل' : 'sender'); }
    if (p.paidAt) { setPaidAt(p.paidAt); got.push(isRTL ? 'التاريخ' : 'date'); }
    if (p.method) setMethod(p.method);
    setFilled(v.trim() ? (got.length ? (isRTL ? 'تمت تعبئة: ' : 'Filled: ') + got.join('، ') : (isRTL ? 'لم أستطع قراءة الرسالة' : 'Could not read the message')) : '');
  };
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
    if (!Number.isFinite(paidNum) || paidNum < 0) { setBusy(false); return; }
    const res = await renewSubscription(tenantId, months, paidNum, total, { method, reference, paidAt, sender, note });
    setBusy(false);
    if (res) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pb-20" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-5" onClick={(e) => e.stopPropagation()}>
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
        </div>
        <div className="space-y-2 rounded-xl border border-slate-800 p-3">
          <p className="text-[11px] font-semibold text-slate-300">{isRTL ? 'بيانات الدفع' : 'Payment details'}</p>
          <textarea value={msg} onChange={(e) => onPasteMsg(e.target.value)} rows={2} placeholder={isRTL ? 'الصق رسالة التحويل هنا لتعبئة البيانات تلقائياً' : 'Paste the transfer message to auto-fill'} className={"w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none text-xs"} />
          {filled && <p className="text-[11px] text-emerald-300">{filled}</p>}
          <span className="block text-[11px] text-slate-400">{isRTL ? 'المبلغ المحصّل (فارغ = المطلوب)' : 'Amount received (empty = due)'}</span>
          <input inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={String(total)} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
            {['InstaPay', 'Vodafone Cash', 'Bank transfer', 'Cash', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input value={reference} onChange={(e) => setReference(e.target.value)} dir="ltr" placeholder={isRTL ? 'الرقم المرجعي (إن وجد)' : 'Reference (if any)'} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder={isRTL ? 'اسم المحوّل' : 'Sender name'} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          <input type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={isRTL ? 'ملاحظة (اختياري)' : 'Note (optional)'} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
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
