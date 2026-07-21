import { AdminDashboardShell } from "@/modules/admin/components/AdminDashboardShell";
import { ReportSectionCard } from "@/modules/admin/components/ReportSectionCard";
import { REPORT_SECTIONS } from "@/modules/admin/utils/report-sections";
import { Eyebrow } from "@/components/landing/Eyebrow";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";

/**
 * Panel Administrador — Fase 2: estructura visual y navegación únicamente.
 * Cada `ReportSectionCard` es un placeholder (título + descripción +
 * skeleton); los datos reales llegan reporte por reporte en fases futuras,
 * sin cambiar este layout.
 */
export function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
      <header className="mb-10 max-w-2xl">
        <Eyebrow>ANALÍTICA</Eyebrow>
        <h1
          className={cn(
            playfair.className,
            "mt-3 text-[clamp(28px,4vw,42px)] leading-[1.1] font-semibold tracking-[-0.01em] text-[#f7f7f7]",
          )}
        >
          Panel Administrador
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-white/55">
          Centro de analítica de OpenProject: productividad, carga de trabajo, tendencias y
          desempeño por proyecto, desarrollador y Project Manager.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_SECTIONS.map((section, index) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            index={index}
            featured={section.id === "dashboard-general"}
          />
        ))}
      </div>
    </AdminDashboardShell>
  );
}
