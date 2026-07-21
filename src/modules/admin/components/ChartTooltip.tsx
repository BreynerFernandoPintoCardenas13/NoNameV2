import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

interface ChartTooltipProps extends TooltipContentProps<ValueType, NameType> {
  /** Formatea cada fila del tooltip — por defecto muestra `nombre: valor`. */
  formatRow?: (
    name: NameType,
    value: ValueType,
    payload: Record<string, unknown>,
  ) => React.ReactNode;
}

/** Tooltip glass compartido por todos los charts del panel — un solo lugar para el estilo. */
export function ChartTooltip({ active, payload, label, formatRow }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0a0a]/90 px-3 py-2 text-xs shadow-[0_12px_30px_-10px_rgba(0,0,0,0.9)] backdrop-blur-md">
      {label != null && <p className="mb-1 font-medium text-white/85">{label}</p>}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-1.5 text-white/70">
            {entry.color && (
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
            )}
            {formatRow
              ? formatRow(
                  entry.name ?? "",
                  entry.value ?? 0,
                  (entry.payload ?? {}) as Record<string, unknown>,
                )
              : `${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    </div>
  );
}
