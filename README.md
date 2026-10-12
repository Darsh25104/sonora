# 🎵 Sonora — Full-Stack Music Streaming App

A Spotify-inspired (but original-branded) music streaming platform where users can
register, browse/search songs, play music in the browser with a persistent global
player, like songs, manage playlists, view play history — and where admins/artists
can upload audio + cover art, organize albums, and manage the catalog.

> **Built for learning.** Every layer is intentionally separated
> (routes → controllers → models/services) so you can read the code like a textbook.

---

## 1. Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, React Router 6, Axios, Context API, plain CSS (design tokens), Vite |
| Backend   | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, Helmet, CORS, rate limiting |
| Database  | MongoDB |
| Storage   | Local disk (`uploads/`) for development · **Cloudinary** for production |
| Auth      | Stateless JWT (`Authorization: Bearer <token>`) |

---

## 2. Project structure

```
sonora/
├── backend/
│   ├── config/
│   │   ├── db.js               # Mongoose connection (MONGO_URI)
│   │   └── storage.js          # storage provider selection (local | cloudinary)
│   ├── controllers/            # ALL request logic lives here (thin routes)
│   │   ├── auth.controller.js      # register / login / me / update me
│   │   ├── song.controller.js      # CRUD, likes, play counts
│   │   ├── stream.controller.js    # HTTP range-request audio streaming
│   │   ├── album.controller.js     # album CRUD
│   │   ├── playlist.controller.js  # playlist CRUD + add/remove songs
│   │   ├── search.controller.js    # unified song/album/artist search
│   │   ├── user.controller.js      # liked songs + recently played
│   │   └── admin.controller.js     # dashboard statistics
│   ├── middleware/
│   │   ├── auth.js            # requireAuth (verify JWT) + requireAdmin (role)
│   │   ├── upload.js          # Multer config: type filter + size limits
│   │   └── errorHandler.js    # 404 + central {success:false,message} formatter
│   ├── models/                 # Mongoose schemas (User, Song, Album, Playlist)
│   ├── routes/                 # URL → controller wiring only
│   ├── services/
│   │   └── storage.service.js # saves/removes files (local or Cloudinary)
│   ├── scripts/
│   │   ├── seedDemo.js        # demo users, 6 generated .wav tracks, album
│   │   ├── createAdmin.js     # create/promote an admin account
│   │   └── devMongo.js        # optional in-memory MongoDB for dev
│   ├── uploads/               # local file storage (audio/, covers/, tmp/)
│   ├── utils/                 # ApiError, asyncHandler, response, validation, token
│   ├── .env.example
│   ├── server.js              # entry point: middleware, routes, DB, listen
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.js          # dev proxy: /api + /uploads → localhost:5000
    ├── .env.example
    └── src/
        ├── components/
        │   ├── common/         # icons, Modal, Toast, ConfirmDialog, states...
        │   ├── layout/         # AppLayout, Sidebar, Topbar, MobileNav
        │   ├── player/         # PlayerBar, ProgressBar, VolumeControl
        │   ├── songs/          # SongCard, SongList, LikeButton, AddToPlaylist
        │   ├── albums/         # AlbumCard
        │   ├── playlists/      # PlaylistCard, CreatePlaylistButton
        │   └── artists/        # ArtistCard
        ├── context/            # AuthContext, PlayerContext, UIContext
        ├── hooks/              # useDebounce, useFetch, useDocumentTitle
        ├── pages/              # Home, Search, Library, Liked, Playlist, Album,
        │                       # Login, Register, Profile, Admin, Upload, 404
        ├── services/           # api.js (axios instance) + one file per resource
        ├── styles/             # global, layout, components, player, pages
        ├── App.jsx             # routes + persistent PlayerBar/Toast/Confirm
        └── main.jsx            # provider tree: Auth → UI → Player → App
```

### Folder responsibilities (why they exist)

- **`routes/`** — maps URLs to controllers. No logic, so endpoints are scannable.
- **`controllers/`** — one function per action; validation + orchestration.
- **`models/`** — data shape + relationships + hooks (password hashing).
- **`middleware/`** — cross-cutting concerns: auth, roles, uploads, errors.
- **`services/`** — side-effectful integrations (file storage) behind a small API,
  so swapping local ↔ Cloudinary never touches controllers.
- **`services/` (frontend)** — the only files that know API endpoints; the app
  never hardcodes URLs or the base URL elsewhere.
- **`context/`** — global state that must survive page navigation (user, player).
- **`hooks/`** — reusable stateful logic (debounce, fetch lifecycle).

---

## 3. Setup instructions

### Prerequisites
- Node.js ≥ 18 (tested on 24)
- npm ≥ 9
- MongoDB: local install **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
  *(or use the bundled in-memory dev MongoDB — see §5)*

### 1) Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows: copy .env.example .env  (macOS/Linux)
# edit .env — at minimum set MONGO_URI and JWT_SECRET
```

### 2) Frontend

```bash
cd frontend
npm install
```

---

## 4. Environment variables

### `backend/.env`

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `NODE_ENV` | environment flag | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/sonora` |
| `JWT_SECRET` | token signing key (**never commit**) | 96 random hex chars |
| `JWT_EXPIRES_IN` | token lifetime | `7d` |
| `CLIENT_URL` | CORS allowed origin(s), comma separated | `http://localhost:5173` |
| `CLOUD_STORAGE_PROVIDER` | `local` or `cloudinary` | `local` |
| `CLOUD_STORAGE_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUD_STORAGE_KEY` | Cloudinary API key | `...` |
| `CLOUD_STORAGE_SECRET` | Cloudinary API secret | `...` |
| `CLOUDINARY_FOLDER` | CDN folder prefix | `sonora` |
| `MAX_AUDIO_SIZE_MB` | audio upload cap | `50` |
| `MAX_IMAGE_SIZE_MB` | image upload cap | `5` |
| `ADMIN_*` | defaults for `npm run create-admin` | — |

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `frontend/.env`

```bash
# Dev: leave unset → Vite proxy forwards /api to localhost:5000
# Prod: full URL of the deployed API
VITE_API_BASE_URL=https://your-api.onrender.com/api
```

**Never hardcode secrets** — frontend env vars are public by definition.

---

## 5. MongoDB setup

**Option A — MongoDB Atlas (recommended, no install):**
1. Create a free cluster → *Database Access* → add a user → *Network Access* → allow your IP.
2. *Connect → Drivers* → copy the connection string into `MONGO_URI`.

**Option B — Local MongoDB:** install from mongodb.com, then
`MONGO_URI=mongodb://127.0.0.1:27017/sonora`.

**Option C — In-memory dev MongoDB (zero install):**

```bash
cd backend
npm run dev:mongo     # terminal 1 — throwaway MongoDB on port 27017
npm run seed          # terminal 2 — demo users + tracks
npm run dev           # terminal 2 — start API
```

---

## 6. Cloud storage setup (Cloudinary)

1. Create a free Cloudinary account → copy **Cloud Name / API Key / API Secret**.
2. In `backend/.env`:
   ```env
   CLOUD_STORAGE_PROVIDER=cloudinary
   CLOUD_STORAGE_NAME=your-cloud-name
   CLOUD_STORAGE_KEY=your-api-key
   CLOUD_STORAGE_SECRET=your-api-secret
   ```
3. Restart the API. New uploads now go to the CDN (`saveAudio`/`saveImage`
   handle the transfer), and the stream endpoint 302-redirects to the CDN URL.

**How local storage works instead (development):**
- Multer writes uploads to `uploads/tmp/` with type + size validation.
- `storage.service.js` moves them to `uploads/audio/` and `uploads/covers/`.
- Express serves `/uploads` statically, and `/api/songs/:id/stream` reads the
  file with **Range support** for efficient seeking.
- Files are referenced in MongoDB as URLs only — *audio bytes never enter the database*.

---

## 7. Creating an admin user

```bash
cd backend
npm run create-admin                                    # uses ADMIN_* from .env
npm run create-admin -- me@mail.com "My Name" secret123  # or pass arguments
```

Only `role: "admin"` accounts can reach `/api/admin/*` and upload songs.
Normal self-registration always creates `role: "user"` (no role escalation).

---

## 8. Running the app

```bash
# terminal 1 — API
cd backend && npm run dev          # http://localhost:5000

# terminal 2 — frontend
cd frontend && npm run dev         # http://localhost:5173
```

Optional first load of demo content:

```bash
cd backend && npm run seed
#  → admin@sonora.dev / admin1234
#  → demo@sonora.dev  / demo1234
#  → 6 original generated .wav tracks, an album, a playlist, likes & history
```

---

## 9. Testing the critical flows

### Upload (admin)
1. Log in as `admin@sonora.dev` → avatar menu → **Dashboard** → **Upload song**.
2. Fill title/artist, pick an `.mp3/.wav/.ogg` and an optional cover, submit.
3. Progress bar → toast → song appears on Home (“Recently Added”).

### Streaming
- DevTools → *Network* → filter `stream` → click a song → status **206 Partial
  Content** with `Content-Range: bytes 0-…` — that's range streaming working.
- Drag the seek bar: each jump issues a new ranged request instead of
  re-downloading the file.

### Full user flow
```
Register → Login → Home → Search "believer" → click song → audio plays
→ navigate (music keeps playing) → ♥ like → + add to playlist
→ song ends → next plays automatically → appears in Recently Played
```

### API smoke tests (PowerShell)
```powershell
$r = Invoke-RestMethod http://localhost:5000/health
$songs = Invoke-RestMethod http://localhost:5000/api/songs
$songs.data.title
```

---

## 10. API reference

Base URL: `http://localhost:5000` — all responses
`{ success, message, data }` / `{ success: false, message }`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | create account → `{token,user}` |
| POST | `/api/auth/login` | – | login → `{token,user}` |
| GET | `/api/auth/me` | user | current profile |
| PUT | `/api/auth/me` | user | update name / profile image |
| GET | `/api/songs` | – | `?sort=recent\|popular\|title&limit=&artist=&album=&genre=` |
| GET | `/api/songs/:id` | – | single song |
| GET | `/api/songs/:id/stream` | – | **range-request audio streaming** |
| POST | `/api/songs` | admin | multipart upload (`audio`, `cover`, metadata) |
| PUT | `/api/songs/:id` | owner/admin | edit metadata / re-upload files |
| DELETE | `/api/songs/:id` | owner/admin | delete + purge references |
| POST | `/api/songs/:id/like` | user | like (idempotent) |
| DELETE | `/api/songs/:id/like` | user | unlike |
| POST | `/api/songs/:id/play` | user | +1 play, record history |
| GET | `/api/search?q=…` | – | `{songs, albums, artists}` |
| GET | `/api/albums` | – | list albums |
| GET | `/api/albums/:id` | – | album + populated songs |
| POST/PUT/DELETE | `/api/albums[/:id]` | admin | album management |
| GET | `/api/playlists` | user | my playlists |
| POST | `/api/playlists` | user | create (`name`, optional `cover`) |
| GET/PUT/DELETE | `/api/playlists/:id` | owner/admin | read / rename / delete |
| POST | `/api/playlists/:id/songs` | owner/admin | add (`songId`) |
| DELETE | `/api/playlists/:id/songs/:songId` | owner/admin | remove |
| GET | `/api/users/me/liked` | user | liked songs (populated) |
| GET | `/api/users/me/recently-played` | user | newest first, max 30 |
| GET | `/api/admin/stats` | admin | totals + play count |

---

## 11. Deployment

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build          # outputs dist/
```
- **Vercel:** framework *Vite*, build `npm run build`, output `dist`.
- **Netlify:** build `npm run build`, publish `dist`.
- Set env var `VITE_API_BASE_URL=https://your-api-domain/api` **before building**
  (env vars are baked in at build time).

### Backend (Render / Railway / Fly.io)
1. Root directory `backend`, build `npm install`, start `npm start`.
2. Environment variables: everything from §4 —
   `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL=https://your-frontend-domain`,
   `CLOUD_STORAGE_PROVIDER=cloudinary` + credentials, `NODE_ENV=production`.
3. Health check path: `/health`.
4. **Persistent disk note:** Render’s free tier has an ephemeral filesystem —
   use Cloudinary (or a persistent disk + `CLOUD_STORAGE_PROVIDER=local`) in production.

### Deploy checklist
- [ ] `JWT_SECRET` is a long random value (not the example!)
- [ ] `CLIENT_URL` set to the exact frontend origin (CORS)
- [ ] Atlas IP access list allows the hosting provider
- [ ] Cloudinary configured (or persistent disk mounted)
- [ ] Frontend rebuilt with the production `VITE_API_BASE_URL`
- [ ] Admin account created via `npm run create-admin`

---

## 12. Production considerations

**Security**
- bcrypt hashing (cost 10, bcryptjs = same $2b$ algorithm, pure JS); passwords never leave the DB (`select: false` + `toPublicJSON`)
- JWT expiry + 401 broadcast → client session cleanup
- Helmet security headers, CORS allow-list, rate-limited auth endpoints
- Multer type + size validation; regex input escaping (ReDoS safe)
- Role checks server-side on every admin route (UI hiding is not security)
- Secrets only in `.env` / host env vars

**Robustness**
- Central error handler → consistent `{success:false,message}`
- Upload cleanup on partial failure; reference purging on delete
- Idempotent likes (`$addToSet`), deduped + capped history (30)
- Loading / empty / error states on every API-driven screen

**Scalability ideas (good next projects)**
- CDN + signed URLs for audio; streaming via cloud storage directly
- Text index or Elasticsearch/Meilisearch for search at scale
- Redis cache for popular/trending queries
- Pagination (`skip/limit` or cursor-based) instead of `limit: 100`
- Refresh-token rotation, email verification, password reset
- Waveform generation (peeks) from uploaded audio
- Play analytics aggregated hourly instead of per-play writes

---

## 13. Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing required environment variable` | create `backend/.env` from `.env.example` |
| CORS error in browser | set `CLIENT_URL` in `backend/.env` to the frontend origin |
| `Cannot reach the server` toast | backend not running on :5000, or `VITE_API_BASE_URL` wrong |
| Song won't play | check file exists in `uploads/audio/`; see API logs; verify format mp3/wav/ogg |
| `Forbidden` on Dashboard | account role is `user` → run `npm run create-admin` |
| Upload rejected instantly | file type/size limits — see `MAX_*_SIZE_MB` |
| Mongo connection failed | Atlas IP allow-list / local mongod running / `npm run dev:mongo` |

---

## License
Original code and generated demo audio — free to use for learning and portfolio work.
“Sonora” is an original brand; no Spotify assets are used.
