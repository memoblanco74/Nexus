import React from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Shield, Globe, Bell, Database, Lock, Save, Send } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { language, toggleLanguage, theme, toggleTheme, isRTL, showToast, t } = useApp();

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
          {t('nav.settings')}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL ? 'إعدادات النظام، واجهات الربط، والتحكم في المستأجرين' : 'Platform security policies, regional database replication, & localization.'}
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
              <span className="text-[11px] text-slate-400">Current: {theme === 'dark' ? 'Dark Medical Glass' : 'Light Clean Mode'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              {theme === 'dark' ? 'Enable Light Mode' : 'Enable Dark Mode'}
            </button>
          </div>
        </div>

        {/* Cloud Endpoints & Security */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>{isRTL ? 'الأمان والتشفير السحابي' : 'Security & Compliance'}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">HIPAA & GDPR Encryption Layer</span>
              <span className="rounded bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 text-[10px]">AES-256 Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Multi-Factor Authentication (MFA)</span>
              <span className="rounded bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 text-[10px]">Enforced for Admins</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Automated Audit Trails</span>
              <span className="rounded bg-blue-500/20 text-blue-400 font-mono px-2 py-0.5 text-[10px]">Active (Immutable Log)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SupportView: React.FC = () => {
  const { isRTL, founderChatMessages, sendFounderMessage, t } = useApp();
  const [input, setInput] = React.useState('');

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
