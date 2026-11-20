import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { cardClass } from '../nursery/ui';

const key = (id: string) => `nexus_tour_done_${id}`;
const START_EVENT = 'nexus:start-tour';

interface Step {
  target?: string;
  screen?: string;
  ar: [string, string];
  en: [string, string];
}

const NAV: Record<string, Record<string, { ar: string; en: string }>> = {
  nursery: {
    founder: { ar: 'نظرة سريعة على الحضانة اليوم: الحضور حسب الفصل، أعياد الميلاد، التنبيهات، والمقارنة المالية.', en: 'Today at a glance: attendance by class, birthdays, alerts and the monthly money comparison.' },
    patients: { ar: 'كل ما يخص الأطفال: البيانات، اليومية والحضور، وتحصيل الاشتراكات.', en: 'Everything about children: records, daily log and attendance, and fee collection.' },
    subscriptions: { ar: 'عرّف أنواع الاشتراك وأسعارها لتُطبَّق على كل طفل.', en: 'Define subscription types and prices to apply to each child.' },
    accounting: { ar: 'المصروفات مع الضريبة، حضور الموظفين والمرتبات والزيادات السنوية، وتقرير الأرباح.', en: 'Expenses with tax, staff attendance, payroll and annual raises, and the profit report.' },
    assistants: { ar: 'أضف أعضاء الفريق وحدد بدقة ما يرونه وما يستطيعون فعله، والفصول المسموح بها لكل منهم.', en: 'Add team members and control exactly what they can see and do, and which classes each may access.' },
    project_settings: { ar: 'إعدادات المشروع: بيانات تجريبية، رابط ولي الأمر، والجولة التعريفية.', en: 'Project settings: demo data, the parent link, and this tour.' },
    settings: { ar: 'حسابك وأمانه ولغتك ومظهرك وتصدير بياناتك.', en: 'Your account, security, language, theme and data export.' },
    support: { ar: 'تواصل مباشرة مع الدعم الفني عند الحاجة.', en: 'Talk to support directly whenever you need help.' },
  },
  clinic: {
    founder: { ar: 'لوحة المؤسس: الإيرادات والحجوزات ونظرة عامة على العيادة.', en: 'Founder dashboard: revenue, bookings and a clinic overview.' },
    patients: { ar: 'سجلات المرضى والتاريخ الطبي والفواتير.', en: 'Patient records, medical history and invoices.' },
    bookings: { ar: 'الحجوزات ودور الانتظار والمتابعات مع تذكير عبر واتساب.', en: 'Bookings, the waiting queue and follow-ups with WhatsApp reminders.' },
    inventory: { ar: 'المخزون والمستلزمات وتنبيهات النقص.', en: 'Inventory, supplies and low-stock alerts.' },
    accounting: { ar: 'الإيرادات والمصروفات وكشف الحساب.', en: 'Revenue, expenses and the ledger.' },
    reports: { ar: 'تقارير الأداء والأطباء والإيرادات.', en: 'Performance, doctor and revenue reports.' },
    projects: { ar: 'مشاريعك وفروعك في مكان واحد.', en: 'Your projects and branches in one place.' },
    assistants: { ar: 'أضف المساعدين وحدد الشاشات التي يستطيع كل واحد رؤيتها.', en: 'Add assistants and choose which screens each can see.' },
    project_settings: { ar: 'إعدادات المشروع والحجز عبر الإنترنت والبيانات التجريبية.', en: 'Project settings, online booking and demo data.' },
    settings: { ar: 'حسابك وأمانه ولغتك ومظهرك وتصدير بياناتك.', en: 'Your account, security, language, theme and data export.' },
    support: { ar: 'تواصل مباشرة مع الدعم الفني عند الحاجة.', en: 'Talk to support directly whenever you need help.' },
  },
};

export const OnboardingTour: React.FC = () => {
  const { isRTL, activeTenant, systemKey, screen, setScreen, t } = useApp();
  const { profile, viewAs } = useAuth() as any;
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [startScreen, setStartScreen] = useState<string | null>(null);
  const id: string | undefined = activeTenant?.id;

  useEffect(() => {
    if (!id || viewAs || profile?.roleCode !== 'founder') { setOpen(false); return; }
    try { setOpen(localStorage.getItem(key(id)) !== '1'); } catch { setOpen(false); }
  }, [id, viewAs, profile?.roleCode]);

  useEffect(() => {
    const start = () => { setI(0); setStartScreen(screen); setOpen(true); };
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, [screen]);

  const findVisible = useCallback((sel?: string): HTMLElement | null => {
    if (!sel) return null;
    const list = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${sel}"]`));
    return list.find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight; }) || null;
  }, []);

  const vocab = NAV[systemKey] || NAV.clinic;
  const navSteps: Step[] = Object.keys(vocab).map((sid) => ({
    target: `nav-${sid}`,
    screen: sid,
    ar: [t(`nav.${sid}`), vocab[sid].ar],
    en: [t(`nav.${sid}`), vocab[sid].en],
  }));
  const steps: Step[] = [
    { ar: ['أهلاً بك في نكسس 👋', 'جولة سريعة تعرّفك على أماكن النظام خطوة بخطوة. يمكنك إغلاقها في أي وقت وإعادتها من إعدادات المشروع.'], en: ['Welcome to Nexus 👋', 'A quick step-by-step tour of the app. Close it any time and replay it from project settings.'] },
    ...navSteps,
    { target: 'header-notifications', ar: ['الإشعارات', 'هنا تصلك تنبيهات الاشتراك والتطعيمات والدفعات والرسائل.'], en: ['Notifications', 'Subscription, vaccine, payment and message alerts arrive here.'] },
    { target: 'header-profile', ar: ['حسابك', 'من هنا تغيّر اللغة والمظهر (فاتح أو داكن) وتدير حسابك وتسجّل الخروج.'], en: ['Your account', 'Change language and theme (light or dark), manage your account and sign out here.'] },
    { ar: ['جاهز للبدء', 'ابدأ بإضافة بياناتك، أو جرّب النظام ببيانات تجريبية من إعدادات المشروع ثم احذفها بضغطة واحدة.'], en: ['You are all set', 'Start adding your data, or explore with demo data from project settings and delete it in one click.'] },
  ];
  const s = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;

  const measure = useCallback(() => {
    const el = findVisible(s.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [findVisible, s.target]);

  useEffect(() => {
    if (!open) return;
    if (s.screen && findVisible(s.target)) setScreen(s.screen as any);
  }, [open, i]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = findVisible(s.target);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    measure();
    const timer = window.setTimeout(measure, 250);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, i, measure, findVisible, s.target]);

  if (!open || !id) return null;

  const close = () => {
    try { localStorage.setItem(key(id), '1'); } catch { /* ignore */ }
    if (startScreen) setScreen(startScreen as any);
    setOpen(false);
  };
  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 6;
  const cardW = Math.min(340, vw - 24);
  let cardStyle: React.CSSProperties = { width: cardW, left: Math.max(12, (vw - cardW) / 2), top: Math.max(12, vh / 2 - 110) };
  if (rect) {
    const below = rect.top + rect.height / 2 < vh / 2;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12);
    cardStyle = below ? { width: cardW, left, top: Math.min(rect.bottom + pad + 12, vh - 200) } : { width: cardW, left, bottom: Math.min(vh - rect.top + pad + 12, vh - 200) };
  }

  return (
    <div className="fixed inset-0 z-[80]" dir={isRTL ? 'rtl' : 'ltr'}>
      <svg className="absolute inset-0 h-full w-full" onClick={(e) => e.stopPropagation()}>
        <defs>
          <mask id="nx-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && <rect x={rect.left - pad} y={rect.top - pad} width={rect.width + pad * 2} height={rect.height + pad * 2} rx="12" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,6,23,0.72)" mask="url(#nx-tour-mask)" />
      </svg>
      {rect && <div className="pointer-events-none absolute rounded-xl ring-2 ring-blue-400 transition-all" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />}
      <div className={`${cardClass} absolute space-y-3 bg-slate-950 shadow-2xl`} style={cardStyle}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-extrabold text-white">{tx(s.ar[0], s.en[0])}</h3>
          <button onClick={close} className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{tx(s.ar[1], s.en[1])}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">{i + 1} / {steps.length}</span>
          <div className="flex items-center gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900"><Prev className="h-4 w-4" />{tx('السابق', 'Back')}</button>}
            <button onClick={() => (last ? close() : setI(i + 1))} className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500">{last ? tx('ابدأ', 'Start') : <>{tx('التالي', 'Next')}<Next className="h-4 w-4" /></>}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TourRestartCard: React.FC = () => {
  const { isRTL } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  return (
    <div className={`${cardClass} space-y-3`}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-white"><PlayCircle className="h-4 w-4 text-blue-400" />{tx('الجولة التعريفية', 'App tour')}</h3>
      <p className="text-xs text-slate-400">{tx('أعد تشغيل الجولة خطوة بخطوة لتتعرف على أقسام النظام.', 'Replay the step-by-step tour of the app sections.')}</p>
      <button onClick={() => window.dispatchEvent(new Event(START_EVENT))} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500">{tx('بدء الجولة', 'Start tour')}</button>
    </div>
  );
};
