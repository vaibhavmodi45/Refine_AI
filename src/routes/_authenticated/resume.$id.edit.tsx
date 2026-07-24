import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getResume, saveResumeVersion, setCurrentVersion } from "@/lib/resume.functions";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { TemplateRenderer } from "@/components/resume/TemplateRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES, TEMPLATE_LABELS, resumeDataSchema, type ResumeData, type TemplateId } from "@/lib/resume-schema";
import { toast } from "sonner";
import { Save, Plus, Download, Target, Upload, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/resume/$id/edit")({
  head: () => ({ meta: [{ title: "Edit resume — Refine" }, { name: "robots", content: "noindex" }] }),
  component: EditResume,
});

function EditResume() {
  const { id } = Route.useParams();
  const router = useRouter();
  const get = useServerFn(getResume);
  const save = useServerFn(saveResumeVersion);
  const setCurr = useServerFn(setCurrentVersion);

  const q = useQuery({ queryKey: ["resume", id], queryFn: () => get({ data: { resumeId: id } }) });

  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [data, setData] = useState<ResumeData | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    const current = q.data.versions.find((v) => v.is_current) ?? q.data.versions[0];
    if (!current) return;
    setTitle(q.data.resume.title);
    setTemplate((current.template as TemplateId) ?? "classic");
    const parsed = resumeDataSchema.safeParse(current.structured_data);
    setData(parsed.success ? parsed.data : (current.structured_data as ResumeData));
    setActiveVersionId(current.id);
  }, [q.data]);

  const previewRef = useRef<HTMLDivElement>(null);

  async function persist(mode: "overwrite" | "new") {
    if (!data) return;
    setSaving(true);
    try {
      const parsed = resumeDataSchema.safeParse(data);
      if (!parsed.success) {
        toast.error("Please fill required fields (name + email).");
        return;
      }
      const res = await save({
        data: {
          resumeId: id,
          versionId: activeVersionId ?? undefined,
          template,
          data: parsed.data,
          mode,
          title,
        },
      });
      setActiveVersionId(res.versionId);
      toast.success(mode === "new" ? "Saved as new version" : "Version saved");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
      setConfirmOverwrite(false);
    }
  }

  async function makeCurrent(versionId: string) {
    await setCurr({ data: { resumeId: id, versionId } });
    toast.success("Marked as current");
    router.invalidate();
  }

  async function switchVersion(versionId: string) {
    const v = q.data?.versions.find((x) => x.id === versionId);
    if (!v) return;
    const parsed = resumeDataSchema.safeParse(v.structured_data);
    setData(parsed.success ? parsed.data : (v.structured_data as ResumeData));
    setTemplate((v.template as TemplateId) ?? "classic");
    setActiveVersionId(versionId);
  }

  const versions = q.data?.versions ?? [];
  const previewData = useMemo(() => data, [data]);

  async function downloadPdf() {
    if (!previewRef.current) return;
    const { exportNodeToPdf } = await import("@/lib/pdf-export");
    await exportNodeToPdf(previewRef.current, `${title || "resume"}.pdf`);
  }

  if (q.isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-xs"
          placeholder="Resume title"
        />
        <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATES.map((t) => (
              <SelectItem key={t} value={t}>{TEMPLATE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeVersionId ?? ""} onValueChange={switchVersion}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.label} {v.is_current ? "· current" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeVersionId &&
          versions.find((v) => v.id === activeVersionId && !v.is_current) && (
            <Button size="sm" variant="outline" onClick={() => makeCurrent(activeVersionId!)}>
              <Check className="mr-1 h-4 w-4" /> Mark current
            </Button>
          )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setConfirmOverwrite(true)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Save version
          </Button>
          <Button size="sm" onClick={() => persist("new")} disabled={saving}>
            <Plus className="mr-2 h-4 w-4" /> Save as new
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Link to="/resume/$id/optimize" params={{ id }}>
            <Button size="sm" variant="ghost"><Target className="mr-2 h-4 w-4" /> Optimize</Button>
          </Link>
          <Link to="/resume/$id/upload" params={{ id }}>
            <Button size="sm" variant="ghost"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(380px,480px)_1fr]">
        <div className="max-h-[calc(100vh-160px)] overflow-auto pr-1">
          <ResumeEditor data={data} setData={(fn) => setData((d) => (d ? fn(d) : d))} template={template} onTemplateChange={setTemplate} />
        </div>
        <Card className="max-h-[calc(100vh-160px)] overflow-auto bg-muted/40 p-4">
          {previewData && (
            <div ref={previewRef} className="mx-auto w-fit shadow-xl">
              <TemplateRenderer data={previewData} template={template} />
            </div>
          )}
          <div className="mt-3 text-center">
            <Badge variant="secondary">Live preview matches the exported PDF</Badge>
          </div>
        </Card>
      </div>

      <AlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the contents of the currently selected version. To keep the current
              version untouched, choose “Save as new” instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => persist("overwrite")}>Overwrite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
