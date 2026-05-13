import api from './axios';

export function getProducts(params) {
  return api.get('/api/products', { params });
}

export function getProductsAdmin(params) {
  return api.get('/api/products/admin/all', { params });
}

export function getProduct(id) {
  return api.get(`/api/products/${id}`);
}

export function getProductAdmin(id) {
  return api.get(`/api/products/admin/product/${id}`);
}

export function getCategories() {
  return api.get('/api/products/categories');
}

export function createProduct(formData) {
  return api.post('/api/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function updateProduct(id, formData) {
  return api.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function deactivateProduct(id) {
  return api.delete(`/api/products/${id}`);
}

export function toggleFeatured(id) {
  return api.patch(`/api/products/${id}/toggle-featured`);
}

export function reactivateProduct(id) {
  return api.patch(`/api/products/${id}/reactivate`);
}
