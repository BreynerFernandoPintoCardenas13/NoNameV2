import { NotePage } from "@/modules/notes/pages/NotePage";

export default async function Note({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  return <NotePage noteId={noteId} />;
}
