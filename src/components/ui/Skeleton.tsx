import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`nx-shimmer rounded-lg ${className}`} />
);

export const SkeletonRow: React.FC = () => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 p-3">
    <Skeleton className="h-12 w-12 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-5 w-14" />
  </div>
);

export const SkeletonList: React.FC<{ rows?: number; grid?: boolean }> = ({ rows = 5, grid }) => (
  <div className={grid ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-2'} aria-busy="true">
    {Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}
  </div>
);

export const SkeletonTableRows: React.FC<{ rows?: number; cols: number }> = ({ rows = 6, cols }) => (
  <>
    {Array.from({ length: rows }, (_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }, (_, c) => (
          <td key={c} className="px-3 py-3"><Skeleton className={`h-3.5 ${c === 0 ? 'w-32' : 'w-16'}`} /></td>
        ))}
      </tr>
    ))}
  </>
);
