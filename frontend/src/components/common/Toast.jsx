export default function Toast({ toasts = [] }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

/** Toast notifications rendered by UIProvider (bottom-right / mobile bottom). */