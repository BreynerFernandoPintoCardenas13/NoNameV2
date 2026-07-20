import { withOpenProject } from "@/modules/openproject/services/route-helpers";

/** Usuarios que pueden ser "Responsable" del proyecto, para el override en Configuración. */
export async function GET(_req: Request, { params }: { params: Promise<{ opId: string }> }) {
  const { opId } = await params;
  return withOpenProject((service) => service.listResponsibleUsers(opId));
}
