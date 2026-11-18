import { api } from './client.js';

export function toFormData(obj = {}) {
  if (obj instanceof FormData) return obj;
  const fd = new FormData();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
    else fd.append(k, v);
  });
  return fd;
}

export const userAuthApi = {
  register: (payload) => api.post('/user/register', toFormData(payload)),
  login: (payload) => api.post('/user/login', toFormData(payload)),
  verifyEmail: (code) => api.post('/user/verify-email', toFormData({ code })),
  resendVerification: () => api.post('/user/resend-verification-code'),
};

export const mutualApi = {
  refresh: (refreshToken) => api.post('/refresh', toFormData({ refresh_token: refreshToken })),
  logout: () => api.post('/logout'),
  logoutOther: () => api.post('/logout-other-devices'),
  logoutAll: () => api.post('/logout-all-devices'),
};

export const userCatalogApi = {
  categories: (params = {}) => api.get('/user/categories', { params }),
  categoryProducts: (categoryId, params = {}) => api.get(`/user/categories/${categoryId}/products`, { params }),
  product: (id) => api.get(`/user/products/${id}`),
};

export const userOrdersApi = {
  list: (params = {}) => api.get('/user/orders', { params }),
  create: (productIds) => {
    const fd = new FormData();
    (productIds || []).forEach((id, i) => fd.append(`product_ids[${i}]`, String(id)));
    return api.post('/user/orders', fd);
  },
  show: (id) => api.get(`/user/orders/${id}`),
};

