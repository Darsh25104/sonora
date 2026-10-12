import api from './api.js';

export async function list(params = {}) {
  const body = await api.get('/albums', { params });
  return body.data;
}

export async function get(id) {
  const body = await api.get(`/albums/${id}`);
  return body.data;
}

export function create(formData) {
  return api.post('/albums', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((body) => body.data);
}

export function update(id, formData) {
  return api.put(`/albums/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((body) => body.data);
}

export async function remove(id) {
  const body = await api.delete(`/albums/${id}`);
  return body.data;
}
