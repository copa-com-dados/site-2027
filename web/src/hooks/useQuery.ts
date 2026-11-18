import { useEffect, useState, type DependencyList } from 'react';

export type QueryState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }
  | { status: 'success'; data: T; error?: undefined };

// Small in-memory cache so navigating between tabs doesn't flash skeletons.
const cache = new Map<string, unknown>();

/**
 * Minimal async-data hook with caching and race protection.
 * `key` must uniquely identify the request (e.g. "matchup:BRA_ESP").
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { enabled = true, deps = [] }: { enabled?: boolean; deps?: DependencyList } = {},
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>(() =>
    cache.has(key) ? { status: 'success', data: cache.get(key) as T } : { status: 'loading' },
  );

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setState({ status: 'loading' });
      return;
    }
    if (cache.has(key)) {
      setState({ status: 'success', data: cache.get(key) as T });
    } else {
      setState({ status: 'loading' });
    }
    fetcher()
      .then((data) => {
        cache.set(key, data);
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!cancelled && !cache.has(key)) {
          setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
        }
        console.error(`[data] ${key}`, error);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, ...deps]);

  return state;
}

/** Combines several query states: loading until all succeed, error if any fails. */
export function combine<T extends readonly QueryState<unknown>[]>(
  ...states: T
): QueryState<{ [K in keyof T]: T[K] extends QueryState<infer U> ? U : never }> {
  const failed = states.find((s) => s.status === 'error');
  if (failed) return { status: 'error', error: failed.error! };
  if (states.some((s) => s.status === 'loading')) return { status: 'loading' };
  return {
    status: 'success',
    data: states.map((s) => s.data) as { [K in keyof T]: T[K] extends QueryState<infer U> ? U : never },
  };
}
