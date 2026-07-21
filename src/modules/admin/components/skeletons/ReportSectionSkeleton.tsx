import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder de carga para una sección de reporte: sugiere ejes + barras, sin ser un chart real todavía. */
export function ReportSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Skeleton className="h-16 w-1/6" />
        <Skeleton className="h-24 w-1/6" />
        <Skeleton className="h-10 w-1/6" />
        <Skeleton className="h-20 w-1/6" />
        <Skeleton className="h-14 w-1/6" />
        <Skeleton className="h-24 w-1/6" />
      </div>
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
