import { Spinner } from './icons.jsx';

export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <Spinner size={30} />
      <p className="state-block__title">{label}</p>
    </div>
  );
}
