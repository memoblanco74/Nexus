import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NurseryChildrenView } from './NurseryChildrenView';
import { NurseryDailyView } from './NurseryDailyView';
import { PaymentsTab } from './NurseryFinanceView';
import { NurseryCore } from './nurseryApi';
import { takePending } from '../../lib/pendingOpen';

type Tab = 'children' | 'daily' | 'payments';

export const NurseryChildrenHub: React.FC<{ core: NurseryCore }> = ({ core }) => {
  const { isRTL, screen } = useApp();
  const { can } = useAuth();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [tab, setTab] = useState<Tab>(screen === 'bookings' ? 'daily' : 'children');

  useEffect(() => {
    if (screen === 'bookings') setTab('daily');
  }, [screen]);

  useEffect(() => {
    if (takePending('collect_fee')) setTab('payments');
  }, []);

  const allTabs: Array<[Tab, string, boolean]> = [
    ['children', tx('بيانات الأطفال', 'Children'), true],
    ['daily', tx('اليومية والحضور', 'Daily log'), can('daily.view')],
    ['payments', tx('تحصيل الاشتراكات', 'Fee collection'), can('payments.view')],
  ];
  const tabs = allTabs.filter((t) => t[2]).map((t) => [t[0], t[1]] as [Tab, string]);
  const cur: Tab = tabs.some((t) => t[0] === tab) ? tab : tabs[0][0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-bold ${cur === k ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400'}`}>{label}</button>
        ))}
      </div>
      {cur === 'children' ? <NurseryChildrenView core={core} /> : cur === 'daily' ? <NurseryDailyView core={core} /> : <PaymentsTab core={core} />}
    </div>
  );
};
