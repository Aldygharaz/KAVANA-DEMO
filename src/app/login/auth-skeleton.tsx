import { Skeleton } from "@/components/ui/skeleton";

export function AuthSkeleton({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <Skeleton className="h-8 w-40" />
        <p className="sr-only">{title}</p>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
