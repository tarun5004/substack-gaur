import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EditorWorkspace } from "@/components/editor/editor-workspace";

export default async function EditPostPage({ params }) {
  const { postId } = await params;

  return (
    <DashboardShell>
      <EditorWorkspace postId={postId} />
    </DashboardShell>
  );
}
