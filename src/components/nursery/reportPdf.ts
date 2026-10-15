import { Child, DailyLog, phoneForWhatsApp } from './nurseryApi';

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const minutesBetween = (from: string, to: string) => {
  if (!from || !to) return null;
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  let diff = th * 60 + tm - (fh * 60 + fm);
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const durationLabel = (mins: number | null, ar: boolean) => {
  if (mins === null) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (ar) return h ? (m ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`) : `${m} دقيقة`;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

export const buildReportHtml = (child: Child, log: DailyLog, nurseryName: string, ar: boolean) => {
  const tx = (a: string, e: string) => (ar ? a : e);
  const mealName = (t: string) => (t === 'breakfast' ? tx('الإفطار', 'Breakfast') : t === 'lunch' ? tx('الغداء', 'Lunch') : tx('السناكس', 'Snacks'));
  const kindName = (k: string) => (k === 'wet' ? tx('بول', 'Wet') : k === 'dirty' ? tx('براز', 'Dirty') : tx('بول وبراز', 'Wet & dirty'));

  const section = (title: string, body: string) =>
    body
      ? `<div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><div style="background:#eef2ff;color:#3730a3;font-weight:700;font-size:13px;padding:8px 12px">${esc(title)}</div><div style="padding:10px 12px;font-size:13px;line-height:1.9;color:#0f172a">${body}</div></div>`
      : '';
  const row = (label: string, value: string) => (value ? `<div><span style="color:#64748b">${esc(label)}:</span> <b>${esc(value)}</b></div>` : '');

  const attendance =
    log.status === 'absent'
      ? `<div style="color:#b91c1c;font-weight:700">${tx('غائب اليوم', 'Absent today')}</div>${row(tx('السبب', 'Reason'), log.absence_reason)}`
      : [
          row(tx('وقت الوصول', 'Arrival'), log.arrival_time),
          row(tx('وقت الانصراف', 'Departure'), log.departure_time),
          row(tx('استلمه', 'Received by'), log.received_by),
          log.departure_mode === 'transport'
            ? row(tx('المشرف المسؤول عن التوصيل', 'Transport supervisor'), log.transport_supervisor) +
              row(tx('سُلِّم إلى', 'Handed to'), log.delivered_to) +
              row(tx('وقت التسليم', 'Handed at'), log.delivered_time)
            : log.departure_mode === 'pickup'
            ? `<div style="color:#64748b">${tx('استلمه ولي الأمر من الحضانة', 'Picked up from the nursery')}</div>`
            : '',
        ].join('');

  const meals = log.meals
    .filter((m) => m.times > 0 || m.note)
    .map((m) => `<div>${esc(mealName(m.type))}: <b>${esc(m.times)}</b> ${tx('مرة', 'time(s)')}${m.note ? ` — ${esc(m.note)}` : ''}</div>`)
    .join('');
  const diapers = log.diapers.map((d) => `<div>${esc(d.time)} — ${esc(kindName(d.kind))}</div>`).join('');
  const medicines = log.medicines
    .map((m) => `<div><b>${esc(m.name)}</b>${m.reason ? ` — ${esc(m.reason)}` : ''}${m.time ? ` (${esc(m.time)})` : ''}</div>`)
    .join('');
  const naps = log.naps
    .map((n) => `<div>${tx('نام', 'Slept')} ${esc(n.from)} — ${tx('صحي', 'woke')} ${esc(n.to)} <span style="color:#64748b">(${esc(durationLabel(minutesBetween(n.from, n.to), ar))})</span></div>`)
    .join('');
  const clothes = log.clothes.map((c) => `<div>${esc(c.time)}${c.note ? ` — ${esc(c.note)}` : ''}</div>`).join('');
  const clothesBlock = log.clothes.length ? `<div style="color:#64748b">${tx('عدد مرات تغيير الهدوم', 'Clothes changes')}: <b style="color:#0f172a">${log.clothes.length}</b></div>${clothes}` : '';
  const school = [row(tx('الأنشطة', 'Activities'), log.daily_activities), row(tx('وقت البريك', 'Break time'), log.break_time), row(tx('فن داي', 'Fun day'), log.fun_day)].join('');
  const extras = [
    log.supplies_brought ? `<div>${tx('أحضر الطفل المستلزمات (سابلايز)', 'Supplies brought')}${log.supplies_note ? ` — ${esc(log.supplies_note)}` : ''}</div>` : '',
    log.used_transport ? `<div>${tx('استخدم المواصلات اليوم', 'Used transport today')}</div>` : '',
  ].join('');
  const comment = log.teacher_comment
    ? `<div style="margin-top:14px;border-radius:12px;background:#fefce8;border:1px solid #fde68a;padding:10px 12px;font-size:13px;line-height:1.9;color:#713f12"><b>${tx('رسالة من المعلمة', 'Teacher note')}:</b><br/>${esc(log.teacher_comment).replace(/\n/g, '<br/>')}</div>`
    : '';

  return `<div dir="${ar ? 'rtl' : 'ltr'}" style="width:760px;background:#ffffff;padding:28px;font-family:Cairo,Tahoma,Arial,sans-serif;color:#0f172a;box-sizing:border-box">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #6366f1;padding-bottom:12px">
      <div><div style="font-size:20px;font-weight:800;color:#3730a3">${esc(nurseryName)}</div><div style="font-size:12px;color:#64748b">${tx('تقرير يوم الطفل', 'Daily child report')}</div></div>
      <div style="text-align:${ar ? 'left' : 'right'};font-size:13px;color:#334155"><div style="font-weight:700">${esc(log.day)}</div></div>
    </div>
    <div style="margin-top:14px;font-size:17px;font-weight:800">${esc(child.full_name)}</div>
    ${section(tx('الحضور والانصراف', 'Attendance'), attendance)}
    ${log.status === 'present' ? section(tx('الوجبات', 'Meals'), meals) : ''}
    ${log.status === 'present' ? section(tx('الحفاضات', 'Diapers'), diapers) : ''}
    ${log.status === 'present' ? section(tx('الدواء', 'Medicine'), medicines) : ''}
    ${log.status === 'present' ? section(tx('النوم', 'Sleep'), naps) : ''}
    ${log.status === 'present' ? section(tx('تغيير الهدوم', 'Clothes'), clothesBlock) : ''}
    ${log.status === 'present' ? section(tx('اليوم الدراسي', 'School day'), school) : ''}
    ${log.status === 'present' ? section(tx('ملاحظات', 'Other'), extras) : ''}
    ${comment}
    <div style="margin-top:18px;text-align:center;font-size:10px;color:#94a3b8">Nexus</div>
  </div>`;
};

export const renderReportPdf = async (html: string): Promise<Blob> => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1';
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    if ((document as any).fonts?.ready) await (document as any).fonts.ready;
    const node = host.firstElementChild as HTMLElement;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    const pageCanvasH = Math.floor((canvas.width * pageH) / pageW);
    if (imgH <= pageH) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, imgH);
    } else {
      let offset = 0;
      let first = true;
      while (offset < canvas.height) {
        const sliceH = Math.min(pageCanvasH, canvas.height - offset);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, offset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (!first) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, (sliceH * pageW) / canvas.width);
        offset += sliceH;
        first = false;
      }
    }
    return pdf.output('blob');
  } finally {
    host.remove();
  }
};

export const sendReportViaWhatsApp = async (blob: Blob, filename: string, phone: string, message: string): Promise<'shared' | 'downloaded'> => {
  const file = new File([blob], filename, { type: 'application/pdf' });
  const nav: any = navigator;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: message });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  const digits = phoneForWhatsApp(phone);
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
  return 'downloaded';
};
