import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import { screensFor } from '../../lib/screenAccess';
import { useAuth } from '../../context/AuthContext';
import { InstallAppButton } from './InstallAppButton';
import { ProfileEditModal } from './ProfileEditModal';
import { GlobalSearch } from './GlobalSearch';
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
  LogOut,
  User,
} from 'lucide-react';

const localizeNotification = (n: { title: string; body: string; code?: string | null; params?: Record<string, any> }, ar: boolean) => {
  const p = n.params || {};
  switch (n.code) {
    case 'nursery_child_added': return { title: ar ? 'طفل جديد' : 'New child', body: ar ? `تم تسجيل الطفل ${p.name}` : `Child ${p.name} was registered` };
    case 'nursery_payment': return { title: ar ? 'دفعة جديدة' : 'New payment', body: ar ? `تم تسجيل دفعة ${p.amount} ج.م للطفل ${p.name}` : `Payment of ${p.amount} EGP recorded for ${p.name}` };
    case 'sub_renewed': return { title: ar ? 'تم تجديد الاشتراك' : 'Subscription renewed', body: ar ? `تم تجديد اشتراكك حتى ${p.until}` : `Your subscription is renewed until ${p.until}` };
    case 'sub_expiring': return { title: ar ? 'اشتراكك قارب على الانتهاء' : 'Subscription expiring soon', body: ar ? `متبقي ${p.days} يوم على انتهاء الاشتراك (${p.date})` : `${p.days} day(s) left until your subscription ends (${p.date})` };
    case 'expiring_summary': return { title: ar ? 'اشتراكات قاربت على الانتهاء' : 'Subscriptions expiring soon', body: ar ? `${p.count} مشترك ينتهي اشتراكهم خلال 7 أيام` : `${p.count} subscriber(s) expire within 7 days` };
    case 'vaccine_due': return { title: ar ? 'موعد تطعيم' : 'Vaccine due', body: ar ? `تطعيم ${p.vaccine} للطفل ${p.child} ${p.days === 0 ? 'اليوم' : `بعد ${p.days} أيام`}` : `${p.vaccine} for ${p.child} ${p.days === 0 ? 'today' : `in ${p.days} days`}` };
    case 'new_subscriber': return { title: ar ? 'مشترك جديد' : 'New subscriber', body: ar ? `اشترك مشروع جديد: ${p.name}` : `New project subscribed: ${p.name}` };
    case 'chat_from_admin': return { title: ar ? 'الدعم الفني' : 'Support', body: p.preview || n.body };
    case 'chat_from_founder': return { title: ar ? `رسالة جديدة من ${p.tenant}` : `New message from ${p.tenant}`, body: p.preview || n.body };
    default: return { title: n.title, body: n.body };
  }
};

const notificationTarget = (code: string | null | undefined, role: string | undefined): ScreenId | null => {
  if (code === 'chat_from_admin') return 'support';
  if (code === 'chat_from_founder') return 'super_admin';
  if (code === 'new_subscriber' || code === 'expiring_summary') return 'super_admin';
  if (code === 'sub_expiring') return role === 'founder' ? 'project_settings' : null;
  if (code === 'sub_renewed') return role === 'founder' ? 'project_settings' : null;
  if (code === 'nursery_child_added') return 'patients';
  if (code === 'nursery_payment') return 'accounting';
  if (code === 'vaccine_due') return 'patients';
  return null;
};

export const Header: React.FC = () => {
  const {
    screen,
    setScreen,
    systemKey,
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    activeTenant,
    setIsTenantModalOpen,
    isRTL,
    t,
    dbHealthy,
    dbLatencyMs,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
  } = useApp();
  const { profile, signOut } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 light:border-[#e2e8f0] light:bg-white/90 transition-colors">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left section: Hamburger (mobile), Logo / Screen Breadcrumb */}
        <div className="flex items-center gap-3">

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm shadow-blue-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white dark:text-white light:text-[#0f172a]">
                {language === 'ar' ? 'نيكسوس' : 'Nexus'}
              </span>
              <span className="text-[10px] text-blue-400 dark:text-blue-400 light:text-blue-600 font-medium">
                {t(`nav.${screen}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Center section: Global Search Bar */}
        {profile?.roleCode === 'super_admin' ? <div className="flex-1" /> : <div className="flex flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>}

        {/* Right section: System Badge, Tenant Selector, Language & Theme Controls, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tenant Switcher Button */}
          {activeTenant && profile?.roleCode === 'founder' && (
            <button
              onClick={() => setIsTenantModalOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-600 dark:border-slate-800 dark:bg-slate-900/80 light:border-[#cbd5e1] light:bg-[#f1f5f9] light:text-[#1e293b] transition"
            >
              {activeTenant.logo ? (
                <img
                  src={activeTenant.logo}
                  alt={activeTenant.name}
                  className="h-5 w-5 rounded-full object-cover ring-1 ring-blue-500/40"
                />
              ) : (
                <Building2 className="h-4 w-4 text-blue-400" />
              )}
              <span className="font-medium truncate max-w-[110px]">
                {language === 'ar' ? activeTenant.nameAr : activeTenant.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}

          {/* System Operational Indicator */}
          <div
            className={`hidden xl:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
              dbHealthy === false
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dbHealthy === false ? 'bg-red-400' : 'bg-emerald-400'}`} />
            <span>
              {dbHealthy === null
                ? (isRTL ? 'جاري الفحص...' : 'Checking...')
                : dbHealthy
                ? (isRTL ? `متصل (${dbLatencyMs}ms)` : `Connected (${dbLatencyMs}ms)`)
                : (isRTL ? 'مشكلة اتصال' : 'Connection Issue')}
            </span>
          </div>

          {/* Install App */}
          <InstallAppButton isRTL={isRTL} />

          {/* Notification Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white dark:border-slate-800 dark:bg-slate-900/60 light:border-[#cbd5e1] light:bg-[#f1f5f9] light:text-[#334155] transition"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-slate-950">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              createPortal(
                <div className="fixed inset-0 z-[25]" onPointerDown={() => setShowNotifications(false)} onClick={() => setShowNotifications(false)} />,
                document.body
              )
            )}
            {showNotifications && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 dark:border-slate-800 dark:bg-slate-900/95 light:border-[#e2e8f0] light:bg-white text-xs`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 dark:border-slate-800 light:border-[#e2e8f0]">
                  <span className="font-bold text-slate-200 dark:text-slate-200 light:text-[#1e293b]">
                    {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </span>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={() => notifications.filter((n) => !n.isRead).forEach((n) => markNotificationRead(n.id))}
                      className="text-[10px] text-blue-400 font-medium hover:text-blue-300"
                    >
                      {language === 'ar' ? 'تمييز الكل كمقروء' : 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-[#f1f5f9] max-h-72 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-center text-slate-500 py-6">
                      {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                    </p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        const go = notificationTarget(n.code, profile?.roleCode);
                        if (go && screensFor(profile?.roleCode, systemKey).includes(go)) { setScreen(go); setShowNotifications(false); }
                      }}
                      className="w-full text-start py-2.5 flex flex-col gap-0.5 hover:bg-slate-800/40 rounded px-1.5 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-[#1e293b] flex items-center gap-1.5">
                          {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                          {localizeNotification(n, isRTL).title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-[#475569] leading-relaxed">
                        {localizeNotification(n, isRTL).body}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative flex items-center gap-2 pl-1">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-xs font-semibold text-white">{profile?.fullName || profile?.username}</span>
              <span className="text-[10px] text-slate-400 capitalize">{profile?.roleCode.replace('_', ' ')}</span>
            </div>
            <button onClick={() => setShowProfileMenu((v) => !v)} className="relative" title={isRTL ? 'حسابي' : 'My Account'}>
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="avatar"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/50"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-xs font-bold ring-2 ring-blue-500/50">
                  {(profile?.fullName || profile?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </button>
            {showProfileMenu &&
              createPortal(
                <div className="fixed inset-0 z-[25]" onPointerDown={() => setShowProfileMenu(false)} onClick={() => setShowProfileMenu(false)} />,
                document.body
              )}
            {showProfileMenu && (
              <div className={`absolute top-full ${isRTL ? 'left-0' : 'right-0'} z-50 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 text-xs shadow-2xl dark:border-slate-800 dark:bg-slate-900 light:border-[#cbd5e1] light:bg-white`}>
                <div className="border-b border-slate-800 px-3 py-2 sm:hidden">
                  <p className="truncate font-semibold text-white">{profile?.fullName || profile?.username}</p>
                  <p className="text-[10px] capitalize text-slate-400">{profile?.roleCode.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start font-medium text-slate-200 hover:bg-slate-800"
                >
                  <User className="h-3.5 w-3.5" />
                  {isRTL ? 'حسابي' : 'My account'}
                </button>
                <button
                  onClick={toggleLanguage}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                  <span className="flex-1">{isRTL ? 'اللغة' : 'Language'}</span>
                  <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">{language === 'en' ? 'العربية' : 'EN'}</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start font-medium text-slate-200 hover:bg-slate-800"
                >
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                  <span className="flex-1">{isRTL ? 'المظهر' : 'Theme'}</span>
                  <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                    {theme === 'dark' ? (isRTL ? 'فاتح' : 'Light') : isRTL ? 'داكن' : 'Dark'}
                  </span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start font-medium text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {isRTL ? 'تسجيل الخروج' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showProfileModal && <ProfileEditModal isRTL={isRTL} onClose={() => setShowProfileModal(false)} />}
    </header>
  );
};
