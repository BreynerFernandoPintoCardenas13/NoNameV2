import type { Metadata } from "next";

import { Detalles } from "@/components/marketing/Detalles";

export const metadata: Metadata = {
  title: "Detalles · NoName",
  description:
    "Qué es NoName, qué problemas resuelve y cuánto puede ahorrarle a su equipo — de reuniones a tickets accionables, en tiempo real.",
};

export default function DetallesPage() {
  return <Detalles />;
}
