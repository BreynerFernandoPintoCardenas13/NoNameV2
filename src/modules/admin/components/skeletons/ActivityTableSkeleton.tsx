import { Skeleton } from "@/components/ui/skeleton";

/** Simula la forma real de `RecentActivityTable`: filas con badge, avatar y fecha. */
export function ActivityTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-6 border-b border-white/[0.06] pb-2">
        {["Ticket", "Proyecto", "Responsable", "PM", "Fecha"].map((label) => (
          <Skeleton key={label} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 border-t border-white/[0.06] pt-3 first:border-t-0 first:pt-0"
        >
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}
