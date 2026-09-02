import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Clock, Stethoscope, User } from 'lucide-react';

export const NewBookingModal: React.FC = () => {
  const {
    isNewBookingOpen,
    setIsNewBookingOpen,
    patients,
    addBooking,
    isRTL,
    t,
  } = useApp();

  const [selectedPatientId, setSelectedPatientId] = useState(
    patients[0]?.id || ''
  );
  const [doctorName, setDoctorName] = useState('Dr. Ahmed Ali');
  const [department, setDepartment] = useState('Surgery & Orthopedics');
  const [time, setTime] = useState('11:00 AM');
  const [type, setType] = useState<any>('General Checkup');

  if (!isNewBookingOpen) return null;

  const currentPatient =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    addBooking({
      bookingNumber: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: currentPatient.nameEn,
      patientNameAr: currentPatient.nameAr,
      doctorName,
      doctorNameAr: doctorName === 'Dr. Ahmed Ali' ? 'د. أحمد علي' : doctorName,
      department,
      departmentAr: department,
      time,
      date: 'Today',
      status: 'confirmed',
      type,
    });

    setIsNewBookingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {isRTL ? 'حجز موعد سريري جديد' : 'New Clinical Appointment'}
            </h3>
          </div>
          <button
            onClick={() => setIsNewBookingOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} ({p.nationalId}) - {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Surgery & Orthopedics">Surgery & Orthopedics</option>
                <option value="Dental Clinic">Dental Clinic</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Radiology & Imaging">Radiology</option>
                <option value="General OPD">General OPD</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Time Slot</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:15 AM">11:15 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Attending Physician</label>
            <select
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Dr. Ahmed Ali">Dr. Ahmed Ali (Senior Consultant)</option>
              <option value="Dr. Mona Salem">Dr. Mona Salem (Dental Specialist)</option>
              <option value="Dr. Fahad Al-Otaibi">Dr. Fahad Al-Otaibi (Cardiologist)</option>
              <option value="Dr. Sarah Smith">Dr. Sarah Smith (Pediatrics)</option>
            </select>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300">
            {isRTL
              ? '⚡ سيتم استقطاع المستلزمات الطبية تلقائياً وتحديث رصيد المخزون عند تأكيد الموعد.'
              : '⚡ Confirming this booking will automatically trigger inventory auto-deductions.'}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewBookingOpen(false)}
              className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {isRTL ? 'تأكيد الحجز والاستقطاع' : 'Confirm & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdjustStockModal: React.FC = () => {
  const {
    isAdjustStockOpen,
    setIsAdjustStockOpen,
    selectedStockItem,
    adjustStock,
    language,
    isRTL,
    t,
  } = useApp();

  const [newStock, setNewStock] = useState<number>(
    selectedStockItem?.stockLevel || 50
  );
  const [reason, setReason] = useState('Manual Stock Count Verification');

  if (!isAdjustStockOpen || !selectedStockItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock(selectedStockItem.id, Number(newStock), reason);
    setIsAdjustStockOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">
            {isRTL ? 'تعديل رصيد المخزون' : 'Adjust Inventory Stock'}
          </h3>
          <button
            onClick={() => setIsAdjustStockOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
            <p className="text-xs font-bold text-white">
              {language === 'ar' ? selectedStockItem.nameAr : selectedStockItem.nameEn}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
              <span>SKU: {selectedStockItem.sku}</span>
              <span>•</span>
              <span>Min Req: {selectedStockItem.minReq} {selectedStockItem.unit}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {isRTL ? 'الرصيد الفعلي الجديد' : 'New Current Stock Level'}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewStock((prev) => Math.max(0, prev - 10))}
                className="h-9 w-9 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setNewStock((prev) => Math.max(0, prev - 1))}
                className="h-9 w-9 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                -1
              </button>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 p-2 text-center text-base font-bold text-white focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setNewStock((prev) => prev + 1)}
                className="h-9 w-9 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setNewStock((prev) => prev + 10)}
                className="h-9 w-9 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                +10
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {isRTL ? 'سبب التعديل أو رقم التوريد' : 'Reason / Restock Reference'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Manual Stock Count Verification">Manual Stock Count Verification</option>
              <option value="Supplier Batch Restock Delivery">Supplier Batch Restock Delivery</option>
              <option value="Damaged or Expired Units Write-off">Damaged or Expired Units Write-off</option>
              <option value="Emergency Surgery Ward Transfer">Emergency Surgery Ward Transfer</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdjustStockOpen(false)}
              className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {isRTL ? 'حفظ التعديل في السجل' : 'Save Stock Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
