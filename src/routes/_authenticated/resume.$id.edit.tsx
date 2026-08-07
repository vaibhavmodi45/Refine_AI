import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import {
  TEMPLATES,
  TEMPLATE_LABELS,
  resumeDataSchema,
  type ResumeData,
  type TemplateId,
} from "@/lib/resume-schema";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Download,
  Target,
  Upload,
  Check,
  Loader2,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/resume/$id/edit")({
  head: () => ({
    meta: [{ title: "Edit resume — RefineAI" }, { name: "robots", content: "noindex" }],
  }),
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
  const [downloading, setDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

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

  const persist = useCallback(
    async (mode: "overwrite" | "new") => {
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
        toast.success(mode === "new" ? "Saved as new version" : "Resume saved successfully");
        router.invalidate();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [data, id, activeVersionId, template, title, save, router],
  );

  // Keyboard shortcut Ctrl+S / Cmd+S for instant saving
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        persist("overwrite");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [persist]);

  async function makeCurrent(versionId: string) {
    await setCurr({ data: { resumeId: id, versionId } });
    toast.success("Marked as active current version");
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
    if (!data || downloading) return;
    setDownloading(true);
    try {
      // Switch to preview tab to ensure container element is visible in DOM
      setMobileTab("preview");
      await new Promise((r) => setTimeout(r, 150));

      const target = previewRef.current;
      if (!target) {
        toast.error("Preview container not ready. Please try again.");
        return;
      }

      const { exportNodeToPdf } = await import("@/lib/pdf-export");
      await exportNodeToPdf(target, `${title || "resume"}.pdf`);
    } catch (e) {
      console.error("[Download PDF Error]", e);
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  if (q.isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground animate-pulse">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading resume editor...
      </div>
    );
  }

  const activeVersion = versions.find((v) => v.id === activeVersionId);

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="font-semibold text-foreground max-w-[220px] truncate">
            {title || "Untitled Resume"}
          </span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
            Editor
          </span>
        </nav>
      </div>
      {/* Mobile-Only Tab Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden rounded-lg bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setMobileTab("edit")}
          className={
            "flex-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer " +
            (mobileTab === "edit"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground")
          }
        >
          Edit Fields
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={
            "flex-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer " +
            (mobileTab === "preview"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground")
          }
        >
          Live Preview
        </button>
      </div>

      {/* Streamlined Unified Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full sm:w-[180px] h-9 text-sm font-medium transition-all focus-visible:ring-primary"
            placeholder="Resume title"
          />

          <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TEMPLATE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clean Version Dropdown */}
          {versions.length > 0 && (
            <Select value={activeVersionId ?? ""} onValueChange={switchVersion}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label} {v.is_current ? "· (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeVersion && !activeVersion.is_current && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => makeCurrent(activeVersion.id)}
              className="h-9 text-xs transition-colors hover:bg-accent"
            >
              <Check className="mr-1 h-3.5 w-3.5 text-primary" /> Set as active
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action Buttons */}
          <Link to="/resume/$id/optimize" params={{ id }}>
            <Button size="sm" variant="outline" className="h-9 transition-colors hover:bg-accent">
              <Target className="mr-1.5 h-4 w-4 text-primary" /> Optimize ATS
            </Button>
          </Link>

          <Link to="/resume/$id/upload" params={{ id }}>
            <Button size="sm" variant="outline" className="h-9 transition-colors hover:bg-accent">
              <Upload className="mr-1.5 h-4 w-4" /> Import PDF
            </Button>
          </Link>

          {/* Download PDF Button with Loading Spinner */}
          <Button
            size="sm"
            variant="outline"
            onClick={downloadPdf}
            disabled={downloading}
            className="h-9 shadow-sm transition-all hover:bg-accent"
          >
            {downloading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Preparing PDF...
              </>
            ) : (
              <>
                <Download className="mr-1.5 h-4 w-4 text-primary" /> Download PDF
              </>
            )}
          </Button>

          {/* Primary Save Dropdown Button */}
          <DropdownMenu>
            <div className="inline-flex rounded-md shadow-sm">
              <Button
                size="sm"
                onClick={() => persist("overwrite")}
                disabled={saving}
                className="h-9 rounded-r-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" /> Save
                  </>
                )}
              </Button>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={saving}
                  className="h-9 px-2 rounded-l-none border-l border-primary-foreground/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => persist("overwrite")}>
                <Save className="mr-2 h-4 w-4" /> Save changes (Ctrl+S)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => persist("new")}>
                <Plus className="mr-2 h-4 w-4" /> Save as new version
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor & Preview Split Grid / Responsive Layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(380px,460px)_1fr]">
        <div
          className={
            "max-h-[calc(100vh-170px)] overflow-auto pr-1 transition-all " +
            (mobileTab === "edit" ? "block" : "hidden lg:block")
          }
        >
          <ResumeEditor
            data={data}
            setData={(fn) => setData((d) => (d ? fn(d) : d))}
            template={template}
            onTemplateChange={setTemplate}
          />
        </div>

        <Card
          className={
            "max-h-[calc(100vh-170px)] overflow-auto bg-muted/20 p-4 sm:p-6 shadow-sm border " +
            (mobileTab === "preview" ? "block" : "hidden lg:block")
          }
        >
          {previewData && (
            <div className="resume-preview-frame transition-all">
              <div className="resume-preview-scale">
                <div ref={previewRef}>
                  <TemplateRenderer data={previewData} template={template} />
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Live preview pixel-matches exported
            PDF
          </div>
        </Card>
      </div>
    </div>
  );
}
