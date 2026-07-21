import { Skeleton } from "@/components/ui/skeleton";

/** Simula la forma real de `TimeDistributionDonut`: aro + leyenda con horas/%. */
export function DonutChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative flex size-52 shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx={50}
            cy={50}
            r={38}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={14}
          />
          <circle
            cx={50}
            cy={50}
            r={38}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={14}
            strokeDasharray="140 300"
            className="animate-pulse"
          />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 self-stretch">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
