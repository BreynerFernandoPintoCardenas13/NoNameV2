"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEVELOPERS, PMS, PROJECTS } from "@/modules/admin/services/mock-admin-data";
import type { AdminFilters } from "@/modules/admin/types";

interface FilterBarProps {
  filters: AdminFilters;
  onChange: (patch: Partial<AdminFilters>) => void;
  onReset: () => void;
}

// Sin OpenProject conectado todavía, las opciones salen de los mismos mocks
// que alimentan los reportes (ver ADMIN_ANALYTICS_PLAN.md §14) — en Fase 4
// vendrán de projects.repository/memberships.repository vía Route Handler.
const PROJECT_OPTIONS = PROJECTS;
const PM_OPTIONS = PMS;
const DEVELOPER_OPTIONS = DEVELOPERS;

/** Filtros globales del panel — comparten estado con la URL vía `useAdminFilters`. */
export function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-date-from" className="text-[11.5px] text-white/50">
          Desde
        </Label>
        <Input
          id="filter-date-from"
          type="date"
          className="h-8 w-36"
          value={filters.dateFrom ?? ""}
          onChange={(e) => onChange({ dateFrom: e.target.value || null })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-date-to" className="text-[11.5px] text-white/50">
          Hasta
        </Label>
        <Input
          id="filter-date-to"
          type="date"
          className="h-8 w-36"
          value={filters.dateTo ?? ""}
          onChange={(e) => onChange({ dateTo: e.target.value || null })}
        />
      </div>

      <FilterSelect
        label="Proyecto"
        value={filters.projectId}
        options={PROJECT_OPTIONS}
        onChange={(value) => onChange({ projectId: value })}
      />
      <FilterSelect
        label="Project Manager"
        value={filters.pmId}
        options={PM_OPTIONS}
        onChange={(value) => onChange({ pmId: value })}
      />
      <FilterSelect
        label="Desarrollador"
        value={filters.developerId}
        options={DEVELOPER_OPTIONS}
        onChange={(value) => onChange({ developerId: value })}
      />

      <Button variant="ghost" size="sm" onClick={onReset} className="text-white/60">
        <RotateCcw /> Limpiar filtros
      </Button>
    </div>
  );
}

const NONE = "none";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly { id: string; name: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11.5px] text-white/50">{label}</Label>
      <Select
        value={value ?? NONE}
        onValueChange={(next) => onChange(next && next !== NONE ? next : null)}
      >
        <SelectTrigger className="h-8 w-44">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
