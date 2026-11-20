import React from 'react';
import { Modal } from '../nursery/ui';
import { useApp } from '../../context/AppContext';
import { ChatProfile } from '../../types';

export const profileSearchText = (p?: ChatProfile): string =>
  p
    ? [
        p.username, p.fullName, p.email, p.phone, p.joinedAt, p.referralCode, p.tenantCode, p.tenantNameAr, p.plan, p.status,
        p.location, p.systemName, p.startedAt, p.endsAt, p.createdAt, String(p.mrr),
        ...p.projects.flatMap((x) => [x.name, x.status, x.plan, x.expiresOn]),
      ]
        .join(' ')
        .toLowerCase()
    : '';

export const ChatSubscriberProfile: React.FC<{ profile: ChatProfile; tenant: string; onClose: () => void }> = ({ profile, tenant, onClose }) => {
  const { isRTL, money } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const rows: Array<[string, string]> = [
    [tx('اسم المستخدم', 'Username'), profile.username],
    [tx('الاسم الكامل', 'Full name'), profile.fullName],
    [tx('البريد الإلكتروني', 'Email'), profile.email],
    [tx('الهاتف المحمول', 'Phone'), profile.phone],
    [tx('تاريخ التسجيل', 'Joined'), profile.joinedAt],
    [tx('كود الإحالة', 'Referral code'), profile.referralCode],
    [tx('حالة الحساب', 'Account'), profile.active ? tx('مفعّل', 'Active') : tx('موقوف', 'Disabled')],
    [tx('المشروع', 'Project'), profile.tenantNameAr || tenant],
    [tx('كود المشروع', 'Project code'), profile.tenantCode],
    [tx('النظام', 'System'), profile.systemName],
    [tx('الباقة', 'Plan'), profile.plan],
    [tx('حالة الاشتراك', 'Subscription'), profile.paused ? tx('متوقف مؤقتاً', 'Paused') : profile.status],
    [tx('قيمة الاشتراك', 'Subscription value'), profile.mrr ? money(profile.mrr) : ''],
    [tx('بداية الاشتراك', 'Started'), profile.startedAt],
    [tx('نهاية الاشتراك', 'Ends'), profile.endsAt],
    [tx('الموقع', 'Location'), profile.location],
    [tx('تاريخ إنشاء المشروع', 'Project created'), profile.createdAt],
  ];
  return (
    <Modal title={tx('ملف المشترك', 'Subscriber profile')} onClose={onClose}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-800 px-3 py-2">
            <p className="text-[10px] text-slate-500">{k}</p>
            <p className="break-words text-xs font-semibold text-white" dir="auto">{v}</p>
          </div>
        ))}
      </div>
      {profile.projects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-white">{tx(`مشاريع المشترك (${profile.projects.length})`, `Subscriber projects (${profile.projects.length})`)}</p>
          {profile.projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs">
              <span className="min-w-0 truncate font-semibold text-white">{p.name}</span>
              <span className="shrink-0 text-[11px] text-slate-400">{[p.plan, p.status, p.expiresOn].filter(Boolean).join(' • ')}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
