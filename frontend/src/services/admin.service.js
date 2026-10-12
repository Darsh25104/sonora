import api from './api.js';

export async function stats() {
  const body = await api.get('/admin/stats');
  return body.data;
}
