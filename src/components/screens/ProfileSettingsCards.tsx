import React, { useRef, useState } from 'react';
import { Camera, Loader2, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const ProfilePhotoCard: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const { profile, uploadAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    const result = await uploadAvatar(file);
    setBusy(false);
    showToast(result.error ? result.error : isRTL ? 'تم تحديث الصورة' : 'Photo updated');
  };

  const initial = (profile?.fullName || profile?.username || '?').charAt(0).toUpperCase();

  return (
    <div className="glass-panel flex items-center gap-4 rounded-2xl border border-slate-800 p-5">
      <button onClick={() => fileRef.current?.click()} className="group relative shrink-0" disabled={busy}>
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/50" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xl font-bold text-white ring-2 ring-blue-500/50">
            {initial}
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{profile?.fullName || profile?.username}</p>
        <p className="truncate text-[11px] text-slate-400">@{profile?.username}</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" />
          {isRTL ? 'تغيير الصورة' : 'Change photo'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
};

export const LogoutCard: React.FC = () => {
  const { isRTL } = useApp();
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => signOut()}
      className="glass-panel flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 p-4 text-sm font-bold text-red-400 hover:bg-red-500/10"
    >
      <LogOut className="h-4 w-4" />
      {isRTL ? 'تسجيل الخروج' : 'Sign out'}
    </button>
  );
};
