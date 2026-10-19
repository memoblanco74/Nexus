import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Info {
  clinic: { name: string; name_ar: string | null };
  doctors: { id: string; name: string; name_ar: string | null; department: string | null; department_ar: string | null; work_days: number[] }[];
}

const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(d);

export const PublicBooking: React.FC<{ token: string }> = ({ token }) => {
  const [ar, setAr] = useState(true);
  const tx = (a: string, e: string) => (ar ? a : e);
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [doctorId, setDoctorId] = useState('');
  const [day, setDay] = useState('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ number: string } | null>(null);

  useEffect(() => {
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.documentElement.lang = ar ? 'ar' : 'en';
  }, [ar]);

  useEffect(() => {
    supabase.rpc('fn_public_booking_info', { p_token: token }).then(({ data }) => setInfo((data as Info) || null));
  }, [token]);

  const doctor = info?.doctors.find((d) => d.id === doctorId);
  const days = useMemo(() => {
    if (!doctor) return [] as string[];
    const out: string[] = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date(Date.now() + i * 86400000);
      const key = iso(d);
      const dow = new Date(key + 'T12:00:00Z').getUTCDay();
      if (doctor.work_days.includes(dow)) out.push(key);
    }
    return out;
  }, [doctor]);

  useEffect(() => {
    setSlots(null);
    setTime('');
    if (!doctorId || !day) return;
    supabase.rpc('fn_public_slots', { p_token: token, p_doctor_id: doctorId, p_day: day }).then(({ data }) => setSlots((data as string[]) || []));
  }, [doctorId, day, token]);

  const dayLabel = (key: string) => new Date(key + 'T12:00:00Z').toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

  const submit = async () => {
    setErr('');
    if (name.trim().length < 2) { setErr(tx('اكتب اسمك', 'Enter your name')); return; }
    if (phone.replace(/\D/g, '').length < 8) { setErr(tx('اكتب رقم موبايل صحيح', 'Enter a valid phone number')); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('fn_public_book', { p_token: token, p_doctor_id: doctorId, p_day: day, p_time: time, p_name: name.trim(), p_phone: phone.trim() });
    setBusy(false);
    if (error) {
      const m = error.message || '';
      setErr(m.includes('SLOT_TAKEN') ? tx('الميعاد ده اتحجز، اختار ميعاد تاني', 'That slot was just taken, pick another')
        : m.includes('TOO_MANY') ? tx('تم تجاوز عدد الحجوزات المسموح، تواصل مع العيادة', 'Booking limit reached, please contact the clinic')
        : m.includes('INVALID_PHONE') ? tx('رقم الموبايل غير صحيح', 'Invalid phone number')
        : tx('تعذر إتمام الحجز، حاول تاني', 'Could not complete the booking'));
      if (m.includes('SLOT_TAKEN')) { setTime(''); const r = await supabase.rpc('fn_public_slots', { p_token: token, p_doctor_id: doctorId, p_day: day }); setSlots((r.data as string[]) || []); }
      return;
    }
    setDone({ number: (data as any)?.number || '' });
  };

  const shell = 'min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans p-4';
  const card = 'mx-auto w-full max-w-md rounded-2xl bg-white p-5 shadow space-y-4';
  const chip = (on: boolean) => `rounded-xl border px-3 py-2 text-xs font-bold ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`;
  const input = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none';

  if (info === undefined) return <div className={`${shell} flex items-center justify-center text-sm text-slate-500`}>...</div>;
  if (info === null) return <div className={`${shell} flex items-center justify-center`}><div className={`${card} text-center`}><p className="text-base font-extrabold">{tx('الحجز أونلاين غير متاح حالياً', 'Online booking is unavailable')}</p><p className="text-xs text-slate-500">{tx('تواصل مع العيادة مباشرة.', 'Please contact the clinic directly.')}</p></div></div>;

  const clinic = ar ? info.clinic.name_ar || info.clinic.name : info.clinic.name;

  if (done) {
    return (
      <div className={shell}>
        <div className={`${card} text-center`}>
          <p className="text-4xl">✅</p>
          <p className="text-lg font-extrabold">{tx('تم إرسال طلب الحجز', 'Booking request sent')}</p>
          <p className="text-sm text-slate-600">{clinic}</p>
          <p className="text-sm">{dayLabel(day)} — {time}</p>
          {done.number && <p className="text-xs text-slate-500">{tx('رقم الحجز', 'Booking no.')}: <b>{done.number}</b></p>}
          <p className="text-xs text-slate-500">{tx('هتتواصل معاك العيادة لتأكيد الميعاد.', 'The clinic will contact you to confirm.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className={card}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold text-blue-700">{clinic}</h1>
            <p className="text-xs text-slate-500">{tx('احجز موعدك أونلاين', 'Book your appointment online')}</p>
          </div>
          <button onClick={() => setAr(!ar)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-bold">{ar ? 'EN' : 'عربي'}</button>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold">{tx('اختار الطبيب', 'Choose a doctor')}</p>
          <div className="flex flex-wrap gap-2">
            {info.doctors.length === 0 && <p className="text-xs text-slate-500">{tx('لا يوجد أطباء متاحين للحجز.', 'No doctors available.')}</p>}
            {info.doctors.map((d) => (
              <button key={d.id} onClick={() => { setDoctorId(d.id); setDay(''); }} className={chip(doctorId === d.id)}>
                {ar ? d.name_ar || d.name : d.name}{(ar ? d.department_ar || d.department : d.department) ? ` — ${ar ? d.department_ar || d.department : d.department}` : ''}
              </button>
            ))}
          </div>
        </div>

        {doctor && (
          <div>
            <p className="mb-2 text-xs font-bold">{tx('اختار اليوم', 'Choose a day')}</p>
            <div className="flex flex-wrap gap-2">{days.map((d) => <button key={d} onClick={() => setDay(d)} className={chip(day === d)}>{dayLabel(d)}</button>)}</div>
          </div>
        )}

        {day && (
          <div>
            <p className="mb-2 text-xs font-bold">{tx('المواعيد المتاحة', 'Available times')}</p>
            {slots === null ? <p className="text-xs text-slate-500">...</p> : slots.length === 0 ? <p className="text-xs text-slate-500">{tx('لا توجد مواعيد فاضية في اليوم ده.', 'No free slots on this day.')}</p> : (
              <div className="flex flex-wrap gap-2">{slots.map((s) => <button key={s} onClick={() => setTime(s)} className={chip(time === s)} dir="ltr">{s}</button>)}</div>
            )}
          </div>
        )}

        {time && (
          <div className="space-y-3">
            <input className={input} placeholder={tx('الاسم', 'Name')} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            <input className={input} placeholder={tx('رقم الموبايل', 'Mobile number')} dir="ltr" inputMode="tel" value={phone} maxLength={16} onChange={(e) => setPhone(e.target.value)} />
            {err && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{err}</p>}
            <button disabled={busy} onClick={submit} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? '...' : tx('تأكيد الحجز', 'Confirm booking')}</button>
          </div>
        )}
        {!time && err && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{err}</p>}
      </div>
    </div>
  );
};
