import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, Landmark, QrCode, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none';

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const max = 480;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let out = canvas.toDataURL('image/png');
        if (out.length > 400000) out = canvas.toDataURL('image/jpeg', 0.9);
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

export const PaymentInfoCard: React.FC = () => {
  const { isRTL, paymentInfo, showToast } = useApp();
  const { phone, link, qr, note } = paymentInfo;
  if (!phone && !link && !qr) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      showToast(isRTL ? 'تم نسخ الرقم' : 'Number copied');
    } catch {
      showToast(phone);
    }
  };
  const safeLink = /^https?:\/\//i.test(link) ? link : link ? `https://${link}` : '';

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <Landmark className="h-4 w-4 text-emerald-400" />
        <span>{isRTL ? 'بيانات التحويل (إنستاباي)' : 'Payment details (InstaPay)'}</span>
      </h3>
      {note && <p className="text-[11px] leading-relaxed text-slate-300">{note}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {qr && <img src={qr} alt="InstaPay QR" className="h-40 w-40 shrink-0 self-center rounded-xl bg-white p-1.5" />}
        <div className="flex-1 space-y-2">
          {phone && (
            <div className="flex items-center gap-2">
              <span dir="ltr" className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-center font-mono text-sm font-bold tracking-wider text-emerald-300">
                {phone}
              </span>
              <button onClick={copy} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
          {safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {isRTL ? 'افتح رابط الدفع' : 'Open payment link'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const PaymentInfoEditor: React.FC = () => {
  const { isRTL, paymentInfo, updatePaymentInfo, showToast } = useApp();
  const [form, setForm] = useState(paymentInfo);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(paymentInfo);
  }, [paymentInfo.phone, paymentInfo.link, paymentInfo.qr, paymentInfo.note]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      showToast(isRTL ? 'اختر صورة' : 'Choose an image');
      return;
    }
    try {
      setForm((p) => ({ ...p, qr: '' }));
      const url = await toDataUrl(f);
      setForm((p) => ({ ...p, qr: url }));
    } catch {
      showToast(isRTL ? 'تعذر قراءة الصورة' : 'Could not read the image');
    }
  };

  const save = async () => {
    setBusy(true);
    await updatePaymentInfo(form);
    setBusy(false);
  };

  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <Landmark className="h-4 w-4 text-emerald-400" />
        <span>{isRTL ? 'بيانات الدفع للفاوندرز (إنستاباي)' : 'Founder payment details (InstaPay)'}</span>
      </h3>
      <p className="text-[11px] text-slate-400">
        {isRTL
          ? 'اللي تكتبه هنا بيظهر للفاوندرز في صفحة الدعم الفني فورًا. سيب الحقل فاضي لو مش عايز تظهره.'
          : 'What you enter here shows to founders on their Support page right away. Leave a field empty to hide it.'}
      </p>
      <input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={isRTL ? 'رقم الموبايل للتحويل' : 'Mobile number'} className={inputClass} />
      <input dir="ltr" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder={isRTL ? 'رابط إنستاباي' : 'InstaPay link'} className={inputClass} />
      <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder={isRTL ? 'ملاحظة للفاوندرز (اختياري)' : 'Note for founders (optional)'} className={inputClass} />
      <div className="flex items-center gap-3">
        {form.qr ? (
          <img src={form.qr} alt="QR" className="h-20 w-20 rounded-lg bg-white p-1" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-700 text-slate-600">
            <QrCode className="h-6 w-6" />
          </span>
        )}
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">
            <Upload className="h-3.5 w-3.5" />
            {isRTL ? 'رفع صورة QR' : 'Upload QR image'}
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          {form.qr && (
            <button onClick={() => setForm({ ...form, qr: '' })} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300">
              <Trash2 className="h-3.5 w-3.5" />
              {isRTL ? 'حذف الصورة' : 'Remove image'}
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
          {isRTL ? 'حفظ' : 'Save'}
        </button>
      </div>
    </div>
  );
};
