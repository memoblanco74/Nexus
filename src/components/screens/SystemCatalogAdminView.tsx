import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemTemplate } from '../../types';
import { Plus, Trash2, Pencil, Package } from 'lucide-react';

export const SystemCatalogAdminView: React.FC = () => {
  const {
    isRTL,
    systemTemplates,
    addSystemTemplate,
    updateSystemTemplate,
    deleteSystemTemplate,
    addSystemFeature,
    deleteSystemFeature,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    key: '',
    name: '',
    nameAr: '',
    icon: '📦',
    brief: '',
    briefAr: '',
    subscriptionPrice: '',
    subscriptionPeriod: 'monthly',
  });

  const [featureForm, setFeatureForm] = useState({ title: '', titleAr: '', description: '', descriptionAr: '', icon: '✨' });

  const openNew = () => {
    setEditing(null);
    setForm({ key: '', name: '', nameAr: '', icon: '📦', brief: '', briefAr: '', subscriptionPrice: '', subscriptionPeriod: 'monthly' });
    setIsFormOpen(true);
  };

  const openEdit = (t: SystemTemplate) => {
    setEditing(t);
    setForm({
      key: t.key,
      name: t.name,
      nameAr: t.nameAr,
      icon: t.icon,
      brief: t.brief,
      briefAr: t.briefAr,
      subscriptionPrice: String(t.subscriptionPrice),
      subscriptionPeriod: t.subscriptionPeriod,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      key: form.key.trim(),
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      icon: form.icon,
      brief: form.brief,
      briefAr: form.briefAr,
      subscriptionPrice: Number(form.subscriptionPrice) || 0,
      subscriptionPeriod: form.subscriptionPeriod,
      isActive: true,
    };
    if (editing) {
      await updateSystemTemplate(editing.id, payload);
    } else {
      await addSystemTemplate(payload);
    }
    setIsFormOpen(false);
  };

  const handleAddFeature = async (templateId: string) => {
    if (!featureForm.title.trim()) return;
    await addSystemFeature(templateId, featureForm);
    setFeatureForm({ title: '', titleAr: '', description: '', descriptionAr: '', icon: '✨' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            {isRTL ? 'كتالوج الأنظمة' : 'System Catalog'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL
              ? 'الأنظمة اللي هتظهر للفاوندرز يختاروا منها لما يعملوا حساب جديد'
              : 'The systems that founders can choose from when they create their first project'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          {isRTL ? 'إضافة نظام' : 'Add System'}
        </button>
      </div>

      <div className="grid gap-4">
        {systemTemplates.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-xl">
                  {t.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{t.name} / {t.nameAr}</p>
                  <p className="text-[11px] text-slate-500">
                    {t.subscriptionPrice} EGP / {t.subscriptionPeriod} • {t.features.length} {isRTL ? 'ميزة' : 'features'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-slate-900"
                >
                  {expandedId === t.id ? (isRTL ? 'إخفاء الميزات' : 'Hide features') : (isRTL ? 'إدارة الميزات' : 'Manage features')}
                </button>
                <button onClick={() => openEdit(t)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-900">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteSystemTemplate(t.id)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {expandedId === t.id && (
              <div className="mt-4 border-t border-slate-800/60 pt-4 space-y-3">
                {t.features.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-900/60 p-3">
                    <div>
                      <p className="text-xs font-bold text-white">{f.icon} {f.title} / {f.titleAr}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{f.description}</p>
                    </div>
                    <button onClick={() => deleteSystemFeature(f.id)} className="text-red-400 hover:text-red-300 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <input
                    value={featureForm.title}
                    onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                    placeholder={isRTL ? 'عنوان الميزة (إنجليزي)' : 'Feature title (English)'}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <input
                    value={featureForm.titleAr}
                    onChange={(e) => setFeatureForm({ ...featureForm, titleAr: e.target.value })}
                    placeholder="عنوان الميزة (عربي)"
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <input
                    value={featureForm.description}
                    onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                    placeholder={isRTL ? 'الشرح (إنجليزي)' : 'Description (English)'}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 col-span-2"
                  />
                  <input
                    value={featureForm.descriptionAr}
                    onChange={(e) => setFeatureForm({ ...featureForm, descriptionAr: e.target.value })}
                    placeholder="الشرح (عربي)"
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 col-span-2"
                  />
                  <input
                    value={featureForm.icon}
                    onChange={(e) => setFeatureForm({ ...featureForm, icon: e.target.value })}
                    placeholder="🎯"
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <button
                    onClick={() => handleAddFeature(t.id)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    {isRTL ? 'إضافة ميزة' : 'Add Feature'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {systemTemplates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
            <Package className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{isRTL ? 'لسه معملتش أي نظام' : 'No systems created yet'}</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2.5 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-1">
              {editing ? (isRTL ? 'تعديل النظام' : 'Edit System') : (isRTL ? 'نظام جديد' : 'New System')}
            </h3>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="key (e.g. clinic)"
              disabled={!!editing}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 disabled:opacity-50"
            />
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
            />
            <input
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              placeholder="الاسم (عربي)"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
            />
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="🏥"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
            />
            <textarea
              value={form.brief}
              onChange={(e) => setForm({ ...form, brief: e.target.value })}
              placeholder={isRTL ? 'الوصف (إنجليزي)' : 'Brief (English)'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
              rows={2}
            />
            <textarea
              value={form.briefAr}
              onChange={(e) => setForm({ ...form, briefAr: e.target.value })}
              placeholder="الوصف (عربي)"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={form.subscriptionPrice}
                onChange={(e) => setForm({ ...form, subscriptionPrice: e.target.value })}
                placeholder={isRTL ? 'السعر' : 'Price'}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
              />
              <select
                value={form.subscriptionPeriod}
                onChange={(e) => setForm({ ...form, subscriptionPeriod: e.target.value })}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
              >
                <option value="monthly">{isRTL ? 'شهري' : 'Monthly'}</option>
                <option value="yearly">{isRTL ? 'سنوي' : 'Yearly'}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {isRTL ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
