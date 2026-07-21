import { Skeleton } from "@/components/ui/skeleton";

/** Simula la forma de `TrendChart`: totales arriba + trazo ondulado con puntos. */
export function LineChartSkeleton() {
  return (
    <div>
      <div className="mb-4 flex items-baseline gap-6">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <svg
          viewBox="0 0 300 100"
          className="h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,70 C30,50 60,80 90,55 C120,35 150,60 180,40 C210,25 240,50 270,30 L300,45"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={2}
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}
