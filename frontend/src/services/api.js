import axios from 'axios';

/**
 * Central Axios instance — the ONLY place that knows the API base URL.
 *
 *  - request interceptor  → attaches the JWT automatically
 *  - response interceptor → unwraps { success, message, data } and turns
 *                           every failure into a plain Error with a friendly
 *                           .message (plus .status for status checks)
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({ baseURL, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sonora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status ?? null;
    let message = error.response?.data?.message;
    if (!message) {
      message = error.request && !error.response
        ? 'Cannot reach the server. Is the backend running?'
        : error.message;
    }

    // Let AuthContext know the session died (expired/invalid token).
    if (status === 401) window.dispatchEvent(new Event('auth:expired'));

    const normalized = new Error(message);
    normalized.status = status;
    return Promise.reject(normalized);
  }
);

/** Origin of the backend ("" in dev thanks to the Vite proxy). */
export const API_ORIGIN = baseURL.replace(/\/api\/?$/, '');

/** Turns stored paths like "/uploads/covers/x.jpg" into usable URLs. */
export function mediaUrl(pathname) {
  if (!pathname) return '';
  if (/^(https?:)?\/\//i.test(pathname) || pathname.startsWith('data:') || pathname.startsWith('blob:')) {
    return pathname;
  }
  return `${API_ORIGIN}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

/** URL the <audio> element loads — served with HTTP range support. */
export function streamUrl(songId) {
  return `${baseURL}/songs/${songId}/stream`;
}

export default api;
