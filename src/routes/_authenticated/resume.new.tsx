import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TEMPLATES, TEMPLATE_LABELS, emptyResume, sampleResume, type TemplateId } from "@/lib/resume-schema";
import { createResume } from "@/lib/resume.functions";
import { TemplateRenderer } from "@/components/resume/TemplateRenderer";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/resume/new")({
  head: () => ({ meta: [{ title: "New resume — Refine" }, { name: "robots", content: "noindex" }] }),
  component: NewResume,
});

function NewResume() {
  const navigate = useNavigate();
  const create = useServerFn(createResume);
  const [title, setTitle] = useState("Untitled resume");
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [useSample, setUseSample] = useState(true);
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setBusy(true);
    try {
      const data = useSample ? sampleResume() : emptyResume();
      if (!useSample) data.personalInfo.fullName = "Your Name";
      const res = await create({ data: { title, template, data } });
      navigate({ to: "/resume/$id/edit", params: { id: res.resumeId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create resume");
    } finally {
      setBusy(false);
    }
  }

  const previewData = useSample ? sampleResume() : { ...emptyResume(), personalInfo: { ...emptyResume().personalInfo, fullName: "Your Name" } };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="p-5">
        <h1 className="text-xl font-semibold tracking-tight">Create a resume</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a template. You can switch anytime.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Template</Label>
            <RadioGroup
              value={template}
              onValueChange={(v) => setTemplate(v as TemplateId)}
              className="mt-2 space-y-2"
            >
              {TEMPLATES.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent/40"
                >
                  <RadioGroupItem value={t} />
                  <div>
                    <div className="text-sm font-medium">{TEMPLATE_LABELS[t]}</div>
                    <div className="text-xs text-muted-foreground">
                      {t === "classic" && "Serif, uppercase section rules. Formal, safe."}
                      {t === "modern" && "Sans, thin dividers, subtle indigo accents."}
                      {t === "fresher" && "Education-first for students & early-career."}
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Start from sample</div>
              <div className="text-xs text-muted-foreground">Prefill with example content.</div>
            </div>
            <Switch checked={useSample} onCheckedChange={setUseSample} />
          </div>
          <Button className="w-full" onClick={onCreate} disabled={busy}>
            {busy ? "Creating…" : "Create resume"}
          </Button>
        </div>
      </Card>

      <div className="min-h-[700px] overflow-auto rounded-xl border bg-muted/40 p-6">
        <div className="mx-auto w-fit shadow-xl">
          <TemplateRenderer data={previewData} template={template} />
        </div>
      </div>
    </div>
  );
}
