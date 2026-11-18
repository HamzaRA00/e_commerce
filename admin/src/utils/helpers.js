export function asArray(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return [v];
}

export function pickData(res) {
  const body = res?.data !== undefined && res?.status ? res.data : res;
  if (!body) return { message: '', data: null, raw: body };
  return { message: body.message || '', data: body.data ?? body, raw: body };
}

export function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return { items: data, meta: null };
  if (data && typeof data === 'object') {
    for (const k of keys) {
      if (Array.isArray(data[k])) return { items: data[k], meta: data.meta || null };
    }
  }
  return { items: [], meta: data?.meta || null };
}

export function formatDate(v) {
  if (!v) return '-';
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
}

export function formatRelative(v) {
  const timestamp = typeof v === 'number' ? v : new Date(v).getTime();
  if (!timestamp || Number.isNaN(timestamp)) return '-';
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export { getErrorMessage } from '../api/client.js';
