import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listResumes, deleteResume } from "@/lib/resume.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Upload, Target, Download } from "lucide-react";
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
    meta: [{ title: "Your resumes — Refine" }, { name: "robots", content: "noindex" }],
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

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your resumes</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, score, and export ATS-friendly resumes.
          </p>
        </div>
        <Link to="/resume/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New resume
          </Button>
        </Link>
      </div>

      {q.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : q.data && q.data.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {q.data.map((r) => {
            const current = r.versions.find((v) => v.is_current) ?? r.versions[0];
            return (
              <Card key={r.id} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(r.updated_at))} ago ·{" "}
                      {r.versions.length} version{r.versions.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  {current ? <Badge variant="secondary">{current.label}</Badge> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/resume/$id/edit" params={{ id: r.id }}>
                    <Button size="sm" variant="secondary">
                      <FileText className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </Link>
                  <Link to="/resume/$id/optimize" params={{ id: r.id }}>
                    <Button size="sm" variant="ghost">
                      <Target className="mr-2 h-4 w-4" /> Optimize
                    </Button>
                  </Link>
                  <Link to="/resume/$id/upload" params={{ id: r.id }}>
                    <Button size="sm" variant="ghost">
                      <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                  </Link>
                  <Link to="/resume/$id/export" params={{ id: r.id }}>
                    <Button size="sm" variant="ghost">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </Link>
                  <div className="ml-auto">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This deletes all versions and analyses for “{r.title}”. This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(r.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-semibold">No resumes yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Start from a blank template or a sample resume you can edit.
          </p>
          <Link to="/resume/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create your first resume
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
