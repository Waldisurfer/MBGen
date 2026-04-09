import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  userId: string;
  role: 'admin' | 'user';
  monthlySpendUsd: number;
  monthlyLimitUsd: number;
  hasStyle: boolean;
  styleGuidelines: Record<string, unknown> | null;
}

export const useAuthStore = defineStore('auth', () => {
  const session            = ref<Session | null>(null);
  const user               = ref<User | null>(null);
  const profile            = ref<UserProfile | null>(null);
  const isLoading          = ref(true);
  const isPasswordRecovery = ref(false);
  const error              = ref<string | null>(null);

  const isAuthenticated = computed(() => !!session.value);
  const isAdmin         = computed(() => profile.value?.role === 'admin');
  const monthlySpend    = computed(() => profile.value?.monthlySpendUsd ?? 0);
  const spendPercent    = computed(() => Math.min(100, (monthlySpend.value / 0.10) * 100));
  const atLimit         = computed(() => monthlySpend.value >= 0.10 && !isAdmin.value);

  async function fetchProfile(): Promise<void> {
    try {
      profile.value = await api.get<UserProfile>('/styles/profile');
    } catch {
      // profile fetch failure is non-fatal
    }
  }

  async function init(): Promise<void> {
    isLoading.value = true;

    // Handle Supabase auth redirect: tokens arrive in the URL hash (#access_token=…)
    // The router fires before Supabase processes the hash, so we must set the session
    // manually before calling getSession(), otherwise the user gets bounced to /login
    // and the hash (with the tokens) is lost.
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params       = new URLSearchParams(hash.substring(1));
      const accessToken  = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type         = params.get('type');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (type === 'recovery') {
          isPasswordRecovery.value = true;
        }
      }
    }

    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value    = data.session?.user ?? null;
    if (session.value && !isPasswordRecovery.value) await fetchProfile();
    isLoading.value = false;

    supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        isPasswordRecovery.value = true;
        session.value = s;
        user.value    = s?.user ?? null;
        return;
      }
      session.value = s;
      user.value    = s?.user ?? null;
      if (s && !isPasswordRecovery.value) {
        await fetchProfile();
      } else if (!s) {
        profile.value            = null;
        isPasswordRecovery.value = false;
      }
    });
  }

  async function signIn(email: string, password: string): Promise<void> {
    error.value = null;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { error.value = err.message; throw err; }
    await fetchProfile();
  }

  async function signUp(email: string, password: string): Promise<void> {
    error.value = null;
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) { error.value = err.message; throw err; }
  }

  async function sendPasswordReset(email: string): Promise<void> {
    error.value = null;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) { error.value = err.message; throw err; }
  }

  async function updatePassword(newPassword: string): Promise<void> {
    error.value = null;
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) { error.value = err.message; throw err; }
    isPasswordRecovery.value = false;
    await fetchProfile();
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    profile.value            = null;
    isPasswordRecovery.value = false;
  }

  async function refreshProfile(): Promise<void> {
    if (session.value) await fetchProfile();
  }

  return {
    session, user, profile, isLoading, isPasswordRecovery, error,
    isAuthenticated, isAdmin, monthlySpend, spendPercent, atLimit,
    init, signIn, signUp, sendPasswordReset, updatePassword, signOut, refreshProfile,
  };
});
