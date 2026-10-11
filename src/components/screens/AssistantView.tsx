import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  HeartPulse,
  Clock,
  Activity,
  CheckCircle2,
  Stethoscope,
  QrCode,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';

export const AssistantView: React.FC = () => {
  const { language, isRTL, bookings, patients, setIsQrScannerOpen, t } = useApp();

  const queue = bookings.filter((b) => b.status !== 'cancelled');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-[#0f172a]">
              {t('nav.assistant')}
            </h1>
            <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
              {isRTL ? 'مكتب الاستقبال' : 'Reception Desk'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL ? 'قائمة الحجوزات الحالية وتسجيل الدخول السريع' : 'Current bookings queue & quick check-in.'}
          </p>
        </div>

        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition active:scale-95"
        >
          <QrCode className="h-4 w-4" />
          <span>{isRTL ? 'مسح باركود المريض' : 'Scan Patient QR'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {queue.length === 0 && (
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 text-xs text-slate-400 lg:col-span-3">
            {isRTL ? 'لا توجد حجوزات حالياً' : 'No bookings yet'}
          </div>
        )}
        {queue.map((item, idx) => (
          <div key={item.id} className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{isRTL ? item.patientNameAr || item.patientName : item.patientName}</h3>
                  <span className="text-[10px] text-slate-400">{item.bookingNumber}</span>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  item.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {item.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <span>{isRTL ? item.departmentAr || item.department : item.department}</span>
              <span className="text-right">{[item.date, item.time].filter(Boolean).join(' · ')}</span>
              {item.doctorName && <span className="col-span-2 text-slate-400">{isRTL ? item.doctorNameAr || item.doctorName : item.doctorName}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
