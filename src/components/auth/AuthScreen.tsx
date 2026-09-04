import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot_username' | 'forgot_password';

export const AuthScreen: React.FC = () => {
  const { signInWithIdentifier, signUp, requestPasswordReset, requestUsernameRecovery } = useAuth();

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
      setInfo('Account created — check your email and click the activation link before signing in.');
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
    setInfo('A password reset link has been sent to your email.');
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
    setInfo('If that email is registered, your username has been sent to it.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Nexus Medical</h1>
            <p className="text-[10px] text-slate-400">Multi-Tenant Medical OS</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            {info}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <Field icon={<User className="h-3.5 w-3.5" />} placeholder="Username or Email" value={identifier} onChange={setIdentifier} />
            <Field icon={<Lock className="h-3.5 w-3.5" />} placeholder="Password" type="password" value={password} onChange={setPassword} />
            <SubmitButton loading={loading} label="Sign In" />
            <div className="flex justify-between text-[11px] pt-1">
              <button type="button" onClick={() => { resetMessages(); setMode('forgot_username'); }} className="text-slate-400 hover:text-blue-400">
                Forgot username?
              </button>
              <button type="button" onClick={() => { resetMessages(); setMode('forgot_password'); }} className="text-slate-400 hover:text-blue-400">
                Forgot password?
              </button>
            </div>
            <div className="text-center text-[11px] text-slate-400 pt-2">
              No account?{' '}
              <button type="button" onClick={() => { resetMessages(); setMode('signup'); }} className="text-blue-400 font-semibold hover:text-blue-300">
                Sign up
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <Field icon={<User className="h-3.5 w-3.5" />} placeholder="Username (letters/numbers, no spaces)" value={suUsername} onChange={setSuUsername} />
            <Field icon={<Mail className="h-3.5 w-3.5" />} placeholder="Email" type="email" value={suEmail} onChange={setSuEmail} />
            <Field icon={<Phone className="h-3.5 w-3.5" />} placeholder="Mobile number" value={suPhone} onChange={setSuPhone} />
            <Field icon={<Lock className="h-3.5 w-3.5" />} placeholder="Password" type="password" value={suPassword} onChange={setSuPassword} />
            <SubmitButton loading={loading} label="Create Account" />
            <div className="text-center text-[11px] text-slate-400 pt-2">
              Already have an account?{' '}
              <button type="button" onClick={() => { resetMessages(); setMode('login'); }} className="text-blue-400 font-semibold hover:text-blue-300">
                Sign in
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_username' && (
          <form onSubmit={handleForgotUsername} className="space-y-3">
            <p className="text-xs text-slate-400">Enter your email and we'll send you your username.</p>
            <Field icon={<Mail className="h-3.5 w-3.5" />} placeholder="Email" type="email" value={recoveryEmail} onChange={setRecoveryEmail} />
            <SubmitButton loading={loading} label="Send Username" />
            <BackToLogin onClick={() => { resetMessages(); setMode('login'); }} />
          </form>
        )}

        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-xs text-slate-400">Enter your email and we'll send you a reset link.</p>
            <Field icon={<Mail className="h-3.5 w-3.5" />} placeholder="Email" type="email" value={recoveryEmail} onChange={setRecoveryEmail} />
            <SubmitButton loading={loading} label="Send Reset Link" />
            <BackToLogin onClick={() => { resetMessages(); setMode('login'); }} />
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
    <span className="absolute left-3 top-2.5 text-slate-500">{icon}</span>
    <input
      required
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
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

const BackToLogin: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="text-center text-[11px] text-slate-400 pt-2">
    <button type="button" onClick={onClick} className="text-blue-400 font-semibold hover:text-blue-300">
      Back to sign in
    </button>
  </div>
);
