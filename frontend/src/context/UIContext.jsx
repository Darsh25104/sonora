import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Toast from '../components/common/Toast.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';

const UIContext = createContext(null);

/**
 * App-wide UI services:
 *  - showToast(message, type)      → transient notifications
 *  - confirm(options)              → Promise<boolean> confirmation dialog
 *    (used before every destructive action: delete song/playlist/album)
 */
export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, resolve }
  const counter = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    counter.current += 1;
    const id = counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  /** Opens the confirm dialog and resolves true (OK) / false (cancel). */
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Delete',
        resolve,
      });
    });
  }, []);

  const settle = useCallback(
    (answer) => {
      dialog?.resolve(answer);
      setDialog(null);
    },
    [dialog]
  );

  const value = useMemo(() => ({ showToast, confirm }), [showToast, confirm]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} />
      <ConfirmDialog dialog={dialog} onAnswer={settle} />
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
