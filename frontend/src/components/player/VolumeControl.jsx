import { VolumeIcon, MuteIcon } from '../common/icons.jsx';

/** Mute toggle + volume slider (hidden on small screens). */
export default function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }) {
  const visualVolume = isMuted ? 0 : volume;

  return (
  <div className="volume" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <button
      type="button"
      className="icon-btn"
      onClick={onToggleMute}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      title={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted || volume === 0 ? <MuteIcon size={18} /> : <VolumeIcon size={18} />}
    </button>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={visualVolume}
      onChange={(e) => onVolumeChange(Number(e.target.value))}
      aria-label="Volume"
      style={{ 
        '--progress': `${visualVolume * 100}%`,
        width: '100px', /* Controls the length of the slider */
        maxWidth: '100%' /* Prevents overflow if space shrinks */
      }}
    />
  </div>
);
}