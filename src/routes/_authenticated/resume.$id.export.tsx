import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getResume } from "@/lib/resume.functions";
import { TemplateRenderer } from "@/components/resume/TemplateRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resumeDataSchema, type ResumeData, type TemplateId } from "@/lib/resume-schema";
import { Download, Loader2, LayoutDashboard, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  const [downloading, setDownloading] = useState(false);

  if (q.isLoading || !q.data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground animate-pulse">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading preview...
      </div>
    );
  }

  const current = q.data.versions.find((v) => v.is_current) ?? q.data.versions[0];
  const parsed = resumeDataSchema.safeParse(current?.structured_data);
  const data: ResumeData = parsed.success ? parsed.data : (current?.structured_data as ResumeData);
  const template: TemplateId = (current?.template as TemplateId) ?? "classic";

  async function download() {
    if (!ref.current || downloading) return;
    setDownloading(true);
    try {
      const { exportNodeToPdf } = await import("@/lib/pdf-export");
      await exportNodeToPdf(ref.current, `${q.data!.resume.title || "resume"}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <Link
            to="/resume/$id/edit"
            params={{ id }}
            className="hover:text-foreground font-medium transition-colors max-w-[200px] truncate"
          >
            {q.data.resume.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="font-semibold text-foreground">Export PDF</span>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={download}
            disabled={downloading}
            className="shadow-sm hover:shadow transition-all"
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" /> Export / Save PDF
              </>
            )}
          </Button>
        </div>
      </div>
      <Card className="overflow-auto bg-muted/30 p-8 shadow-sm">
        <div ref={ref} className="mx-auto w-fit shadow-xl rounded-sm bg-white transition-all">
          <TemplateRenderer data={data} template={template} />
        </div>
      </Card>
    </div>
  );
}
