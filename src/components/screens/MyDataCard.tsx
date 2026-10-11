import React, { useState } from 'react';
import { Database, Download, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cellXml = (v: unknown) => {
  if (v === null || v === undefined) return '<Cell><Data ss:Type="String"></Data></Cell>';
  if (typeof v === 'number' && isFinite(v)) return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
  const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return `<Cell><Data ss:Type="String">${esc(text)}</Data></Cell>`;
};

const buildWorkbook = (data: Record<string, any>) => {
  const sheets: string[] = [];
  Object.entries(data).forEach(([name, value]) => {
    let rows: any[] = [];
    if (Array.isArray(value)) rows = value;
    else if (value && typeof value === 'object') rows = [value];
    else rows = [{ value }];
    const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r || {}))));
    const header = keys.length ? `<Row>${keys.map((k) => `<Cell><Data ss:Type="String">${esc(k)}</Data></Cell>`).join('')}</Row>` : '';
    const body = rows.map((r) => `<Row>${keys.map((k) => cellXml(r?.[k])).join('')}</Row>`).join('');
    const safe = esc(name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31) || 'Sheet');
    sheets.push(`<Worksheet ss:Name="${safe}"><Table>${header}${body}</Table></Worksheet>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.join('')}</Workbook>`;
};

const download = (content: string, filename: string, type: string) => {
  const blob = new Blob(['﻿' + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const MyDataCard: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const { signOut } = useAuth();
  const [exporting, setExporting] = useState<'json' | 'xls' | null>(null);
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const word = isRTL ? 'حذف' : 'DELETE';

  const exportData = async (kind: 'json' | 'xls') => {
    setExporting(kind);
    const { data, error } = await supabase.rpc('fn_export_my_data');
    setExporting(null);
    if (error || !data) {
      showToast(error?.message || 'Error');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'json') {
      download(JSON.stringify(data, null, 2), `my-data-${stamp}.json`, 'application/json');
    } else {
      const { exported_at, ...tables } = data as Record<string, any>;
      download(buildWorkbook({ account: tables.account, ...tables }), `my-data-${stamp}.xml`, 'application/vnd.ms-excel');
    }
    showToast(isRTL ? 'تم تجهيز ملف بياناتك' : 'Your data file is ready');
  };

  const deleteAll = async () => {
    if (!password || phrase.trim().toUpperCase() !== word.toUpperCase()) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('delete-account', { body: { password } });
    setDeleting(false);
    if (error || data?.error) {
      const code = data?.error || error?.message || 'Error';
      showToast(code === 'wrong_password' ? (isRTL ? 'كلمة المرور غير صحيحة' : 'Wrong password') : code);
      return;
    }
    showToast(isRTL ? 'تم حذف كل بياناتك' : 'All your data has been deleted');
    await signOut();
  };

  return (
    <div className="glass-panel space-y-4 rounded-2xl border border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <Database className="h-4 w-4 text-blue-400" />
        <span>{isRTL ? 'بياناتي' : 'My Data'}</span>
      </h3>

      <div className="space-y-2">
        <p className="text-[11px] text-slate-400">
          {isRTL
            ? 'حمّل نسخة كاملة من بياناتك أنت بس (مشاريعك، المساعدين، المرضى، الحجوزات، الفواتير، المصروفات، المخزون).'
            : 'Download a full copy of your own data only (projects, assistants, patients, bookings, invoices, expenses, inventory).'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportData('xls')}
            disabled={exporting !== null}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isRTL ? 'تصدير Excel' : 'Export Excel'}
          </button>
          <button
            onClick={() => exportData('json')}
            disabled={exporting !== null}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
        <p className="flex items-center gap-2 text-xs font-bold text-red-400">
          <Trash2 className="h-4 w-4" />
          {isRTL ? 'حذف كل بياناتي نهائيًا' : 'Delete all my data permanently'}
        </p>
        <p className="text-[11px] leading-relaxed text-slate-400">
          {isRTL
            ? 'هيتمسح حسابك وكلمة مرورك وكل المساعدين وكلمات مرورهم وكل الشغل اللي اتسجّل (مرضى، حجوزات، فواتير، مخزون، مصروفات). مش هترجع تاني. لو عايز نسخة، صدّر بياناتك الأول.'
            : 'Your account and password, all assistants and their passwords, and all recorded work will be erased. This cannot be undone. Export your data first if you want a copy.'}
        </p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRTL ? 'كلمة المرور الحالية' : 'Current password'} autoComplete="current-password" className={inputClass} />
        <input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={isRTL ? `اكتب "${word}" للتأكيد` : `Type "${word}" to confirm`} className={inputClass} />
        <button
          onClick={deleteAll}
          disabled={deleting || !password || phrase.trim().toUpperCase() !== word.toUpperCase()}
          className="w-full rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-40"
        >
          {deleting ? '...' : isRTL ? 'احذف كل بياناتي' : 'Delete all my data'}
        </button>
      </div>
    </div>
  );
};
