import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { useUI } from '../context/UIContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import * as playlistsService from '../services/playlists.service.js';
import * as songsService from '../services/songs.service.js';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Modal from '../components/common/Modal.jsx';
import SongList from '../components/songs/SongList.jsx';
import CoverImage from '../components/common/CoverImage.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import {
  PlayIcon, PauseIcon, ShuffleIcon, EditIcon, TrashIcon, PlusIcon, SearchIcon,
} from '../components/common/icons.jsx';

/**
 * Modal that lists catalog songs so they can be added to this playlist.
 * Loads the catalog once on mount, filters client-side as you type.
 */
function AddSongsModal({ playlist, onSongsChanged, onClose }) {
  const { showToast } = useUI();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    songsService
      .list({ limit: 100 })
      .then((songs) => alive && setCatalog(songs))
      .catch((err) => alive && showToast(err.message || 'Could not load songs.', 'error'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [showToast]);

  const inPlaylist = new Set((playlist.songs || []).map((song) => String(song._id)));
  const term = filter.trim().toLowerCase();
  const visible = catalog.filter((song) =>
    `${song.title} ${song.artist}`.toLowerCase().includes(term)
  );

  const addSong = async (song) => {
    setBusyId(song._id);
    try {
      const updated = await playlistsService.addSong(playlist._id, song._id);
      onSongsChanged(updated);
      showToast(`Added "${song.title}"`, 'success');
    } catch (err) {
      showToast(err.message || 'Could not add song.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal title={`Add songs to "${playlist.name}"`} onClose={onClose} size="medium">
      <div className="search-box">
        <SearchIcon size={17} />
        <input
          className="search-input"
          placeholder="Filter songs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoFocus
        />
      </div>

      <div className="picker-list picker-list--scroll">
        {loading && <p className="muted">Loading songs...</p>}

        {!loading &&
          visible.map((song) => (
            <div key={song._id} className="picker-list__item picker-list__row">
              <CoverImage
                src={song.coverImage}
                alt={song.title}
                seed={song.title}
                className="picker-cover"
                iconSize={13}
              />
              <span className="picker-list__meta">
                <strong>{song.title}</strong>
                <small>{song.artist}</small>
              </span>

              {inPlaylist.has(String(song._id)) ? (
                <span className="badge">In playlist</span>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={busyId === song._id}
                  onClick={() => addSong(song)}
                >
                  <PlusIcon size={15} /> Add
                </button>
              )}
            </div>
          ))}

        {!loading && visible.length === 0 && <p className="muted">No songs match that filter.</p>}
      </div>
    </Modal>
  );
}

function PlaylistContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, confirm } = useUI();
  const { playFromList, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: playlist, loading, error, refetch } = useFetch(() => playlistsService.get(id), [id]);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [adding, setAdding] = useState(false);

  useDocumentTitle(playlist ? playlist.name : 'Playlist');

  if (loading) return <LoadingState label="Loading playlist..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!playlist) return <EmptyState title="Playlist not found" />;

  const songs = playlist.songs || [];
  const ownsCurrentTrack =
    Boolean(currentTrack) && songs.some((song) => song._id === currentTrack._id);
  const isThisPlaylistPlaying = isPlaying && ownsCurrentTrack;

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (ownsCurrentTrack) togglePlay(); // resume/pause the playlist we're already in
    else playFromList(songs, 0);
  };

  const handleShuffle = () => {
    if (!songs.length) return;
    playFromList([...songs].sort(() => Math.random() - 0.5), 0);
  };

  const handleRename = async (event) => {
    event.preventDefault();
    if (!nameDraft.trim()) return;
    try {
      await playlistsService.update(id, { name: nameDraft.trim() });
      showToast('Playlist renamed', 'success');
      setRenaming(false);
      refetch(); // re-read authoritative server state
    } catch (err) {
      showToast(err.message || 'Could not rename playlist.', 'error');
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete "${playlist.name}"?`,
      message: 'This permanently removes the playlist. The songs themselves stay in the catalog.',
      confirmLabel: 'Delete playlist',
    });
    if (!ok) return;

    try {
      await playlistsService.remove(id);
      showToast('Playlist deleted', 'success');
      navigate('/library');
    } catch (err) {
      showToast(err.message || 'Could not delete playlist.', 'error');
    }
  };

  const handleRemoveSong = async (song) => {
    try {
      await playlistsService.removeSong(id, song._id);
      showToast(`Removed "${song.title}"`, 'info');
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not remove song.', 'error');
    }
  };

  return (
    <div className="page">
      <header className="detail-hero">
        <CoverImage
          src={playlist.coverImage}
          alt={playlist.name}
          seed={playlist._id}
          className="detail-hero__art"
          iconSize={42}
        />
        <div className="detail-hero__info">
          <p className="page__eyebrow">Playlist</p>
          <h1>{playlist.name}</h1>
          <p className="muted">
            {songs.length} song{songs.length === 1 ? '' : 's'} · created{' '}
            {new Date(playlist.createdAt).toLocaleDateString()}
          </p>

          <div className="detail-hero__actions">
            <button type="button" className="btn btn--play" disabled={!songs.length} onClick={handlePlayAll}>
              {isThisPlaylistPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              {isThisPlaylistPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn btn--secondary" disabled={!songs.length} onClick={handleShuffle}>
              <ShuffleIcon size={17} /> Shuffle
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => { setNameDraft(playlist.name); setRenaming(true); }}
            >
              <EditIcon size={16} /> Rename
            </button>
            <button type="button" className="btn btn--danger-outline" onClick={handleDelete}>
              <TrashIcon size={16} /> Delete
            </button>
          </div>
        </div>
      </header>

      {songs.length > 0 ? (
        <SongList songs={songs} onRemove={handleRemoveSong} showAlbum />
      ) : (
        <EmptyState
          title="This playlist is empty"
          message="Add songs from search results or any song card using the + button."
          action={<Link className="btn btn--primary" to="/search">Find songs</Link>}
        />
      )}

      <div className="page__footer-actions">
        <button type="button" className="btn btn--secondary" onClick={() => setAdding(true)}>
          <PlusIcon size={17} /> Add songs
        </button>
      </div>

      {renaming && (
        <Modal title="Rename playlist" onClose={() => setRenaming(false)} size="small">
          <form className="form" onSubmit={handleRename}>
            <label className="field">
              <span>Playlist name</span>
              <input
                className="input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={80}
                autoFocus
              />
            </label>
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setRenaming(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={!nameDraft.trim()}>
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {adding && (
        <AddSongsModal
          playlist={playlist}
          onSongsChanged={() => refetch()}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

export default function PlaylistDetail() {
  return (
    <ProtectedRoute>
      <PlaylistContent />
    </ProtectedRoute>
  );
}
