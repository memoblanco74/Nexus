import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';
import {
  ShieldCheck,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  QrCode,
  Package,
  CircleDollarSign,
  Users,
  CalendarCheck,
} from 'lucide-react';

type Tab = { id: ScreenId; label: string; icon: React.ReactNode };

export const MobileBottomNav: React.FC = () => {
  const { screen, setScreen, setIsQrScannerOpen, isRTL } = useApp();
  const { profile } = useAuth();

  const role = profile?.roleCode;

  let tabs: Tab[] = [];
  let showScanFab = false;

  if (role === 'super_admin') {
    tabs = [
      { id: 'super_admin', label: isRTL ? 'المشرف' : 'Admin', icon: <ShieldCheck className="h-5 w-5" /> },
      { id: 'catalog', label: isRTL ? 'الأنظمة' : 'Catalog', icon: <LayoutGrid className="h-5 w-5" /> },
      { id: 'settings', label: isRTL ? 'الإعدادات' : 'Settings', icon: <Settings className="h-5 w-5" /> },
    ];
    showScanFab = false;
  } else if (role === 'founder') {
    tabs = [
      { id: 'founder', label: isRTL ? 'الرئيسية' : 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
      { id: 'patients', label: isRTL ? 'المرضى' : 'Patients', icon: <Users className="h-5 w-5" /> },
      { id: 'inventory', label: isRTL ? 'المخزون' : 'Stock', icon: <Package className="h-5 w-5" /> },
      { id: 'accounting', label: isRTL ? 'المالية' : 'Finance', icon: <CircleDollarSign className="h-5 w-5" /> },
    ];
    showScanFab = true;
  } else if (role === 'assistant') {
    tabs = [
      { id: 'assistant', label: isRTL ? 'الرئيسية' : 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
      { id: 'bookings', label: isRTL ? 'الحجوزات' : 'Bookings', icon: <CalendarCheck className="h-5 w-5" /> },
      { id: 'inventory', label: isRTL ? 'المخزون' : 'Stock', icon: <Package className="h-5 w-5" /> },
    ];
    showScanFab = true;
  }

  const firstHalf = showScanFab ? tabs.slice(0, 2) : tabs;
  const secondHalf = showScanFab ? tabs.slice(2) : [];

  const renderTab = (tab: Tab) => {
    const isActive = screen === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => setScreen(tab.id)}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium transition ${
          isActive
            ? 'text-blue-400 dark:text-blue-400 light:text-blue-600'
            : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-slate-600'
        }`}
      >
        {tab.icon}
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/90 px-2 backdrop-blur-xl lg:hidden dark:border-slate-800 dark:bg-slate-950/90 light:border-slate-200 light:bg-white/95">
      {firstHalf.map(renderTab)}

      {showScanFab && (
        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-slate-950 transition hover:scale-105 active:scale-95"
          title="Scan QR Code"
        >
          <QrCode className="h-6 w-6" />
        </button>
      )}

      {secondHalf.map(renderTab)}
    </div>
  );
};
