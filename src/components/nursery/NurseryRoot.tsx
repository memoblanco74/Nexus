import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NurseryChildrenHub } from './NurseryChildrenHub';
import { NurseryMoneyView, NurserySubscriptionsView } from './NurseryFinanceView';
import { NurseryHome } from './NurseryHome';
import { useNurseryCore } from './nurseryApi';

export const NurseryRoot: React.FC = () => {
  const { screen, activeTenant } = useApp();
  const { allowedClassIds } = useAuth();
  const core = useNurseryCore(activeTenant?.id, allowedClassIds);
  if (screen === 'patients' || screen === 'bookings') return <NurseryChildrenHub core={core} />;
  if (screen === 'subscriptions') return <NurserySubscriptionsView core={core} />;
  if (screen === 'accounting') return <NurseryMoneyView />;
  return <NurseryHome core={core} />;
};
