import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Paperclip, Pill, Plus, Printer, Stethoscope, StickyNote, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { askConfirm } from '../../lib/dialog';
import { RxItem, buildPrescriptionHtml, printHtml } from '../../lib/printDoc';
import { Field, Modal, inputClass } from '../nursery/ui';
import { Patient } from '../../types';

type Kind = 'diagnosis' | 'note' | 'prescription' | 'file';

interface RecordRow {
  id: string;
  kind: Kind;
  title: string;
  body: string | null;
  items: RxItem[];
  file_path: string | null;
  file_name: string | null;
  record_date: string;
}

const emptyItem = (): RxItem => ({ drug: '', dose: '', frequency: '', duration: '' });

export const PatientRecordsModal: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
  const { isRTL, language, activeTenant, showToast, isReadOnly } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Kind | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [items, setItems] = useState<RxItem[]>([emptyItem()]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tenantId = activeTenant?.id;
  const clinic = language === 'ar' ? activeTenant?.nameAr || activeTenant?.name || '' : activeTenant?.name || '';
  const patientName = language === 'ar' ? patient.nameAr || patient.nameEn : patient.nameEn || patient.nameAr;

  const load = useCallback(async () => {
    const { data } = await supabase.from('patient_records').select('*').eq('patient_id', patient.id).order('record_date', { ascending: false }).order('created_at', { ascending: false });
    setRows((data as RecordRow[]) || []);
    setLoading(false);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setAdding(null); setTitle(''); setBody(''); setItems([emptyItem()]); };

  const save = async () => {
    if (!tenantId || !adding) return;
    const cleanItems = items.filter((i) => i.drug.trim());
    if (adding === 'prescription' && cleanItems.length === 0) { showToast(tx('اكتب دواء واحد على الأقل', 'Add at least one drug')); return; }
    if (adding !== 'prescription' && !title.trim() && !body.trim()) { showToast(tx('اكتب عنوان أو تفاصيل', 'Enter a title or details')); return; }
    setBusy(true);
    const { error } = await supabase.from('patient_records').insert({
      tenant_id: tenantId,
      patient_id: patient.id,
      kind: adding,
      title: title.trim(),
      body: body.trim() || null,
      items: adding === 'prescription' ? cleanItems : [],
    });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    reset();
    load();
  };

  const upload = async (file: File) => {
    if (!tenantId) return;
    if (file.size > 10 * 1024 * 1024) { showToast(tx('الملف أكبر من 10 ميجا', 'File is larger than 10 MB')); return; }
    setBusy(true);
    const safe = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${tenantId}/${patient.id}/${Date.now()}-${safe}`;
    const up = await supabase.storage.from('patient-files').upload(path, file, { contentType: file.type || undefined });
    if (up.error) { setBusy(false); showToast(up.error.message); return; }
    const { error } = await supabase.from('patient_records').insert({ tenant_id: tenantId, patient_id: patient.id, kind: 'file', title: file.name, file_path: path, file_name: file.name });
    setBusy(false);
    if (error) { await supabase.storage.from('patient-files').remove([path]); showToast(error.message); return; }
    load();
  };

  const openFile = async (r: RecordRow) => {
    if (!r.file_path) return;
    const { data, error } = await supabase.storage.from('patient-files').createSignedUrl(r.file_path, 120);
    if (error || !data) { showToast(error?.message || 'Error'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const remove = async (r: RecordRow) => {
    if (!(await askConfirm({ danger: true, message: tx('حذف السجل ده؟', 'Delete this record?') }))) return;
    if (r.file_path) await supabase.storage.from('patient-files').remove([r.file_path]);
    const { error } = await supabase.from('patient_records').delete().eq('id', r.id);
    if (error) showToast(error.message);
    else load();
  };

  const printRx = (r: RecordRow) => {
    printHtml(
      buildPrescriptionHtml({ patient: patientName, age: patient.age, date: r.record_date, diagnosis: r.title, items: r.items || [], notes: r.body || '' }, clinic, patient.doctor || '', isRTL),
      isRTL ? 'rtl' : 'ltr'
    );
  };

  const icon = (k: Kind) => (k === 'diagnosis' ? <Stethoscope className="h-4 w-4 text-blue-400" /> : k === 'prescription' ? <Pill className="h-4 w-4 text-emerald-400" /> : k === 'file' ? <Paperclip className="h-4 w-4 text-amber-400" /> : <StickyNote className="h-4 w-4 text-slate-400" />);
  const kindLabel = (k: Kind) => ({ diagnosis: tx('تشخيص', 'Diagnosis'), prescription: tx('روشتة', 'Prescription'), note: tx('ملاحظة', 'Note'), file: tx('مرفق', 'File') })[k];

  return (
    <Modal title={`${tx('الملف الطبي', 'Medical file')} — ${patientName}`} onClose={onClose} wide>
      {!isReadOnly && !adding && (
        <div className="flex flex-wrap gap-2" data-write="1">
          {(['diagnosis', 'prescription', 'note'] as const).map((k) => (
            <button key={k} onClick={() => setAdding(k)} className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20"><Plus className="h-3.5 w-3.5" />{kindLabel(k)}</button>
          ))}
          <button disabled={busy} onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"><Paperclip className="h-3.5 w-3.5" />{tx('رفع ملف (أشعة / تحليل)', 'Upload file')}</button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
        </div>
      )}

      {adding && (
        <div className="space-y-3 rounded-2xl border border-slate-800 p-3">
          <h4 className="text-xs font-bold text-white">{kindLabel(adding)}</h4>
          <Field label={adding === 'prescription' ? tx('التشخيص', 'Diagnosis') : tx('العنوان', 'Title')}>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          {adding === 'prescription' && (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 p-2 sm:grid-cols-4">
                  {([['drug', tx('الدواء', 'Drug')], ['dose', tx('الجرعة', 'Dose')], ['frequency', tx('التكرار', 'Frequency')], ['duration', tx('المدة', 'Duration')]] as const).map(([f, ph]) => (
                    <input key={f} className={inputClass} placeholder={ph} value={it[f]} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, [f]: e.target.value } : x)))} />
                  ))}
                </div>
              ))}
              <button onClick={() => setItems([...items, emptyItem()])} className="text-[11px] font-bold text-blue-400 hover:text-blue-300">+ {tx('دواء آخر', 'Add drug')}</button>
            </div>
          )}
          <Field label={adding === 'prescription' ? tx('ملاحظات للمريض', 'Patient notes') : tx('التفاصيل', 'Details')}>
            <textarea rows={3} className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button onClick={reset} className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">{tx('إلغاء', 'Cancel')}</button>
            <button disabled={busy} onClick={save} className="rounded-lg bg-blue-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 disabled:opacity-50">{tx('حفظ', 'Save')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-xs text-slate-500">...</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">{tx('مفيش سجلات للمريض ده لسه', 'No records yet')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {icon(r.kind)}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{r.title || kindLabel(r.kind)}</p>
                    <p className="text-[10px] text-slate-500">{kindLabel(r.kind)} • {r.record_date}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.kind === 'prescription' && <button onClick={() => printRx(r)} title={tx('طباعة', 'Print')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><Printer className="h-4 w-4" /></button>}
                  {r.kind === 'file' && <button onClick={() => openFile(r)} title={tx('فتح', 'Open')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><FileText className="h-4 w-4" /></button>}
                  {!isReadOnly && <button data-write="1" onClick={() => remove(r)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
              {r.kind === 'prescription' && r.items?.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-slate-300">
                  {r.items.map((i, n) => <li key={n}>• {i.drug} {i.dose && `— ${i.dose}`} {i.frequency && `— ${i.frequency}`} {i.duration && `— ${i.duration}`}</li>)}
                </ul>
              )}
              {r.body && <p className="mt-2 whitespace-pre-wrap text-[11px] text-slate-400">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
