import { Link } from 'react-router-dom';
import CoverImage from '../common/CoverImage.jsx';
import { PlayIcon } from '../common/icons.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';

/** Album artwork card → navigates to /album/:id. */
export default function AlbumCard({ album }) {
  const { playFromList } = usePlayer();

  const handleClick = () => {
    // Convenience: if the album already carries songs, start them immediately.
    if (album.songs?.length) playFromList(album.songs, 0);
  };

  return (
    <Link to={`/album/${album._id}`} className="media-card" onClick={handleClick}>
      <div className="media-card__art">
        <CoverImage src={album.coverImage} alt={album.title} seed={album.title} iconSize={34} />
        {album.songs?.length > 0 && (
          <span className="media-card__badge" title={`${album.songs.length} songs`}>
            <PlayIcon size={18} />
          </span>
        )}
      </div>
      <h3 className="media-card__title">{album.title}</h3>
      <p className="media-card__subtitle">{album.artist}</p>
    </Link>
  );
}
