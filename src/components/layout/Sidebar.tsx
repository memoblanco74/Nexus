import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';
import {
  ShieldCheck,
  LayoutDashboard,
  UserCheck,
  FolderKanban,
  Users,
  CalendarCheck,
  Package,
  CircleDollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Building,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    screen,
    setScreen,
    language,
    activeTenant,
    setIsTenantModalOpen,
    isRTL,
    t,
  } = useApp();
  const { profile } = useAuth();

  const ROLE_SCREENS: Record<string, ScreenId[]> = {
    super_admin: ['super_admin', 'settings', 'support'],
    founder: ['founder', 'projects', 'patients', 'bookings', 'inventory', 'accounting', 'reports', 'settings', 'support'],
    assistant: ['assistant', 'patients', 'bookings', 'inventory', 'settings', 'support'],
  };
  const allowedScreens = profile ? ROLE_SCREENS[profile.roleCode] || [] : [];

  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'super_admin',
      label: t('nav.super_admin'),
      icon: <ShieldCheck className="h-4 w-4" />,
      badge: 'Super',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'founder',
      label: t('nav.founder'),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'assistant',
      label: t('nav.assistant'),
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      id: 'projects',
      label: t('nav.projects'),
      icon: <FolderKanban className="h-4 w-4" />,
      badge: '3',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'patients',
      label: t('nav.patients'),
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'bookings',
      label: t('nav.bookings'),
      icon: <CalendarCheck className="h-4 w-4" />,
      badge: 'Today',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'inventory',
      label: t('nav.inventory'),
      icon: <Package className="h-4 w-4" />,
      badge: 'Auto',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'accounting',
      label: t('nav.accounting'),
      icon: <CircleDollarSign className="h-4 w-4" />,
    },
    {
      id: 'reports',
      label: t('nav.reports'),
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: 'support',
      label: t('nav.support'),
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ];

  const visibleNavItems = navItems.filter((item) => allowedScreens.includes(item.id));

  const handleNavClick = (id: ScreenId) => {
    setScreen(id);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 ${
          isRTL ? 'right-0' : 'left-0'
        } z-50 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0 dark:border-slate-800/80 dark:bg-slate-950/95 light:border-slate-200 light:bg-white ${
          isOpenMobile
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4 dark:border-slate-800/80 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 text-white shadow-lg shadow-blue-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/40">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                  {language === 'ar' ? 'نيكسوس كلاود' : 'Nexus Medical'}
                </h1>
                <span className="rounded bg-blue-500/20 px-1 py-0.5 text-[9px] font-bold text-blue-400">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">
                {language === 'ar' ? 'بوابة الرعاية والمستأجرين' : 'Multi-Tenant Medical OS'}
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Quick Switcher Header Card */}
        {activeTenant && (
          <div className="p-3 border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
            <button
              onClick={() => setIsTenantModalOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-left text-xs transition hover:border-slate-700 hover:bg-slate-900 dark:border-slate-800 dark:bg-slate-900/60 light:border-slate-200 light:bg-slate-50 light:hover:bg-slate-100"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {activeTenant.logo ? (
                  <img
                    src={activeTenant.logo}
                    alt={activeTenant.name}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-700"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    <Building className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-semibold text-white dark:text-white light:text-slate-900 truncate">
                    {language === 'ar' ? activeTenant.nameAr : activeTenant.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{activeTenant.code}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{activeTenant.plan}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {language === 'ar' ? 'الوحدات الرئيسية' : 'Portals & Modules'}
          </div>

          {visibleNavItems.map((item) => {
            const isActive = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30 dark:bg-blue-600/15 dark:text-blue-400 light:bg-blue-50 light:text-blue-700 light:ring-blue-300'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200 light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`transition-colors ${
                      isActive
                        ? 'text-blue-400 light:text-blue-600'
                        : 'text-slate-400 group-hover:text-slate-200 light:text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                      item.badgeColor || 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & active nodes */}
        <div className="border-t border-slate-800/80 p-3.5 dark:border-slate-800/80 light:border-slate-200">
          <div className="flex items-center justify-between rounded-lg bg-slate-900/40 p-2 text-[11px] text-slate-400 dark:bg-slate-900/40 light:bg-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
              <span>{language === 'ar' ? 'المزامنة التلقائية' : 'Live Syncing'}</span>
            </div>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              {language === 'ar' ? 'نشط' : 'Active'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
