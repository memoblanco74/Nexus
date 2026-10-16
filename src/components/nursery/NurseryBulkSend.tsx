import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Modal } from './ui';
import { buildReportHtml, renderReportPdf, sendReportViaWhatsApp } from './reportPdf';
import { Child, DailyLog } from './nurseryApi';

type State = 'preparing' | 'ready' | 'sent' | 'error';

export const NurseryBulkSend: React.FC<{ day: string; children: Child[]; logs: Record<string, DailyLog>; onClose: () => void }> = ({ day, children, logs, onClose }) => {
  const { isRTL, language, activeTenant, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const items = children.filter((c) => logs[c.id]);
  const [states, setStates] = useState<Record<string, State>>({});
  const blobs = useRef<Record<string, Blob>>({});
  const cancelled = useRef(false);

  const phoneOf = (c: Child) => c.mother_phone || c.father_phone || c.guardian_phone || '';
  const nurseryName = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';

  useEffect(() => {
    cancelled.current = false;
    (async () => {
      for (const c of items) {
        if (cancelled.current) return;
        setStates((s) => ({ ...s, [c.id]: 'preparing' }));
        try {
          blobs.current[c.id] = await renderReportPdf(buildReportHtml(c, logs[c.id], nurseryName, isRTL));
          setStates((s) => ({ ...s, [c.id]: 'ready' }));
        } catch {
          setStates((s) => ({ ...s, [c.id]: 'error' }));
        }
      }
    })();
    return () => { cancelled.current = true; };
  }, []);

  const send = async (c: Child) => {
    const blob = blobs.current[c.id];
    if (!blob) return;
    const msg = isRTL ? `تقرير ${c.full_name} ليوم ${day}` : `${c.full_name} report for ${day}`;
    const safe = `${c.full_name.replace(/[\\/:*?"<>|\s]+/g, '_')}_${day}.pdf`;
    try {
      const r = await sendReportViaWhatsApp(blob, safe, phoneOf(c), msg);
      setStates((s) => ({ ...s, [c.id]: 'sent' }));
      if (r === 'downloaded') showToast(tx('اتحمّل الـ PDF وفتحنا واتساب، أرفق الملف في المحادثة', 'PDF downloaded and WhatsApp opened, attach the file'));
    } catch (e: any) {
      showToast(e?.message || 'Error');
    }
  };

  const next = items.find((c) => states[c.id] === 'ready' && phoneOf(c));
  const sentCount = items.filter((c) => states[c.id] === 'sent').length;

  return (
    <Modal
      title={tx(`إرسال تقارير ${day}`, `Send reports for ${day}`)}
      onClose={onClose}
      footer={
        <button disabled={!next} onClick={() => next && send(next)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40">
          <Send className="h-4 w-4" />
          {next ? tx(`إرسال التالي: ${next.full_name}`, `Send next: ${next.full_name}`) : tx('لا يوجد تقارير جاهزة', 'Nothing left to send')}
        </button>
      }
    >
      <p className="text-[11px] text-slate-400">
        {tx(`الإرسال عبر واتساب بيتم تقرير تقرير (المتصفح بيطلب ضغطة لكل رسالة). تم إرسال ${sentCount} من ${items.length}.`, `WhatsApp sends one report at a time. Sent ${sentCount} of ${items.length}.`)}
      </p>
      {items.length === 0 && <p className="py-6 text-center text-xs text-slate-500">{tx('مفيش تقارير مسجلة لليوم ده', 'No reports recorded for this day')}</p>}
      <div className="space-y-2">
        {items.map((c) => {
          const st = states[c.id];
          const phone = phoneOf(c);
          return (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{c.full_name}</p>
                <p className="text-[11px] text-slate-500" dir="ltr">{phone || tx('مفيش رقم موبايل', 'No phone')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {st === 'preparing' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                {st === 'sent' && <Badge tone="ok"><Check className="inline h-3 w-3" /> {tx('تم', 'Sent')}</Badge>}
                {st === 'error' && <Badge tone="bad">{tx('خطأ', 'Error')}</Badge>}
                {(st === 'ready' || st === 'sent') && phone && (
                  <button onClick={() => send(c)} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20">
                    {st === 'sent' ? tx('إعادة', 'Resend') : tx('إرسال', 'Send')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
