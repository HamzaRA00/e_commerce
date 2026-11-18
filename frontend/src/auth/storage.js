const KEY = 'ecom_test_auth_v1';

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    if (auth?.role !== 'user') {
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
  const id = `web-${randomId()}`;
  return id;
}

export function makeAuthState({ role, accessToken, refreshToken, device, email = null, verified = null, userId = null }) {
  return {
    role,
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    device: device || ensureDeviceId(null),
    email,
    verified,
    userId: userId ?? null,
  };
}
