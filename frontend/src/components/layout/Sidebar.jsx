import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import CreatePlaylistButton from '../playlists/CreatePlaylistButton.jsx';
import { LogoMark, HomeIcon, SearchIcon, LibraryIcon, HeartIcon, PlayIcon, PauseIcon } from '../common/icons.jsx';
import CoverImage from '../common/CoverImage.jsx';
import useFetch from '../../hooks/useFetch.js';
import * as playlistsService from '../../services/playlists.service.js';

/** Desktop left navigation. Shows the user's playlists when logged in. */
export default function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const { currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: playlists } = useFetch(() => playlistsService.mine(), [], isAuthenticated);

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar__brand">
        <LogoMark size={34} />
        <span>Sonora</span>
      </Link>

      <nav className="sidebar__nav" aria-label="Primary">
        <NavLink to="/" end>
          <HomeIcon /> <span>Home</span>
        </NavLink>
        <NavLink to="/search">
          <SearchIcon /> <span>Search</span>
        </NavLink>
        <NavLink to="/library">
          <LibraryIcon /> <span>Library</span>
        </NavLink>
        <NavLink to="/liked">
          <HeartIcon size={21} /> <span>Liked Songs</span>
        </NavLink>
      </nav>

      <CreatePlaylistButton className="sidebar__create" />

      <div className="sidebar__playlists">
        <p className="sidebar__label">Your playlists</p>
        {isAuthenticated && playlists?.map((playlist) => (
          <NavLink key={playlist._id} to={`/playlist/${playlist._id}`} className="sidebar__playlist">
            {playlist.name}
          </NavLink>
        ))}
        {isAuthenticated && playlists?.length === 0 && (
          <p className="sidebar__hint">Nothing yet — create one above.</p>
        )}
        {!isAuthenticated && <p className="sidebar__hint">Log in to see your playlists.</p>}
      </div>

      

    {user && ( 
  <Link to="/profile" className="sidebar__profile" style={{ transform: "translateY(-75px)", display: "inline-flex" }}> 
    <span className="avatar avatar--sm">{user.name.charAt(0).toUpperCase()}</span> 
    <span>{user.name}</span> 
  </Link> 
)}


    </aside>
  );
}
