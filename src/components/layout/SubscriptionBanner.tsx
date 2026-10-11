import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const SubscriptionBanner: React.FC = () => {
  const { activeTenant, activeAccess, isReadOnly, isRTL } = useApp();
  const { profile } = useAuth();
  if (!profile || !activeTenant || (profile.roleCode !== 'founder' && profile.roleCode !== 'assistant')) return null;

  if (isReadOnly) {
    const isFounder = profile.roleCode === 'founder';
    const reasonAr =
      activeAccess.reason === 'expired'
        ? `انتهى الاشتراك${activeAccess.expiresOn ? ` بتاريخ ${activeAccess.expiresOn}` : ''}`
        : 'الاشتراك موقوف';
    const reasonEn =
      activeAccess.reason === 'expired'
        ? `Subscription ended${activeAccess.expiresOn ? ` on ${activeAccess.expiresOn}` : ''}`
        : 'Subscription is suspended';
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          {isRTL
            ? `${reasonAr}. تقدر تشوف بياناتك بس مش هتقدر تضيف أو تعدّل أو تحذف حاجة لحد ما يتجدد الاشتراك.${isFounder ? ' تواصل مع الدعم الفني للتجديد.' : ' كلّم المسؤول عنك للتجديد.'}`
            : `${reasonEn}. You can view your data but cannot add, edit or delete anything until it is renewed.${isFounder ? ' Contact support to renew.' : ' Ask your manager to renew.'}`}
        </p>
      </div>
    );
  }

  if (profile.roleCode === 'founder' && !activeAccess.inFreePeriod && activeAccess.expiresOn && activeAccess.daysLeft <= 7) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          {isRTL
            ? `اشتراكك ينتهي بتاريخ ${activeAccess.expiresOn} (متبقي ${activeAccess.daysLeft} يوم). جدّده قبل الانتهاء علشان ما يتحولش لوضع القراءة فقط.`
            : `Your subscription ends on ${activeAccess.expiresOn} (${activeAccess.daysLeft} day(s) left). Renew before it ends to avoid read-only mode.`}
        </p>
      </div>
    );
  }
  return null;
};
