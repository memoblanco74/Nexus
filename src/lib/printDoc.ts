export const printHtml = (html: string, dir: 'rtl' | 'ltr' = 'rtl') => {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(`<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>Nexus</title><style>@page{size:A4;margin:14mm}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;margin:0}</style></head><body>${html}</body></html>`);
  doc.close();
  const go = () => {
    try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } finally { setTimeout(() => frame.remove(), 3000); }
  };
  setTimeout(go, 250);
};

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const docHeader = (clinic: string, title: string, meta: string) =>
  `<div style="border-bottom:3px solid #1d4ed8;padding-bottom:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end">
    <div><div style="font-size:22px;font-weight:800;color:#1d4ed8">${esc(clinic)}</div><div style="font-size:13px;color:#475569">${esc(title)}</div></div>
    <div style="font-size:12px;color:#475569;text-align:end">${meta}</div></div>`;

export const buildInvoiceHtml = (
  inv: { invoiceNumber: string; clientName: string; clientNameAr?: string; amount: number; status: string; date: string; dueDate: string; items: { description: string; quantity: number; unitPrice: number; total: number }[] },
  clinic: string,
  ar: boolean,
  fmt: (n: number) => string
) => {
  const th = (t: string) => `<th style="background:#1d4ed8;color:#fff;padding:7px;text-align:${ar ? 'right' : 'left'};font-size:12px">${t}</th>`;
  const td = (t: string) => `<td style="padding:7px;border-bottom:1px solid #e2e8f0;font-size:12px">${t}</td>`;
  const statusLabel = ar ? ({ paid: 'مدفوعة', pending: 'معلقة', overdue: 'متأخرة' } as any)[inv.status] || inv.status : inv.status;
  const client = ar && inv.clientNameAr ? inv.clientNameAr : inv.clientName;
  return `<div style="padding:8px">${docHeader(clinic, ar ? 'فاتورة' : 'Invoice', `${esc(inv.invoiceNumber)}<br/>${esc(inv.date)}`)}
    <table style="width:100%;font-size:13px;margin-bottom:14px"><tr><td><b>${ar ? 'العميل' : 'Client'}:</b> ${esc(client)}</td><td style="text-align:end"><b>${ar ? 'الحالة' : 'Status'}:</b> ${esc(statusLabel)}</td></tr>
    ${inv.dueDate ? `<tr><td><b>${ar ? 'تاريخ الاستحقاق' : 'Due'}:</b> ${esc(inv.dueDate)}</td><td></td></tr>` : ''}</table>
    <table style="width:100%;border-collapse:collapse"><thead><tr>${th(ar ? 'البيان' : 'Description')}${th(ar ? 'الكمية' : 'Qty')}${th(ar ? 'السعر' : 'Price')}${th(ar ? 'الإجمالي' : 'Total')}</tr></thead>
    <tbody>${inv.items.map((i) => `<tr>${td(esc(i.description))}${td(String(i.quantity))}${td(fmt(i.unitPrice))}${td(fmt(i.total))}</tr>`).join('')}</tbody></table>
    <div style="margin-top:16px;padding:12px 16px;background:#eff6ff;border-radius:10px;display:flex;justify-content:space-between;font-size:16px;font-weight:800"><span>${ar ? 'الإجمالي' : 'Total'}</span><span style="color:#1d4ed8">${fmt(inv.amount)}</span></div></div>`;
};

export interface RxItem { drug: string; dose: string; frequency: string; duration: string }

export const buildPrescriptionHtml = (
  p: { patient: string; age?: number | string; date: string; diagnosis: string; items: RxItem[]; notes: string },
  clinic: string,
  doctor: string,
  ar: boolean
) => {
  const th = (t: string) => `<th style="background:#1d4ed8;color:#fff;padding:7px;text-align:${ar ? 'right' : 'left'};font-size:12px">${t}</th>`;
  const td = (t: string) => `<td style="padding:7px;border-bottom:1px solid #e2e8f0;font-size:13px">${esc(t)}</td>`;
  return `<div style="padding:8px">${docHeader(clinic, ar ? 'روشتة طبية' : 'Prescription', esc(p.date))}
    <table style="width:100%;font-size:13px;margin-bottom:12px"><tr><td><b>${ar ? 'المريض' : 'Patient'}:</b> ${esc(p.patient)}</td><td style="text-align:end">${p.age ? `<b>${ar ? 'السن' : 'Age'}:</b> ${esc(String(p.age))}` : ''}</td></tr>
    ${doctor ? `<tr><td colspan="2"><b>${ar ? 'الطبيب' : 'Doctor'}:</b> ${esc(doctor)}</td></tr>` : ''}
    ${p.diagnosis ? `<tr><td colspan="2"><b>${ar ? 'التشخيص' : 'Diagnosis'}:</b> ${esc(p.diagnosis)}</td></tr>` : ''}</table>
    <div style="font-size:28px;font-weight:800;color:#1d4ed8;margin:6px 0">Rx</div>
    <table style="width:100%;border-collapse:collapse"><thead><tr>${th(ar ? 'الدواء' : 'Drug')}${th(ar ? 'الجرعة' : 'Dose')}${th(ar ? 'التكرار' : 'Frequency')}${th(ar ? 'المدة' : 'Duration')}</tr></thead>
    <tbody>${p.items.map((i) => `<tr>${td(i.drug)}${td(i.dose)}${td(i.frequency)}${td(i.duration)}</tr>`).join('')}</tbody></table>
    ${p.notes ? `<p style="margin-top:14px;font-size:13px"><b>${ar ? 'ملاحظات' : 'Notes'}:</b> ${esc(p.notes)}</p>` : ''}
    <div style="margin-top:50px;text-align:end;font-size:12px;color:#64748b">${ar ? 'التوقيع / الختم' : 'Signature / Stamp'}: ____________</div></div>`;
};
