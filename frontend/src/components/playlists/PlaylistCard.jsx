import { Link } from 'react-router-dom';
import CoverImage from '../common/CoverImage.jsx';
import { ListIcon } from '../common/icons.jsx';

/** Playlist card → navigates to /playlist/:id. */
export default function PlaylistCard({ playlist }) {
  const count = playlist.songs?.length ?? 0;

  return (
    <Link to={`/playlist/${playlist._id}`} className="media-card">
      <div className="media-card__art">
        <CoverImage
          src={playlist.coverImage}
          alt={playlist.name}
          seed={playlist._id || playlist.name}
          iconSize={34}
        />
        <span className="media-card__badge media-card__badge--muted" title={`${count} songs`}>
          <ListIcon size={16} />
        </span>
      </div>
      <h3 className="media-card__title">{playlist.name}</h3>
      <p className="media-card__subtitle">{count} song{count === 1 ? '' : 's'}</p>
    </Link>
  );
}
