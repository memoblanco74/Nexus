import React from 'react';
import { useApp } from '../../context/AppContext';
import { ChangePasswordCard, UserManagementCard } from './AccountSecurityCards';
import { ReferralCard, ReferralOverviewCard } from './ReferralParts';
import { PaymentInfoCard } from './PaymentInfoParts';
import { MyDataCard } from './MyDataCard';
import { useAuth, DEFAULT_NOTIFICATION_PREFS, NotificationPrefs } from '../../context/AuthContext';
import { Settings, Shield, Globe, Bell, Database, Lock, Save, Send } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { language, toggleLanguage, theme, toggleTheme, isRTL, showToast, t } = useApp();
  const { profile, updateNotificationPrefs } = useAuth();
  const prefs = profile?.notificationPrefs || DEFAULT_NOTIFICATION_PREFS;
  const isAdmin = profile?.roleCode === 'super_admin';

  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  const enableDevice = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const sendTest = () => {
    const title = isRTL ? 'إشعار تجريبي' : 'Test notification';
    const body = isRTL ? 'الإشعارات شغالة على هذا الجهاز' : 'Notifications are working on this device';
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, { body, icon: '/Nexus/icon-192.png' }))
        .catch(() => new Notification(title, { body }));
    } else {
      new Notification(title, { body });
    }
  };

  const toggle = (key: keyof NotificationPrefs) => {
    updateNotificationPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const rows: { key: keyof NotificationPrefs; title: string; hint: string }[] = [
    {
      key: 'chatDevice',
      title: isRTL ? 'إشعار الجهاز للرسائل' : 'Device alert for chat messages',
      hint: isAdmin
        ? isRTL ? 'إشعار باسم المشروع ونص الرسالة لما يوصلك رسالة من مؤسس' : 'Shows the project name and message text when a founder writes to you'
        : isRTL ? 'إشعار بنص الرسالة لما يرد عليك الدعم الفني' : 'Shows the message text when support replies to you',
    },
    {
      key: 'chatToast',
      title: isRTL ? 'تنبيه داخل التطبيق للرسائل' : 'In-app alert for chat messages',
      hint: isRTL ? 'رسالة صغيرة تظهر على الشاشة وأنت فاتح التطبيق' : 'A small message on screen while the app is open',
    },
    {
      key: 'chatSound',
      title: isRTL ? 'صوت التنبيه' : 'Alert sound',
      hint: isRTL ? 'نغمة قصيرة عند وصول رسالة جديدة' : 'A short tone when a new message arrives',
    },
  ];
  if (!isAdmin) {
    rows.push({
      key: 'systemDevice',
      title: isRTL ? 'إشعارات النظام' : 'System alerts',
      hint: isRTL ? 'حجز جديد، فاتورة مدفوعة، نقص مخزون، وتصلك على الجهاز لما يكون التطبيق في الخلفية' : 'New booking, paid invoice, low stock, delivered to the device while the app is in the background',
    });
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
          {t('nav.settings')}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL ? 'اللغة والمظهر والإشعارات' : 'Language, appearance and notifications.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Localization & Theme */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <span>{isRTL ? 'اللغة والمظهر' : 'Localization & Appearance'}</span>
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <div>
              <p className="text-xs font-semibold text-white">{isRTL ? 'لغة الواجهة' : 'Interface Language'}</p>
              <span className="text-[11px] text-slate-400">Current: {language === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {language === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-semibold text-white">{isRTL ? 'نمط المظهر' : 'Theme Mode'}</p>
              <span className="text-[11px] text-slate-400">Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              {theme === 'dark' ? 'Enable Light Mode' : 'Enable Dark Mode'}
            </button>
          </div>
        </div>

        {profile?.roleCode === 'founder' && <ReferralCard />}

        <ChangePasswordCard />

        {(profile?.roleCode === 'super_admin' || profile?.roleCode === 'founder') && <UserManagementCard />}

        {profile?.roleCode === 'super_admin' && <ReferralOverviewCard />}

        {profile?.roleCode === 'founder' && <MyDataCard />}

        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            <span>{isRTL ? 'الإشعارات' : 'Notifications'}</span>
          </h3>

          <div className="flex flex-col gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-white">{isRTL ? 'إشعارات الجهاز' : 'Device notifications'}</p>
              <span className="text-[11px] text-slate-400">
                {permission === 'unsupported'
                  ? isRTL ? 'المتصفح لا يدعم الإشعارات' : 'This browser does not support notifications'
                  : permission === 'granted'
                  ? isRTL ? 'مفعّلة على هذا الجهاز' : 'Enabled on this device'
                  : permission === 'denied'
                  ? isRTL ? 'محظورة من إعدادات المتصفح، فعّلها من إعدادات الموقع' : 'Blocked in browser settings; allow it from the site settings'
                  : isRTL ? 'لم يتم التفعيل بعد' : 'Not enabled yet'}
              </span>
            </div>
            <div className="flex gap-2">
              {permission === 'default' && (
                <button
                  onClick={enableDevice}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  {isRTL ? 'تفعيل' : 'Enable'}
                </button>
              )}
              {permission === 'granted' && (
                <button
                  onClick={sendTest}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  {isRTL ? 'إشعار تجريبي' : 'Send test'}
                </button>
              )}
            </div>
          </div>

          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
              <div className="pr-3">
                <p className="text-xs font-semibold text-white">{r.title}</p>
                <span className="text-[11px] text-slate-400">{r.hint}</span>
              </div>
              <button
                onClick={() => toggle(r.key)}
                role="switch"
                aria-checked={prefs[r.key]}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${prefs[r.key] ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    prefs[r.key] ? (isRTL ? 'right-0.5' : 'left-[22px]') : isRTL ? 'right-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SupportView: React.FC = () => {
  const { isRTL, founderChatMessages, sendFounderMessage, t } = useApp();
  const [input, setInput] = React.useState('');

  React.useEffect(() => {
    document.getElementById('founder-chat-end')?.scrollIntoView({ block: 'end' });
  }, [founderChatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendFounderMessage(input);
    setInput('');
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
          {t('nav.support')}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL ? 'تواصل مباشر مع فريق الإدارة' : 'Direct chat with the platform administrator'}
        </p>
      </div>

      <PaymentInfoCard />

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {founderChatMessages.length === 0 && (
            <p className="text-center text-xs text-slate-500 mt-10">
              {isRTL ? 'ابدأ محادثة مع فريق الدعم' : 'Start a conversation with the support team'}
            </p>
          )}
          {founderChatMessages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="mt-1 text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
              </div>
            );
          })}
          <div id="founder-chat-end" />
        </div>
        <form onSubmit={handleSend} className="border-t border-slate-800/80 p-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition active:scale-95 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
