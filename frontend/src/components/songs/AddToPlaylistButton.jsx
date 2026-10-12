import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import * as playlistsService from '../../services/playlists.service.js';
import Modal from '../common/Modal.jsx';
import { PlusIcon, ListIcon } from '../common/icons.jsx';

/**
 * "+" button on every song row/card → modal listing the user's playlists.
 * Selecting one adds the song; a new playlist can be created inline.
 */
export default function AddToPlaylistButton({ song, className = '' }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const openModal = async (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      showToast('Log in to create playlists.', 'info');
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      setPlaylists(await playlistsService.mine());
    } catch (err) {
      showToast(err.message || 'Could not load playlists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addTo = async (playlistId) => {
    setBusy(true);
    try {
      const playlist = await playlistsService.addSong(playlistId, song._id);
      showToast(`Added "${song.title}" to ${playlist.name}`, 'success');
      setOpen(false);
    } catch (err) {
      showToast(err.message || 'Could not add song.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const createAndAdd = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const playlist = await playlistsService.create(newName.trim());
      await playlistsService.addSong(playlist._id, song._id);
      showToast(`Created ${playlist.name} and added "${song.title}"`, 'success');
      setNewName('');
      setPlaylists((prev) => [playlist, ...prev]);
      navigate(`/playlist/${playlist._id}`);
      setOpen(false);
    } catch (err) {
      showToast(err.message || 'Could not create playlist.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`icon-btn ${className}`}
        onClick={openModal}
        aria-label="Add to playlist"
        title="Add to playlist"
      >
        <PlusIcon size={18} />
      </button>

      {open && (
        <Modal title={`Add "${song.title}" to playlist`} onClose={() => setOpen(false)} size="small">
          <form className="inline-form" onSubmit={createAndAdd}>
            <input
              className="input"
              placeholder="New playlist name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={80}
            />
            <button type="submit" className="btn btn--primary" disabled={busy || !newName.trim()}>
              Create
            </button>
          </form>

          <div className="picker-list">
            {loading && <p className="muted">Loading playlists...</p>}
            {!loading && playlists.length === 0 && (
              <p className="muted">No playlists yet — create the first one above.</p>
            )}
            {!loading &&
              playlists.map((playlist) => (
                <button
                  key={playlist._id}
                  type="button"
                  className="picker-list__item"
                  disabled={busy}
                  onClick={() => addTo(playlist._id)}
                >
                  <ListIcon size={16} />
                  <span>{playlist.name}</span>
                  <span className="muted">{playlist.songs?.length || 0} songs</span>
                </button>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
