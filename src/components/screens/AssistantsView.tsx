import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, Trash2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { assistantOptions } from '../../lib/screenAccess';
import { Modal } from '../nursery/ui';

export const AssistantsView: React.FC = () => {
  const { isRTL, assistants, createAssistant, removeAssistant, showToast, systemKey, activeTenant, refreshAssistants, t } = useApp();
  const [permFor, setPermFor] = useState<(typeof assistants)[number] | null>(null);
  const [permSel, setPermSel] = useState<string[]>([]);
  const [permBusy, setPermBusy] = useState(false);
  const options = assistantOptions(systemKey);
  const openPerms = (a: (typeof assistants)[number]) => {
    setPermFor(a);
    setPermSel(a.allowedScreens ?? options);
  };
  const savePerms = async () => {
    if (!permFor || !activeTenant) return;
    setPermBusy(true);
    const allSelected = options.every((o) => permSel.includes(o));
    const { error } = await supabase.rpc('fn_set_assistant_screens', { p_tenant_id: activeTenant.id, p_user_id: permFor.id, p_screens: allSelected ? null : permSel });
    setPermBusy(false);
    if (error) { showToast(error.message); return; }
    await refreshAssistants();
    showToast(isRTL ? 'تم حفظ الصلاحيات' : 'Permissions saved');
    setPermFor(null);
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = async () => {
    setFormError('');
    if (!/^[A-Za-z0-9]+$/.test(username)) {
      setFormError(isRTL ? 'اسم اليوزر لازم يكون حروف وأرقام بس' : 'Username must be letters/numbers only');
      return;
    }
    if (password.length < 6) {
      setFormError(isRTL ? 'الباسورد لازم يكون 6 حروف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    const result = await createAssistant({ username, password, fullName: fullName || username });
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setUsername('');
    setFullName('');
    setPassword('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-[#0f172a]">
            {isRTL ? 'إدارة المساعدين' : 'Manage Assistants'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL
              ? 'أنشئ يوزرات لمساعديك، مش محتاجين تفعيل إيميل — بيسجلوا دخول باليوزر والباسورد على طول'
              : 'Create accounts for your assistants — no email confirmation needed, they log in with username and password right away'}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)} data-write="1"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          {isRTL ? 'إضافة مساعد' : 'Add Assistant'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 dark:border-slate-800 dark:bg-slate-950/60 light:border-[#e2e8f0] light:bg-white overflow-hidden">
        {assistants.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {isRTL ? 'لسه معملتش أي حساب مساعد' : 'You have not created any assistant accounts yet'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60 text-[11px] text-slate-500">
                <th className="text-left px-4 py-3 font-semibold">{isRTL ? 'الاسم' : 'Name'}</th>
                <th className="text-left px-4 py-3 font-semibold">{isRTL ? 'اليوزر' : 'Username'}</th>
                <th className="text-left px-4 py-3 font-semibold">{isRTL ? 'تاريخ الإنشاء' : 'Created'}</th>
                <th className="text-right px-4 py-3 font-semibold">{isRTL ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {assistants.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/40 text-xs">
                  <td className="px-4 py-3 font-semibold text-white">{a.fullName}</td>
                  <td className="px-4 py-3 text-slate-400">{a.username}</td>
                  <td className="px-4 py-3 text-slate-400">{a.createdAt}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openPerms(a)} data-write="1"
                      className="mx-1 inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      {isRTL ? 'الصلاحيات' : 'Permissions'}
                    </button>
                    <button
                      onClick={() => removeAssistant(a.id)} data-write="1"
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3 w-3" />
                      {isRTL ? 'إلغاء الوصول' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                {isRTL ? 'حساب مساعد جديد' : 'New Assistant Account'}
              </h3>
            </div>
            {formError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                {formError}
              </div>
            )}
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isRTL ? 'الاسم بالكامل' : 'Full name'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRTL ? 'اسم اليوزر (حروف وأرقام بس)' : 'Username (letters/numbers only)'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRTL ? 'الباسورد' : 'Password'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {submitting ? '...' : isRTL ? 'إنشاء' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      {permFor && (
        <Modal
          title={`${isRTL ? 'صلاحيات' : 'Permissions'} — ${permFor.fullName || permFor.username}`}
          onClose={() => setPermFor(null)}
          footer={<button disabled={permBusy} onClick={savePerms} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">{isRTL ? 'حفظ' : 'Save'}</button>}
        >
          <p className="text-[11px] text-slate-400">{isRTL ? 'اختار الشاشات اللي المساعد يقدر يفتحها. الصفحة الرئيسية والإعدادات الشخصية متاحة دايماً.' : 'Choose the screens this assistant can open. Home and personal settings are always available.'}</p>
          <div className="space-y-2">
            {options.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-xs text-white">
                <input type="checkbox" className="h-4 w-4 accent-blue-500" checked={permSel.includes(o)} onChange={() => setPermSel(permSel.includes(o) ? permSel.filter((x) => x !== o) : [...permSel, o])} />
                {t(`nav.${o}`)}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">{isRTL ? 'التحكم هنا في ظهور الشاشات للمساعد داخل التطبيق.' : 'This controls which screens the assistant sees in the app.'}</p>
        </Modal>
      )}
    </div>
  );
};
