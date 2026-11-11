import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { askConfirm } from '../../lib/dialog';
import { Child, NurseryClass, NurseryCore } from './nurseryApi';
import { Field, Modal, inputClass } from './ui';

const MembersEditor: React.FC<{ cls: NurseryClass; core: NurseryCore; onBack: () => void }> = ({ cls, core, onBack }) => {
  const { isRTL, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(core.children.filter((c) => c.class_id === cls.id).map((c) => c.id)));
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const others = useMemo(() => new Map(core.classes.map((c) => [c.id, c.name])), [core.classes]);
  const list = core.children.filter((c) => c.status === 'active' && (!q.trim() || c.full_name.toLowerCase().includes(q.trim().toLowerCase())));

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('fn_set_class_members', { p_class_id: cls.id, p_child_ids: Array.from(selected) });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    await core.reload();
    showToast(tx('تم حفظ أطفال الفصل', 'Class members saved'));
    onBack();
  };

  return (
    <Modal
      title={`${tx('أطفال فصل', 'Children of')} ${cls.name}`}
      onClose={onBack}
      footer={<>
        <button onClick={onBack} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">{tx('رجوع', 'Back')}</button>
        <button disabled={busy} onClick={save} className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">{tx(`حفظ (${selected.size})`, `Save (${selected.size})`)}</button>
      </>}
    >
      <input className={inputClass} placeholder={tx('بحث باسم الطفل...', 'Search child...')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-1.5">
        {list.map((c: Child) => {
          const other = c.class_id && c.class_id !== cls.id ? others.get(c.class_id) : null;
          return (
            <label key={c.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs hover:bg-slate-900/60">
              <span className="flex min-w-0 items-center gap-2">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4" />
                <span className="truncate font-semibold text-white">{c.full_name}</span>
              </span>
              {other && selected.has(c.id) && <span className="shrink-0 text-[10px] text-amber-300">{tx(`هيتنقل من ${other}`, `moves from ${other}`)}</span>}
              {other && !selected.has(c.id) && <span className="shrink-0 text-[10px] text-slate-500">{other}</span>}
            </label>
          );
        })}
        {list.length === 0 && <p className="py-6 text-center text-xs text-slate-500">{tx('لا يوجد أطفال', 'No children')}</p>}
      </div>
    </Modal>
  );
};

export const ClassesManager: React.FC<{ core: NurseryCore; onClose: () => void }> = ({ core, onClose }) => {
  const { isRTL, activeTenant, showToast } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [members, setMembers] = useState<NurseryClass | null>(null);
  const [busy, setBusy] = useState(false);

  const count = (id: string) => core.children.filter((c) => c.class_id === id).length;
  const reset = () => { setName(''); setTeacher(''); setEditId(null); };

  const save = async () => {
    const n = name.trim();
    if (!n || !activeTenant) { showToast(tx('اكتب اسم الفصل', 'Enter the class name')); return; }
    setBusy(true);
    const res = editId
      ? await supabase.from('nursery_classes').update({ name: n, teacher_name: teacher.trim() || null }).eq('id', editId)
      : await supabase.from('nursery_classes').insert({ tenant_id: activeTenant.id, name: n, teacher_name: teacher.trim() || null });
    setBusy(false);
    if (res.error) { showToast(res.error.code === '23505' ? tx('اسم الفصل موجود بالفعل', 'A class with this name already exists') : res.error.message); return; }
    reset();
    core.reload();
  };

  const remove = async (c: NurseryClass) => {
    const ok = await askConfirm({ message: tx(`حذف فصل "${c.name}"؟ الأطفال هيفضلوا في النظام من غير فصل.`, `Delete class "${c.name}"? Children stay, without a class.`), danger: true, confirmText: tx('حذف', 'Delete') });
    if (!ok) return;
    const { error } = await supabase.from('nursery_classes').delete().eq('id', c.id);
    if (error) { showToast(error.message); return; }
    core.reload();
  };

  if (members) return <MembersEditor cls={members} core={core} onBack={() => setMembers(null)} />;

  return (
    <Modal title={tx('الفصول', 'Classes')} onClose={onClose}>
      <div data-write="1" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label={tx('اسم الفصل', 'Class name')}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={tx('مثال: فصل العصافير', 'e.g. Sparrows')} />
        </Field>
        <Field label={tx('المدرسة / المسؤولة (اختياري)', 'Teacher (optional)')}>
          <input className={inputClass} value={teacher} onChange={(e) => setTeacher(e.target.value)} />
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <button disabled={busy || !name.trim()} onClick={save} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400">
            <Plus className="h-4 w-4" />{editId ? tx('حفظ التعديل', 'Save changes') : tx('إضافة فصل', 'Add class')}
          </button>
          {editId && <button onClick={reset} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">{tx('إلغاء', 'Cancel')}</button>}
        </div>
      </div>

      <div className="space-y-2">
        {core.classes.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{c.name}</p>
              <p className="text-[11px] text-slate-400">{tx(`${count(c.id)} طفل`, `${count(c.id)} child(ren)`)}{c.teacher_name ? ` • ${c.teacher_name}` : ''}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button data-write="1" onClick={() => setMembers(c)} className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20"><Users className="h-3.5 w-3.5" />{tx('الأطفال', 'Children')}</button>
              <button data-write="1" onClick={() => { setEditId(c.id); setName(c.name); setTeacher(c.teacher_name || ''); }} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /></button>
              <button data-write="1" onClick={() => remove(c)} className="rounded-lg border border-red-500/40 p-1.5 text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {core.classes.length === 0 && <p className="py-4 text-center text-xs text-slate-500">{tx('لا توجد فصول بعد. أضف أول فصل من الأعلى.', 'No classes yet. Add the first one above.')}</p>}
      </div>
    </Modal>
  );
};

export const ClassFilter: React.FC<{ core: NurseryCore; value: string; onChange: (v: string) => void }> = ({ core, value, onChange }) => {
  const { isRTL } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  if (core.classes.length === 0) return null;
  const chip = (id: string, label: string, n: number) => (
    <button key={id} onClick={() => onChange(id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${value === id ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
      {label} <span className="opacity-70">{n}</span>
    </button>
  );
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chip('all', tx('الكل', 'All'), core.children.length)}
      {core.classes.map((c) => chip(c.id, c.name, core.children.filter((x) => x.class_id === c.id).length))}
      {chip('none', tx('بدون فصل', 'No class'), core.children.filter((x) => !x.class_id).length)}
    </div>
  );
};

export const matchesClass = (c: Child, filter: string) => filter === 'all' || (filter === 'none' ? !c.class_id : c.class_id === filter);
