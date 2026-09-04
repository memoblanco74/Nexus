import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export const InstallAppButton: React.FC<{ isRTL: boolean }> = ({ isRTL }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    if (installed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [installed]);

  if (installed) return null;
  if (!deferredPrompt && !isIos()) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    if (isIos()) setShowIosHint(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/10 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/20 transition"
        title={isRTL ? 'تثبيت التطبيق' : 'Install App'}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isRTL ? 'تثبيت' : 'Install'}</span>
      </button>

      {showIosHint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center space-y-3">
            <button
              onClick={() => setShowIosHint(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-white">
              {isRTL ? 'لتثبيت التطبيق على آيفون' : 'Install on iPhone'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isRTL
                ? 'دوس على زرار المشاركة (المربع وفوقه سهم) تحت في متصفح Safari، بعدين اختار "Add to Home Screen".'
                : 'Tap the Share button in Safari, then choose "Add to Home Screen".'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
