import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

let listenerRegistered = false;
let initPromise: Promise<void> | null = null;

interface UserProfile {
  userId: string;
  role: 'admin' | 'user';
  monthlySpendUsd: number;
  monthlyLimitUsd: number;
  hasStyle: boolean;
  styleGuidelines: Record<string, unknown> | null;
}

export const useAuthStore = defineStore('auth', () => {
  const session   = ref<Session | null>(null);
  const user      = ref<User | null>(null);
  const profile   = ref<UserProfile | null>(null);
  const isLoading = ref(true);
  const error     = ref<string | null>(null);

  const isAuthenticated = computed(() => !!session.value);
  const isAdmin         = computed(() => profile.value?.role === 'admin');
  const monthlySpend    = computed(() => profile.value?.monthlySpendUsd ?? 0);
  const spendPercent    = computed(() => Math.min(100, (monthlySpend.value / 0.10) * 100));
  const atLimit         = computed(() => monthlySpend.value >= 0.10 && !isAdmin.value);

  async function fetchProfile(): Promise<void> {
    try {
      // Use a raw fetch instead of the axios client so a 401 here does NOT
      // trigger the global "sign out on 401" interceptor. The profile endpoint
      // can legitimately return 401 during a cold-start or key-rotation window
      // right after sign-in, and we must not cancel the session in that case.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      const res = await fetch(`${base}/styles/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8_000),
      });

      if (!res.ok) {
        console.warn(`[auth] Profile fetch returned ${res.status} — skipping`);
        return;
      }
      profile.value = (await res.json()) as UserProfile;
    } catch (err) {
      console.warn('[auth] Profile fetch failed:', err instanceof Error ? err.message : String(err));
    }
  }

  async function init(): Promise<void> {
    // Singleton: concurrent callers (App.vue + router guard) share one promise.
    if (!initPromise) {
      initPromise = (async () => {
        isLoading.value = true;

        const { data } = await supabase.auth.getSession();
        session.value = data.session;
        user.value    = data.session?.user ?? null;
        if (session.value) await fetchProfile();
        isLoading.value = false;

        if (listenerRegistered) return;
        listenerRegistered = true;
        supabase.auth.onAuthStateChange(async (_, s) => {
          session.value = s;
          user.value    = s?.user ?? null;
          if (s) {
            await fetchProfile();
          } else {
            profile.value = null;
          }
        });
      })();
    }
    return initPromise;
  }

  async function signIn(email: string, password: string): Promise<void> {
    error.value = null;
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { error.value = err.message; throw err; }
    // Eagerly sync session so isAuthenticated is true before onAuthStateChange fires,
    // avoiding a race where router.push('/dashboard') sees a stale null session.
    if (data.session) {
      session.value = data.session;
      user.value = data.session.user;
    }
  }

  async function signUp(email: string, password: string): Promise<void> {
    error.value = null;
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { error.value = err.message; throw err; }
    // If email confirmation is disabled, a session is returned immediately — sync it.
    if (data.session) {
      session.value = data.session;
      user.value = data.session.user;
      await fetchProfile();
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    profile.value = null;
  }

  async function refreshProfile(): Promise<void> {
    if (session.value) await fetchProfile();
  }

  return {
    session, user, profile, isLoading, error,
    isAuthenticated, isAdmin, monthlySpend, spendPercent, atLimit,
    init, signIn, signUp, signOut, refreshProfile,
  };
});
