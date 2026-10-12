import api from './api.js';

export async function mine() {
  const body = await api.get('/playlists');
  return body.data;
}

export async function get(id) {
  const body = await api.get(`/playlists/${id}`);
  return body.data;
}

export async function create(name) {
  const body = await api.post('/playlists', { name });
  return body.data;
}

export async function update(id, patch) {
  const body = await api.put(`/playlists/${id}`, patch);
  return body.data;
}

export async function remove(id) {
  const body = await api.delete(`/playlists/${id}`);
  return body.data;
}

export async function addSong(id, songId) {
  const body = await api.post(`/playlists/${id}/songs`, { songId });
  return body.data; // updated playlist with populated songs
}

export async function removeSong(id, songId) {
  const body = await api.delete(`/playlists/${id}/songs/${songId}`);
  return body.data; // updated playlist with populated songs
}
