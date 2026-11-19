import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageSkeleton } from '../components/ui/Skeleton';
import { ErrorBoundary } from './ErrorBoundary';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="px-gutter-mobile pt-20">
            <PageSkeleton />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
}
