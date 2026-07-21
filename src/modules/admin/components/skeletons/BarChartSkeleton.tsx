import { Skeleton } from "@/components/ui/skeleton";

const HORIZONTAL_WIDTHS = ["85%", "70%", "60%", "45%", "35%"];
const COLUMN_HEIGHTS = ["55%", "80%", "40%", "95%", "65%"];

/** Simula la forma real de `DistributionChart`: barras horizontales o columnas, según `orientation`. */
export function BarChartSkeleton({
  orientation = "horizontal",
}: {
  orientation?: "horizontal" | "columns";
}) {
  if (orientation === "columns") {
    return (
      <div className="flex h-[220px] items-end justify-around gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        {COLUMN_HEIGHTS.map((height, i) => (
          <div key={i} className="flex w-full flex-col items-center gap-2">
            <Skeleton className="w-full rounded-t-md" style={{ height }} />
            <Skeleton className="size-6 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      {HORIZONTAL_WIDTHS.map((width, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-3 w-16 shrink-0" />
          <Skeleton className="h-5 rounded-r-md" style={{ width }} />
        </div>
      ))}
    </div>
  );
}
