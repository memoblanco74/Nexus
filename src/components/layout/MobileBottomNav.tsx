import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';
import { screensFor } from '../../lib/screenAccess';
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
  Settings2,
  Menu,
  UserCheck,
  FolderKanban,
  BarChart3,
  HelpCircle,
  Building,
  ChevronDown,
  X,
} from 'lucide-react';

type Tab = { id: ScreenId; label: string; icon: React.ReactNode };

export const MobileBottomNav: React.FC = () => {
  const { screen, setScreen, setIsQrScannerOpen, isRTL, systemKey, t, language, activeTenant, setIsTenantModalOpen, founderUnreadCount, describeTenant } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const { profile } = useAuth();

  const role = profile?.roleCode;

  let tabs: Tab[] = [];
  let showScanFab = false;

  if (role === 'super_admin') {
    tabs = [
      { id: 'super_admin', label: isRTL ? 'المشرف' : 'Admin', icon: <ShieldCheck className="h-5 w-5" /> },
      { id: 'catalog', label: isRTL ? 'الأنظمة' : 'Catalog', icon: <LayoutGrid className="h-5 w-5" /> },
      { id: 'platform', label: isRTL ? 'المنصة' : 'Platform', icon: <Settings2 className="h-5 w-5" /> },
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
    showScanFab = false;
  }

  if (systemKey === 'nursery' && (role === 'founder' || role === 'assistant')) {
    tabs = [
      { id: role === 'founder' ? 'founder' : 'assistant', label: isRTL ? 'الرئيسية' : 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
      { id: 'patients', label: isRTL ? 'الأطفال' : 'Children', icon: <Users className="h-5 w-5" /> },
      { id: 'bookings', label: isRTL ? 'اليومية' : 'Daily', icon: <CalendarCheck className="h-5 w-5" /> },
      { id: 'accounting', label: isRTL ? 'الاشتراكات' : 'Fees', icon: <CircleDollarSign className="h-5 w-5" /> },
    ];
    showScanFab = false;
  }

  const ICONS: Partial<Record<ScreenId, React.ReactNode>> = {
    founder: <LayoutDashboard className="h-5 w-5" />, assistant: <UserCheck className="h-5 w-5" />, projects: <FolderKanban className="h-5 w-5" />,
    patients: <Users className="h-5 w-5" />, bookings: <CalendarCheck className="h-5 w-5" />, inventory: <Package className="h-5 w-5" />,
    accounting: <CircleDollarSign className="h-5 w-5" />, reports: <BarChart3 className="h-5 w-5" />, project_settings: <Settings2 className="h-5 w-5" />,
    settings: <Settings className="h-5 w-5" />, support: <HelpCircle className="h-5 w-5" />,
  };
  const isMember = role === 'founder' || role === 'assistant';
  const tabIds = tabs.map((x) => x.id);
  const moreItems = isMember ? screensFor(role, systemKey).filter((id) => !tabIds.includes(id) && ICONS[id]) : [];
  const moreActive = moreItems.includes(screen);
  const tenantInfo = activeTenant ? describeTenant(activeTenant) : null;

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
            : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-[#475569]'
        }`}
      >
        {tab.icon}
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/90 px-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 light:border-[#e2e8f0] light:bg-white/95`}>
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

      {isMember && (
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium transition ${moreActive ? 'text-blue-400 light:text-blue-600' : 'text-slate-400 hover:text-slate-200 light:text-[#475569]'}`}
        >
          <Menu className="h-5 w-5" />
          <span>{isRTL ? 'المزيد' : 'More'}</span>
        </button>
      )}

      {moreOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setMoreOpen(false)} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-h-[80vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 p-4 pb-6 shadow-2xl sm:rounded-3xl light:bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white light:text-[#0f172a]">{isRTL ? 'القائمة' : 'Menu'}</h3>
              <button onClick={() => setMoreOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>
            {activeTenant && role === 'founder' && (
              <button
                onClick={() => { setMoreOpen(false); setIsTenantModalOpen(true); }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs light:bg-[#f8fafc]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400"><Building className="h-4 w-4" /></div>
                  <div className="min-w-0 text-start">
                    <p className="truncate font-semibold text-white light:text-[#0f172a]">{language === 'ar' ? activeTenant.nameAr : activeTenant.name}</p>
                    <p className="truncate text-[10px] text-slate-400">{tenantInfo?.system}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            )}
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((id) => (
                <button
                  key={id}
                  onClick={() => { setScreen(id); setMoreOpen(false); }}
                  className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[11px] font-semibold transition ${screen === id ? 'border-blue-500/50 bg-blue-600/15 text-blue-400' : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 light:bg-[#f8fafc] light:text-[#334155]'}`}
                >
                  {ICONS[id]}
                  <span className="text-center leading-tight">{t(`nav.${id}`)}</span>
                  {id === 'support' && founderUnreadCount > 0 && <span className="absolute end-2 top-2 rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">{founderUnreadCount}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
