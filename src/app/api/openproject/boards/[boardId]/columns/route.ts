import { withOpenProject } from "@/modules/openproject/services/route-helpers";

/** Columnas de un tablero, para el select "Columna inicial". */
export async function GET(_req: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return withOpenProject((service) => service.listBoardColumns(Number(boardId)));
}
