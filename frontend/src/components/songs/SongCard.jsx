import { usePlayer } from '../../context/PlayerContext.jsx';
import CoverImage from '../common/CoverImage.jsx';
import LikeButton from './LikeButton.jsx';
import AddToPlaylistButton from './AddToPlaylistButton.jsx';
import { PlayIcon, PauseIcon } from '../common/icons.jsx';

/**
 * Reusable song card (home, search, album, playlists...).
 * Clicking anywhere on the card starts playback of this song within `queue`.
 */
export default function SongCard({ song, queue = [] }) {
  const { playSong, currentTrack, isPlaying, togglePlay } = usePlayer();

  const isCurrent = currentTrack && currentTrack._id === song._id;
  const showAsPlaying = isCurrent && isPlaying;

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else playSong(song, queue.length ? queue : [song]);
  };

  return (
    <article
      className={`song-card ${isCurrent ? 'song-card--current' : ''}`}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handlePlay())}
    >
      <div className="song-card__art">
        <CoverImage src={song.coverImage} alt={song.title} seed={song.title} />
        <span className="song-card__play" aria-hidden="true">
          {showAsPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
        </span>
      </div>

      <div className="song-card__body">
        <h3 className="song-card__title">{song.title}</h3>
        <p className="song-card__artist">{song.artist}</p>
      </div>

      <div className="song-card__actions" onClick={(e) => e.stopPropagation()}>
        <LikeButton songId={song._id} />
        <AddToPlaylistButton song={song} />
      </div>
    </article>
  );
}
