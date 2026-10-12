import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { useUI } from '../context/UIContext.jsx';
import * as adminService from '../services/admin.service.js';
import * as songsService from '../services/songs.service.js';
import * as albumsService from '../services/albums.service.js';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Modal from '../components/common/Modal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatTime } from '../components/songs/SongList.jsx';
import { UploadIcon, EditIcon, TrashIcon, PlusIcon, DiscIcon } from '../components/common/icons.jsx';

/** Inline edit form for a song's metadata (files are re-uploaded separately). */
function EditSongModal({ song, onSaved, onClose }) {
  const { showToast } = useUI();
  const [form, setForm] = useState({
    title: song.title,
    artist: song.artist,
    album: song.album || 'Single',
    genre: song.genre || '',
  });
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await songsService.update(song._id, form);
      showToast('Song updated', 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Edit "${song.title}"`} onClose={onClose} size="small">
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Title</span>
          <input className="input" value={form.title} onChange={update('title')} required />
        </label>
        <label className="field">
          <span>Artist</span>
          <input className="input" value={form.artist} onChange={update('artist')} required />
        </label>
        <label className="field">
          <span>Album</span>
          <input className="input" value={form.album} onChange={update('album')} />
        </label>
        <label className="field">
          <span>Genre</span>
          <input className="input" value={form.genre} onChange={update('genre')} />
        </label>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Create/edit album form (title, artist, optional cover image). */
function AlbumFormModal({ album = null, onSaved, onClose }) {
  const { showToast } = useUI();
  const [title, setTitle] = useState(album?.title || '');
  const [artist, setArtist] = useState(album?.artist || '');
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('artist', artist.trim());
    if (cover) formData.append('cover', cover);

    setBusy(true);
    try {
      if (album) await albumsService.update(album._id, formData);
      else await albumsService.create(formData);
      showToast(album ? 'Album updated' : 'Album created', 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Could not save album.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={album ? `Edit "${album.title}"` : 'Create album'} onClose={onClose} size="small">
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Album title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          <span>Artist</span>
          <input className="input" value={artist} onChange={(e) => setArtist(e.target.value)} required />
        </label>
        <label className="field">
          <span>Cover image (optional)</span>
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </label>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy || !title.trim() || !artist.trim()}>
            {busy ? 'Saving...' : album ? 'Save changes' : 'Create album'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DashboardContent() {
  useDocumentTitle('Dashboard');
  const { showToast, confirm } = useUI();
  const navigate = useNavigate();

  const stats = useFetch(() => adminService.stats(), []);
  const songs = useFetch(() => songsService.list({ sort: 'recent', limit: 100 }), []);
  const albums = useFetch(() => albumsService.list({ limit: 100 }), []);

  const [editingSong, setEditingSong] = useState(null);
  const [albumModal, setAlbumModal] = useState(null); // { mode: 'create' } | { mode:'edit', album }

  // Refresh the stat cards whenever content changes.
  const refreshAll = () => {
    stats.refetch();
    songs.refetch();
    albums.refetch();
  };

  if (stats.loading || songs.loading) return <LoadingState label="Loading dashboard..." />;
  if (stats.error || songs.error) {
    return <ErrorState message={stats.error || songs.error} onRetry={refreshAll} />;
  }

  const cards = [
    { label: 'Total songs', value: stats.data?.totalSongs ?? 0 },
    { label: 'Total albums', value: stats.data?.totalAlbums ?? 0 },
    { label: 'Total plays', value: stats.data?.totalPlays ?? 0 },
    { label: 'Total users', value: stats.data?.totalUsers ?? 0 },
  ];

  const deleteSong = async (song) => {
    const ok = await confirm({
      title: `Delete "${song.title}"?`,
      message: 'The audio file and cover are removed from storage, and the song disappears from every playlist and liked list. This cannot be undone.',
      confirmLabel: 'Delete song',
    });
    if (!ok) return;
    try {
      await songsService.remove(song._id);
      showToast('Song deleted', 'success');
      refreshAll();
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error');
    }
  };

  const deleteAlbum = async (album) => {
    const ok = await confirm({
      title: `Delete "${album.title}"?`,
      message: 'The album is removed. Its songs stay in the catalog as singles.',
      confirmLabel: 'Delete album',
    });
    if (!ok) return;
    try {
      await albumsService.remove(album._id);
      showToast('Album deleted', 'success');
      refreshAll();
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error');
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Admin / Artist</p>
          <h1>Creator Dashboard</h1>
        </div>
        <Link to="/admin/upload" className="btn btn--play">
          <UploadIcon size={18} /> Upload song
        </Link>
      </header>

      <section className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <strong>{card.value.toLocaleString()}</strong>
            <span>{card.label}</span>
          </div>
        ))}
      </section>

      {/* ---------------- Song management ---------------- */}
      <section className="panel">
        <div className="panel__head">
          <h2>Songs ({songs.data?.length || 0})</h2>
          <Link to="/admin/upload" className="btn btn--secondary btn--sm">
            <PlusIcon size={15} /> New
          </Link>
        </div>

        {songs.data?.length === 0 ? (
          <EmptyState title="No songs yet" message="Upload your first track to get started." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th>Duration</th>
                  <th>Plays</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {songs.data.map((song) => (
                  <tr key={song._id}>
                    <td><strong>{song.title}</strong></td>
                    <td>{song.artist}</td>
                    <td>{song.album || 'Single'}</td>
                    <td>{formatTime(song.duration)}</td>
                    <td>{song.playCount}</td>
                    <td className="table__actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setEditingSong(song)}
                        aria-label={`Edit ${song.title}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => deleteSong(song)}
                        aria-label={`Delete ${song.title}`}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Album management ---------------- */}
      <section className="panel">
        <div className="panel__head">
          <h2>Albums ({albums.data?.length || 0})</h2>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setAlbumModal({ mode: 'create' })}
          >
            <PlusIcon size={15} /> New album
          </button>
        </div>

        {albums.loading && <LoadingState label="Loading albums..." />}

        {!albums.loading && albums.data?.length === 0 && (
          <EmptyState title="No albums yet" message="Group your songs by creating an album." icon />
        )}

        {!albums.loading && albums.data?.length > 0 && (
          <ul className="manage-list">
            {albums.data.map((album) => (
              <li key={album._id} className="manage-list__item">
                <span className="manage-list__icon"><DiscIcon /></span>
                <span className="manage-list__meta">
                  <strong>{album.title}</strong>
                  <small>{album.artist} · {album.songs?.length || 0} songs</small>
                </span>
                <span className="table__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setAlbumModal({ mode: 'edit', album })}
                    aria-label={`Edit ${album.title}`}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => deleteAlbum(album)}
                    aria-label={`Delete ${album.title}`}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingSong && (
        <EditSongModal song={editingSong} onSaved={refreshAll} onClose={() => setEditingSong(null)} />
      )}

      {albumModal?.mode === 'create' && (
        <AlbumFormModal onSaved={refreshAll} onClose={() => setAlbumModal(null)} />
      )}

      {albumModal?.mode === 'edit' && (
        <AlbumFormModal
          album={albumModal.album}
          onSaved={refreshAll}
          onClose={() => setAlbumModal(null)}
        />
      )}

      <div className="page__footer-actions">
        <button type="button" className="btn btn--ghost" onClick={() => navigate('/library')}>
          Back to library
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardContent />
    </ProtectedRoute>
  );
}
