import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, User, Phone, ArrowRight, Loader2, Languages } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot_username' | 'forgot_password';

const ERRORS_AR: Record<string, string> = {
  'Invalid username/email or password.': 'اسم المستخدم أو البريد أو كلمة المرور غير صحيحة.',
  'Username must be letters and numbers only, no spaces.': 'اسم المستخدم لازم يكون حروف وأرقام فقط بدون مسافات.',
  'This username is already taken.': 'اسم المستخدم ده مستخدم قبل كده.',
  'This email is already registered. Please sign in instead.': 'البريد ده مسجل بالفعل. سجّل الدخول بدل كده.',
  'This mobile number is already registered.': 'رقم الموبايل ده مسجل بالفعل.',
};

const readLang = (): 'ar' | 'en' => {
  try {
    return localStorage.getItem('nexus_lang') === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
};

export const AuthScreen: React.FC = () => {
  const { signInWithIdentifier, signUp, requestPasswordReset, requestUsernameRecovery } = useAuth();
  const [lang, setLang] = useState<'ar' | 'en'>(readLang);
  const ar = lang === 'ar';
  const tx = (a: string, e: string) => (ar ? a : e);
  const trErr = (m: string) => (ar ? ERRORS_AR[m] || m : m);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('nexus_lang', lang);
    } catch {}
  }, [lang, ar]);

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [suUsername, setSuUsername] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPassword, setSuPassword] = useState('');

  const [recoveryEmail, setRecoveryEmail] = useState('');

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { error } = await signInWithIdentifier(identifier, password);
    setLoading(false);
    if (error) setError(error);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const result = await signUp({
      username: suUsername.trim(),
      email: suEmail.trim(),
      phone: suPhone.trim(),
      password: suPassword,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setInfo(tx('تم إنشاء الحساب. افتح بريدك واضغط على رابط التفعيل قبل تسجيل الدخول.', 'Account created — check your email and click the activation link before signing in.'));
      setMode('login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { error } = await requestPasswordReset(recoveryEmail.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setInfo(tx('اتبعت رابط إعادة تعيين كلمة المرور على بريدك.', 'A password reset link has been sent to your email.'));
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { error } = await requestUsernameRecovery(recoveryEmail.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setInfo(tx('لو البريد ده مسجل، هنبعتلك اسم المستخدم عليه.', 'If that email is registered, your username has been sent to it.'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold tracking-tight text-white">{tx('نيكسوس', 'Nexus')}</h1>
          </div>
          <button
            type="button"
            onClick={() => setLang(ar ? 'en' : 'ar')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Languages className="h-3.5 w-3.5" />
            {ar ? 'English' : 'العربية'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {trErr(error)}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            {info}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <Field icon={<User className="h-3.5 w-3.5" />} placeholder={tx('اسم المستخدم أو البريد', 'Username or Email')} value={identifier} onChange={setIdentifier} />
            <Field icon={<Lock className="h-3.5 w-3.5" />} placeholder={tx('كلمة المرور', 'Password')} type="password" value={password} onChange={setPassword} />
            <SubmitButton loading={loading} label={tx('تسجيل الدخول', 'Sign In')} />
            <div className="flex justify-between text-[11px] pt-1">
              <button type="button" onClick={() => { resetMessages(); setMode('forgot_username'); }} className="text-slate-400 hover:text-blue-400">
                {tx('نسيت اسم المستخدم؟', 'Forgot username?')}
              </button>
              <button type="button" onClick={() => { resetMessages(); setMode('forgot_password'); }} className="text-slate-400 hover:text-blue-400">
                {tx('نسيت كلمة المرور؟', 'Forgot password?')}
              </button>
            </div>
            <div className="text-center text-[11px] text-slate-400 pt-2">
              {tx('ليس لديك حساب؟', 'No account?')}{' '}
              <button type="button" onClick={() => { resetMessages(); setMode('signup'); }} className="text-blue-400 font-semibold hover:text-blue-300">
                {tx('إنشاء حساب', 'Sign up')}
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <Field icon={<User className="h-3.5 w-3.5" />} placeholder={tx('اسم المستخدم (حروف وأرقام بدون مسافات)', 'Username (letters/numbers, no spaces)')} value={suUsername} onChange={setSuUsername} />
            <Field icon={<Mail className="h-3.5 w-3.5" />} placeholder={tx('البريد الإلكتروني', 'Email')} type="email" value={suEmail} onChange={setSuEmail} />
            <Field icon={<Phone className="h-3.5 w-3.5" />} placeholder={tx('رقم الموبايل', 'Mobile number')} value={suPhone} onChange={setSuPhone} />
            <Field icon={<Lock className="h-3.5 w-3.5" />} placeholder={tx('كلمة المرور', 'Password')} type="password" value={suPassword} onChange={setSuPassword} />
            <SubmitButton loading={loading} label={tx('إنشاء الحساب', 'Create Account')} />
            <div className="text-center text-[11px] text-slate-400 pt-2">
              {tx('عندك حساب؟', 'Already have an account?')}{' '}
              <button type="button" onClick={() => { resetMessages(); setMode('login'); }} className="text-blue-400 font-semibold hover:text-blue-300">
                {tx('سجّل الدخول', 'Sign in')}
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_username' && (
          <form onSubmit={handleForgotUsername} className="space-y-3">
            <p className="text-xs text-slate-400">{tx('اكتب بريدك وهنبعتلك اسم المستخدم.', "Enter your email and we'll send you your username.")}</p>
            <Field icon={<Mail className="h-3.5 w-3.5" />} placeholder={tx('البريد الإلكتروني', 'Email')} type="email" value={recoveryEmail} onChange={setRecoveryEmail} />
            <SubmitButton loading={loading} label={tx('إرسال اسم المستخدم', 'Send Username')} />
            <BackToLogin label={tx('رجوع لتسجيل الدخول', 'Back to sign in')} onClick={() => { resetMessages(); setMode('login'); }} />
          </form>
        )}

        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-xs text-slate-400">{tx('اكتب بريدك وهنبعتلك رابط إعادة تعيين كلمة المرور.', "Enter your email and we'll send you a reset link.")}</p>
            <Field icon={<Mail className="h-3.5 w-3.5" />} placeholder={tx('البريد الإلكتروني', 'Email')} type="email" value={recoveryEmail} onChange={setRecoveryEmail} />
            <SubmitButton loading={loading} label={tx('إرسال رابط إعادة التعيين', 'Send Reset Link')} />
            <BackToLogin label={tx('رجوع لتسجيل الدخول', 'Back to sign in')} onClick={() => { resetMessages(); setMode('login'); }} />
          </form>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}> = ({ icon, placeholder, value, onChange, type = 'text' }) => (
  <div className="relative">
    <span className="absolute start-3 top-2.5 text-slate-500">{icon}</span>
    <input
      required
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
    />
  </div>
);

const SubmitButton: React.FC<{ loading: boolean; label: string }> = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95 disabled:opacity-60"
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
    <span>{label}</span>
  </button>
);

const BackToLogin: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <div className="text-center text-[11px] text-slate-400 pt-2">
    <button type="button" onClick={onClick} className="text-blue-400 font-semibold hover:text-blue-300">
      {label}
    </button>
  </div>
);
