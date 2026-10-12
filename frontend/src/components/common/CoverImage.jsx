import { useState } from 'react';
import { mediaUrl } from '../../services/api.js';
import { MusicNoteIcon } from './icons.jsx';

/**
 * Deterministic gradient artwork for items without a cover image —
 * the same seed always produces the same colours.
 */
function gradientFor(seed = '') {
  const text = String(seed);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 360;
  }
  return `linear-gradient(135deg, hsl(${hash} 70% 45%), hsl(${(hash + 60) % 360} 70% 30%))`;
}

/**
 * Cover artwork with graceful fallback:
 *   image (if stored) → gradient + music note (if missing/broken)
 */
export default function CoverImage({ src, alt = '', seed, className = '', iconSize = 26 }) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src);
  const showImage = resolved && !failed;

  return (
    <div
      className={`cover-image ${className}`}
      style={showImage ? undefined : { background: gradientFor(seed || alt) }}
    >
      {showImage ? (
        <img src={resolved} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="cover-image__placeholder" aria-hidden="true">
          <MusicNoteIcon size={iconSize} />
        </span>
      )}
    </div>
  );
}
