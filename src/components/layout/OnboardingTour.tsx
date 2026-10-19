import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const key = (id: string) => `nexus_tour_done_${id}`;

export const OnboardingTour: React.FC = () => {
  const { isRTL, activeTenant, systemKey } = useApp();
  const { profile, viewAs } = useAuth() as any;
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const id: string | undefined = activeTenant?.id;

  useEffect(() => {
    if (!id || viewAs || profile?.roleCode !== 'founder') { setOpen(false); return; }
    try { setOpen(localStorage.getItem(key(id)) !== '1'); } catch { setOpen(false); }
  }, [id, viewAs, profile?.roleCode]);

  if (!open || !id) return null;

  const common: Array<[string, string, string, string]> = [
    ['أهلاً بيك في نكسس 👋', 'Welcome to Nexus 👋', 'جولة سريعة (دقيقة) تعرّفك على أهم الأماكن. تقدر تقفلها في أي وقت.', 'A one-minute tour of the key areas. You can close it any time.'],
    ['مشروع تجريبي', 'Try a demo project', 'من الإعدادات → "بيانات تجريبية" تقدر تضيف بيانات وهمية تجرب بيها وتمسحها كلها بضغطة واحدة.', 'In Settings → "Demo data" you can add sample data to explore and delete it all in one click.'],
    ['استيراد من Excel', 'Import from Excel', 'بدل ما تكتب بيانات واحدة واحدة، استورد ملف Excel أو CSV من زر "استيراد" في الشاشة.', 'Instead of typing records one by one, import an Excel/CSV from the "Import" button.'],
    ['المساعدين والصلاحيات', 'Assistants & permissions', 'من الإعدادات أضف مساعدين وحدد الشاشات اللي كل واحد يشوفها.', 'Add assistants in Settings and choose which screens each one can see.'],
  ];
  const specific: Record<string, Array<[string, string, string, string]>> = {
    clinic: [
      ['الحجز أونلاين', 'Online booking', 'فعّل رابط الحجز من الإعدادات وشاركه مع المرضى: كل مريض يشوف المواعيد الفاضية لكل دكتور.', 'Enable the booking link in Settings and share it: patients see each doctor’s free slots.'],
      ['دور الانتظار والمتابعات', 'Queue & follow-ups', 'من شاشة الحجوزات تدير دور الانتظار وتشوف المتابعات المستحقة وتبعت تذكير واتساب.', 'In Bookings you manage the waiting queue and see due follow-ups with WhatsApp reminders.'],
    ],
    nursery: [
      ['اليومية وبوابة ولي الأمر', 'Daily log & parent portal', 'سجّل يوميات الأطفال وشارك مع ولي الأمر رابط خاص يتابع منه طفله.', 'Log each child’s day and share a private link parents can follow.'],
      ['الموظفين والمرتبات', 'Staff & payroll', 'من المالية سجّل حضور المدرسين واحسب المرتبات والخصومات.', 'In Finance, record teacher attendance and compute payroll and deductions.'],
    ],
  };
  const steps = [...common.slice(0, 1), ...(specific[systemKey] || []), ...common.slice(1)];
  const s = steps[i];
  const last = i === steps.length - 1;
  const close = () => { try { localStorage.setItem(key(id), '1'); } catch { /* ignore */ } setOpen(false); };
  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
          <button onClick={close} className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{tx(s[0], s[1])}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{tx(s[2], s[3])}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">{steps.map((_, k) => <span key={k} className={`h-1.5 w-5 rounded-full ${k === i ? 'bg-blue-500' : 'bg-slate-700'}`} />)}</div>
          <div className="flex items-center gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900"><Prev className="h-4 w-4" />{tx('السابق', 'Back')}</button>}
            <button onClick={() => (last ? close() : setI(i + 1))} className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500">{last ? tx('ابدأ', 'Start') : <>{tx('التالي', 'Next')}<Next className="h-4 w-4" /></>}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
