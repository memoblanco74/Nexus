import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface QueueData {
  clinic: { name: string; name_ar: string | null };
  serving: { number: number; doctor: string | null } | null;
  waiting: number[];
  waiting_count: number;
}

const beep = () => {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.2;
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 450);
  } catch { /* ignore */ }
};

export const QueueDisplay: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<QueueData | null | undefined>(undefined);
  const [sound, setSound] = useState(false);
  const last = useRef<number | null>(null);
  const soundRef = useRef(false);
  soundRef.current = sound;

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    let stop = false;
    const tick = async () => {
      const { data: d } = await supabase.rpc('fn_public_queue', { p_token: token });
      if (stop) return;
      const q = (d as QueueData) || null;
      setData(q);
      const n = q?.serving?.number ?? null;
      if (n !== null && last.current !== null && n !== last.current && soundRef.current) beep();
      last.current = n;
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [token]);

  if (data === undefined) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">...</div>;
  if (data === null) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-xl text-slate-300">الشاشة غير متاحة</div>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 p-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-blue-300">{data.clinic.name_ar || data.clinic.name}</h1>
        <button onClick={() => { setSound(!sound); if (!sound) beep(); }} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">{sound ? '🔊 الصوت مفعّل' : '🔈 تفعيل الصوت'}</button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-2xl text-slate-400">الدور الحالي</p>
        <p className="text-[9rem] font-black leading-none text-emerald-400 sm:text-[14rem]">{data.serving ? data.serving.number : '—'}</p>
        {data.serving?.doctor && <p className="text-2xl text-slate-300">{data.serving.doctor}</p>}
      </div>
      <div className="border-t border-slate-800 pt-4">
        <p className="mb-2 text-lg text-slate-400">في الانتظار ({data.waiting_count})</p>
        <div className="flex flex-wrap gap-3">
          {data.waiting.length === 0 ? <span className="text-slate-600">لا يوجد منتظرين</span> : data.waiting.map((n) => <span key={n} className="rounded-xl bg-slate-800 px-5 py-2 text-3xl font-bold">{n}</span>)}
        </div>
      </div>
    </div>
  );
};
