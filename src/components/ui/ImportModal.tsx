import React, { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../nursery/ui';
import { Cell, ColumnDef, ParsedSheet, downloadTemplate, matchColumns, pick, readSheet } from '../../lib/importSheet';

export interface ImportEntity {
  title: string;
  titleEn: string;
  columns: ColumnDef[];
  validate?: (rec: Record<string, string>) => string | null;
  insert: (records: Record<string, string>[]) => Promise<{ error: string | null }>;
  filename: string;
}

export const ImportModal: React.FC<{ entity: ImportEntity; onClose: () => void; onDone: () => void }> = ({ entity, onClose, onDone }) => {
  const { isRTL, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const map = sheet ? matchColumns(sheet.headers, entity.columns) : {};
  const records: Record<string, string>[] = sheet
    ? sheet.rows.map((r) => {
        const rec: Record<string, string> = {};
        entity.columns.forEach((c) => { rec[c.key] = pick(r as Record<string, Cell>, map, c.key); });
        return rec;
      })
    : [];
  const checked = records.map((rec) => {
    const missing = entity.columns.find((c) => c.required && !rec[c.key]);
    if (missing) return { rec, error: tx(`ناقص: ${missing.labelAr}`, `Missing: ${missing.labelEn}`) };
    const v = entity.validate?.(rec) || null;
    return { rec, error: v };
  });
  const good = checked.filter((c) => !c.error);
  const bad = checked.filter((c) => c.error);
  const missingRequired = entity.columns.filter((c) => c.required && !map[c.key]);

  const onFile = async (f: File) => {
    setErr('');
    try {
      const s = await readSheet(f);
      if (s.rows.length === 0) setErr(tx('الملف فاضي أو مفيهوش صفوف بيانات', 'The file has no data rows'));
      else if (s.rows.length > 2000) setErr(tx('الحد الأقصى 2000 صف في المرة', 'Maximum 2000 rows per import'));
      else setSheet(s);
    } catch {
      setErr(tx('تعذر قراءة الملف. استخدم ملف xlsx أو csv', 'Could not read the file. Use xlsx or csv'));
    }
  };

  const run = async () => {
    setBusy(true);
    const res = await entity.insert(good.map((g) => g.rec));
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    showToast(tx(`تم استيراد ${good.length} سجل`, `${good.length} records imported`));
    onDone();
    onClose();
  };

  return (
    <Modal
      title={tx(`استيراد ${entity.title} من Excel`, `Import ${entity.titleEn} from Excel`)}
      onClose={onClose}
      wide
      footer={
        <button disabled={busy || !sheet || good.length === 0 || missingRequired.length > 0} onClick={run} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-40">
          {busy ? '...' : tx(`استيراد ${good.length} سجل`, `Import ${good.length} records`)}
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => downloadTemplate(entity.columns, isRTL, entity.filename)} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800">
          <Download className="h-3.5 w-3.5" />{tx('تحميل القالب', 'Download template')}
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20">
          <Upload className="h-3.5 w-3.5" />{tx('اختيار ملف (xlsx / csv)', 'Choose file (xlsx / csv)')}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
      </div>
      <p className="text-[11px] text-slate-500">{tx('الصف الأول لازم يكون عناوين الأعمدة. حمّل القالب واملاه، أو ارفع ملفك بنفس العناوين.', 'The first row must be the column headings. Download the template, or use your own file with the same headings.')}</p>
      {err && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{err}</p>}

      {sheet && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {entity.columns.map((c) => (
              <span key={c.key} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[c.key] ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : c.required ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-slate-700 text-slate-500'}`}>
                {isRTL ? c.labelAr : c.labelEn}{c.required ? ' *' : ''}
              </span>
            ))}
          </div>
          {missingRequired.length > 0 && <p className="text-[11px] text-red-300">{tx('عمود مطلوب مش موجود في الملف: ', 'Required column not found: ')}{missingRequired.map((c) => (isRTL ? c.labelAr : c.labelEn)).join('، ')}</p>}
          <p className="flex items-center gap-1.5 text-xs text-slate-300"><FileSpreadsheet className="h-4 w-4 text-emerald-400" />{tx(`${good.length} صف سليم`, `${good.length} valid row(s)`)}{bad.length > 0 && <span className="text-amber-300"> — {tx(`${bad.length} صف هيتم تخطيه`, `${bad.length} row(s) will be skipped`)}</span>}</p>
          {bad.length > 0 && (
            <ul className="max-h-24 overflow-y-auto rounded-xl border border-slate-800 p-2 text-[11px] text-amber-300">
              {bad.slice(0, 20).map((b, i) => <li key={i}>{tx('صف', 'Row')} {checked.indexOf(b) + 2}: {b.error}</li>)}
            </ul>
          )}
          <div className="max-h-44 overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-[11px] text-slate-300">
              <thead className="sticky top-0 bg-slate-900 text-slate-400"><tr>{entity.columns.map((c) => <th key={c.key} className="px-2 py-1.5 text-start">{isRTL ? c.labelAr : c.labelEn}</th>)}</tr></thead>
              <tbody>{good.slice(0, 8).map((g, i) => <tr key={i} className="border-t border-slate-800">{entity.columns.map((c) => <td key={c.key} className="px-2 py-1">{g.rec[c.key]}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
};
