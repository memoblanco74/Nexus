import React from 'react';
import { Gift } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const FreePeriodBanner: React.FC = () => {
  const { activeTenant, freePeriodDays, freeInfoFromStart, isRTL } = useApp();
  const { profile } = useAuth();
  if (profile?.roleCode !== 'founder' || !activeTenant) return null;

  const info = freeInfoFromStart(activeTenant.startDate);
  if (!info.active) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
      <Gift className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">
        {isRTL
          ? `أنت حالياً في فترة الاستخدام المجاني (${freePeriodDays} يوم) وتنتهي بتاريخ ${info.endsOn}، متبقي ${info.daysLeft} يوم.`
          : `You are currently in the free usage period (${freePeriodDays} days). It ends on ${info.endsOn}, ${info.daysLeft} day(s) left.`}
      </p>
    </div>
  );
};
