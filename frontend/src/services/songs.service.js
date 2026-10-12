import api from './api.js';

export async function list(params = {}) {
  const body = await api.get('/songs', { params });
  return body.data; // array
}

export async function get(id) {
  const body = await api.get(`/songs/${id}`);
  return body.data;
}

/** multipart/form-data: { title, artist, album, genre, duration, audio, cover } */
export function create(formData, onUploadProgress) {
  return api.post('/songs', formData, {
    timeout: 0, // large audio files can take a while
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }).then((body) => body.data);
}

export function update(id, formData, onUploadProgress) {
  return api.put(`/songs/${id}`, formData, {
    timeout: 0,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }).then((body) => body.data);
}

export async function remove(id) {
  const body = await api.delete(`/songs/${id}`);
  return body.data;
}

export async function like(id) {
  const body = await api.post(`/songs/${id}/like`);
  return body.data; // { likedSongs: [...] }
}

export async function unlike(id) {
  const body = await api.delete(`/songs/${id}/like`);
  return body.data; // { likedSongs: [...] }
}

/** Fired by the player when a track starts. */
export async function recordPlay(id) {
  const body = await api.post(`/songs/${id}/play`);
  return body.data;
}

export async function search(query) {
  const body = await api.get('/search', { params: { q: query } });
  return body.data; // { songs, albums, artists }
}
