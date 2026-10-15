import React from 'react';
import { useApp } from '../../context/AppContext';
import { NurseryChildrenView } from './NurseryChildrenView';
import { NurseryDailyView } from './NurseryDailyView';
import { NurseryFinanceView } from './NurseryFinanceView';
import { NurseryHome } from './NurseryHome';
import { useNurseryCore } from './nurseryApi';

export const NurseryRoot: React.FC = () => {
  const { screen, activeTenant } = useApp();
  const core = useNurseryCore(activeTenant?.id);
  if (screen === 'patients') return <NurseryChildrenView core={core} />;
  if (screen === 'bookings') return <NurseryDailyView core={core} />;
  if (screen === 'accounting') return <NurseryFinanceView core={core} />;
  return <NurseryHome core={core} />;
};
