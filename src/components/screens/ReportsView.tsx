import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, PieChart, Activity, Download, ShieldCheck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { language, isRTL, openPdfExport, t } = useApp();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('nav.reports')}
            </h1>
            <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
              {isRTL ? 'تحليلات الذكاء الاصطناعي' : 'Clinical Analytics Engine'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL ? 'تقارير الأداء السريري، كفاءة الأطباء، ومعدلات الإشغال' : 'Clinical operational efficiency, bed occupancy, and diagnostic accuracy ratios.'}
          </p>
        </div>

        <button
          onClick={() => openPdfExport('Comprehensive Clinical & Operational Report')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
        >
          <Download className="h-4 w-4" />
          <span>{t('founder.export_pdf')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'كفاءة الأقسام والعيادات' : 'Departmental Volume & Throughput'}
          </h3>
          <div className="space-y-3">
            {[
              { dept: 'Surgery & Orthopedics', pct: 92, cases: 412, rev: '$48,000' },
              { dept: 'Dental Clinic', pct: 84, cases: 380, rev: '$32,500' },
              { dept: 'Radiology & Imaging', pct: 76, cases: 290, rev: '$26,000' },
              { dept: 'Cardiology', pct: 68, cases: 166, rev: '$18,000' },
            ].map((d) => (
              <div key={d.dept} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{d.dept}</span>
                  <span className="font-bold text-emerald-400">{d.rev}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${d.pct}%` }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isRTL ? 'مؤشرات الجودة والامتثال الصحي' : 'Healthcare Quality & SLA Metrics'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase">Avg Wait Time</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">8.4 mins</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase">Patient Satisfaction</span>
                <p className="text-xl font-bold text-blue-400 mt-1">98.6%</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase">Auto-Deduct Accuracy</span>
                <p className="text-xl font-bold text-amber-400 mt-1">99.4%</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase">Audit Ready</span>
                <p className="text-xl font-bold text-teal-400 mt-1">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
