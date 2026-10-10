import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const keyFor = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `nexus_ann_dismissed_${h}`;
};

export const AnnouncementBanner: React.FC = () => {
  const { announcement, announcementActive, language } = useApp();
  const { profile } = useAuth();
  const title = language === 'ar' ? announcement.titleAr : announcement.title;
  const message = language === 'ar' ? announcement.messageAr : announcement.message;
  const storageKey = keyFor(announcement.title + announcement.message + announcement.titleAr + announcement.messageAr);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  let dismissed = dismissedKey === storageKey;
  if (!dismissed) {
    try {
      dismissed = localStorage.getItem(storageKey) === '1';
    } catch {
      dismissed = false;
    }
  }

  if (profile?.roleCode !== 'founder' || !announcementActive || dismissed || (!title && !message)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {}
    setDismissedKey(storageKey);
  };

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-200">
      <Megaphone className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-bold text-white">{title}</p>}
        {message && <p className="mt-0.5">{message}</p>}
      </div>
      <button onClick={dismiss} className="rounded p-1 text-blue-300 hover:bg-blue-500/20" aria-label="close">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
