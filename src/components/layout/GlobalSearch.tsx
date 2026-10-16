import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { requestOpen } from '../../lib/pendingOpen';
import { supabase } from '../../lib/supabaseClient';
import type { ScreenId } from '../../types';

const normalize = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();

interface Hit {
  key: string;
  title: string;
  sub: string;
  screen: ScreenId;
  childId?: string;
}

interface Group {
  label: string;
  hits: Hit[];
}

export const GlobalSearch: React.FC = () => {
  const { isRTL, systemKey, activeTenant, patients, bookings, invoices, inventory, setScreen } = useApp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<Hit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNursery = systemKey === 'nursery';
  const needle = normalize(query);

  useEffect(() => {
    if (!isNursery || !activeTenant || needle.length < 1) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('nursery_children')
        .select('id, full_name, father_name, father_phone, mother_name, mother_phone, guardian_name, guardian_phone, status')
        .eq('tenant_id', activeTenant.id)
        .order('full_name')
        .limit(500);
      if (cancelled) return;
      const hits = ((data as any[]) || [])
        .filter((c) =>
          [c.full_name, c.father_name, c.mother_name, c.guardian_name, c.father_phone, c.mother_phone, c.guardian_phone].some((v) =>
            normalize(v).includes(needle)
          )
        )
        .slice(0, 8)
        .map((c) => ({
          key: `c-${c.id}`,
          title: c.full_name,
          sub: [c.mother_name || c.father_name || c.guardian_name, c.mother_phone || c.father_phone || c.guardian_phone].filter(Boolean).join(' • '),
          screen: 'patients' as ScreenId,
          childId: c.id as string,
        }));
      setRemote(hits);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needle, isNursery, activeTenant?.id]);

  const groups: Group[] = useMemo(() => {
    if (!needle) return [];
    const has = (...vals: unknown[]) => vals.some((v) => normalize(v).includes(needle));
    if (isNursery) {
      return remote.length ? [{ label: isRTL ? 'الأطفال' : 'Children', hits: remote }] : [];
    }
    const out: Group[] = [];
    const p = patients
      .filter((x) => has(x.nameEn, x.nameAr, x.phone, x.nationalId, x.email))
      .slice(0, 6)
      .map((x) => ({ key: `p-${x.id}`, title: isRTL ? x.nameAr || x.nameEn : x.nameEn, sub: x.phone || x.nationalId || '', screen: 'patients' as ScreenId }));
    if (p.length) out.push({ label: isRTL ? 'المرضى' : 'Patients', hits: p });
    const b = bookings
      .filter((x) => has(x.bookingNumber, x.patientName, x.patientNameAr, x.doctorName, x.doctorNameAr, x.department))
      .slice(0, 6)
      .map((x) => ({
        key: `b-${x.id}`,
        title: isRTL ? x.patientNameAr || x.patientName : x.patientName,
        sub: [x.bookingNumber, x.date, x.time].filter(Boolean).join(' • '),
        screen: 'bookings' as ScreenId,
      }));
    if (b.length) out.push({ label: isRTL ? 'الحجوزات' : 'Bookings', hits: b });
    const inv = invoices
      .filter((x) => has(x.invoiceNumber, x.clientName, x.clientNameAr))
      .slice(0, 6)
      .map((x) => ({
        key: `i-${x.id}`,
        title: isRTL ? x.clientNameAr || x.clientName : x.clientName,
        sub: [x.invoiceNumber, x.date].filter(Boolean).join(' • '),
        screen: 'accounting' as ScreenId,
      }));
    if (inv.length) out.push({ label: isRTL ? 'الفواتير' : 'Invoices', hits: inv });
    const st = inventory
      .filter((x) => has(x.nameEn, x.nameAr, x.sku, x.category, x.categoryAr, x.supplier))
      .slice(0, 6)
      .map((x) => ({ key: `s-${x.id}`, title: isRTL ? x.nameAr || x.nameEn : x.nameEn, sub: x.sku || '', screen: 'inventory' as ScreenId }));
    if (st.length) out.push({ label: isRTL ? 'المخزون' : 'Stock', hits: st });
    return out;
  }, [needle, isNursery, remote, patients, bookings, invoices, inventory, isRTL]);

  const total = groups.reduce((s, g) => s + g.hits.length, 0);

  const choose = (hit: Hit) => {
    setScreen(hit.screen);
    if (hit.childId) setTimeout(() => requestOpen('child', hit.childId!), 0);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const placeholder = isNursery
    ? isRTL ? 'بحث باسم الطفل أو ولي الأمر أو الموبايل...' : 'Search child, parent or phone...'
    : isRTL ? 'بحث في المرضى، الحجوزات، الفواتير، الأصناف...' : 'Search patients, bookings, invoices, stock...';

  return (
    <div className="relative w-full">
      <Search className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-slate-400`} />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && total > 0) choose(groups[0].hits[0]);
        }}
        placeholder={placeholder}
        className={`w-full rounded-full border border-slate-800/80 bg-slate-900/60 py-1.5 ${
          isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'
        } text-xs text-slate-200 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-900/70 light:border-[#cbd5e1] light:bg-[#f1f5f9] light:text-[#0f172a] light:placeholder-[#64748b]`}
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
          className={`absolute top-2 ${isRTL ? 'left-2.5' : 'right-2.5'} text-slate-400 hover:text-white`}
          aria-label="clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && needle &&
        createPortal(
          <div className="fixed inset-0 z-[25]" onPointerDown={() => setOpen(false)} />,
          document.body
        )}
      {open && needle && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-1.5 text-xs shadow-2xl dark:border-slate-800 dark:bg-slate-900 light:border-[#cbd5e1] light:bg-white">
          {total === 0 ? (
            <p className="py-5 text-center text-slate-500">{isRTL ? 'لا توجد نتائج' : 'No results'}</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="py-1">
                <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{g.label}</p>
                {g.hits.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => choose(h)}
                    className="flex w-full flex-col rounded-lg px-2.5 py-2 text-start hover:bg-slate-800"
                  >
                    <span className="truncate font-semibold text-slate-100">{h.title}</span>
                    {h.sub && <span className="truncate text-[11px] text-slate-400">{h.sub}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
