export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-container ${className}`} aria-hidden="true" />;
}

/** Generic page placeholder used while Firestore data loads. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col w-full pb-6 space-y-5 pt-1" role="status" aria-label="Carregando">
      <Skeleton className="h-4 w-48 rounded-full" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-56 w-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
