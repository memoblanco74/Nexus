import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SaveButtonProps {
  signature: string;
  onSave: () => Promise<boolean | void> | boolean | void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ signature, onSave, label, disabled, className = '' }) => {
  const { isRTL } = useApp();
  const [busy, setBusy] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [savedSig, setSavedSig] = useState<string | null>(null);
  const sigRef = useRef(signature);
  sigRef.current = signature;

  useEffect(() => {
    if (saveCount > 0) setSavedSig(sigRef.current);
  }, [saveCount]);

  const isSaved = savedSig !== null && savedSig === signature;

  const run = async () => {
    if (busy || isSaved) return;
    setBusy(true);
    let ok: boolean | void = true;
    try {
      ok = await onSave();
    } catch {
      ok = false;
    }
    setBusy(false);
    if (ok !== false) setSaveCount((c) => c + 1);
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || isSaved || disabled}
      className={`flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition ${
        isSaved ? 'bg-emerald-700/40 text-emerald-300 opacity-70 cursor-default' : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50'
      } ${className}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isSaved ? <Check className="h-3.5 w-3.5" /> : null}
      <span>{isSaved ? (isRTL ? 'تم الحفظ' : 'Saved') : label || (isRTL ? 'حفظ' : 'Save')}</span>
    </button>
  );
};
