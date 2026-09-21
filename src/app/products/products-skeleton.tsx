import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton halaman listing produk (dipakai Suspense fallback & loading state) */
export function ProductsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-full rounded-md sm:w-44" />
        <Skeleton className="h-10 w-full rounded-md sm:w-48" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
