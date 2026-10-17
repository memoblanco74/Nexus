import React from 'react';
import { Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const ViewAsBanner: React.FC = () => {
  const { viewAs, stopViewAs } = useAuth();
  const { isRTL } = useApp();
  if (!viewAs) return null;
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950">
      <span className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">{isRTL ? `وضع المعاينة (قراءة فقط) — ${viewAs.name}` : `View mode (read-only) — ${viewAs.name}`}</span>
      </span>
      <button onClick={() => stopViewAs()} className="shrink-0 rounded-lg bg-slate-950 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-slate-800">{isRTL ? 'خروج' : 'Exit'}</button>
    </div>
  );
};
