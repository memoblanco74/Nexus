import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, FileText, Check } from 'lucide-react';
import { InvoiceItem } from '../../types';

export const CreateInvoiceModal: React.FC = () => {
  const { isCreateInvoiceOpen, setIsCreateInvoiceOpen, addInvoice, isRTL, t } = useApp();

  const [clientName, setClientName] = useState('');
  const [clientNameAr, setClientNameAr] = useState('');
  const [dueDate, setDueDate] = useState('2024-10-15');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Clinical Consultation & Diagnostics', quantity: 1, unitPrice: 250, total: 250 },
  ]);

  if (!isCreateInvoiceOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: 'Medical Service / Lab Test', quantity: 1, unitPrice: 150, total: 150 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      })
    );
  };

  const totalAmount = items.reduce((sum, itm) => sum + (itm.total || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    addInvoice({
      invoiceNumber: `INV-2024-${Math.floor(100 + Math.random() * 900)}`,
      clientName,
      clientNameAr: clientNameAr || clientName,
      amount: totalAmount,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dueDate,
      items,
    });

    setIsCreateInvoiceOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {isRTL ? 'إنشاء فاتورة طبية جديدة' : 'Create New Medical Invoice'}
            </h3>
          </div>
          <button
            onClick={() => setIsCreateInvoiceOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {isRTL ? 'اسم العميل / المريض (EN)' : 'Client / Company Name'}
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Pharma LLC"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {isRTL ? 'اسم العميل (عربي)' : 'Arabic Name (Optional)'}
              </label>
              <input
                type="text"
                value={clientNameAr}
                onChange={(e) => setClientNameAr(e.target.value)}
                placeholder="شركة أبيكس للأدوية"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{isRTL ? 'بنود الفاتورة والخدمات' : 'Service Items & Charges'}</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                + {isRTL ? 'إضافة بند' : 'Add Item'}
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    placeholder="Item description"
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                    className="w-14 rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-xs text-white focus:border-blue-500 focus:outline-none text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                    className="w-20 rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-xs text-white focus:border-blue-500 focus:outline-none text-right"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400">{isRTL ? 'الإجمالي الكلي:' : 'Total Amount:'}</span>
              <p className="text-lg font-bold text-emerald-400">${totalAmount.toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateInvoiceOpen(false)}
                className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                {isRTL ? 'إصدار الفاتورة' : 'Issue Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddPatientModal: React.FC = () => {
  const { isAddPatientOpen, setIsAddPatientOpen, addPatient, isRTL, t } = useApp();

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [phone, setPhone] = useState('+966 5');
  const [nationalId, setNationalId] = useState('10');
  const [bloodType, setBloodType] = useState('O+');
  const [doctor, setDoctor] = useState('Dr. Ahmed Ali');
  const [condition, setCondition] = useState('Routine Checkup & Diagnostics');

  if (!isAddPatientOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    addPatient({
      nameEn,
      nameAr: nameAr || nameEn,
      age: Number(age),
      gender,
      phone,
      email: `${nameEn.toLowerCase().replace(/\s+/g, '.')}@patient.med`,
      bloodType,
      nationalId,
      lastVisit: new Date().toISOString().split('T')[0],
      doctor,
      condition,
      status: 'Active',
    });

    setIsAddPatientOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'تسجيل ملف مريض جديد' : 'Register New Patient EMR'}
          </h3>
          <button
            onClick={() => setIsAddPatientOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Name (English)</label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Tariq Mansoor"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">الاسم بالعربية</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="طارق المنصور"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Blood Group</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">National ID</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Primary Doctor</label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Dr. Ahmed Ali">Dr. Ahmed Ali (Surgery & Orthopedics)</option>
              <option value="Dr. Mona Salem">Dr. Mona Salem (Dental Clinic)</option>
              <option value="Dr. Fahad Al-Otaibi">Dr. Fahad Al-Otaibi (Cardiology)</option>
              <option value="Dr. Sarah Smith">Dr. Sarah Smith (Pediatrics)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddPatientOpen(false)}
              className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {isRTL ? 'حفظ وتسجيل المريض' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
