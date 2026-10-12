import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useDebounce from '../hooks/useDebounce.js';
import { search as searchService } from '../services/songs.service.js';
import Section from '../components/common/Section.jsx';
import MediaGrid from '../components/common/MediaGrid.jsx';
import SongCard from '../components/songs/SongCard.jsx';
import AlbumCard from '../components/albums/AlbumCard.jsx';
import ArtistCard from '../components/artists/ArtistCard.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { SearchIcon } from '../components/common/icons.jsx';

/**
 * Search page with a debounced query:
 *
 *  keystroke → query state → useDebounce(400ms) → debouncedQuery
 *           → useEffect fires ONE GET /api/search?q=...
 *           → results render in song/album/artist sections
 *
 * The query is also mirrored into the URL (?q=believer) so results are
 * shareable and the topbar search box lands here.
 */
export default function Search() {
  useDocumentTitle('Search');
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebounce(query, 400);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmed = debouncedQuery.trim();

  // Keep the URL in sync without stacking history entries.
  useEffect(() => {
    setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true });
  }, [trimmed, setSearchParams]);

  useEffect(() => {
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    searchService(trimmed)
      .then((data) => alive && setResults(data))
      .catch((err) => alive && setError(err.message || 'Search failed.'))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [trimmed]);

  const hasQuery = trimmed.length > 0;
  const isEmpty =
    results &&
    results.songs.length === 0 &&
    results.albums.length === 0 &&
    results.artists.length === 0;

  return (
    <div className="page">
      <header className="page__header">
        <h1>Search</h1>
        <p className="muted">Find songs, artists and albums by name.</p>
      </header>

      <div className="search-box search-box--lg">
        <SearchIcon size={20} />
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "believer", an artist or an album...'
          aria-label="Search songs, artists and albums"
          autoFocus
        />
        {query && (
          <button type="button" className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {!hasQuery && (
        <EmptyState
          title="Start typing to search"
          message='Search matches song titles, artists, albums and genres — e.g. "believer".'
        />
      )}

      {hasQuery && loading && <LoadingState label="Searching..." />}

      {hasQuery && !loading && error && <ErrorState message={error} />}

      {hasQuery && !loading && !error && isEmpty && (
        <EmptyState
          title={`No results for "${trimmed}"`}
          message="Check the spelling or try a different keyword."
        />
      )}

      {hasQuery && !loading && !error && results && !isEmpty && (
        <>
          {results.songs.length > 0 && (
            <Section title={`Songs (${results.songs.length})`}>
              <MediaGrid>
                {results.songs.map((song) => (
                  <SongCard key={song._id} song={song} queue={results.songs} />
                ))}
              </MediaGrid>
            </Section>
          )}

          {results.albums.length > 0 && (
            <Section title="Albums">
              <MediaGrid>
                {results.albums.map((album) => (
                  <AlbumCard key={album._id} album={album} />
                ))}
              </MediaGrid>
            </Section>
          )}

          {results.artists.length > 0 && (
            <Section title="Artists">
              <MediaGrid dense>
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.name} artist={artist} />
                ))}
              </MediaGrid>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
