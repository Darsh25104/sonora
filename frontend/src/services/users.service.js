import api from './api.js';

export async function likedSongs() {
  const body = await api.get('/users/me/liked');
  return body.data;
}

export async function recentlyPlayed() {
  const body = await api.get('/users/me/recently-played');
  return body.data;
}
