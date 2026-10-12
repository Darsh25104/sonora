import { Link } from 'react-router-dom';
import CoverImage from '../common/CoverImage.jsx';

/** Artist avatar card → jumps to search results for that artist. */
export default function ArtistCard({ artist }) {
  const name = typeof artist === 'string' ? artist : artist.name;

  return (
    <Link to={`/search?q=${encodeURIComponent(name)}`} className="artist-card">
      <CoverImage src={artist?.coverImage} alt={name} seed={name} className="artist-card__art" iconSize={30} />
      <h3 className="artist-card__name">{name}</h3>
      <p className="artist-card__label">Artist</p>
    </Link>
  );
}
