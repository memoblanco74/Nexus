import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type RoleCode = 'super_admin' | 'founder' | 'assistant';

interface UserProfile {
  id: string;
  username: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  roleCode: RoleCode;
}

interface TenantMembership {
  tenantId: string;
  isFounder: boolean;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  tenantMemberships: TenantMembership[];
  activeTenantId: string | null;
  setActiveTenantId: (id: string) => void;
  loading: boolean;
  signInWithIdentifier: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: {
    username: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  requestUsernameRecovery: (email: string) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenantMemberships, setTenantMemberships] = useState<TenantMembership[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentSession: Session) => {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, phone, roles(code)')
      .eq('auth_uid', currentSession.user.id)
      .single();

    if (error || !userRow) {
      setProfile(null);
      setTenantMemberships([]);
      setActiveTenantId(null);
      return;
    }

    setProfile({
      id: userRow.id,
      username: userRow.username,
      fullName: userRow.full_name,
      email: userRow.email,
      phone: userRow.phone,
      roleCode: (userRow as any).roles.code,
    });

    if ((userRow as any).roles.code !== 'super_admin') {
      const { data: memberships } = await supabase
        .from('tenant_users')
        .select('tenant_id, is_founder')
        .eq('user_id', userRow.id);

      const list = (memberships || []).map((m) => ({
        tenantId: m.tenant_id,
        isFounder: m.is_founder,
      }));
      setTenantMemberships(list);
      if (list.length > 0) setActiveTenantId(list[0].tenantId);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile(newSession);
      } else {
        setProfile(null);
        setTenantMemberships([]);
        setActiveTenantId(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithIdentifier = async (identifier: string, password: string) => {
    const trimmed = identifier.trim().toLowerCase();
    let email = trimmed;

    if (trimmed.indexOf('@') === -1) {
      const { data, error } = await supabase.rpc('fn_resolve_email_by_username', {
        p_username: trimmed,
      });
      if (error || !data) return { error: 'Invalid username/email or password.' };
      email = (data as string).toLowerCase();
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signUp = async (params: { username: string; email: string; phone: string; password: string }) => {
    const usernamePattern = /^[A-Za-z0-9]+$/;
    if (!usernamePattern.test(params.username)) {
      return { error: 'Username must be letters and numbers only, no spaces.', needsEmailConfirmation: false };
    }

    const usernameCheck = await supabase.rpc('fn_is_username_taken', { p_username: params.username });
    if (usernameCheck.data) {
      return { error: 'This username is already taken.', needsEmailConfirmation: false };
    }

    if (params.phone) {
      const phoneCheck = await supabase.rpc('fn_is_phone_taken', { p_phone: params.phone });
      if (phoneCheck.data) {
        return { error: 'This mobile number is already registered.', needsEmailConfirmation: false };
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: { username: params.username, phone: params.phone },
        emailRedirectTo: window.location.href,
      },
    });

    if (error) return { error: error.message, needsEmailConfirmation: false };

    return { error: null, needsEmailConfirmation: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    });
    return { error: error ? error.message : null };
  };

  const requestUsernameRecovery = async (email: string) => {
    const { error } = await supabase.functions.invoke('recover-username', {
      body: { method: 'email', value: email },
    });
    return { error: error ? error.message : null };
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? error.message : null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        tenantMemberships,
        activeTenantId,
        setActiveTenantId,
        loading,
        signInWithIdentifier,
        signUp,
        signOut,
        requestPasswordReset,
        requestUsernameRecovery,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
