import { Skeleton } from "@/components/ui/skeleton";

/** Simula la forma real de `DeveloperRankingList`: posición + avatar + barra de progreso por fila. */
export function RankingListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-4 w-5 shrink-0" />
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
