import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';

export const SystemCatalogAdminView: React.FC = () => {
  const { isRTL, language, systemTemplates } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
          {isRTL ? 'كتالوج الأنظمة' : 'System Catalog'}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL
            ? 'الأنظمة اللي بتظهر للفاوندرز يختاروا منها. لإضافة نظام جديد أو تعديل سعر، قولّي مباشرة.'
            : 'The systems founders can choose from. To add a new system or change a price, just ask.'}
        </p>
      </div>

      <div className="grid gap-4">
        {systemTemplates.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 dark:border-slate-800 dark:bg-slate-950/60 light:border-slate-200 light:bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-xl">
                  {t.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                      {language === 'ar' ? t.nameAr : t.name}
                    </p>
                    {!t.isActive && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                        {isRTL ? 'قريبًا' : 'Coming Soon'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {t.subscriptionPrice} EGP / {t.subscriptionPeriod === 'monthly' ? (isRTL ? 'شهريًا' : 'mo') : (isRTL ? 'سنويًا' : 'yr')}
                    {' • '}{t.features.length} {isRTL ? 'ميزة' : 'features'}
                    {' • '}{t.subscriberCount} {isRTL ? 'مشترك' : 'subscribers'}
                  </p>
                </div>
              </div>
              {t.features.length > 0 && (
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                >
                  {expandedId === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>

            {expandedId === t.id && (
              <div className="mt-4 border-t border-slate-800/60 pt-4 space-y-2">
                {t.features.map((f) => (
                  <div key={f.id} className="rounded-xl bg-slate-900/60 p-3">
                    <p className="text-xs font-bold text-white">
                      {f.icon} {language === 'ar' ? f.titleAr : f.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ar' ? f.descriptionAr : f.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {systemTemplates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
            <Package className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              {isRTL ? 'لسه مفيش أي نظام في الكتالوج' : 'No systems in the catalog yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
