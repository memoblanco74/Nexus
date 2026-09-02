import React, { useState } from 'react';
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

  const [triageQueue, setTriageQueue] = useState([
    { id: 'q-1', name: 'Tariq Al-Mansoor', queueNo: 'A-01', bp: '120/80', pulse: '72 bpm', temp: '36.8 °C', status: 'In Consultation' },
    { id: 'q-2', name: 'Noura Al-Hassan', queueNo: 'A-02', bp: '115/75', pulse: '68 bpm', temp: '37.0 °C', status: 'Vitals Recorded' },
    { id: 'q-3', name: 'Khalid Al-Ghamdi', queueNo: 'A-03', bp: '138/88', pulse: '84 bpm', temp: '37.2 °C', status: 'Waiting Room' },
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('nav.assistant')}
            </h1>
            <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
              {isRTL ? 'مكتب الاستقبال والفرز السريري' : 'Triage & Reception Station'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL ? 'إدارة طابور الانتظار وقياس العلامات الحيوية وتسجيل الدخول السريع' : 'Live patient queue, digital vital signs log & barcode check-in.'}
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

      {/* Reception Queue & Vitals Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {triageQueue.map((item) => (
          <div key={item.id} className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs">
                  {item.queueNo}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <span className="text-[10px] text-slate-400">{item.status}</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Ready
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800/60">
                <span className="text-[9px] text-slate-400 uppercase">BP</span>
                <p className="text-xs font-bold text-white mt-0.5">{item.bp}</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800/60">
                <span className="text-[9px] text-slate-400 uppercase">Pulse</span>
                <p className="text-xs font-bold text-white mt-0.5">{item.pulse}</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800/60">
                <span className="text-[9px] text-slate-400 uppercase">Temp</span>
                <p className="text-xs font-bold text-white mt-0.5">{item.temp}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button className="text-blue-400 font-semibold hover:underline">
                {isRTL ? 'إرسال إلى العيادة' : 'Send to Doctor'} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
