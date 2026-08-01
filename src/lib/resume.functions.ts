import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { resumeDataSchema, TEMPLATES, type TemplateId } from "./resume-schema";

export const listResumes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: resumes, error } = await context.supabase
      .from("resumes")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (resumes ?? []).map((r) => r.id);
    if (!ids.length) return [];
    const { data: versions } = await context.supabase
      .from("resume_versions")
      .select("id, resume_id, version_number, label, is_current, template, created_at")
      .in("resume_id", ids);
    return (resumes ?? []).map((r) => ({
      ...r,
      versions: (versions ?? []).filter((v) => v.resume_id === r.id),
    }));
  });

export const getResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeId: string }) => z.object({ resumeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: resume, error } = await context.supabase
      .from("resumes")
      .select("id, title, created_at, updated_at")
      .eq("id", data.resumeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!resume) throw new Error("Not found");
    const { data: versions, error: vErr } = await context.supabase
      .from("resume_versions")
      .select("*")
      .eq("resume_id", data.resumeId)
      .order("version_number", { ascending: false });
    if (vErr) throw new Error(vErr.message);
    return { resume, versions: versions ?? [] };
  });

export const createResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; template: TemplateId; data: unknown }) =>
    z
      .object({
        title: z.string().min(1),
        template: z.enum(TEMPLATES),
        data: resumeDataSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: resume, error } = await context.supabase
      .from("resumes")
      .insert({ user_id: context.userId, title: data.title })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const { data: version, error: vErr } = await context.supabase
      .from("resume_versions")
      .insert({
        resume_id: resume.id,
        version_number: 1,
        label: "v1",
        template: data.template,
        structured_data: data.data,
        is_current: true,
      })
      .select()
      .single();
    if (vErr) throw new Error(vErr.message);
    return { resumeId: resume.id, versionId: version.id };
  });

export const saveResumeVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      resumeId: string;
      versionId?: string;
      label?: string;
      template: TemplateId;
      data: unknown;
      mode: "overwrite" | "new";
      title?: string;
    }) =>
      z
        .object({
          resumeId: z.string().uuid(),
          versionId: z.string().uuid().optional(),
          label: z.string().optional(),
          template: z.enum(TEMPLATES),
          data: resumeDataSchema,
          mode: z.enum(["overwrite", "new"]),
          title: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.title) {
      await context.supabase.from("resumes").update({ title: data.title }).eq("id", data.resumeId);
    }
    if (data.mode === "overwrite" && data.versionId) {
      const { error } = await context.supabase
        .from("resume_versions")
        .update({
          structured_data: data.data,
          template: data.template,
          label: data.label ?? undefined,
        })
        .eq("id", data.versionId);
      if (error) throw new Error(error.message);
      return { versionId: data.versionId };
    }
    // new
    const { data: existing } = await context.supabase
      .from("resume_versions")
      .select("version_number")
      .eq("resume_id", data.resumeId)
      .order("version_number", { ascending: false })
      .limit(1);
    const nextNum = (existing?.[0]?.version_number ?? 0) + 1;
    // unset current
    await context.supabase
      .from("resume_versions")
      .update({ is_current: false })
      .eq("resume_id", data.resumeId);
    const { data: version, error } = await context.supabase
      .from("resume_versions")
      .insert({
        resume_id: data.resumeId,
        version_number: nextNum,
        label: data.label ?? `v${nextNum}`,
        template: data.template,
        structured_data: data.data,
        is_current: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { versionId: version.id };
  });

export const setCurrentVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeId: string; versionId: string }) =>
    z.object({ resumeId: z.string().uuid(), versionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("resume_versions")
      .update({ is_current: false })
      .eq("resume_id", data.resumeId);
    await context.supabase
      .from("resume_versions")
      .update({ is_current: true })
      .eq("id", data.versionId);
    return { ok: true };
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeId: string }) => z.object({ resumeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("resumes").delete().eq("id", data.resumeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
