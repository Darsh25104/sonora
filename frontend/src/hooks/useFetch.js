import { useCallback, useEffect, useState } from 'react';

/**
 * Small data-fetching hook that gives every API-driven screen the three
 * states it must handle: loading / error / data (+ refetch).
 *
 *   const { data: songs, loading, error, refetch } = useFetch(
 *     () => songsService.list({ sort: 'popular' }),
 *     []
 *   );
 *
 * Rules:
 *  - `fetcher` returns a promise of the payload
 *  - `deps` list everything the fetcher closes over (like useEffect deps)
 *  - pass `enabled = false` to skip the request (e.g. user is logged out)
 */
export default function useFetch(fetcher, deps = [], enabled = true) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.resolve()
      .then(fetcher)
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (alive) {
          setState({ data: null, loading: false, error: err.message || 'Something went wrong. Please try again.' });
        }
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, enabled]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, refetch };
}
