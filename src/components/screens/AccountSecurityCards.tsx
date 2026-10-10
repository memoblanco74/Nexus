import React, { useEffect, useState } from 'react';
import { KeyRound, Search, UserCog } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { SaveButton } from '../ui/SaveButton';

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none';

export const ChangePasswordCard: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const { changeOwnPassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const submit = async (): Promise<boolean> => {
    if (next.length < 6) {
      showToast(isRTL ? 'كلمة المرور الجديدة لازم تكون 6 حروف على الأقل' : 'New password must be at least 6 characters');
      return false;
    }
    if (next !== confirm) {
      showToast(isRTL ? 'كلمة المرور الجديدة وتأكيدها غير متطابقين' : 'New password and confirmation do not match');
      return false;
    }
    const result = await changeOwnPassword(current, next);
    if (result.error === 'WRONG_CURRENT_PASSWORD') {
      showToast(isRTL ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
      return false;
    }
    if (result.error) {
      showToast(result.error);
      return false;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    showToast(isRTL ? 'تم تغيير كلمة المرور' : 'Password changed');
    return true;
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-blue-400" />
        <span>{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</span>
      </h3>
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder={isRTL ? 'كلمة المرور الحالية' : 'Current password'}
        autoComplete="current-password"
        className={inputClass}
      />
      <input
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder={isRTL ? 'كلمة المرور الجديدة' : 'New password'}
        autoComplete="new-password"
        className={inputClass}
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
        autoComplete="new-password"
        className={inputClass}
      />
      <SaveButton
        signature={`${current}|${next}|${confirm}`}
        baseline="||"
        onSave={submit}
        disabled={!current || !next || !confirm}
        label={isRTL ? 'حفظ كلمة المرور' : 'Save password'}
        className="px-4 py-2"
      />
    </form>
  );
};

interface ManagedUser {
  user_id: string;
  user_name: string | null;
  display_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  project_names: string | null;
}

export const UserManagementCard: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const { profile } = useAuth();
  const isAdmin = profile?.roleCode === 'super_admin';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const [all, setAll] = useState<ManagedUser[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [remote, setRemote] = useState<ManagedUser[] | null>(null);

  const fetchUsers = async (q: string) => {
    const { data, error } = await supabase.rpc('fn_search_manageable_users', { p_query: q });
    if (error) {
      showToast(error.message);
      return null;
    }
    return (data as ManagedUser[]) || [];
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUsers('').then((rows) => {
      if (cancelled) return;
      setLoading(false);
      if (rows) {
        setAll(rows);
        setTruncated(rows.length >= 100);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!truncated || !query.trim()) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const rows = await fetchUsers(query);
      if (!cancelled && rows) setRemote(rows);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, truncated]);

  const needle = query.trim().toLowerCase();
  const localMatches = needle
    ? all.filter((u) =>
        [u.user_name, u.display_name, u.user_email, u.user_phone, u.project_names].some((v) => (v || '').toLowerCase().includes(needle))
      )
    : all;
  const results = (truncated && needle && remote ? remote : localMatches).slice(0, 25);

  const reset = async (userId: string) => {
    if (newPassword.length < 6) {
      showToast(isRTL ? 'كلمة المرور لازم تكون 6 حروف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { userId, newPassword },
    });
    setBusy(false);
    if (error || data?.error) {
      showToast(data?.error || error?.message || 'Error');
      return;
    }
    setOpenId(null);
    setNewPassword('');
    showToast(isRTL ? 'تم تغيير كلمة المرور' : 'Password reset');
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <UserCog className="h-4 w-4 text-amber-400" />
        <span>{isAdmin ? (isRTL ? 'إدارة المؤسسين' : 'Manage Founders') : isRTL ? 'إدارة المساعدين' : 'Manage Assistants'}</span>
      </h3>
      <p className="text-[11px] text-slate-400">
        {isAdmin
          ? isRTL ? 'ابحث باسم المستخدم أو الاسم أو الإيميل أو الموبايل أو اسم المشروع، ثم أعد تعيين كلمة المرور.' : 'Search by username, name, email, phone or project name, then reset the password.'
          : isRTL ? 'ابحث باسم المستخدم أو الاسم، ثم أعد تعيين كلمة مرور المساعد.' : 'Search by username or name, then reset the assistant password.'}
      </p>
      <div className="relative">
        <Search className={`absolute top-2.5 h-4 w-4 text-slate-500 ${isRTL ? 'right-3' : 'left-3'}`} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isRTL ? 'بحث...' : 'Search...'}
          className={`${inputClass} ${isRTL ? 'pr-9' : 'pl-9'}`}
        />
      </div>

      <div className="divide-y divide-slate-800/60">
        {!loading && results.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-500">{isRTL ? 'لا توجد نتائج' : 'No results'}</p>
        )}
        {results.map((u) => (
          <div key={u.user_id} className="py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{u.display_name || u.user_name}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {[u.user_name, isAdmin ? u.user_email : null, u.project_names].filter(Boolean).join(' • ')}
                </p>
              </div>
              <button
                onClick={() => {
                  setOpenId(openId === u.user_id ? null : u.user_id);
                  setNewPassword('');
                }}
                className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
              >
                {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset password'}
              </button>
            </div>
            {openId === u.user_id && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isRTL ? 'كلمة المرور الجديدة' : 'New password'}
                  autoComplete="off"
                  className={inputClass}
                />
                <button
                  onClick={() => reset(u.user_id)}
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {isRTL ? 'تأكيد' : 'Confirm'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
