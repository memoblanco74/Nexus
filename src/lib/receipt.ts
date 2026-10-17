import { renderReportPdf, sendReportViaWhatsApp } from '../components/nursery/reportPdf';

export interface ReceiptRow {
  id: string; months: number; previous_end: string | null; new_end: string | null; amount_due: number | null; amount_paid: number | null;
  payment_method: string | null; reference: string | null; paid_at: string; sender_name: string | null; receipt_no: number | null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const receiptNumber = (r: ReceiptRow) => `NX-${r.receipt_no ?? r.id.slice(0, 6).toUpperCase()}`;

export const buildReceiptHtml = (r: ReceiptRow, tenantName: string, ar: boolean) => {
  const dt = new Date(r.paid_at).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' });
  const row = (k: string, v: string) => `<tr><td style="padding:9px 0;color:#64748b;width:38%;border-bottom:1px solid #e2e8f0">${esc(k)}</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #e2e8f0">${esc(v)}</td></tr>`;
  const paid = r.amount_paid != null ? Number(r.amount_paid) : 0;
  return `<div dir="${ar ? 'rtl' : 'ltr'}" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;padding:40px;width:620px;background:#fff">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1d4ed8;padding-bottom:14px;margin-bottom:22px">
      <div><div style="font-size:26px;font-weight:800;color:#1d4ed8">Nexus</div><div style="font-size:12px;color:#64748b">${ar ? 'إيصال سداد اشتراك' : 'Subscription payment receipt'}</div></div>
      <div style="text-align:${ar ? 'left' : 'right'}"><div style="font-size:11px;color:#64748b">${ar ? 'رقم الإيصال' : 'Receipt no.'}</div><div style="font-size:18px;font-weight:800">${receiptNumber(r)}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${row(ar ? 'المشترك' : 'Subscriber', tenantName)}
      ${row(ar ? 'تاريخ الدفع' : 'Payment date', dt)}
      ${row(ar ? 'مدة الاشتراك' : 'Period', ar ? `${r.months} شهر` : `${r.months} month(s)`)}
      ${row(ar ? 'من' : 'From', r.previous_end || '—')}
      ${row(ar ? 'حتى' : 'Until', r.new_end || '—')}
      ${row(ar ? 'طريقة الدفع' : 'Payment method', r.payment_method || '—')}
      ${r.reference ? row(ar ? 'الرقم المرجعي' : 'Reference', r.reference) : ''}
      ${r.sender_name ? row(ar ? 'المحوّل' : 'Paid by', r.sender_name) : ''}
    </table>
    <div style="margin-top:24px;padding:16px 18px;background:#eff6ff;border-radius:12px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:14px;font-weight:700">${ar ? 'المبلغ المدفوع' : 'Amount paid'}</span>
      <span style="font-size:24px;font-weight:800;color:#1d4ed8">${paid.toLocaleString()} EGP</span>
    </div>
    <div style="margin-top:22px;text-align:center;font-size:11px;color:#94a3b8">${ar ? 'شكراً لثقتكم — هذا إيصال إلكتروني صادر من منصة Nexus' : 'Thank you — electronic receipt issued by the Nexus platform'}</div>
  </div>`;
};

const save = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const downloadReceipt = async (r: ReceiptRow, tenantName: string, ar: boolean) => {
  save(await renderReportPdf(buildReceiptHtml(r, tenantName, ar)), `${receiptNumber(r)}.pdf`);
};

export const shareReceipt = async (r: ReceiptRow, tenantName: string, ar: boolean, phone: string) => {
  const blob = await renderReportPdf(buildReceiptHtml(r, tenantName, ar));
  return sendReportViaWhatsApp(blob, `${receiptNumber(r)}.pdf`, phone, ar ? `إيصال سداد اشتراك ${tenantName} — ${receiptNumber(r)}` : `Subscription receipt ${receiptNumber(r)}`);
};
