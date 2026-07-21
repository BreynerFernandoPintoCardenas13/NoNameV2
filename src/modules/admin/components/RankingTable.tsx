"use client";

import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RankingItem } from "@/modules/admin/types";

interface RankingTableProps {
  items: RankingItem[];
  valueLabel: string;
  secondaryLabel?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** Tabla ordenable genérica (PM, Proyecto, Desarrolladores): avatar + nombre + barra de progreso. */
export function RankingTable({ items, valueLabel, secondaryLabel }: RankingTableProps) {
  const [sortByValue, setSortByValue] = React.useState<"value" | "secondaryValue">("value");
  const sorted = React.useMemo(
    () => [...items].sort((a, b) => (b[sortByValue] ?? 0) - (a[sortByValue] ?? 0)),
    [items, sortByValue],
  );
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] tracking-wide text-white/40 uppercase">
            <th className="pb-2 font-medium">Nombre</th>
            <th className="pb-2 font-medium">
              <button
                type="button"
                onClick={() => setSortByValue("value")}
                className="hover:text-white/70"
              >
                {valueLabel}
              </button>
            </th>
            {secondaryLabel && (
              <th className="pb-2 font-medium">
                <button
                  type="button"
                  onClick={() => setSortByValue("secondaryValue")}
                  className="hover:text-white/70"
                >
                  {secondaryLabel}
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id} className="border-t border-white/[0.06]">
              <td className="py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-white/10 text-[11px] text-white/70">
                      {initials(item.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[#f7f7f7]">{item.name}</span>
                </div>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-right text-white/80">{item.value}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/60"
                      style={{ width: `${(item.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              {secondaryLabel && <td className="py-2.5 text-white/60">{item.secondaryValue}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
