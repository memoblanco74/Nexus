import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, X, Loader2 } from 'lucide-react';

export const ProfileEditModal: React.FC<{ isRTL: boolean; onClose: () => void }> = ({ isRTL, onClose }) => {
  const { profile, updateProfileDetails, uploadAvatar, changePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError('');
    const result = await uploadAvatar(file);
    setUploadingAvatar(false);
    if (result.error) setError(result.error);
    else setSuccess(isRTL ? 'تم تحديث الصورة' : 'Photo updated');
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    setError('');
    setSuccess('');
    const result = await updateProfileDetails({ fullName, phone });
    setSavingDetails(false);
    if (result.error) setError(result.error);
    else setSuccess(isRTL ? 'تم حفظ البيانات' : 'Details saved');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setError(isRTL ? 'الباسورد لازم يكون 6 حروف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    setError('');
    setSuccess('');
    const result = await changePassword(newPassword);
    setSavingPassword(false);
    if (result.error) setError(result.error);
    else {
      setSuccess(isRTL ? 'تم تغيير الباسورد' : 'Password changed');
      setNewPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{isRTL ? 'حسابي' : 'My Account'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">
            {success}
          </div>
        )}

        {/* Avatar */}
        <div className="flex justify-center">
          <button
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-blue-500/40 group"
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-2xl font-bold">
                {(profile?.fullName || profile?.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Details */}
        <div className="space-y-2">
          <label className="block text-[11px] text-slate-400">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
          />
          <label className="block text-[11px] text-slate-400">{isRTL ? 'رقم الموبايل' : 'Mobile Number'}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
          />
          <button
            onClick={handleSaveDetails}
            disabled={savingDetails}
            className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {savingDetails ? '...' : isRTL ? 'حفظ البيانات' : 'Save Details'}
          </button>
        </div>

        {/* Password */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <label className="block text-[11px] text-slate-400">{isRTL ? 'باسورد جديد' : 'New Password'}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={isRTL ? 'اتركه فاضي لو مش عايز تغيّره' : 'Leave blank to keep current'}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
          />
          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword}
            className="w-full rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
          >
            {savingPassword ? '...' : isRTL ? 'تغيير الباسورد' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
};
