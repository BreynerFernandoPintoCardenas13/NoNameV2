import { Skeleton } from "@/components/ui/skeleton";
import { BarChartSkeleton } from "@/modules/admin/components/skeletons/BarChartSkeleton";

/** Simula la forma real de `TimeBreakdownPanel`: promedios + lista + bar chart + dos listas más. */
export function TimeBreakdownSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-8">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <BarChartSkeleton orientation="horizontal" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, col) => (
          <div key={col} className="flex flex-col gap-1.5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
