export function asArray(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return [v];
}

export function pickData(res) {
  // axios response or already unwrapped {message,data}
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

export { getErrorMessage } from '../api/client.js';
