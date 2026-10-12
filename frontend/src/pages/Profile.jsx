import { useState } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import * as usersService from '../services/users.service.js';
import * as playlistsService from '../services/playlists.service.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { UploadIcon, LogoutIcon, EditIcon } from '../components/common/icons.jsx';

/** Profile page: account info, personal stats, rename form, logout. */
export default function Profile() {
  useDocumentTitle('Profile');
  const { user, isAdmin, logout, updateProfile } = useAuth();
  const { showToast } = useUI();

  const liked = useFetch(() => usersService.likedSongs(), []);
  const playlists = useFetch(() => playlistsService.mine(), []);
  const history = useFetch(() => usersService.recentlyPlayed(), []);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);

  const stats = [
    { label: 'Liked songs', value: liked.loading ? '…' : liked.data?.length ?? 0 },
    { label: 'Playlists', value: playlists.loading ? '…' : playlists.data?.length ?? 0 },
    { label: 'Recently played', value: history.loading ? '…' : history.data?.length ?? 0 },
  ];

  const saveName = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      showToast('Name must be at least 2 characters.', 'error');
      return;
    }
    setBusy(true);
    try {
      await updateProfile({ name: name.trim() });
      showToast('Profile updated', 'success');
      setEditing(false);
    } catch (err) {
      showToast(err.message || 'Could not update profile.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (liked.error || playlists.error) {
    return <ErrorState message={liked.error || playlists.error} onRetry={() => { liked.refetch(); playlists.refetch(); }} />;
  }

  return (
    <div className="page page--narrow">
      <header className="profile-header">
        <span className="avatar avatar--xl">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <p className="page__eyebrow">Profile</p>
          <h1>{user.name}</h1>
          <p className="muted">
            {user.email}
            {isAdmin && <span className="badge badge--admin">Admin / Artist</span>}
          </p>
          <p className="muted">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </header>

      <section className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Account</h2>

        {editing ? (
          <form className="form" onSubmit={saveName}>
            <label className="field">
              <span>Display name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
            </label>
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => { setName(user.name); setEditing(false); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-actions">
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(true)}>
              <EditIcon size={16} /> Edit name
            </button>

            {isAdmin && (
              <Link to="/admin" className="btn btn--secondary">
                <UploadIcon size={17} /> Creator dashboard
              </Link>
            )}

            <button type="button" className="btn btn--danger-outline" onClick={logout}>
              <LogoutIcon size={16} /> Log out
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Library shortcuts</h2>
        <div className="profile-actions">
          <Link to="/liked" className="btn btn--ghost">Liked Songs</Link>
          <Link to="/library" className="btn btn--ghost">Your Library</Link>
          <Link to="/search" className="btn btn--ghost">Search</Link>
        </div>
      </section>

      {liked.loading && <LoadingState label="Loading your stats..." />}
    </div>
  );
}
