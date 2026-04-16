import axios from 'axios';
import { supabase } from './supabase';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Singleton refresh promise — deduplicates concurrent refresh attempts so that
// multiple in-flight requests don't each trigger their own refresh race.
let activeRefresh: Promise<string | null> | null = null;

async function getFreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const expiresAt = data.session.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);

  // Proactively refresh if expired or within 60 s of expiry
  if (expiresAt - nowSec < 60) {
    if (!activeRefresh) {
      activeRefresh = supabase.auth
        .refreshSession()
        .then(({ data: r }) => r.session?.access_token ?? null)
        .catch(() => null)
        .finally(() => { activeRefresh = null; });
    }
    return activeRefresh;
  }

  return data.session.access_token;
}

client.interceptors.request.use(async (config) => {
  const token = await getFreshToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? null;

      if (status === 401) {
        const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
        if (!config?._retry) {
          // First 401: try refreshing the session and retrying the request once.
          // This handles backend cold-starts, JWKS re-fetches, and token edge cases
          // without immediately signing the user out.
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            config!._retry = true;
            config!.headers!.Authorization = `Bearer ${refreshData.session.access_token}`;
            return client(config!);
          }
          // Refresh token is gone — session is truly dead.
          await supabase.auth.signOut();
        } else {
          // Already retried — give up and sign out.
          await supabase.auth.signOut();
        }
      }

      const message =
        (error.response?.data as { error?: string })?.error ?? error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: <T>(url: string, params?: Record<string, string>) =>
    client.get<T, T>(url, { params }),
  post: <T>(url: string, data?: unknown) => client.post<T, T>(url, data),
  put: <T>(url: string, data?: unknown) => client.put<T, T>(url, data),
  delete: <T>(url: string) => client.delete<T, T>(url),
  postForm: <T>(url: string, data: FormData) =>
    client.post<T, T>(url, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  putRaw: async (url: string, body: Blob | File, contentType: string) => {
    const res = await fetch(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType },
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    return res;
  },
};
