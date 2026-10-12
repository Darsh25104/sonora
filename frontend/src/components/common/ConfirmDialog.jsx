import Modal from './Modal.jsx';

/**
 * Promise-based confirmation dialog.
 *   const ok = await confirm({ title: 'Delete playlist?', message: '...' });
 *   if (ok) { ... }
 */
export default function ConfirmDialog({ dialog, onAnswer }) {
  if (!dialog) return null;

  return (
    <Modal
      title={dialog.title}
      onClose={() => onAnswer(false)}
      size="small"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={() => onAnswer(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={() => onAnswer(true)}>
            {dialog.confirmLabel}
          </button>
        </>
      }
    >
      {dialog.message && <p className="confirm-message">{dialog.message}</p>}
    </Modal>
  );
}
