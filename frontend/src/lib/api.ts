import axios from 'axios';
import { supabase } from './supabase';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject Supabase JWT on every request.
// On auth expiry responses, we do a one-time refresh+retry fallback below.
client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const requestConfig = error.config as (typeof error.config & {
        __retriedAuth?: boolean;
      }) | undefined;
      const status = error.response?.status ?? null;
      const responseError = (error.response?.data as { error?: string } | undefined)?.error ?? null;

      const shouldRetryWithRefresh = status === 401
        && responseError === 'Invalid or expired token'
        && !!requestConfig
        && !requestConfig.__retriedAuth;

      if (shouldRetryWithRefresh && requestConfig) {
        requestConfig.__retriedAuth = true;
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        const refreshedToken = refreshed.session?.access_token;
        if (refreshedToken && !refreshError) {
          requestConfig.headers.Authorization = `Bearer ${refreshedToken}`;
          return client.request(requestConfig);
        }
        await supabase.auth.signOut();
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
  putRaw: (url: string, body: Blob | File, contentType: string) =>
    fetch(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType },
    }),
};
