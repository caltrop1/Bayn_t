import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
export const TOKEN_KEY = 'bayn_access_token';

// Set to true while a refresh is in-flight so we don't fire multiple refreshes
let _isRefreshing = false;
let _refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  _refreshSubscribers.forEach((cb) => cb(newToken));
  _refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  _refreshSubscribers.push(cb);
}

export class ApiError extends Error {
  constructor(message, { status, errors, response } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || {};
    this.response = response;
  }
}

const client = axios.create({
  baseURL: API_BASE_URL,
  // Neon and the Render backend can need several seconds to wake from idle.
  // Keep the timeout configurable while using a more forgiving default.
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 60000),
  headers: { Accept: 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) config.headers['Content-Type'] = 'application/json';
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error.response;
    if (!response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      throw new ApiError(
        timedOut
          ? 'The request is taking longer than expected. Please check your connection and try again.'
          : 'Unable to connect to the academy server. Please try again.',
        { code: error.code }
      );
    }

    // Auto-refresh on 401 (token expired) — but not for auth endpoints themselves
    if (response.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute && localStorage.getItem(TOKEN_KEY)) {
        if (!_isRefreshing) {
          _isRefreshing = true;
          try {
            const refreshRes = await client.post('/auth/refresh', { device_name: 'browser' });
            const newToken = refreshRes.data?.access_token;
            if (newToken) {
              localStorage.setItem(TOKEN_KEY, newToken);
              onTokenRefreshed(newToken);
              _isRefreshing = false;
              // Retry the original failed request with the new token
              error.config.headers['Authorization'] = `Bearer ${newToken}`;
              return client.request(error.config);
            }
          } catch {
            _isRefreshing = false;
            _refreshSubscribers = [];
          }
        } else {
          // Queue this request until the refresh completes
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              error.config.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(client.request(error.config));
            });
          });
        }
        // Refresh failed → log out
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event('bayn:unauthorized'));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event('bayn:unauthorized'));
      }
    }

    const message = response.data?.message || (response.status === 429
      ? 'Too many requests. Please wait a moment and try again.'
      : response.status >= 500 ? 'The academy server is temporarily unavailable.' : 'Request could not be completed.');
    throw new ApiError(message, { status: response.status, errors: response.data?.errors, response });
  },
);

export const api = {
  request: (config) => client.request(config),
  get: (url, params, config = {}) => client.get(url, { ...config, params }),
  post: (url, data, config) => client.post(url, data, config),
  patch: (url, data, config) => client.patch(url, data, config),
  put: (url, data) => client.put(url, data),
  delete: (url) => client.delete(url),
};

export function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export function toUserMessage(error) {
  if (error?.status === 401) return 'Your session has expired. Please sign in again.';
  if (error?.status === 403) return 'You do not have permission to perform this action.';
  if (error?.status === 404) return 'The requested item could not be found.';
  if (error?.status === 409) return error.message || 'This action conflicts with the current status.';
  return error?.message || 'Something went wrong. Please try again.';
}
