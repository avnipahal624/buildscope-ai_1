import { api, errorMessage } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
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

const schema = z.object({
  name: z.string().trim().min(2, "Give the project a name.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Describe the project in at least 10 characters."),
  problem_statement: z
    .string()
    .trim()
    .min(20, "Describe the problem in at least 20 characters so research has context."),
});

type FormValues = z.infer<typeof schema>;

export function ProjectFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", problem_statement: "" },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null);
      setTargetUsers([]);
      setKeywords([]);
      setFeatures([]);
      reset({ name: "", description: "", problem_statement: "" });
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: FormValues) => {
    if (targetUsers.length === 0) {
      setError("Add at least one target user. Validation starts with who has the problem.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const project = await api.createProject({
        name: values.name,
        description: values.description,
        problem_statement: values.problem_statement,
        target_users: targetUsers,
        keywords,
        planned_features: features,
      });
      toast.success("Project created. Start with a research run.");
      onCreated?.(project.id);
      setTargetUsers([]);
      setKeywords([]);
      setFeatures([]);
      reset({ name: "", description: "", problem_statement: "" });
      onOpenChange(false);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-forest">New investigation</DialogTitle>
          <DialogDescription>
            This creates a real project in the FastAPI research service. The deployed backend has
            no account ownership, so the project is visible in the shared workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Project name" htmlFor="project-name" error={errors.name?.message}>
            <Input id="project-name" {...register("name")} placeholder="Campus lost-and-found" className="bg-ivory/60" />
          </Field>
          <Field
            label="Short description"
            htmlFor="project-description"
            error={errors.description?.message}
            hint="What it does and who it is for."
          >
            <Textarea
              id="project-description"
              {...register("description")}
              rows={3}
              placeholder="A tool that helps students report, match and recover lost belongings on campus."
              className="bg-ivory/60"
            />
          </Field>
          <Field
            label="Problem statement"
            htmlFor="project-problem"
            error={errors.problem_statement?.message}
            hint="What is broken today? This becomes the anchor for research queries."
          >
            <Textarea
              id="project-problem"
              {...register("problem_statement")}
              rows={3}
              placeholder="Lost items are reported across scattered channels, so students and campus staff cannot match found items to owners reliably."
              className="bg-ivory/60"
            />
          </Field>

          <Field label="Target users" htmlFor="project-users" hint="Add at least one. Enter or comma to add.">
            <TagInput
              id="project-users"
              value={targetUsers}
              onChange={setTargetUsers}
              placeholder="Students, campus security…"
              suggestions={["Students", "Faculty", "Campus staff", "Administrators", "Visitors"]}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Keywords" htmlFor="project-keywords" hint="Optional — used as research context.">
              <TagInput
                id="project-keywords"
                value={keywords}
                onChange={setKeywords}
                placeholder="lost and found, campus…"
                suggestions={["Campus", "Marketplace", "Accessibility", "Climate", "Health"]}
              />
            </Field>
            <Field label="Planned features" htmlFor="project-features" hint="Optional">
              <TagInput
                id="project-features"
                value={features}
                onChange={setFeatures}
                placeholder="Claims, notifications…"
                suggestions={["Search", "Notifications", "Verification", "Dashboard", "Chat"]}
              />
            </Field>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-full bg-forest px-5">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {saving ? "Creating" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
