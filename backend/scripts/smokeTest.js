/**
 * End-to-end API smoke test for Sonora.
 *   node scripts/smokeTest.js
 * Covers: auth → likes → history → playlists → admin → upload → streaming.
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.API_BASE || 'http://localhost:5000';
let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label} ${detail}`);
  }
}

async function call(method, url, { token, body, raw = false, headers = {} } = {}) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const json = raw ? null : await res.json().catch(() => null);
  return { status: res.status, json, res };
}

const email = `test-${Date.now()}@example.com`;

/* ---------------- 1. Auth ---------------- */
console.log('\n1. Authentication');
{
  const bad = await call('POST', '/api/auth/register', { body: { name: 'X', email: 'bad', password: '1' } });
  check('register validates input (400)', bad.status === 400 && bad.json.success === false);

  const reg = await call('POST', '/api/auth/register', {
    body: { name: 'Test User', email, password: 'secret123' },
  });
  check('register creates account (201)', reg.status === 201 && Boolean(reg.json.data.token));
  check('password not leaked', JSON.stringify(reg.json.data.user).includes('password') === false);
  check('role is not admin', reg.json.data.user.role === 'user');

  const dup = await call('POST', '/api/auth/register', { body: { name: 'Test User', email, password: 'secret123' } });
  check('duplicate email rejected (409)', dup.status === 409);

  const login = await call('POST', '/api/auth/login', { body: { email, password: 'secret123' } });
  check('login returns token', login.status === 200 && Boolean(login.json.data.token));

  const wrong = await call('POST', '/api/auth/login', { body: { email, password: 'nope' } });
  check('wrong password rejected (401)', wrong.status === 401);

  const me = await call('GET', '/api/auth/me', { token: login.json.data.token });
  check('GET /me works with token', me.status === 200 && me.json.data.email === email);

  const noAuth = await call('GET', '/api/auth/me');
  check('GET /me without token rejected (401)', noAuth.status === 401);
}

const userToken = (await call('POST', '/api/auth/login', { body: { email, password: 'secret123' } })).json.data.token;

/* ---------------- 2. Songs + search ---------------- */
console.log('\n2. Songs, search, streaming');
const songs = (await call('GET', '/api/songs')).json.data;
check('GET /songs returns catalog', Array.isArray(songs) && songs.length > 0, `got ${songs?.length}`);
const target = songs[0];

{
  const one = await call('GET', `/api/songs/${target._id}`);
  check('GET /songs/:id', one.status === 200 && one.json.data.title === target.title);

  const missing = await call('GET', '/api/songs/64b000000000000000000000');
  check('missing song → 404 {success:false}', missing.status === 404 && missing.json.success === false);

  const invalid = await call('GET', '/api/songs/not-an-id');
  check('invalid ObjectId → 400 friendly message', invalid.status === 400 && typeof invalid.json.message === 'string');

  const search = await call('GET', `/api/search?q=${encodeURIComponent(target.title.split(' ')[0])}`);
  check('search finds the song', search.json.data.songs.length >= 1);

  const empty = await call('GET', '/api/search?q=');
  check('empty query → empty groups', empty.json.data.songs.length === 0);

  // Range streaming
  const partial = await fetch(`${BASE}/api/songs/${target._id}/stream`, { headers: { Range: 'bytes=0-99' } });
  const buf = await partial.arrayBuffer();
  check('range request → 206', partial.status === 206, `got ${partial.status}`);
  check('Content-Range header present', Boolean(partial.headers.get('content-range')));
  check('exactly 100 bytes returned', buf.byteLength === 100, `got ${buf.byteLength}`);
  check('Accept-Ranges: bytes', partial.headers.get('accept-ranges') === 'bytes');

  const full = await fetch(`${BASE}/api/songs/${target._id}/stream`);
  check('no range → 200 full file', full.status === 200);
}

/* ---------------- 3. Likes + history ---------------- */
console.log('\n3. Likes and recently played');
{
  const like = await call('POST', `/api/songs/${target._id}/like`, { token: userToken });
  check('like song', like.status === 200 && like.json.data.likedSongs.length === 1);

  const likeAgain = await call('POST', `/api/songs/${target._id}/like`, { token: userToken });
  check('like is idempotent (no dupes)', likeAgain.json.data.likedSongs.length === 1);

  const liked = await call('GET', '/api/users/me/liked', { token: userToken });
  check('GET liked returns the song', liked.json.data.some((s) => s._id === target._id));

  const play = await call('POST', `/api/songs/${target._id}/play`, { token: userToken });
  check('record play increments count', play.status === 200);

  const anon = await call('POST', `/api/songs/${target._id}/play`);
  check('anonymous play rejected (401)', anon.status === 401);

  const history = await call('GET', '/api/users/me/recently-played', { token: userToken });
  check('history contains the song first', history.json.data[0]?._id === target._id);

  // duplicate history entries
  await call('POST', `/api/songs/${target._id}/play`, { token: userToken });
  await call('POST', `/api/songs/${target._id}/play`, { token: userToken });
  const history2 = (await call('GET', '/api/users/me/recently-played', { token: userToken })).json.data;
  check('history has no duplicate entries', history2.filter((s) => s._id === target._id).length === 1);

  const unlike = await call('DELETE', `/api/songs/${target._id}/like`, { token: userToken });
  check('unlike works', unlike.json.data.likedSongs.length === 0);
}

/* ---------------- 4. Playlists ---------------- */
console.log('\n4. Playlists');
let playlistId;
{
  const noName = await call('POST', '/api/playlists', { token: userToken, body: {} });
  check('name is required (400)', noName.status === 400);

  const created = await call('POST', '/api/playlists', { token: userToken, body: { name: 'Test Mix' } });
  playlistId = created.json.data._id;
  check('create playlist (201)', created.status === 201 && Boolean(playlistId));

  const mine = await call('GET', '/api/playlists', { token: userToken });
  check('lists my playlists', mine.json.data.some((p) => p._id === playlistId));

  const add = await call('POST', `/api/playlists/${playlistId}/songs`, {
    token: userToken,
    body: { songId: target._id },
  });
  check('add song → 1 song', add.json.data.songs.length === 1);

  const addDup = await call('POST', `/api/playlists/${playlistId}/songs`, {
    token: userToken,
    body: { songId: target._id },
  });
  check('duplicate add rejected (409)', addDup.status === 409);

  const second = songs[1];
  await call('POST', `/api/playlists/${playlistId}/songs`, { token: userToken, body: { songId: second._id } });
  const removed = await call('DELETE', `/api/playlists/${playlistId}/songs/${second._id}`, { token: userToken });
  check('remove song → back to 1', removed.json.data.songs.length === 1);

  const renamed = await call('PUT', `/api/playlists/${playlistId}`, { token: userToken, body: { name: 'Renamed Mix' } });
  check('rename playlist', renamed.json.data.name === 'Renamed Mix');

  // access control: another user can't read it
  const otherEmail = `other-${Date.now()}@example.com`;
  await call('POST', '/api/auth/register', { body: { name: 'Other', email: otherEmail, password: 'secret123' } });
  const otherToken = (await call('POST', '/api/auth/login', { body: { email: otherEmail, password: 'secret123' } })).json.data.token;
  const forbidden = await call('GET', `/api/playlists/${playlistId}`, { token: otherToken });
  check("another user can't read private playlist (403)", forbidden.status === 403);
}

/* ---------------- 5. Admin ---------------- */
console.log('\n5. Admin / upload');
const adminToken = (await call('POST', '/api/auth/login', { body: { email: 'admin@sonora.dev', password: 'admin1234' } })).json?.data?.token;
{
  check('admin login', Boolean(adminToken));

  const stats = await call('GET', '/api/admin/stats', { token: adminToken });
  check('admin stats', stats.status === 200 && typeof stats.json.data.totalSongs === 'number');

  const denied = await call('GET', '/api/admin/stats', { token: userToken });
  check('regular user blocked from admin API (403)', denied.status === 403);

  const anonStats = await call('GET', '/api/admin/stats');
  check('anonymous blocked from admin API (401)', anonStats.status === 401);

  const userUpload = await call('POST', '/api/songs', { token: userToken });
  check('regular user cannot upload (403)', userUpload.status === 403);

  // multipart upload of a generated wav
  const samplePath = path.resolve('uploads/audio/neon-horizon.wav');
  const form = new FormData();
  form.append('title', `Uploaded Smoke ${Date.now()}`);
  form.append('artist', 'QA Bot');
  form.append('album', 'Signal Drive');
  form.append('genre', 'Test');
  form.append('duration', '8');
  form.append('audio', new Blob([fs.readFileSync(samplePath)], { type: 'audio/wav' }), 'smoke.wav');

  const upload = await call('POST', '/api/songs', { token: adminToken, body: form });
  check('admin uploads song (201)', upload.status === 201, JSON.stringify(upload.json));
  const uploaded = upload.json?.data;
  check('audioUrl stored', Boolean(uploaded?.audioUrl));

  if (uploaded) {
    const stream = await fetch(`${BASE}/api/songs/${uploaded._id}/stream`, { headers: { Range: 'bytes=0-1023' } });
    check('uploaded song streams (206)', stream.status === 206);

    const edit = await call('PUT', `/api/songs/${uploaded._id}`, {
      token: adminToken,
      body: { title: 'Uploaded Smoke Edited' },
    });
    check('edit song metadata', edit.json.data.title === 'Uploaded Smoke Edited');

    // unlink check: appears in album by title fallback
    const albumList = (await call('GET', '/api/albums')).json.data;
    const signal = albumList.find((a) => a.title === 'Signal Drive');
    const albumView = await call('GET', `/api/albums/${signal._id}`);
    const albumTitles = albumView.json.data.songs.map((s) => s.title);
    check('album page includes title-linked song', albumTitles.includes('Uploaded Smoke Edited'));

    const del = await call('DELETE', `/api/songs/${uploaded._id}`, { token: adminToken });
    check('delete song', del.status === 200);
    const gone = await call('GET', `/api/songs/${uploaded._id}`);
    check('deleted song → 404', gone.status === 404);

    const files = fs.readdirSync(path.resolve('uploads/audio'));
    check('audio file removed from disk', !files.includes(uploaded.audioUrl.split('/').pop()));
  }

  // bad file type rejected
  const badForm = new FormData();
  badForm.append('title', 'Bad');
  badForm.append('artist', 'Bad');
  badForm.append('audio', new Blob(['not audio'], { type: 'text/plain' }), 'evil.txt');
  const rejected = await call('POST', '/api/songs', { token: adminToken, body: badForm });
  check('wrong file type rejected (400)', rejected.status === 400);

  const noAudio = new FormData();
  noAudio.append('title', 'No Audio');
  noAudio.append('artist', 'Nobody');
  const missingAudio = await call('POST', '/api/songs', { token: adminToken, body: noAudio });
  check('missing audio file rejected (400)', missingAudio.status === 400);
}

/* ---------------- 6. Cleanup ---------------- */
console.log('\n6. Cleanup');
{
  const del = await call('DELETE', `/api/playlists/${playlistId}`, { token: userToken });
  check('delete playlist', del.status === 200);
  const gone = await call('GET', `/api/playlists/${playlistId}`, { token: userToken });
  check('deleted playlist → 404', gone.status === 404);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
