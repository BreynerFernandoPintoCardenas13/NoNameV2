import { withOpenProject } from "@/modules/openproject/services/route-helpers";

/** Proyectos reales de OpenProject, para el selector del modal "Crear Proyecto". */
export async function GET() {
  return withOpenProject((service) => service.listAvailableProjects());
}
