import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { phoneForWhatsApp } from '../nursery/nurseryApi';
import {
  CalendarCheck,
  CalendarPlus,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  MessageCircle,
} from 'lucide-react';

export const BookingsView: React.FC = () => {
  const {
    language,
    isRTL,
    bookings,
    updateBookingStatus,
    setIsNewBookingOpen,
    refreshBookings,
    activeTenant,
    showToast,
    t,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const filteredBookings = bookings.filter((b) => {
    return statusFilter === 'all' || b.status === statusFilter;
  });

  const cairoDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(d);
  const tomorrowKey = cairoDay(new Date(Date.now() + 86400000));
  const tomorrow = bookings.filter((b) => b.scheduledAt && b.status !== 'cancelled' && cairoDay(new Date(b.scheduledAt)) === tomorrowKey);
  const clinicName = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';

  const remind = async (b: (typeof bookings)[number]) => {
    if (!b.patientPhone) { showToast(isRTL ? 'مفيش رقم موبايل للمريض' : 'No phone number for this patient'); return; }
    const when = b.scheduledAt ? new Date(b.scheduledAt).toLocaleString(isRTL ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : `${b.date} ${b.time}`;
    const name = isRTL ? b.patientNameAr : b.patientName;
    const msg = isRTL
      ? `أهلاً ${name}، تذكير بموعدك في ${clinicName} يوم ${when}. لو محتاج تغيير الموعد رجاءً تواصل معنا. مع تمنياتنا بالسلامة.`
      : `Hello ${name}, a reminder of your appointment at ${clinicName} on ${when}. Please contact us if you need to reschedule.`;
    window.open(`https://wa.me/${phoneForWhatsApp(b.patientPhone)}?text=${encodeURIComponent(msg)}`, '_blank');
    await supabase.from('bookings').update({ reminder_sent_at: new Date().toISOString() }).eq('id', b.id);
    refreshBookings();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-[#0f172a]">
              {t('nav.bookings')}
            </h1>
            <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
              {bookings.length} {isRTL ? 'مواعيد اليوم' : "Today's Schedule"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('vocab.bookings_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsNewBookingOpen(true)} data-write="1"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 transition active:scale-95"
        >
          <CalendarPlus className="h-4 w-4" />
          <span>{t('founder.new_booking')}</span>
        </button>
      </div>

      {tomorrow.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="mb-2 text-xs font-bold text-emerald-300">{isRTL ? `حجوزات بكرة (${tomorrow.length}) — ابعت تذكير واتساب` : `Tomorrow's bookings (${tomorrow.length}) — send WhatsApp reminders`}</h3>
          <div className="space-y-1.5">
            {tomorrow.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs">
                <span className="min-w-0 truncate font-semibold text-white">{isRTL ? b.patientNameAr : b.patientName} <span className="font-normal text-slate-400">• {b.time}</span></span>
                <button data-write="1" onClick={() => remind(b)} className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${b.reminderSentAt ? 'border-slate-700 text-slate-400' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'}`}>
                  <MessageCircle className="h-3.5 w-3.5" />{b.reminderSentAt ? (isRTL ? 'اتبعت — إعادة' : 'Sent — again') : (isRTL ? 'تذكير' : 'Remind')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st === 'all' ? (isRTL ? 'الكل' : 'All') : st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">{t('common.patient_name')}</th>
                <th className="py-3 px-3">{t('common.doctor')}</th>
                <th className="py-3 px-3">{t('common.department')}</th>
                <th className="py-3 px-3">{t('common.time')}</th>
                <th className="py-3 px-3">{isRTL ? 'نوع الزيارة' : 'Appointment Type'}</th>
                <th className="py-3 px-3">{t('common.status')}</th>
                <th className="py-3 px-3 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    {b.bookingNumber}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    {language === 'ar' ? b.patientNameAr : b.patientName}
                  </td>
                  <td className="py-3 px-3 text-blue-400 font-medium">
                    {language === 'ar' ? b.doctorNameAr : b.doctorName}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {language === 'ar' ? b.departmentAr : b.department}
                  </td>
                  <td className="py-3 px-3 text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{b.time}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {b.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        {isRTL ? 'مؤكد' : 'Confirmed'}
                      </span>
                    )}
                    {b.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        {isRTL ? 'قيد المراجعة' : 'Pending'}
                      </span>
                    )}
                    {b.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                        <XCircle className="h-3 w-3" />
                        {isRTL ? 'ملغي' : 'Cancelled'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {b.status !== 'cancelled' && b.patientPhone && (
                        <button data-write="1" onClick={() => remind(b)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400" title={isRTL ? 'تذكير واتساب' : 'WhatsApp reminder'}>
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => updateBookingStatus(b.id, 'confirmed')}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                        title="Confirm Booking"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateBookingStatus(b.id, 'cancelled')}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                        title="Cancel Booking"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
