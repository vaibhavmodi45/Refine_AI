import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listResumes, deleteResume } from "@/lib/resume.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Trash2,
  Upload,
  Target,
  Download,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Your resumes — RefineAI" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const list = useServerFn(listResumes);
  const del = useServerFn(deleteResume);
  const router = useRouter();
  const q = useQuery({ queryKey: ["resumes"], queryFn: () => list() });

  async function onDelete(id: string) {
    try {
      await del({ data: { resumeId: id } });
      toast.success("Resume deleted");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  const resumes = q.data ?? [];
  const totalVersions = resumes.reduce((acc, r) => acc + r.versions.length, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner & Stats Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Resume Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your master profiles, score against target JDs, and download ATS-ready PDFs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="default"
            className="shadow-md font-semibold transition-all hover:scale-[1.02]"
          >
            <Link to="/resume/new">
              <Plus className="mr-2 h-4 w-4" /> Create New Resume
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      {resumes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black">{resumes.length}</div>
              <div className="text-xs text-muted-foreground font-medium">Master Resumes</div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black">{totalVersions}</div>
              <div className="text-xs text-muted-foreground font-medium">Targeted Versions</div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black">100%</div>
              <div className="text-xs text-muted-foreground font-medium">ATS Factual Grounding</div>
            </div>
          </div>
        </div>
      )}

      {/* Resumes Grid */}
      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-44 animate-pulse bg-muted/40 p-5" />
          ))}
        </div>
      ) : resumes.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r) => {
            const current = r.versions.find((v) => v.is_current) ?? r.versions[0];
            return (
              <Card
                key={r.id}
                className="group flex flex-col justify-between p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Updated {formatDistanceToNow(new Date(r.updated_at))} ago</span>
                      </div>
                    </div>
                    {current ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold shrink-0"
                      >
                        {current.label}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    {r.versions.length} version{r.versions.length === 1 ? "" : "s"} available
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-2">
                  <Link to="/resume/$id/edit" params={{ id: r.id }} className="flex-1">
                    <Button size="sm" className="w-full font-semibold shadow-xs">
                      <FileText className="mr-1.5 h-4 w-4" /> Edit
                    </Button>
                  </Link>

                  <Link to="/resume/$id/optimize" params={{ id: r.id }}>
                    <Button size="sm" variant="outline" title="Optimize ATS">
                      <Target className="h-4 w-4 text-primary" />
                    </Button>
                  </Link>

                  <Link to="/resume/$id/upload" params={{ id: r.id }}>
                    <Button size="sm" variant="outline" title="Import PDF/DOCX">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link to="/resume/$id/export" params={{ id: r.id }}>
                    <Button size="sm" variant="outline" title="Export PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes all versions and ATS analyses for “{r.title}”.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(r.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Resume
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center border-dashed p-14 text-center bg-card/60">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold">No resumes in your library yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Create your first resume from scratch or import an existing PDF/DOCX to get started.
          </p>
          <Link to="/resume/new" className="mt-6">
            <Button size="lg" className="shadow-md font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Create Your First Resume
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
