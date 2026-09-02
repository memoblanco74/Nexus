import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const PatientsView: React.FC = () => {
  const {
    language,
    isRTL,
    patients,
    setIsAddPatientOpen,
    setIsNewBookingOpen,
    t,
  } = useApp();

  const [search, setSearch] = useState('');

  const filteredPatients = patients.filter((p) => {
    return (
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      p.nationalId.includes(search) ||
      p.phone.includes(search)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('nav.patients')}
            </h1>
            <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
              {patients.length} {isRTL ? 'ملفات مسجلة' : 'Registered Records'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isRTL ? 'إدارة السجلات الطبية للمرضى وتاريخ الفحوصات والتشخيصات' : 'Patient electronic medical records (EMR) & consultation logs.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>{t('founder.add_patient')}</span>
        </button>
      </div>

      {/* Patient Search & Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-slate-400`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم، رقم الهوية أو الجوال...' : 'Search by name, National ID or phone...'}
              className={`w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 ${
                isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'
              } text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none`}
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-3">{t('common.patient_name')}</th>
                <th className="py-3 px-3">{isRTL ? 'العمر / الجنس' : 'Age / Gender'}</th>
                <th className="py-3 px-3">{isRTL ? 'فصيلة الدم' : 'Blood Group'}</th>
                <th className="py-3 px-3">{isRTL ? 'الهوية الوطنية' : 'National ID'}</th>
                <th className="py-3 px-3">{t('common.doctor')}</th>
                <th className="py-3 px-3">{isRTL ? 'التشخيص / الحالة' : 'Condition'}</th>
                <th className="py-3 px-3">{t('common.status')}</th>
                <th className="py-3 px-3 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-3 font-semibold text-white">
                    <div>
                      <span>{language === 'ar' ? p.nameAr : p.nameEn}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-500" />
                          {p.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {p.age} yrs • {p.gender}
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                      {p.bloodType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {p.nationalId}
                  </td>
                  <td className="py-3 px-3 text-blue-400 font-medium">
                    {p.doctor}
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                    {p.condition}
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setIsNewBookingOpen(true)}
                      className="rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-2.5 py-1 text-[11px] font-semibold transition"
                    >
                      {isRTL ? 'حجز موعد' : 'Book'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
