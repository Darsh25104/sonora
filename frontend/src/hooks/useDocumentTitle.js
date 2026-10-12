import { useEffect } from 'react';

/** Sets document.title to "<page> · Sonora" while the component is mounted. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Sonora` : 'Sonora — Stream your sound';
  }, [title]);
}
