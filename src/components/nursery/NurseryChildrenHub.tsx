import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NurseryChildrenView } from './NurseryChildrenView';
import { NurseryDailyView } from './NurseryDailyView';
import { PaymentsTab } from './NurseryFinanceView';
import { NurseryCore } from './nurseryApi';

type Tab = 'children' | 'daily' | 'payments';

export const NurseryChildrenHub: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, screen } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [tab, setTab] = useState<Tab>(screen === 'bookings' ? 'daily' : 'children');

  useEffect(() => {
    if (screen === 'bookings') setTab('daily');
  }, [screen]);

  const tabs: Array<[Tab, string]> = [
    ['children', tx('بيانات الأطفال', 'Children')],
    ['daily', tx('اليومية والحضور', 'Daily log')],
    ['payments', tx('تحصيل الاشتراكات', 'Fee collection')],
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-bold ${tab === k ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400'}`}>{label}</button>
        ))}
      </div>
      {tab === 'children' ? <NurseryChildrenView core={core} /> : tab === 'daily' ? <NurseryDailyView core={core} /> : <PaymentsTab core={core} />}
    </div>
  );
};
