// In test runner mode, default to true to allow standalone unit testing without live MySQL/Express port 5000.
// In development/production, default to false to connect directly to the real Backend REST API.
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Utility helper for simulated network latency in mock mode (makes UI state transitions feel realistic)
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

const TOKEN_KEY = 'cinelight_token';
const REFRESH_TOKEN_KEY = 'cinelight_refresh_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized: Attempt token refresh once
  if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/v1/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshJson: ApiResponse = await refreshRes.json();
          if (refreshJson.success && refreshJson.data?.accessToken) {
            setStoredTokens(refreshJson.data.accessToken, refreshJson.data.refreshToken);
            // Retry original request with new access token
            headers.set('Authorization', `Bearer ${refreshJson.data.accessToken}`);
            res = await fetch(url, { ...options, headers });
          }
        } else {
          clearStoredTokens();
        }
      } catch {
        clearStoredTokens();
      }
    }
  }

  const data: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: { code: 'INVALID_JSON_RESPONSE', message: 'Lỗi máy chủ: Không thể đọc phản hồi JSON' },
  }));

  if (!res.ok || !data.success) {
    const errorMsg = data.error?.message || data.message || `Lỗi API (${res.status})`;
    const err = new Error(errorMsg) as Error & { code?: string; statusCode?: number };
    err.code = data.error?.code || 'API_ERROR';
    err.statusCode = res.status;
    throw err;
  }

  return data.data as T;
}
