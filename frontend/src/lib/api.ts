import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
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
  putRaw: (url: string, body: Blob | File, contentType: string) =>
    fetch(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType },
    }),
};
