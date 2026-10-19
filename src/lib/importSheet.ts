export type Cell = string;
export interface ParsedSheet { headers: string[]; rows: Record<string, Cell>[] }

const norm = (s: string) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[ً-ٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^a-z0-9؀-ۿ]+/g, '');

const asText = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text).join('');
    if ('text' in v) return String(v.text ?? '');
    if ('result' in v) return String(v.result ?? '');
    return '';
  }
  return String(v).trim();
};

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let q = false;
  const src = text.replace(/^﻿/, '');
  const delim = (src.split('\n')[0].match(/;/g) || []).length > (src.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"' && src[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (ch !== '\r') cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
};

export const readSheet = async (file: File): Promise<ParsedSheet> => {
  let matrix: string[][] = [];
  if (/\.csv$/i.test(file.name)) {
    matrix = parseCsv(await file.text()).map((r) => r.map((c) => c.trim()));
  } else {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    if (!ws) return { headers: [], rows: [] };
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals: string[] = [];
      for (let c = 1; c <= ws.columnCount; c++) vals.push(asText(row.getCell(c).value));
      matrix.push(vals);
    });
  }
  matrix = matrix.filter((r) => r.some((c) => c !== ''));
  if (matrix.length === 0) return { headers: [], rows: [] };
  const headers = matrix[0];
  const rows = matrix.slice(1).map((r) => {
    const o: Record<string, Cell> = {};
    headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
  return { headers, rows };
};

export interface ColumnDef {
  key: string;
  labelAr: string;
  labelEn: string;
  aliases?: string[];
  required?: boolean;
  sampleAr: string;
  sampleEn: string;
}

export const matchColumns = (headers: string[], cols: ColumnDef[]) => {
  const map: Record<string, string | null> = {};
  cols.forEach((c) => {
    const names = [c.labelAr, c.labelEn, c.key, ...(c.aliases || [])].map(norm);
    map[c.key] = headers.find((h) => names.includes(norm(h))) ?? null;
  });
  return map;
};

export const pick = (row: Record<string, Cell>, map: Record<string, string | null>, key: string) => {
  const h = map[key];
  return h ? (row[h] ?? '').trim() : '';
};

export const downloadTemplate = async (cols: ColumnDef[], ar: boolean, filename: string) => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(ar ? 'بيانات' : 'Data', { views: [{ rightToLeft: ar }] });
  ws.addRow(cols.map((c) => (ar ? c.labelAr : c.labelEn)));
  ws.addRow(cols.map((c) => (ar ? c.sampleAr : c.sampleEn)));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
  cols.forEach((c, i) => { ws.getColumn(i + 1).width = Math.max(16, (ar ? c.labelAr : c.labelEn).length + 6); });
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const toIsoDate = (v: string): string | null => {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    return `${m[3]}-${mo}-${d}`;
  }
  return null;
};

export const toNumber = (v: string): number => {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  const s = v.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d))).replace(/[^\d.\-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export const toPhone = (v: string): string => {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  let s = v.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d))).replace(/[^\d+]/g, '');
  if (/^1\d{9}$/.test(s)) s = '0' + s;
  return s;
};
