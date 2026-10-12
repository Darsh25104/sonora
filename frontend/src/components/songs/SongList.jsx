import { usePlayer } from '../../context/PlayerContext.jsx';
import CoverImage from '../common/CoverImage.jsx';
import LikeButton from './LikeButton.jsx';
import AddToPlaylistButton from './AddToPlaylistButton.jsx';
import { PlayIcon, PauseIcon, TrashIcon } from '../common/icons.jsx';

/** Formats seconds → "3:45". */
export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Numbered row list used on playlist / album / liked pages.
 * Props:
 *   songs      array to render
 *   onRemove   optional (playlist page) → shows a remove button
 *   showAlbum  show the album column on wide screens
 */
export default function SongList({ songs, onRemove = null, showAlbum = false }) {
  const { playSong, currentTrack, isPlaying, togglePlay } = usePlayer();

  return (
    <div className="song-list">
      <div className="song-list__head">
        <span>#</span>
        <span>Title</span>
        {showAlbum && <span className="col-album">Album</span>}
        <span className="col-duration">Duration</span>
        <span className="col-tools" aria-label="Actions" />
      </div>

      {songs.map((song, index) => {
        const isCurrent = currentTrack && currentTrack._id === song._id;
        const showAsPlaying = isCurrent && isPlaying;

        return (
          <div
            key={song._id}
            className={`song-row ${isCurrent ? 'song-row--current' : ''}`}
            onDoubleClick={() => (isCurrent ? togglePlay() : playSong(song, songs))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && (isCurrent ? togglePlay() : playSong(song, songs))}
          >
            <button
              type="button"
              className="song-row__index"
              onClick={() => (isCurrent ? togglePlay() : playSong(song, songs))}
              aria-label={showAsPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
            >
              <span className="song-row__number">{index + 1}</span>
              <span className="song-row__play">
                {showAsPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </span>
            </button>

            <button
              type="button"
              className="song-row__main"
              onClick={() => (isCurrent ? togglePlay() : playSong(song, songs))}
            >
              <CoverImage src={song.coverImage} alt={song.title} seed={song.title} className="song-row__cover" iconSize={16} />
              <span className="song-row__meta">
                <span className="song-row__title">{song.title}</span>
                <span className="song-row__artist">{song.artist}</span>
              </span>
            </button>

            {showAlbum && <span className="song-row__album col-album">{song.album || 'Single'}</span>}

            <span className="song-row__duration col-duration">{formatTime(song.duration)}</span>

            <span className="song-row__tools col-tools">
              <LikeButton songId={song._id} />
              <AddToPlaylistButton song={song} />
              {onRemove && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRemove(song)}
                  aria-label="Remove from playlist"
                  title="Remove from playlist"
                >
                  <TrashIcon />
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
