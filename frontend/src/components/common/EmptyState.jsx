import { MusicNoteIcon } from './icons.jsx';

export default function EmptyState({ title = 'Nothing here yet', message = '', action = null, icon = true }) {
  return (
    <div className="state-block">
      {icon && (
        <span className="state-block__icon">
          <MusicNoteIcon size={30} />
        </span>
      )}
      <p className="state-block__title">{title}</p>
      {message && <p className="state-block__message">{message}</p>}
      {action}
    </div>
  );
}
