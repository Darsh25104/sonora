import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogoMark, SearchIcon, UserIcon, LogoutIcon, UploadIcon } from '../common/icons.jsx';

/**
 * Sticky top bar: quick search box + profile menu.
 * On mobile it also shows the brand (the sidebar is hidden there).
 */
export default function Topbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown when clicking anywhere else.
  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand" aria-label="Sonora home">
        <LogoMark size={30} />
      </Link>

      <form className="topbar__search" onSubmit={submitSearch} role="search">
        <SearchIcon size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums"
          aria-label="Search"
        />
      </form>

      <div className="topbar__right" ref={menuRef}>
        {isAuthenticated ? (
          <div className="profile-menu">
            <button
              type="button"
              className="profile-menu__trigger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="profile-menu__name">{user.name}</span>
            </button>

            {menuOpen && (
              <div className="profile-menu__dropdown" role="menu">
                <div className="profile-menu__meta">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                  {isAdmin && <span className="badge badge--admin">Admin / Artist</span>}
                </div>
                <Link to="/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <UserIcon size={17} /> Profile
                </Link>
                {isAdmin && (
                  <Link to="/admin" role="menuitem" onClick={() => setMenuOpen(false)}>
                    <UploadIcon size={17} /> Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    navigate('/');
                  }}
                >
                  <LogoutIcon size={17} /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar__auth">
            <Link to="/login" className="btn btn--ghost">Log in</Link>
            <Link to="/register" className="btn btn--primary">Sign up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
