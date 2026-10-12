import { usePlayer } from '../../context/PlayerContext.jsx';
import CoverImage from '../common/CoverImage.jsx';
import LikeButton from '../songs/LikeButton.jsx';
import ProgressBar from './ProgressBar.jsx';
import VolumeControl from './VolumeControl.jsx';
import {
  PlayIcon, PauseIcon, NextIcon, PrevIcon, ShuffleIcon, RepeatIcon, RepeatOneIcon,
} from '../common/icons.jsx';

/**
 * Fixed bottom player — rendered once in App.jsx so it (and the audio)
 * survives every route change.
 *
 *  [cover title artist]   [shuffle prev play next repeat]
 *      [time ----●---- time]        [like] [volume]
 */
export default function PlayerBar() {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, isMuted, shuffle, repeat,
    togglePlay, next, previous, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat,
  } = usePlayer();

  if (!currentTrack) return null; // nothing chosen yet → no bar

  const repeatLabel =
    repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one';

  return (
    <footer className="player-bar">
      {/* --- current track ------------------------------------------- */}
      <div className="player-bar__track">
        <CoverImage
          src={currentTrack.coverImage}
          alt={currentTrack.title}
          seed={currentTrack.title}
          className="player-bar__cover"
          iconSize={16}
        />
        <div className="player-bar__meta">
          <span className="player-bar__title">{currentTrack.title}</span>
          <span className="player-bar__artist">{currentTrack.artist}</span>
        </div>
        <LikeButton songId={currentTrack._id} className="player-bar__like" />
      </div>

      {/* --- controls + progress ------------------------------------- */}
      <div className="player-bar__center">
        <div className="player-bar__controls">
          <button
            type="button"
            className={`icon-btn ${shuffle ? 'icon-btn--active' : ''}`}
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            title="Shuffle"
          >
            <ShuffleIcon size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={previous} aria-label="Previous track" title="Previous">
            <PrevIcon size={22} />
          </button>
          <button
            type="button"
            className="player-bar__play"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </button>
          <button type="button" className="icon-btn" onClick={next} aria-label="Next track" title="Next">
            <NextIcon size={22} />
          </button>
          <button
            type="button"
            className={`icon-btn ${repeat !== 'off' ? 'icon-btn--active' : ''}`}
            onClick={cycleRepeat}
            aria-label={`Repeat mode: ${repeat}`}
            title={repeatLabel}
          >
            {repeat === 'one' ? <RepeatOneIcon size={18} /> : <RepeatIcon size={18} />}
          </button>
        </div>

        <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
      </div>

      {/* --- volume --------------------------------------------------- */}
      <div className="player-bar__right">
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
        />
      </div>
    </footer>
  );
}
