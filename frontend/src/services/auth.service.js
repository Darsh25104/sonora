import api from './api.js';

export async function register({ name, email, password }) {
  const body = await api.post('/auth/register', { name, email, password });
  return body.data; // { token, user }
}

export async function login(email, password) {
  const body = await api.post('/auth/login', { email, password });
  return body.data; // { token, user }
}

export async function getMe() {
  const body = await api.get('/auth/me');
  return body.data; // user
}

export async function updateMe(patch) {
  const body = await api.put('/auth/me', patch);
  return body.data; // user
}
