import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import * as playlistsService from '../../services/playlists.service.js';
import Modal from '../common/Modal.jsx';
import { PlusIcon } from '../common/icons.jsx';

/**
 * "Create playlist" button (sidebar + library page).
 * Flow: click → modal → POST /api/playlists → navigate to the new playlist.
 */
export default function CreatePlaylistButton({ className = '', label = 'Create playlist' }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleOpen = () => {
    if (!isAuthenticated) {
      showToast('Log in to create playlists.', 'info');
      return;
    }
    setName('');
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || busy) return;

    setBusy(true);
    try {
      const playlist = await playlistsService.create(name.trim());
      showToast(`Playlist "${playlist.name}" created`, 'success');
      setOpen(false);
      navigate(`/playlist/${playlist._id}`);
    } catch (err) {
      showToast(err.message || 'Could not create the playlist.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={`btn btn--secondary ${className}`} onClick={handleOpen}>
        <PlusIcon size={17} /> <span>{label}</span>
      </button>

      {open && (
        <Modal title="Create a new playlist" onClose={() => setOpen(false)} size="small">
          <form onSubmit={handleSubmit} className="form">
            <label className="field">
              <span>Playlist name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Workout"
                maxLength={80}
                autoFocus
              />
            </label>
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={busy || !name.trim()}>
                {busy ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
