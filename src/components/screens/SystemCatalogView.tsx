import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SystemTemplate, SystemTemplateFeature } from '../../types';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, LogOut } from 'lucide-react';

export const SystemCatalogView: React.FC = () => {
  const { language, isRTL, systemTemplates, subscribeToSystem, showToast } = useApp();
  const { signOut } = useAuth();
  const [selected, setSelected] = useState<SystemTemplate | null>(null);
  const [activeFeature, setActiveFeature] = useState<SystemTemplateFeature | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const activeTemplates = systemTemplates.filter((t) => t.isActive);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleSubscribe = async () => {
    if (!selected) return;
    setSubscribing(true);
    await subscribeToSystem(selected.id);
    setSubscribing(false);
  };

  if (activeTemplates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-slate-100 px-4">
        <div className="max-w-sm text-center space-y-3">
          <Sparkles className="h-8 w-8 text-blue-400 mx-auto" />
          <p className="text-sm font-semibold">
            {isRTL ? 'لا توجد أنظمة متاحة حاليًا' : 'No systems available yet'}
          </p>
          <p className="text-xs text-slate-400">
            {isRTL
              ? 'المشرف العام لسه ما ضافش أي نظام للاشتراك فيه. راجعنا قريب.'
              : 'The administrator has not published any systems to subscribe to yet. Please check back soon.'}
          </p>
          <button
            onClick={() => signOut()}
            className="text-xs text-slate-500 hover:text-red-400 underline underline-offset-4"
          >
            {isRTL ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setSelected(null);
              setActiveFeature(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6"
          >
            <BackIcon className="h-3.5 w-3.5" />
            {isRTL ? 'رجوع لكل الأنظمة' : 'Back to all systems'}
          </button>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-2xl">
                {selected.icon}
              </span>
              <div>
                <h1 className="text-lg font-extrabold text-white">
                  {language === 'ar' ? selected.nameAr : selected.name}
                </h1>
                <p className="text-xs text-slate-400">
                  {selected.subscriptionPrice} {isRTL ? 'جنيه' : 'EGP'} /{' '}
                  {selected.subscriptionPeriod === 'monthly'
                    ? isRTL ? 'شهريًا' : 'month'
                    : isRTL ? 'سنويًا' : 'year'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {language === 'ar' ? selected.briefAr : selected.brief}
            </p>

            {selected.features.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  {isRTL ? 'دوس على أي خدمة عشان تعرف عنها أكتر' : 'Tap any feature to learn more'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selected.features.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFeature(f)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center hover:border-blue-500/50 hover:bg-slate-900 transition"
                    >
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-[11px] font-semibold text-slate-200">
                        {language === 'ar' ? f.titleAr : f.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFeature && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-600/10 p-4">
                <p className="text-xs font-bold text-blue-300 mb-1">
                  {language === 'ar' ? activeFeature.titleAr : activeFeature.title}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ar' ? activeFeature.descriptionAr : activeFeature.description}
                </p>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {subscribing
                ? isRTL ? 'جاري الاشتراك...' : 'Subscribing...'
                : isRTL ? 'اشترك في هذا النظام' : 'Subscribe to this system'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-xl font-extrabold text-white">
            {isRTL ? 'اختار نظامك' : 'Choose your system'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL
              ? 'اختار نوع المشروع اللي عايز تديره، وهنعرض لك خدماته وسعر الاشتراك'
              : 'Pick the type of business you want to manage — we will show you its features and pricing'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {activeTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 hover:border-blue-500/50 hover:-translate-y-0.5 transition"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-2xl">
                {t.icon}
              </span>
              <span className="text-sm font-bold text-white">{language === 'ar' ? t.nameAr : t.name}</span>
              <span className="text-[10px] text-slate-500">
                {t.subscriptionPrice} {isRTL ? 'جنيه' : 'EGP'}/{t.subscriptionPeriod === 'monthly' ? (isRTL ? 'شهر' : 'mo') : (isRTL ? 'سنة' : 'yr')}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 mx-auto text-xs text-slate-500 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isRTL ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
};
