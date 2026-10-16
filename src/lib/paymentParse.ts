const AR = '٠١٢٣٤٥٦٧٨٩';
const norm = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/٫/g, '.');

export interface ParsedPayment {
  amount?: string;
  sender?: string;
  reference?: string;
  paidAt?: string;
  method?: string;
}

const pad = (n: number | string) => String(n).padStart(2, '0');

export const parsePaymentMessage = (raw: string): ParsedPayment => {
  const s = norm(raw).replace(/\s+/g, ' ').trim();
  const out: ParsedPayment = {};
  const amount = s.match(/بمبلغ\s*([\d,]+(?:\.\d+)?)/) || s.match(/([\d,]+(?:\.\d+)?)\s*(?:جم|ج\.م|جنيه|EGP)/i);
  if (amount) out.amount = amount[1].replace(/,/g, '');
  const sender = s.match(/(?:جم|جنيه|EGP)\s*من\s+(.+?)\s+(?:رقم\s*مرجعي|مرجع|يوم)/i);
  if (sender) out.sender = sender[1].trim();
  const ref = s.match(/(?:رقم\s*مرجعي|المرجع|مرجعي)\s*:?\s*([A-Za-z0-9]+)/);
  if (ref) out.reference = ref[1];
  const dt = s.match(/يوم\s*(\d{1,4})[-\/](\d{1,2})(?:[-\/](\d{1,4}))?\s*(?:الساعة|الساعه|ساعة)?\s*(\d{1,2}):(\d{2})/);
  if (dt) {
    const a = Number(dt[1]);
    const b = Number(dt[2]);
    const c = dt[3] ? Number(dt[3]) : null;
    const nowYear = Number(new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }).slice(0, 4));
    let y = nowYear, m = a, d = b;
    if (c !== null) {
      if (a > 31) { y = a; m = b; d = c; }
      else { d = a; m = b; y = c < 100 ? 2000 + c : c; }
    } else if (a > 12) { d = a; m = b; }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      let iso = `${y}-${pad(m)}-${pad(d)}T${pad(dt[4])}:${dt[5]}`;
      if (c === null && iso > new Date().toLocaleString('sv-SE', { timeZone: 'Africa/Cairo' }).slice(0, 16).replace(' ', 'T')) iso = `${y - 1}-${pad(m)}-${pad(d)}T${pad(dt[4])}:${dt[5]}`;
      out.paidAt = iso;
    }
  }
  if (/تحويل\s*لحظي|انستا|instapay/i.test(s)) out.method = 'InstaPay';
  else if (/فودافون|vodafone/i.test(s)) out.method = 'Vodafone Cash';
  return out;
};
