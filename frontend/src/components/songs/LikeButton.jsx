import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import * as songsService from '../../services/songs.service.js';
import { HeartIcon } from '../common/icons.jsx';

/**
 * Heart toggle for a song.
 * Flow: click → optimistic UI update → API call → sync state with response.
 * (If the request fails we revert and show a toast.)
 */
export default function LikeButton({ songId, className = '' }) {
  const { isAuthenticated, likedIds, setLikedSongs } = useAuth();
  const { showToast } = useUI();

  const liked = likedIds.has(String(songId));

  const handleClick = async (event) => {
    event.stopPropagation(); // don't trigger the parent card's play action

    if (!isAuthenticated) {
      showToast('Log in to like songs.', 'info');
      return;
    }

    const previous = [...likedIds];
    // Optimistic: flip instantly for a snappy feel.
    setLikedSongs(liked ? previous.filter((id) => String(id) !== String(songId)) : [...previous, songId]);

    try {
      const result = liked ? await songsService.unlike(songId) : await songsService.like(songId);
      setLikedSongs(result.likedSongs);
    } catch (err) {
      setLikedSongs(previous); // revert
      showToast(err.message || 'Could not update your likes.', 'error');
    }
  };

  return (
    <button
      type="button"
      className={`icon-btn like-btn ${liked ? 'like-btn--on' : ''} ${className}`}
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
      title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
    >
      <HeartIcon size={18} filled={liked} />
    </button>
  );
}
