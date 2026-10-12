import { useParams, Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useFetch from '../hooks/useFetch.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { get as getAlbum } from '../services/albums.service.js';
import SongList from '../components/songs/SongList.jsx';
import CoverImage from '../components/common/CoverImage.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { PlayIcon, PauseIcon, ShuffleIcon } from '../components/common/icons.jsx';

/** Album detail page: hero header + full track list. */
export default function AlbumDetail() {
  const { id } = useParams();
  const { playFromList, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: album, loading, error, refetch } = useFetch(() => getAlbum(id), [id]);

  useDocumentTitle(album ? album.title : 'Album');

  if (loading) return <LoadingState label="Loading album..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!album) return <EmptyState title="Album not found" />;

  const songs = album.songs || [];
  const ownsCurrentTrack = Boolean(currentTrack) && songs.some((s) => s._id === currentTrack._id);

  return (
    <div className="page">
      <header className="detail-hero">
        <CoverImage
          src={album.coverImage}
          alt={album.title}
          seed={album._id}
          className="detail-hero__art"
          iconSize={42}
        />
        <div className="detail-hero__info">
          <p className="page__eyebrow">Album</p>
          <h1>{album.title}</h1>
          <p className="muted">
            <Link to={`/search?q=${encodeURIComponent(album.artist)}`}>{album.artist}</Link>
            {' · '}
            {songs.length} song{songs.length === 1 ? '' : 's'}
            {album.createdAt && ` · ${new Date(album.createdAt).getFullYear()}`}
          </p>

          <div className="detail-hero__actions">
            <button
              type="button"
              className="btn btn--play"
              disabled={!songs.length}
              onClick={() => (ownsCurrentTrack ? togglePlay() : playFromList(songs, 0))}
            >
              {isPlaying && ownsCurrentTrack ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              {isPlaying && ownsCurrentTrack ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={!songs.length}
              onClick={() => playFromList([...songs].sort(() => Math.random() - 0.5), 0)}
            >
              <ShuffleIcon size={17} /> Shuffle
            </button>
          </div>
        </div>
      </header>

      {songs.length > 0 ? (
        <SongList songs={songs} showAlbum />
      ) : (
        <EmptyState
          title="No songs in this album"
          message="Songs are linked automatically when they are uploaded with a matching album name."
          action={<Link className="btn btn--primary" to="/search">Browse songs</Link>}
        />
      )}
    </div>
  );
}
