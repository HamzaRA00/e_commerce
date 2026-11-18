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

export const adminAuthApi = {
  login: (payload) => api.post('/admin/login', toFormData(payload)),
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

export const adminCategoriesApi = {
  list: (params = {}) => api.get('/admin/categories', { params }),
  show: (id) => api.get(`/admin/categories/${id}`),
  create: (payload) => api.post('/admin/categories', payload),
  update: (id, payload) => api.put(`/admin/categories/${id}`, payload),
  remove: (id) => api.delete(`/admin/categories/${id}`),
};

export const adminProductsApi = {
  listInCategory: (categoryId, params = {}) => api.get(`/admin/categories/${categoryId}/products`, { params }),
  show: (id) => api.get(`/admin/products/${id}`),
  create: (payload, images = []) => {
    const fd = new FormData();
    Object.entries(payload || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      fd.append(k, v);
    });
    images.forEach((file) => fd.append('images[]', file));
    return api.post('/admin/products', fd);
  },
  update: (id, payload) => api.put(`/admin/products/${id}`, payload),
  remove: (id) => api.delete(`/admin/products/${id}`),
  addImages: (id, images = []) => {
    const fd = new FormData();
    images.forEach((file) => fd.append('images[]', file));
    return api.post(`/admin/products/${id}/images`, fd);
  },
  deleteImage: (productId, imageId) => api.delete(`/admin/products/${productId}/images/${imageId}`),
};

export const adminOrdersApi = {
  list: (params = {}) => api.get('/admin/orders', { params }),
  statuses: () => api.get('/admin/orders/statuses'),
  show: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
};
