"use client";

import { motion } from "motion/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverLift } from "@/components/shared/hover-lift";
import type { AdminReportSection } from "@/modules/admin/types";

interface ReportSectionCardProps {
  section: AdminReportSection;
  /** Orden dentro de la grilla, usado únicamente para escalonar la animación de entrada. */
  index: number;
  /** Ocupa el ancho completo de la grilla (usado por "Dashboard General"). */
  featured?: boolean;
  children: React.ReactNode;
}

/**
 * Card glass de una sección de reporte: título + descripción + contenido.
 * Fase 3: el contenido ya es el widget conectado a su hook (con datos mock);
 * el contenedor no cambia entre fases.
 */
export function ReportSectionCard({
  section,
  index,
  featured = false,
  children,
}: ReportSectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      className={featured ? "sm:col-span-2 xl:col-span-3" : undefined}
    >
      <HoverLift>
        <Card className="border-white/10 bg-white/[0.04] text-[#f7f7f7] shadow-[0_20px_50px_-25px_rgba(0,0,0,0.8)] ring-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-[#f7f7f7]">{section.title}</CardTitle>
            <CardDescription className="text-white/55">{section.description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </HoverLift>
    </motion.div>
  );
}
