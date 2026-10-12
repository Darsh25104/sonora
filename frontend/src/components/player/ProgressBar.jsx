import { formatTime } from '../songs/SongList.jsx';

/**
 * Seek bar + time labels.
 * Uses a native range input (keyboard accessible for free).
 * On change we seek the audio element immediately.
 */
export default function ProgressBar({ currentTime, duration, onSeek }) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="progress">
      <span className="progress__time">{formatTime(currentTime)}</span>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${progress}%` }} />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={!duration}
          aria-label="Seek through track"
          style={{ '--progress': `${progress}%` }}
        />
      </div>
      <span className="progress__time">{formatTime(duration)}</span>
    </div>
  );
}
