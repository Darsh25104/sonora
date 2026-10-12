import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import * as playlistsService from '../services/playlists.service.js';
import * as usersService from '../services/users.service.js';
import Section from '../components/common/Section.jsx';
import MediaGrid from '../components/common/MediaGrid.jsx';
import PlaylistCard from '../components/playlists/PlaylistCard.jsx';
import SongCard from '../components/songs/SongCard.jsx';
import CreatePlaylistButton from '../components/playlists/CreatePlaylistButton.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { HeartIcon, PlayIcon } from '../components/common/icons.jsx';

/**
 * Library = the user's personal shelf:
 *   Liked Songs tile → playlists → recently played.
 */
function LibraryContent() {
  const { user } = useAuth();
  const { playFromList } = usePlayer();

  const playlists = useFetch(() => playlistsService.mine(), []);
  const liked = useFetch(() => usersService.likedSongs(), []);
  const history = useFetch(() => usersService.recentlyPlayed(), []);

  const loading = playlists.loading || liked.loading;
  const error = playlists.error || liked.error;

  if (loading) return <LoadingState label="Loading your library..." />;
  if (error) return <ErrorState message={error} onRetry={() => { playlists.refetch(); liked.refetch(); }} />;

  const likedCount = liked.data?.length || 0;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Your Library</h1>
          <p className="muted">Playlists, liked songs and history — all in one place.</p>
        </div>
        <CreatePlaylistButton />
      </header>

      <Section title="Quick picks">
        <div className="library-tiles">
          <Link to="/liked" className="library-tile library-tile--liked">
            <span className="library-tile__icon"><HeartIcon size={26} filled /></span>
            <span className="library-tile__text">
              <strong>Liked Songs</strong>
              <small>{likedCount} song{likedCount === 1 ? '' : 's'}</small>
            </span>
          </Link>

          <button
            type="button"
            className="library-tile library-tile--history"
            disabled={!history.data?.length}
            onClick={() => history.data?.length && playFromList(history.data, 0)}
          >
            <span className="library-tile__icon"><PlayIcon size={24} /></span>
            <span className="library-tile__text">
              <strong>Recently Played</strong>
              <small>{history.data?.length || 0} songs — play from the top</small>
            </span>
          </button>
        </div>
      </Section>

      <Section title={`Playlists (${playlists.data?.length || 0})`}>
        {playlists.data?.length ? (
          <MediaGrid>
            {playlists.data.map((playlist) => (
              <PlaylistCard key={playlist._id} playlist={playlist} />
            ))}
          </MediaGrid>
        ) : (
          <EmptyState
            title="No playlists yet"
            message={`${user?.name?.split(' ')[0] || 'You'} haven't created any playlists. It takes a second.`}
          />
        )}
      </Section>

      {history.data?.length > 0 && (
        <Section title="Recently played">
          <MediaGrid dense>
            {history.data.slice(0, 6).map((song) => (
              <SongCard key={song._id} song={song} queue={history.data} />
            ))}
          </MediaGrid>
        </Section>
      )}
    </div>
  );
}

export default function Library() {
  useDocumentTitle('Library');
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  );
}
