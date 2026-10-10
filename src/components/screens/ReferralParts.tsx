import React, { useEffect, useState } from 'react';
import { Copy, Gift, Ticket } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none';

export const ReferralPromptStep: React.FC = () => {
  const { isRTL, referral, redeemReferral, skipReferralPrompt } = useApp();
  const { signOut } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    await redeemReferral(code);
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f17] px-4 text-slate-100">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <Ticket className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-white">{isRTL ? 'معاك كود خصم؟' : 'Do you have a discount code?'}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            {isRTL
              ? `لو حد بعتلك كود دعوة اكتبه دلوقتي وهتاخد خصم ${referral?.defaultPercent || ''}% ويتاخد نفس الخصم لصاحب الكود. تقدر كمان تضيفه بعدين من الإعدادات، بس مرة واحدة فقط.`
              : `If someone sent you an invite code, enter it now to get ${referral?.defaultPercent || ''}% off, and the same discount goes to the person who invited you. You can also add it later from Settings, once only.`}
          </p>
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="NXXXXXXXX"
          dir="ltr"
          className={`${inputClass} text-center font-mono tracking-widest`}
        />
        <button
          onClick={apply}
          disabled={busy || !code.trim()}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isRTL ? 'تفعيل الكود' : 'Apply code'}
        </button>
        <button onClick={skipReferralPrompt} className="w-full text-xs text-slate-400 underline underline-offset-4 hover:text-slate-200">
          {isRTL ? 'تخطي' : 'Skip'}
        </button>
        <button onClick={() => signOut()} className="block w-full text-[11px] text-slate-600 hover:text-red-400">
          {isRTL ? 'تسجيل الخروج' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};

export const ReferralCard: React.FC = () => {
  const { isRTL, referral, redeemReferral, showToast, activeTenant, money } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  if (!referral) return null;

  const copy = async () => {
    if (!referral.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      showToast(isRTL ? 'تم نسخ الكود' : 'Code copied');
    } catch {
      showToast(referral.code);
    }
  };

  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const ok = await redeemReferral(code);
    setBusy(false);
    if (ok) setCode('');
  };

  const price = activeTenant?.mrr || 0;
  const final = price * (1 - referral.totalPercent / 100);

  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <Gift className="h-4 w-4 text-emerald-400" />
        <span>{isRTL ? 'الخصومات والدعوات' : 'Discounts & Invites'}</span>
      </h3>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="text-[11px] text-slate-400">
          {isRTL
            ? `كودك الخاص: ابعته لأي مشترك جديد، لما يستخدمه انت وهو تاخدوا خصم ${referral.defaultPercent}%.`
            : `Your code: send it to a new subscriber; when they use it, you both get ${referral.defaultPercent}% off.`}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span dir="ltr" className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-emerald-300">
            {referral.code || '-'}
          </span>
          <button onClick={copy} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-900/60 p-2.5">
          <p className="text-sm font-extrabold text-white">{referral.referralsCount}</p>
          <p className="text-[10px] text-slate-400">{isRTL ? 'دعوات ناجحة' : 'Invites used'}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-2.5">
          <p className="text-sm font-extrabold text-white">{referral.ownPercent + referral.earnedPercent}%</p>
          <p className="text-[10px] text-slate-400">{isRTL ? 'إجمالي خصمك' : 'Your discount'}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-2.5">
          <p className="text-sm font-extrabold text-emerald-400">{price ? money(final) : '-'}</p>
          <p className="text-[10px] text-slate-400">{isRTL ? 'سعر اشتراكك بعد الخصم' : 'Price after discount'}</p>
        </div>
      </div>

      {referral.redeemed ? (
        <p className="rounded-xl bg-emerald-500/10 p-3 text-[11px] text-emerald-300">
          {isRTL
            ? `استخدمت الكود ${referral.redeemedCode} وحصلت على خصم ${referral.ownPercent}%. لا يمكن استخدام كود آخر.`
            : `You used code ${referral.redeemedCode} and got ${referral.ownPercent}% off. No other code can be used.`}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400">
            {isRTL ? 'معاك كود دعوة من مشترك؟ اكتبه هنا، مرة واحدة فقط.' : 'Have an invite code? Enter it here, once only.'}
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              dir="ltr"
              placeholder="NXXXXXXXX"
              className={`${inputClass} font-mono tracking-widest`}
            />
            <button
              onClick={apply}
              disabled={busy || !code.trim()}
              className="shrink-0 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isRTL ? 'تفعيل' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface OverviewRow {
  user_id: string;
  user_name: string | null;
  email: string | null;
  own_code: string | null;
  used_code: string | null;
  own_percent: number;
  earned_percent: number;
  referrals_count: number;
  total_percent: number;
}

export const ReferralOverviewCard: React.FC = () => {
  const { isRTL } = useApp();
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.rpc('fn_referral_overview').then(({ data }) => setRows((data as OverviewRow[]) || []));
  }, []);

  const needle = q.trim().toLowerCase();
  const list = rows.filter(
    (r) =>
      !needle ||
      [r.user_name, r.email, r.own_code, r.used_code].some((v) => (v || '').toLowerCase().includes(needle))
  );

  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-slate-800 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Gift className="h-4 w-4 text-emerald-400" />
          <span>{isRTL ? 'خصومات الدعوات للمشتركين' : 'Referral discounts'}</span>
        </h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isRTL ? 'بحث بالاسم أو الكود...' : 'Search name or code...'}
          className={`${inputClass} sm:max-w-xs`}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500">
              <th className="px-2 py-2 text-start">{isRTL ? 'المشترك' : 'Founder'}</th>
              <th className="px-2 py-2 text-start">{isRTL ? 'كوده' : 'Own code'}</th>
              <th className="px-2 py-2 text-start">{isRTL ? 'الكود المستخدم' : 'Used code'}</th>
              <th className="px-2 py-2 text-start">{isRTL ? 'دعوات' : 'Invites'}</th>
              <th className="px-2 py-2 text-start">{isRTL ? 'إجمالي الخصم' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {list.map((r) => (
              <tr key={r.user_id}>
                <td className="px-2 py-2">
                  <p className="font-semibold text-white">{r.user_name}</p>
                  <p className="text-[10px] text-slate-500">{r.email}</p>
                </td>
                <td className="px-2 py-2 font-mono text-slate-300" dir="ltr">{r.own_code || '-'}</td>
                <td className="px-2 py-2 font-mono text-slate-300" dir="ltr">{r.used_code || '-'}</td>
                <td className="px-2 py-2 text-slate-300">{r.referrals_count}</td>
                <td className="px-2 py-2 font-bold text-emerald-400">{Number(r.total_percent)}%</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">{isRTL ? 'لا توجد نتائج' : 'No results'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
