import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume/$id/upload")({
  head: () => ({ meta: [{ title: "Upload resume — Refine" }, { name: "robots", content: "noindex" }] }),
  component: UploadPage,
});

function UploadPage() {
  const { id } = Route.useParams();
  return (
    <div className="space-y-4">
      <Link to="/resume/$id/edit" params={{ id }}>
        <Button size="sm" variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
      </Link>
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
          <Upload className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Upload & parse (coming next)</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Upload a PDF or DOCX and Refine will extract sections into the same editable structure
          used by the builder. This deterministic parser is being wired up next — for now you can
          create or edit resumes manually.
        </p>
      </Card>
    </div>
  );
}
