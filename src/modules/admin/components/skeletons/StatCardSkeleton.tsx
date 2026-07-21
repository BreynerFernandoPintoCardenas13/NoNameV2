import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="mt-3 h-7 w-1/2" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  );
}
