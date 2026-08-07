import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getResume, saveResumeVersion, createResume } from "@/lib/resume.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Loader2,
  Check,
  AlertTriangle,
  Plus,
  RefreshCw,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { extractPdfText, extractDocxText, segmentToResume } from "@/lib/resume-parser";
import { sanitizeResumeData, type ResumeData, type TemplateId } from "@/lib/resume-schema";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { TemplateRenderer } from "@/components/resume/TemplateRenderer";
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

export const Route = createFileRoute("/_authenticated/resume/$id/upload")({
  head: () => ({
    meta: [{ title: "Upload resume — RefineAI" }, { name: "robots", content: "noindex" }],
  }),
  component: UploadPage,
});

function UploadPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const get = useServerFn(getResume);
  const save = useServerFn(saveResumeVersion);
  const create = useServerFn(createResume);
  const q = useQuery({ queryKey: ["resume", id], queryFn: () => get({ data: { resumeId: id } }) });

  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ResumeData | null>(null);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onFile(file: File) {
    setError(null);
    setParsed(null);
    setParsing(true);
    try {
      const name = file.name.toLowerCase();
      let text: string;
      if (name.endsWith(".pdf") || file.type === "application/pdf") {
        text = await extractPdfText(file);
      } else if (
        name.endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await extractDocxText(file);
      } else {
        throw new Error("Unsupported format. Please upload a .pdf or .docx file.");
      }
      if (!text || text.trim().length < 30) {
        throw new Error(
          "We couldn't extract any readable text from this file. If it's a scanned image PDF, export a text-based version and try again.",
        );
      }
      const data = segmentToResume(text);
      setParsed(data);
      const current = q.data?.versions.find((v) => v.is_current) ?? q.data?.versions[0];
      if (current?.template) setTemplate(current.template as TemplateId);
      toast.success("Resume parsed successfully! Review your data and choose a save option.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to parse file";
      setError(msg);
      toast.error(msg);
    } finally {
      setParsing(false);
    }
  }

  async function commit(mode: "overwrite" | "new_entry" | "new_version") {
    if (!parsed) return;
    setSaving(true);
    try {
      const cleanedData = sanitizeResumeData(parsed);

      if (mode === "new_entry") {
        // Create a completely separate new resume entry in the user's dashboard library
        const resTitle = cleanedData.personalInfo.fullName
          ? `${cleanedData.personalInfo.fullName} Resume`
          : "Imported Resume";
        const created = await create({
          data: {
            title: resTitle,
            template,
            data: cleanedData,
          },
        });
        toast.success("Created a new separate resume entry!");
        await router.invalidate();
        router.navigate({ to: "/resume/$id/edit", params: { id: created.resumeId } });
        return;
      }

      // Overwrite current version OR save as new version under existing resume
      const current = q.data?.versions.find((v) => v.is_current) ?? q.data?.versions[0];
      await save({
        data: {
          resumeId: id,
          versionId: mode === "overwrite" ? current?.id : undefined,
          template,
          data: cleanedData,
          mode: mode === "overwrite" ? "overwrite" : "new",
          label: mode === "new_version" ? "Imported Version" : undefined,
        },
      });
      toast.success(
        mode === "overwrite" ? "Current resume data replaced!" : "Saved as a new version!",
      );
      await router.invalidate();
      router.navigate({ to: "/resume/$id/edit", params: { id } });
    } catch (e) {
      console.error("[Import Commit Error]", e);
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
      setConfirm(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b pb-3">
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
            {q.data?.resume.title || "Resume"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="font-semibold text-foreground">Import File</span>
        </nav>
      </div>

      {!parsed && (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            {parsing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </div>
          <h2 className="text-lg font-semibold">Upload PDF or DOCX</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            We'll extract the text and structure it into editable sections. You can review and save
            it as a new entry or overwrite your current resume.
          </p>
          <div className="mx-auto mt-5 max-w-xs">
            <Input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={parsing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </div>
          {error && (
            <div className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-left text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </Card>
      )}

      {parsed && (
        <>
          <Card className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Check className="h-4 w-4 text-emerald-500" />
              Resume parsed successfully! Review the extracted fields below before saving.
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setParsed(null)} disabled={saving}>
                Upload a different file
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setConfirm(true)}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Overwrite current resume
              </Button>
              <Button size="sm" disabled={saving} onClick={() => commit("new_entry")}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Save as new entry
                  </>
                )}
              </Button>
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-[minmax(380px,480px)_1fr]">
            <div className="max-h-[calc(100vh-220px)] overflow-auto pr-1">
              <ResumeEditor
                data={parsed}
                setData={(fn) => setParsed((d) => (d ? fn(d) : d))}
                template={template}
                onTemplateChange={setTemplate}
              />
            </div>
            <Card className="max-h-[calc(100vh-220px)] overflow-auto bg-muted/40 p-4">
              <div className="resume-preview-frame">
                <div className="resume-preview-scale">
                  <TemplateRenderer data={parsed} template={template} />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite current resume data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update your active resume version with the newly parsed content. To create a
              separate new resume entry instead, choose “Save as new entry”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={() => commit("overwrite")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? "Overwriting..." : "Confirm Overwrite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
