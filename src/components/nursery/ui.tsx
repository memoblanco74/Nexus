import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none';

export const labelClass = 'block text-[11px] font-semibold text-slate-400 mb-1';

export const cardClass = 'glass-panel rounded-2xl border border-slate-800 p-4 sm:p-5';

export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}> = ({ title, onClose, children, wide, footer }) =>
  createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`glass-panel flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-slate-800 bg-slate-950 sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );

export const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

export const Badge: React.FC<{ tone: 'ok' | 'warn' | 'bad' | 'muted'; children: React.ReactNode }> = ({ tone, children }) => {
  const map = {
    ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warn: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bad: 'bg-red-500/15 text-red-400 border-red-500/30',
    muted: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[tone]}`}>{children}</span>;
};
