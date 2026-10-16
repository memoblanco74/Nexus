import { supabase } from './supabaseClient';
import { renderReportPdf } from '../components/nursery/reportPdf';

export interface PaymentRow {
  tenant_name: string; paid_at: string; months: number; amount_paid: number | null; amount_due: number | null;
  payment_method: string | null; reference: string | null; sender_name: string | null;
  previous_end: string | null; new_end: string | null; note: string | null;
}

export const fetchPayments = async (tenantId: string | null): Promise<PaymentRow[]> => {
  const { data, error } = await supabase.rpc('fn_payments_export', { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  return (data as PaymentRow[]) || [];
};

const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'short', timeStyle: 'short' });

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

const headers = (ar: boolean) => ar
  ? ['المشترك', 'تاريخ الدفع', 'الأشهر', 'المبلغ المحصّل', 'المبلغ المطلوب', 'الطريقة', 'المرجع', 'المحوّل', 'من', 'إلى', 'ملاحظة']
  : ['Subscriber', 'Paid at', 'Months', 'Amount paid', 'Amount due', 'Method', 'Reference', 'Sender', 'From', 'Until', 'Note'];

export const exportPaymentsXlsx = async (rows: PaymentRow[], ar: boolean, name: string) => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(ar ? 'المدفوعات' : 'Payments', { views: [{ rightToLeft: ar }] });
  ws.addRow(headers(ar));
  rows.forEach((r) => ws.addRow([r.tenant_name, fmt(r.paid_at), r.months, r.amount_paid ?? 0, r.amount_due ?? '', r.payment_method || '', r.reference || '', r.sender_name || '', r.previous_end || '', r.new_end || '', r.note || '']));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
  ws.columns.forEach((c, i) => { c.width = [24, 18, 8, 14, 14, 14, 18, 22, 12, 12, 24][i]; });
  ws.addRow([]);
  const total = ws.addRow([ar ? 'الإجمالي' : 'Total', '', '', rows.reduce((s, r) => s + Number(r.amount_paid || 0), 0)]);
  total.font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  save(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${name}.xlsx`);
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const exportPaymentsPdf = async (rows: PaymentRow[], ar: boolean, name: string, title: string) => {
  const h = headers(ar).slice(0, 8);
  const total = rows.reduce((s, r) => s + Number(r.amount_paid || 0), 0);
  const html = `<div dir="${ar ? 'rtl' : 'ltr'}" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;padding:28px;width:900px;background:#fff">
    <h2 style="margin:0 0 4px;color:#1d4ed8">${esc(title)}</h2>
    <p style="margin:0 0 16px;font-size:12px;color:#475569">${new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo' })} — ${ar ? 'الإجمالي' : 'Total'}: <b>${total.toLocaleString()} EGP</b></p>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr>${h.map((x) => `<th style="background:#1d4ed8;color:#fff;padding:6px;text-align:${ar ? 'right' : 'left'}">${esc(x)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr style="background:${i % 2 ? '#f1f5f9' : '#fff'}">${[r.tenant_name, fmt(r.paid_at), String(r.months), r.amount_paid != null ? String(r.amount_paid) : '', r.amount_due != null ? String(r.amount_due) : '', r.payment_method || '', r.reference || '', r.sender_name || ''].map((c) => `<td style="padding:5px 6px;border-bottom:1px solid #e2e8f0">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  save(await renderReportPdf(html), `${name}.pdf`);
};
