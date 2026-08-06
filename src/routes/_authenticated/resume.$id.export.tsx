import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { getResume } from "@/lib/resume.functions";
import { TemplateRenderer } from "@/components/resume/TemplateRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resumeDataSchema, type ResumeData, type TemplateId } from "@/lib/resume-schema";
import { Download, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume/$id/export")({
  head: () => ({
    meta: [{ title: "Export resume — RefineAI" }, { name: "robots", content: "noindex" }],
  }),
  component: ExportResume,
});

function ExportResume() {
  const { id } = Route.useParams();
  const get = useServerFn(getResume);
  const q = useQuery({ queryKey: ["resume", id], queryFn: () => get({ data: { resumeId: id } }) });
  const ref = useRef<HTMLDivElement>(null);

  if (q.isLoading || !q.data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const current = q.data.versions.find((v) => v.is_current) ?? q.data.versions[0];
  const parsed = resumeDataSchema.safeParse(current?.structured_data);
  const data: ResumeData = parsed.success ? parsed.data : (current?.structured_data as ResumeData);
  const template: TemplateId = (current?.template as TemplateId) ?? "classic";

  async function download() {
    if (!ref.current) return;
    const { exportNodeToPdf } = await import("@/lib/pdf-export");
    await exportNodeToPdf(ref.current, `${q.data!.resume.title || "resume"}.pdf`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/resume/$id/edit" params={{ id }}>
          <Button size="sm" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to editor
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">{q.data.resume.title}</h1>
        <div className="ml-auto">
          <Button onClick={download}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
      <Card className="overflow-auto bg-muted/40 p-6">
        <div ref={ref} className="mx-auto w-fit shadow-xl">
          <TemplateRenderer data={data} template={template} />
        </div>
      </Card>
    </div>
  );
}
