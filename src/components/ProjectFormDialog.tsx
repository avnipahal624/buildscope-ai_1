import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { DOMAINS } from "@/lib/skills";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNote, Field, TagInput } from "@/components/common";

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(value) ||
      (value.startsWith("http") && z.string().url().safeParse(value).success),
    "Enter a valid URL.",
  )
  .optional();

const schema = z.object({
  name: z.string().trim().min(2, "Give the project a name."),
  description: z
    .string()
    .trim()
    .min(20, "Describe the project in at least 20 characters — reviewers need context."),
  domain: z.string().min(1),
  status: z.enum(["idea", "building", "testing", "shipped"]),
  goals: z.string().trim().optional(),
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  docsUrl: optionalUrl,
});

type FormValues = z.infer<typeof schema>;

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Doc<"projects"> | null;
  onCreated?: (id: Id<"projects">) => void;
}) {
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const [technologies, setTechnologies] = useState<string[]>(project?.technologies ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      domain: project?.domain ?? DOMAINS[0],
      status: project?.status ?? "idea",
      goals: project?.goals ?? "",
      repoUrl: project?.repoUrl ?? "",
      demoUrl: project?.demoUrl ?? "",
      docsUrl: project?.docsUrl ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTechnologies(project?.technologies ?? []);
    reset({
      name: project?.name ?? "",
      description: project?.description ?? "",
      domain: project?.domain ?? DOMAINS[0],
      status: project?.status ?? "idea",
      goals: project?.goals ?? "",
      repoUrl: project?.repoUrl ?? "",
      demoUrl: project?.demoUrl ?? "",
      docsUrl: project?.docsUrl ?? "",
    });
  }, [open, project, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setError(null);
    try {
      if (technologies.length === 0) {
        setError("Add at least one technology — it is used for evidence checks.");
        setSaving(false);
        return;
      }
      if (project) {
        await updateProject({
          projectId: project._id,
          name: values.name,
          description: values.description,
          domain: values.domain,
          status: values.status,
          technologies,
          goals: values.goals || undefined,
          repoUrl: values.repoUrl || undefined,
          demoUrl: values.demoUrl || undefined,
          docsUrl: values.docsUrl || undefined,
        });
        toast.success("Project updated.");
      } else {
        const id = await createProject({
          name: values.name,
          description: values.description,
          domain: values.domain,
          status: values.status,
          technologies,
          goals: values.goals || undefined,
          repoUrl: values.repoUrl || undefined,
          demoUrl: values.demoUrl || undefined,
          docsUrl: values.docsUrl || undefined,
        });
        toast.success("Project created. Add a milestone to start tracking progress.");
        onCreated?.(id);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-forest">
            {project ? "Edit project" : "New project"}
          </DialogTitle>
          <DialogDescription>
            Projects are your build record. Link a repository later to collect evidence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Project name" htmlFor="project-name" error={errors.name?.message}>
            <Input id="project-name" {...register("name")} placeholder="Campus commute planner" className="bg-ivory/60" />
          </Field>
          <Field
            label="Description"
            htmlFor="project-description"
            error={errors.description?.message}
            hint="What it does, who it is for, and what exists today."
          >
            <Textarea
              id="project-description"
              {...register("description")}
              rows={3}
              placeholder="A small web app that helps students compare campus commute routes…"
              className="bg-ivory/60"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Domain" htmlFor="project-domain" error={errors.domain?.message}>
              <select
                id="project-domain"
                {...register("domain")}
                className="h-9 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest"
              >
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="project-status">
              <select
                id="project-status"
                {...register("status")}
                className="h-9 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm capitalize text-forest"
              >
                {["idea", "building", "testing", "shipped"].map((status) => (
                  <option key={status} value={status} className="capitalize">{status}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Technologies" htmlFor="project-tech" hint="Used to compare against detected repository languages.">
            <TagInput
              id="project-tech"
              value={technologies}
              onChange={setTechnologies}
              placeholder="React, TypeScript…"
              suggestions={["React", "TypeScript", "Python", "Node.js", "SQL", "Tailwind CSS"]}
            />
          </Field>
          <Field label="Goals" htmlFor="project-goals" hint="Optional">
            <Textarea id="project-goals" {...register("goals")} rows={2} placeholder="What should be true when this is done?" className="bg-ivory/60" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GitHub repository" htmlFor="project-repo" error={errors.repoUrl?.message} hint="Optional">
              <Input id="project-repo" {...register("repoUrl")} placeholder="https://github.com/owner/repo" className="bg-ivory/60" />
            </Field>
            <Field label="Live demo" htmlFor="project-demo" error={errors.demoUrl?.message} hint="Optional">
              <Input id="project-demo" {...register("demoUrl")} placeholder="https://…" className="bg-ivory/60" />
            </Field>
          </div>
          <Field label="Documentation link" htmlFor="project-docs" error={errors.docsUrl?.message} hint="Optional">
            <Input id="project-docs" {...register("docsUrl")} placeholder="https://…" className="bg-ivory/60" />
          </Field>

          {error && <ErrorNote>{error}</ErrorNote>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-full bg-forest px-5">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {saving ? "Saving" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
