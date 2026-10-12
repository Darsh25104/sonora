import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { likedSongs } from '../services/users.service.js';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import SongList from '../components/songs/SongList.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { HeartIcon, PlayIcon, ShuffleIcon } from '../components/common/icons.jsx';

function LikedContent() {
  useDocumentTitle('Liked Songs');
  const { data: songs, loading, error, refetch } = useFetch(() => likedSongs(), []);
  const { playFromList } = usePlayer();

  const shufflePlay = () => {
    if (!songs?.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playFromList(shuffled, 0);
  };

  return (
    <div className="page">
      <header className="detail-hero detail-hero--liked">
        <span className="detail-hero__art detail-hero__art--gradient">
          <HeartIcon size={48} filled />
        </span>
        <div className="detail-hero__info">
          <p className="page__eyebrow">Playlist</p>
          <h1>Liked Songs</h1>
          <p className="muted">
            {loading ? 'Loading...' : `${songs?.length || 0} song${songs?.length === 1 ? '' : 's'}`}
          </p>
          <div className="detail-hero__actions">
            <button
              type="button"
              className="btn btn--play"
              disabled={!songs?.length}
              onClick={() => playFromList(songs, 0)}
            >
              <PlayIcon size={20} /> Play
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={!songs?.length}
              onClick={shufflePlay}
            >
              <ShuffleIcon size={18} /> Shuffle
            </button>
          </div>
        </div>
      </header>

      {loading && <LoadingState label="Loading your liked songs..." />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && songs?.length === 0 && (
        <EmptyState
          title="No liked songs yet"
          message="Tap the heart on any song to save it here."
          action={<Link className="btn btn--primary" to="/search">Find something you love</Link>}
        />
      )}

      {!loading && !error && songs?.length > 0 && <SongList songs={songs} showAlbum />}
    </div>
  );
}

export default function Liked() {
  return (
    <ProtectedRoute>
      <LikedContent />
    </ProtectedRoute>
  );
}
