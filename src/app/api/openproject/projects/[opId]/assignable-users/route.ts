import { withOpenProject } from "@/modules/openproject/services/route-helpers";

/** Usuarios del proyecto de OpenProject, para "Asignado a...". */
export async function GET(_req: Request, { params }: { params: Promise<{ opId: string }> }) {
  const { opId } = await params;
  return withOpenProject((service) => service.listAssignableUsers(opId));
}
