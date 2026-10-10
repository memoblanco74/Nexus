import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SaveButtonProps {
  signature: string;
  baseline: string;
  onSave: () => Promise<boolean | void> | boolean | void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ signature, baseline, onSave, label, disabled, className = '' }) => {
  const { isRTL } = useApp();
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const clean = signature === baseline;

  useEffect(() => {
    if (!clean) setJustSaved(false);
  }, [clean]);

  const run = async () => {
    if (busy || clean) return;
    setBusy(true);
    let ok: boolean | void = true;
    try {
      ok = await onSave();
    } catch {
      ok = false;
    }
    setBusy(false);
    if (ok !== false) setJustSaved(true);
  };

  const showSaved = clean && justSaved;

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || clean || disabled}
      className={`flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition ${
        showSaved
          ? 'bg-emerald-700/30 text-emerald-300 cursor-default'
          : clean
          ? 'bg-slate-800 text-slate-500 cursor-default'
          : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50'
      } ${className}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : showSaved ? <Check className="h-3.5 w-3.5" /> : null}
      <span>{showSaved ? (isRTL ? 'تم الحفظ' : 'Saved') : label || (isRTL ? 'حفظ' : 'Save')}</span>
    </button>
  );
};
