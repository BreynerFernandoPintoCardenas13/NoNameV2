import { NotebookPen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

/** Vista por defecto del dashboard: aún no hay nota abierta. */
export function DashboardPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <EmptyState
        icon={NotebookPen}
        title="Selecciona una nota"
        description="Elige una nota en la sidebar o crea una nueva dentro de un proyecto."
        className="w-full max-w-sm border-none"
      />
    </div>
  );
}
