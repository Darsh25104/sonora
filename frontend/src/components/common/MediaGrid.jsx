/** Responsive card grid used for songs, albums, playlists and artists. */
export default function MediaGrid({ children, dense = false }) {
  return <div className={`media-grid${dense ? ' media-grid--dense' : ''}`}>{children}</div>;
}
