import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stayed unchanged for `delay` ms.
 * Used by the search page so we send one request per pause in typing
 * instead of one request per keystroke.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
