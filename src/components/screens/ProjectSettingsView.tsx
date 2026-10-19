import React, { useState } from 'react';
import { CalendarClock, Building2, Settings2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SaveButton } from '../ui/SaveButton';
import { ReferralCard } from './ReferralParts';
import { PaymentInfoCard } from './PaymentInfoParts';
import { UserManagementCard } from './AccountSecurityCards';
import { AssistantsView } from './AssistantsView';
import { ProjectDataCard } from './MyDataCard';
import { DemoDataCard } from './DemoDataCard';
import { ClinicOnlineCard } from '../clinic/ClinicOnlineCard';
import { SubscriptionHistoryList } from '../modals/SubscriptionHistory';

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none';

const ProjectNameCard: React.FC = () => {
  const { isRTL, activeTenant, renameTenant, showToast } = useApp();
  const stored = activeTenant ? (isRTL ? activeTenant.nameAr || activeTenant.name : activeTenant.name) : '';
  const [name, setName] = useState(stored);
  const [baseline, setBaseline] = useState(stored);

  React.useEffect(() => {
    setName(stored);
    setBaseline(stored);
  }, [activeTenant?.id]);

  if (!activeTenant) return null;

  const save = async () => {
    if (name.trim().length < 2) {
      showToast(isRTL ? 'اسم المشروع لازم يكون حرفين على الأقل' : 'Project name must be at least 2 characters');
      return false;
    }
    const ok = await renameTenant(activeTenant.id, name.trim());
    if (ok) setBaseline(name.trim());
    return ok;
  };

  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <Building2 className="h-4 w-4 text-blue-400" />
        <span>{isRTL ? 'اسم المشروع' : 'Project name'}</span>
      </h3>
      <p className="text-[11px] text-slate-400">
        {isRTL ? 'الاسم ده بيظهر لك ولكل المساعدين.' : 'This name is shown to you and all your assistants.'}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row" data-write="1">
        <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <SaveButton signature={name.trim()} baseline={baseline} onSave={save} label={isRTL ? 'حفظ' : 'Save'} className="shrink-0 px-5 py-2" />
      </div>
    </div>
  );
};

const PaymentHistoryCard: React.FC = () => {
  const { isRTL, activeTenant } = useApp();
  if (!activeTenant) return null;
  return (
    <div className="glass-panel space-y-3 rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white dark:text-white light:text-[#0f172a]">{isRTL ? 'سجل المدفوعات والتجديدات' : 'Payments & renewals history'}</h3>
      <SubscriptionHistoryList tenantId={activeTenant.id} />
    </div>
  );
};

const SubscriptionCard: React.FC = () => {
  const { isRTL, activeTenant, activeAccess, referral, money, setScreen } = useApp();
  if (!activeTenant) return null;
  const monthly = activeTenant.mrr || 0;
  const percent = referral?.totalPercent || 0;
  const after = Math.round(monthly * (1 - percent / 100) * 100) / 100;
  const status = !activeAccess.writable
    ? { text: isRTL ? 'منتهي (عرض فقط)' : 'Expired (view only)', cls: 'text-red-400' }
    : activeAccess.inFreePeriod
    ? { text: isRTL ? 'فترة مجانية' : 'Free period', cls: 'text-amber-400' }
    : { text: isRTL ? 'نشط' : 'Active', cls: 'text-emerald-400' };

  return (
    <div className="glass-panel space-y-4 rounded-2xl border border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <CalendarClock className="h-4 w-4 text-emerald-400" />
        <span>{isRTL ? 'الاشتراك والتجديد' : 'Subscription & renewal'}</span>
      </h3>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-[10px] text-slate-400">{isRTL ? 'الحالة' : 'Status'}</p>
          <p className={`mt-0.5 font-bold ${status.cls}`}>{status.text}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-[10px] text-slate-400">{isRTL ? 'ينتهي في' : 'Ends on'}</p>
          <p className="mt-0.5 font-bold text-white">{activeAccess.expiresOn || '-'}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-[10px] text-slate-400">{isRTL ? 'المتبقي' : 'Days left'}</p>
          <p className="mt-0.5 font-bold text-white">
            {activeAccess.expiresOn ? (activeAccess.daysLeft < 0 ? (isRTL ? 'منتهي' : 'Expired') : `${activeAccess.daysLeft} ${isRTL ? 'يوم' : 'days'}`) : '-'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-[10px] text-slate-400">{isRTL ? 'خصمك' : 'Your discount'}</p>
          <p className="mt-0.5 font-bold text-emerald-400">{percent}%</p>
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-slate-200">
        <div className="flex justify-between">
          <span className="text-slate-400">{isRTL ? 'سعر الاشتراك الشهري قبل الخصم' : 'Monthly price before discount'}</span>
          <span>{money(monthly, 2)}</span>
        </div>
        {percent > 0 && (
          <div className="flex justify-between text-emerald-300">
            <span>{isRTL ? `خصم ${percent}%` : `Discount ${percent}%`}</span>
            <span>- {money(monthly - after, 2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-blue-500/30 pt-1.5 text-sm font-extrabold text-white">
          <span>{isRTL ? 'السعر الشهري بعد الخصم' : 'Monthly price after discount'}</span>
          <span>{money(after, 2)}</span>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        {isRTL
          ? 'لتجديد الاشتراك: حوّل المبلغ بالطريقة الموضحة تحت، وبعدها كلّم الدعم الفني وقولهم عدد الشهور اللي دفعتها وهيجددوه لك.'
          : 'To renew: transfer the amount using the details below, then message support with the number of months you paid and they will renew it for you.'}
      </p>
      <PaymentInfoCard />
      <button
        onClick={() => setScreen('support')}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
      >
        {isRTL ? 'تواصل مع الدعم لتجديد الاشتراك' : 'Contact support to renew'}
      </button>
    </div>
  );
};

export const ProjectSettingsView: React.FC = () => {
  const { isRTL, systemKey } = useApp();
  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-white sm:text-2xl">
          <Settings2 className="h-5 w-5 text-blue-400" />
          {isRTL ? 'إعدادات المشروع' : 'Project settings'}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL ? 'اسم المشروع، المساعدين، الاشتراك والخصم، وبيانات المشروع' : 'Project name, assistants, subscription & discount, and project data'}
        </p>
      </div>
      <ProjectNameCard />
      <SubscriptionCard />
      <PaymentHistoryCard />
      <ReferralCard />
      {systemKey === 'clinic' && <ClinicOnlineCard />}
      <AssistantsView />
      <UserManagementCard />
      <DemoDataCard />
      <ProjectDataCard />
    </div>
  );
};
