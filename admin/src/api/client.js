import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let handlers = {
  getAuth: () => null,
  setAuth: () => {},
  clearAuth: () => {},
};

export function registerAuthHandlers(h) {
  handlers = { ...handlers, ...h };
}

export const api = axios.create({ baseURL });

let refreshPromise = null;

function authHeaders(config = {}) {
  const auth = handlers.getAuth();
  const headers = { Accept: 'application/json', lang: 'en', ...(config.headers || {}) };
  const device = auth?.device || headers.device;
  if (device) headers.device = device;
  if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
  return headers;
}

api.interceptors.request.use((config) => {
  config.headers = authHeaders(config);
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

function extractMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Request failed';
  if (typeof data.message === 'string') return data.message;
  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  return 'Request failed';
}

async function doRefresh() {
  const auth = handlers.getAuth();
  if (!auth?.refreshToken || !auth?.device) throw new Error('No refresh token');
  const res = await axios.post(
    `${baseURL.replace(/\/$/, '')}/refresh`,
    { refresh_token: auth.refreshToken },
    { headers: { Accept: 'application/json', lang: 'en', device: auth.device } }
  );
  const payload = res.data?.data || res.data;
  const next = {
    ...auth,
    accessToken: payload.access_token || payload.accessToken,
    refreshToken: payload.refresh_token || payload.refreshToken || auth.refreshToken,
    device: payload.device || auth.device,
    userId: payload.user_id ?? payload.userId ?? auth.userId ?? null,
  };
  handlers.setAuth(next);
  return next;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;
    const url = String(original.url || '');
    const isRefreshCall = url.includes('/refresh') || url.includes('/login');
    if (status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
        await refreshPromise;
        original.headers = { ...(original.headers || {}), ...authHeaders(original) };
        return api(original);
      } catch {
        handlers.clearAuth();
      }
    }
    const enriched = new Error(extractMessage(error));
    enriched.status = status;
    enriched.data = error?.response?.data;
    enriched.original = error;
    throw enriched;
  }
);

export function unwrap(res) {
  return res?.data;
}

export function getErrorMessage(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err.message || 'Request failed';
}
