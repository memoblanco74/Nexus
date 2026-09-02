import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  Building2,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const {
    screen,
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    activeTenant,
    setIsTenantModalOpen,
    isRTL,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Low Stock Alert', desc: 'Lidocaine HCl 2% is below minimum threshold (12/30 units).', time: '10m ago', unread: true },
    { id: 2, title: 'New Booking', desc: 'Tariq Al-Mansoor booked Surgery Follow-up for 10:00 AM.', time: '25m ago', unread: true },
    { id: 3, title: 'Invoice Paid', desc: 'TechCorp Inc. paid invoice #INV-2023-089 ($4,500).', time: '1h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 light:border-slate-200 light:bg-white/90 transition-colors">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left section: Hamburger (mobile), Logo / Screen Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/50 text-slate-300 hover:bg-slate-800 lg:hidden dark:border-slate-700/60 dark:bg-slate-900/50 light:border-slate-300 light:bg-slate-100 light:text-slate-700"
            aria-label="Toggle navigation menu"
          >
            <Layers className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm shadow-blue-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                {language === 'ar' ? 'نيكسوس الطبية' : 'Nexus Medical'}
              </span>
              <span className="text-[10px] text-blue-400 dark:text-blue-400 light:text-blue-600 font-medium">
                {t(`nav.${screen}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Center section: Global Search Bar */}
        <div className="flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث في المرضى، الفواتير، الأصناف والمستأجرين...' : 'Search patients, invoices, stock & tenants...'}
              className={`w-full rounded-full border border-slate-800/80 bg-slate-900/60 py-1.5 ${
                isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'
              } text-xs text-slate-200 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-900/70 light:border-slate-300 light:bg-slate-100 light:text-slate-900 light:placeholder-slate-500`}
            />
          </div>
        </div>

        {/* Right section: System Badge, Tenant Selector, Language & Theme Controls, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tenant Switcher Button */}
          <button
            onClick={() => setIsTenantModalOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-600 dark:border-slate-800 dark:bg-slate-900/80 light:border-slate-300 light:bg-slate-100 light:text-slate-800 transition"
          >
            <img
              src={activeTenant.logo}
              alt={activeTenant.name}
              className="h-5 w-5 rounded-full object-cover ring-1 ring-blue-500/40"
            />
            <span className="font-medium truncate max-w-[110px]">
              {language === 'ar' ? activeTenant.nameAr : activeTenant.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* System Operational Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{language === 'ar' ? 'الخوادم نشطة (١٢ عقدة)' : 'Operational (12 Nodes)'}</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white dark:border-slate-800 dark:bg-slate-900/60 light:border-slate-300 light:bg-slate-100 light:text-slate-700 transition"
            title="Switch Language (AR / EN)"
          >
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>{language === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white dark:border-slate-800 dark:bg-slate-900/60 light:border-slate-300 light:bg-slate-100 light:text-slate-700 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>

          {/* Notification Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white dark:border-slate-800 dark:bg-slate-900/60 light:border-slate-300 light:bg-slate-100 light:text-slate-700 transition"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
            </button>

            {showNotifications && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 dark:border-slate-800 dark:bg-slate-900/95 light:border-slate-200 light:bg-white text-xs`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <span className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                    {language === 'ar' ? 'التنبيهات المباشرة' : 'Live Notifications'}
                  </span>
                  <span className="text-[10px] text-blue-400 font-medium">
                    {language === 'ar' ? 'تمييز الكل كمقروء' : 'Mark all read'}
                  </span>
                </div>
                <div className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5 flex flex-col gap-0.5 hover:bg-slate-800/40 rounded px-1.5 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                          {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Headshot */}
          <div className="flex items-center gap-2 pl-1">
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuApBl0LJ3KCCkD49pBYKaJdFnxeORVPgoryporuU_pxRJKQm4acWeXJbsYfo8dNAmtTMdFV-yhNC508cGz8jsmyH1_edm_qUp-WanKkRl0bf2jNrLX3At_gnnq5mAJxNreoPggeXheEmIscyS5jdKm4alPN2iwf8E_WhboWRwx0FdxA4JVFCidVOA_usxwsW4bGleAIC5StP8f1g8DX-ygG4ToXGWsGNiiQzZRtaTfeHYpRgeY58XKR8Q"
                alt="Super Admin"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/50"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
