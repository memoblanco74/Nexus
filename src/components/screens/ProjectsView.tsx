import React from 'react';
import { useApp } from '../../context/AppContext';
import { FolderKanban, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { language, isRTL, projects, t } = useApp();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('nav.projects')}
            </h1>
            <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              {projects.length} {isRTL ? 'مشاريع نشطة' : 'Active Expansions'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL ? 'مشاريع التوسع وتطوير الفروع السريرية وأتمتة الأجنحة' : 'Clinic infrastructure expansions, departmental automation, & capital projects.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {projects.map((prj) => (
          <div key={prj.id} className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  {prj.tenantName}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  {language === 'ar' ? prj.titleAr : prj.title}
                </h3>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {prj.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{isRTL ? 'نسبة الإنجاز' : 'Progress'}</span>
                <span className="font-bold text-white">{prj.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${prj.progress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-500">{isRTL ? 'الميزانية' : 'Budget'}</span>
                <p className="font-bold text-white">${prj.budget.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">{isRTL ? 'المصروف حتى الآن' : 'Disbursed'}</span>
                <p className="font-bold text-emerald-400">${prj.spent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
