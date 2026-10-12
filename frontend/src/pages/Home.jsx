import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import * as songsService from '../services/songs.service.js';
import * as albumsService from '../services/albums.service.js';
import * as playlistsService from '../services/playlists.service.js';
import * as usersService from '../services/users.service.js';
import Section from '../components/common/Section.jsx';
import MediaGrid from '../components/common/MediaGrid.jsx';
import SongCard from '../components/songs/SongCard.jsx';
import SongList from '../components/songs/SongList.jsx';
import AlbumCard from '../components/albums/AlbumCard.jsx';
import PlaylistCard from '../components/playlists/PlaylistCard.jsx';
import ArtistCard from '../components/artists/ArtistCard.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import CreatePlaylistButton from '../components/playlists/CreatePlaylistButton.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Homepage. Loads three public feeds in parallel (recent, popular, albums)
 * plus personalised data (history, playlists) when the user is logged in.
 */
export default function Home() {
  useDocumentTitle('Home');
  const { user, isAuthenticated } = useAuth();
  const { playFromList } = usePlayer();

  const { data, loading, error, refetch } = useFetch(async () => {
    const [recent, popular, albums] = await Promise.all([
      songsService.list({ sort: 'recent', limit: 12 }),
      songsService.list({ sort: 'popular', limit: 12 }),
      albumsService.list({ limit: 12 }),
    ]);
    return { recent, popular, albums };
  }, []);

  // Personalised feeds re-run whenever the login state changes.
  const history = useFetch(() => usersService.recentlyPlayed(), [user?._id], isAuthenticated);
  const library = useFetch(() => playlistsService.mine(), [user?._id], isAuthenticated);

  // Unique artists from the popular list (cheap client-side derivation).
  const artists = useMemo(() => {
    const names = new Set();
    (data?.popular || []).forEach((song) => song.artist && names.add(song.artist));
    return [...names].slice(0, 8);
  }, [data]);

  if (loading) return <LoadingState label="Loading songs..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { recent = [], popular = [], albums = [] } = data || {};

  return (
    <div className="page page--home">
      <header className="page__hero">
        <div>
          <p className="page__eyebrow">{greeting()}</p>
          <h1>{user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Discover your next favourite sound'}</h1>
        </div>
        <CreatePlaylistButton />
      </header>

      {isAuthenticated && history.data && history.data.length > 0 && (
        <Section title="Recently Played">
          <MediaGrid dense>
            {history.data.slice(0, 6).map((song) => (
              <SongCard key={`recent-${song._id}`} song={song} queue={history.data} />
            ))}
          </MediaGrid>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Recently Added">
          <MediaGrid>
            {recent.map((song) => (
              <SongCard key={`new-${song._id}`} song={song} queue={recent} />
            ))}
          </MediaGrid>
        </Section>
      )}

      {popular.length > 0 && (
        <Section title="Popular right now">
          <SongList songs={popular.slice(0, 8)} showAlbum />
          <div className="section__footer">
            <button type="button" className="btn btn--secondary" onClick={() => playFromList(popular, 0)}>
              Play all popular songs
            </button>
          </div>
        </Section>
      )}

      {albums.length > 0 && (
        <Section title="Albums" to="/search">
          <MediaGrid>
            {albums.map((album) => (
              <AlbumCard key={album._id} album={album} />
            ))}
          </MediaGrid>
        </Section>
      )}

      {artists.length > 0 && (
        <Section title="Artists">
          <MediaGrid dense>
            {artists.map((name) => (
              <ArtistCard key={name} artist={{ name }} />
            ))}
          </MediaGrid>
        </Section>
      )}

      {isAuthenticated && (
        <Section title="Your playlists" to="/library">
          {library.loading && <LoadingState label="Loading playlists..." />}
          {!library.loading && library.data?.length > 0 && (
            <MediaGrid>
              {library.data.map((playlist) => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </MediaGrid>
          )}
          {!library.loading && library.data?.length === 0 && (
            <EmptyState
              title="No playlists yet"
              message="Create your first playlist and start adding songs."
              action={<Link className="btn btn--primary" to="/library">Go to Library</Link>}
            />
          )}
        </Section>
      )}

      {recent.length === 0 && popular.length === 0 && albums.length === 0 && (
        <EmptyState
          title="No songs in the catalog yet"
          message="An admin/artist needs to upload music first."
          action={<Link className="btn btn--primary" to="/search">Search anyway</Link>}
        />
      )}
    </div>
  );
}
