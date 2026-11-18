import type { ReactNode } from 'react';
import type { QueryState } from '../../hooks/useQuery';
import { ErrorState } from './ErrorState';
import { PageSkeleton } from './Skeleton';

interface AsyncViewProps<T> {
  state: QueryState<T>;
  children: (data: T) => ReactNode;
  fallback?: ReactNode;
}

/** Renders a skeleton while loading, an error card on failure, and `children(data)` on success. */
export function AsyncView<T>({ state, children, fallback = <PageSkeleton /> }: AsyncViewProps<T>) {
  if (state.status === 'loading') return <>{fallback}</>;
  if (state.status === 'error') {
    return <ErrorState message={import.meta.env.DEV ? state.error.message : undefined} />;
  }
  return <>{children(state.data)}</>;
}
