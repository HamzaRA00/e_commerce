const KEY = 'ecom_admin_auth_v1';

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    if (auth?.role !== 'admin') {
      localStorage.removeItem(KEY);
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}

export function setStoredAuth(value) {
  if (!value) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function ensureDeviceId(current) {
  if (current?.device) return current.device;
  return `admin-${randomId()}`;
}
