import { withOpenProject } from "@/modules/openproject/services/route-helpers";

/** Tableros del proyecto de OpenProject elegido, para el select "Tablero". */
export async function GET(_req: Request, { params }: { params: Promise<{ opId: string }> }) {
  const { opId } = await params;
  return withOpenProject((service) => service.listProjectBoards(Number(opId)));
}
