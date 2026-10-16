import React, { useState } from 'react';
import { Percent, Settings2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SaveButton } from '../ui/SaveButton';
import { PaymentInfoEditor } from './PaymentInfoParts';

export const PlatformSettingsView: React.FC = () => {
  const { isRTL, t, showToast, defaultDiscount, setDefaultDiscount, freePeriodDays, setFreePeriodDays } = useApp();
  const [freeDaysInput, setFreeDaysInput] = useState<string>('');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-white sm:text-2xl">
          <Settings2 className="h-5 w-5 text-blue-400" />
          {isRTL ? 'إعدادات المنصة' : 'Platform Settings'}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL ? 'الخصم الافتراضي، بيانات الدفع للفاوندرز، وفترة الاستخدام المجاني' : 'Default discount, founder payment details and free usage period'}
        </p>
      </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Percent className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-[#0f172a]">
                {t('super_admin.default_discount')}
              </h3>
            </div>
            <p className="mt-2.5 text-xs text-slate-400">
              {isRTL
                ? 'نسبة الخصم التلقائية المطبقة على عقود المستأجرين الجدد وتجديدات الباقات.'
                : 'Global baseline discount applied to newly provisioned clinic contracts.'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {['10%', '15%', '20%', '25%'].map((disc) => (
              <button
                key={disc}
                onClick={() => {
                  setDefaultDiscount(disc);
                  showToast(isRTL ? `تم تعيين الخصم الافتراضي: ${disc}` : `Default discount set to ${disc}`);
                }}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                  defaultDiscount === disc
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>
        </div>

      <PaymentInfoEditor />

      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-[#0f172a]">
              {isRTL ? 'فترة الاستخدام المجاني' : 'Free Usage Period'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {freePeriodDays > 0
                ? isRTL
                  ? `المحفوظ حالياً: كل مشترك يحصل على ${freePeriodDays} يوم مجاناً تبدأ من تاريخ اشتراكه في مشروعه.`
                  : `Every subscriber gets ${freePeriodDays} free days starting from their own subscription date.`
                : isRTL
                ? 'غير مفعّلة. حدد عدد الأيام ليحصل كل مشترك على فترة مجانية تبدأ من تاريخ اشتراكه.'
                : 'Not active. Set a number of days so each subscriber gets a free period from their own subscription date.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setFreeDaysInput(String(d))}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  freeDaysInput === String(d)
                    ? 'bg-blue-600 text-white'
                    : freePeriodDays === d && freeDaysInput === ''
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {d} {isRTL ? 'يوم' : 'days'}
              </button>
            ))}
            <input
              type="text"
              inputMode="numeric"
              value={freeDaysInput}
              onChange={(e) => setFreeDaysInput(e.target.value)}
              placeholder={isRTL ? 'عدد الأيام' : 'Days'}
              className="w-24 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
            <SaveButton
              signature={freeDaysInput}
              baseline=""
              label={isRTL ? 'حفظ' : 'Save'}
              className="px-3 py-2"
              onSave={async () => {
                const digits = freeDaysInput
                  .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
                  .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  .replace(/[^0-9]/g, '');
                if (!digits) {
                  showToast(isRTL ? 'اكتب عدد الأيام أولاً' : 'Enter the number of days first');
                  return false;
                }
                const ok = await setFreePeriodDays(Number(digits));
                if (ok) setFreeDaysInput('');
                return ok;
              }}
            />
            {freePeriodDays > 0 && (
              <button
                onClick={() => setFreePeriodDays(0)}
                className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
              >
                {isRTL ? 'إلغاء' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
