import React, { useState, useEffect, useCallback } from 'react';
import { Percent, Settings2, ShieldCheck, Lock, KeyRound, Trash2, Ban, Check } from 'lucide-react';
import { askConfirm } from '../../lib/dialog';
import { supabase } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';
import { SaveButton } from '../ui/SaveButton';
import { PaymentInfoEditor } from './PaymentInfoParts';

interface AdminRow { id: string; username: string; email: string; full_name: string; is_active: boolean; is_owner: boolean; is_me: boolean; }

const ERR_AR: Record<string, string> = {
  username_taken: 'اسم المستخدم مستخدم بالفعل', invalid_username: 'اسم المستخدم حروف وأرقام إنجليزية فقط (3-30)',
  weak_password: 'كلمة المرور 6 أحرف على الأقل', owner_protected: 'هذا الحساب أساسي ومحمي', cannot_self: 'لا يمكنك تنفيذ ذلك على حسابك',
  in_use_deactivate_instead: 'لا يمكن الحذف لارتباطه ببيانات، استخدم الإيقاف بدلاً منه', use_own_password_form: 'غيّر كلمة مرورك من إعداداتي',
};

const AdminsCard: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const field = 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500';

  const call = async (body: any) => {
    const { data, error } = await supabase.functions.invoke('manage-admins', { body });
    let code = (data as any)?.error as string | undefined;
    if (error && !code) {
      try { code = (await (error as any).context?.json())?.error; } catch { code = error.message; }
    }
    if (code) { showToast(isRTL ? (ERR_AR[code] || code) : code); return null; }
    return data as any;
  };

  const load = useCallback(async () => {
    const d = await call({ action: 'list' });
    if (d?.admins) setRows(d.admins);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    const d = await call({ action: 'create', username: username.trim(), fullName: fullName.trim(), password });
    setBusy(false);
    if (d?.ok) { setUsername(''); setFullName(''); setPassword(''); showToast(isRTL ? 'تم إنشاء المدير' : 'Admin created'); load(); }
  };

  return (
    <div className="glass-panel space-y-4 rounded-2xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white dark:text-white light:text-[#0f172a]">
        <ShieldCheck className="h-4 w-4 text-blue-400" />
        {isRTL ? 'مديرو النظام (Super Admin)' : 'System admins (Super Admin)'}
      </h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-100">{r.full_name} <span dir="ltr" className="font-normal text-slate-400">@{r.username}</span></p>
                <p className="text-[11px] text-slate-400">
                  {r.is_owner ? (isRTL ? 'الحساب الأساسي — محمي' : 'Primary account — protected') : r.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'موقوف' : 'Suspended')}
                  {r.is_me ? (isRTL ? ' (أنت)' : ' (you)') : ''}
                </p>
              </div>
              {r.is_owner && <Lock className="h-4 w-4 shrink-0 text-amber-400" />}
              {!r.is_owner && !r.is_me && (
                <div className="flex shrink-0 gap-1.5">
                  <button title={isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset password'} onClick={() => { setResetId(resetId === r.id ? null : r.id); setNewPass(''); }} className="rounded-lg bg-blue-600/20 p-1.5 text-blue-300 hover:bg-blue-600/30"><KeyRound className="h-3.5 w-3.5" /></button>
                  <button title={r.is_active ? (isRTL ? 'إيقاف' : 'Suspend') : (isRTL ? 'تفعيل' : 'Activate')} onClick={async () => { if ((await call({ action: 'set_active', userId: r.id, active: !r.is_active }))?.ok) load(); }} className="rounded-lg bg-amber-500/20 p-1.5 text-amber-300 hover:bg-amber-500/30">{r.is_active ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}</button>
                  <button title={isRTL ? 'حذف' : 'Delete'} onClick={async () => { if (!(await askConfirm({ danger: true, message: isRTL ? `حذف ${r.username} نهائياً؟` : `Delete ${r.username} permanently?` }))) return; if ((await call({ action: 'delete', userId: r.id }))?.ok) load(); }} className="rounded-lg bg-red-500/20 p-1.5 text-red-300 hover:bg-red-500/30"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
            {resetId === r.id && (
              <div className="flex gap-2">
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder={isRTL ? 'كلمة المرور الجديدة' : 'New password'} className={field} />
                <button onClick={async () => { if ((await call({ action: 'reset_password', userId: r.id, newPassword: newPass }))?.ok) { setResetId(null); setNewPass(''); showToast(isRTL ? 'تم تغيير كلمة المرور' : 'Password changed'); } }} className="shrink-0 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-500">{isRTL ? 'حفظ' : 'Save'}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-xl border border-slate-800 p-3">
        <p className="text-[11px] font-semibold text-slate-300">{isRTL ? 'إضافة مدير جديد' : 'Add a new admin'}</p>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isRTL ? 'الاسم' : 'Full name'} className={field} />
        <input dir="ltr" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9]/g, ''))} placeholder={isRTL ? 'اسم المستخدم (إنجليزي)' : 'Username'} className={field} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRTL ? 'كلمة المرور (6 أحرف على الأقل)' : 'Password (min 6)'} className={field} />
        <button onClick={create} disabled={busy || username.length < 3 || password.length < 6} className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{isRTL ? 'إنشاء مدير' : 'Create admin'}</button>
      </div>
    </div>
  );
};

export const PlatformSettingsView: React.FC = () => {
  const { isRTL, t, showToast, defaultDiscount, setDefaultDiscount, freePeriodDays, setFreePeriodDays } = useApp();
  const [freeDaysInput, setFreeDaysInput] = useState<string>('');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-white sm:text-2xl">
          <Settings2 className="h-5 w-5 text-blue-400" />
          {isRTL ? 'إعدادات المنصة' : 'Platform Settings'}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isRTL ? 'الخصم الافتراضي، بيانات الدفع للفاوندرز، وفترة الاستخدام المجاني' : 'Default discount, founder payment details and free usage period'}
        </p>
      </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Percent className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-[#0f172a]">
                {t('super_admin.default_discount')}
              </h3>
            </div>
            <p className="mt-2.5 text-xs text-slate-400">
              {isRTL
                ? 'نسبة الخصم التلقائية المطبقة على عقود المستأجرين الجدد وتجديدات الباقات.'
                : 'Global baseline discount applied to newly provisioned clinic contracts.'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {['10%', '15%', '20%', '25%'].map((disc) => (
              <button
                key={disc}
                onClick={() => {
                  setDefaultDiscount(disc);
                  showToast(isRTL ? `تم تعيين الخصم الافتراضي: ${disc}` : `Default discount set to ${disc}`);
                }}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                  defaultDiscount === disc
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>
        </div>

      <PaymentInfoEditor />

      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-[#0f172a]">
              {isRTL ? 'فترة الاستخدام المجاني' : 'Free Usage Period'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {freePeriodDays > 0
                ? isRTL
                  ? `المحفوظ حالياً: كل مشترك يحصل على ${freePeriodDays} يوم مجاناً تبدأ من تاريخ اشتراكه في مشروعه.`
                  : `Every subscriber gets ${freePeriodDays} free days starting from their own subscription date.`
                : isRTL
                ? 'غير مفعّلة. حدد عدد الأيام ليحصل كل مشترك على فترة مجانية تبدأ من تاريخ اشتراكه.'
                : 'Not active. Set a number of days so each subscriber gets a free period from their own subscription date.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setFreeDaysInput(String(d))}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  freeDaysInput === String(d)
                    ? 'bg-blue-600 text-white'
                    : freePeriodDays === d && freeDaysInput === ''
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {d} {isRTL ? 'يوم' : 'days'}
              </button>
            ))}
            <input
              type="text"
              inputMode="numeric"
              value={freeDaysInput}
              onChange={(e) => setFreeDaysInput(e.target.value)}
              placeholder={isRTL ? 'عدد الأيام' : 'Days'}
              className="w-24 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
            <SaveButton
              signature={freeDaysInput}
              baseline=""
              label={isRTL ? 'حفظ' : 'Save'}
              className="px-3 py-2"
              onSave={async () => {
                const digits = freeDaysInput
                  .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
                  .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  .replace(/[^0-9]/g, '');
                if (!digits) {
                  showToast(isRTL ? 'اكتب عدد الأيام أولاً' : 'Enter the number of days first');
                  return false;
                }
                const ok = await setFreePeriodDays(Number(digits));
                if (ok) setFreeDaysInput('');
                return ok;
              }}
            />
            {freePeriodDays > 0 && (
              <button
                onClick={() => setFreePeriodDays(0)}
                className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
              >
                {isRTL ? 'إلغاء' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      <AdminsCard />
    </div>
  );
};
