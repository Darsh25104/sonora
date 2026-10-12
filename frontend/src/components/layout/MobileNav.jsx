import { NavLink } from 'react-router-dom';
import { HomeIcon, SearchIcon, LibraryIcon, HeartIcon } from '../common/icons.jsx';

/** Bottom navigation shown on phones/tablets. */
export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary mobile">
      <NavLink to="/" end>
        <HomeIcon size={21} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/search">
        <SearchIcon size={21} />
        <span>Search</span>
      </NavLink>
      <NavLink to="/library">
        <LibraryIcon size={21} />
        <span>Library</span>
      </NavLink>
      <NavLink to="/liked">
        <HeartIcon size={20} />
        <span>Liked</span>
      </NavLink>
    </nav>
  );
}
