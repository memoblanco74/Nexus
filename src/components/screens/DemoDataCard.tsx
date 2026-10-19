import React, { useState } from 'react';
import { FlaskConical, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { askConfirm } from '../../lib/dialog';
import { cardClass } from '../nursery/ui';

export const DemoDataCard: React.FC = () => {
  const { isRTL, activeTenant, showToast, isReadOnly } = useApp();
  const tx = (ar: string, en: string) => (isRTL ? ar : en);
  const [busy, setBusy] = useState(false);
  if (!activeTenant) return null;

  const run = async (fn: 'fn_seed_demo' | 'fn_clear_demo') => {
    if (fn === 'fn_clear_demo' && !(await askConfirm({ message: tx('هيتم حذف كل البيانات التجريبية فقط. بياناتك الحقيقية مش هتتأثر. متأكد؟', 'This deletes only the demo data. Your real data is untouched. Continue?'), danger: true, confirmText: tx('احذف', 'Delete') }))) return;
    setBusy(true);
    const { error } = await supabase.rpc(fn, { p_tenant_id: activeTenant.id });
    setBusy(false);
    if (error) { showToast(error.message.includes('DEMO_EXISTS') ? tx('البيانات التجريبية موجودة بالفعل', 'Demo data already exists') : error.message); return; }
    showToast(fn === 'fn_seed_demo' ? tx('تمت إضافة بيانات تجريبية', 'Demo data added') : tx('تم حذف البيانات التجريبية', 'Demo data deleted'));
    setTimeout(() => window.location.reload(), 700);
  };

  return (
    <div className={`${cardClass} space-y-3`}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-white"><FlaskConical className="h-4 w-4 text-pink-400" />{tx('بيانات تجريبية', 'Demo data')}</h3>
      <p className="text-xs text-slate-400">{tx('أضف بيانات وهمية صغيرة عشان تجرب النظام، وامسحها كلها بضغطة واحدة وقت ما تحب.', 'Add a small set of sample records to explore the app, and delete them all in one click any time.')}</p>
      <div className="flex flex-wrap gap-2" data-write="1">
        <button disabled={busy || isReadOnly} onClick={() => run('fn_seed_demo')} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-40">{tx('إضافة بيانات تجريبية', 'Add demo data')}</button>
        <button disabled={busy || isReadOnly} onClick={() => run('fn_clear_demo')} className="flex items-center gap-1.5 rounded-xl border border-red-500/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-40"><Trash2 className="h-4 w-4" />{tx('حذف البيانات التجريبية', 'Delete demo data')}</button>
      </div>
    </div>
  );
};
