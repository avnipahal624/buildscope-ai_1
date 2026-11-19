import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { generateRoadmap, STAGES } from "@/lib/roadmap";
import { formatHours } from "@/lib/format";
import { canonicalSkill, skillDefinition } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import {
  Chip,
  ConfirmButton,
  EmptyState,
  ErrorNote,
  Field,
  InfoNote,
  LoadingBlock,
  PageHeader,
  ScoreRing,
  SectionCard,
  Tag,
  ToneIcon,
} from "@/components/common";
import { BookScene, CubeScene } from "@/components/decor/Scenes";

const STAGE_TONE: Record<string, string> = {
  foundation: "border-sage-deep/60 bg-sage/35",
  intermediate: "border-[#E3CDA1]/60 bg-[#F0E3C8]/45",
  application: "border-peach-deep/60 bg-peach/35",
  "project-ready": "border-lavender-deep/60 bg-lavender/35",
};

type Task = Doc<"roadmapTasks">;

type TaskDraft = {
  title: string;
  description: string;
  skill: string;
  stage: Task["stage"];
  priority: Task["priority"];
  estimatedMinutes: number;
  resourceLabel: string;
  resourceUrl: string;
};

const emptyDraft: TaskDraft = {
  title: "",
  description: "",
  skill: "",
  stage: "foundation",
  priority: "medium",
  estimatedMinutes: 60,
  resourceLabel: "",
  resourceUrl: "",
};

export default function Roadmap() {
  const { user } = useAuth();
  const state = useQuery(api.roadmap.state);
  const opportunities = useQuery(api.opportunities.list);
  const projects = useQuery(api.projects.list);
  const addTask = useMutation(api.roadmap.addTask);
  const updateTask = useMutation(api.roadmap.updateTask);
  const removeTask = useMutation(api.roadmap.removeTask);
  const setTarget = useMutation(api.roadmap.setTarget);
  const addTasks = useMutation(api.roadmap.addTasks);

  const [targetOpen, setTargetOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [targetMode, setTargetMode] = useState<"opportunity" | "project" | "goal">("opportunity");
  const [targetRef, setTargetRef] = useState("");
  const [goalLabel, setGoalLabel] = useState("");
  const [goalSkills, setGoalSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tasks = state?.tasks ?? [];
  const activeTarget = state?.activeTarget ?? null;
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length === 0 ? null : Math.round((done / tasks.length) * 100);
  const remainingMinutes = tasks
    .filter((task) => task.status !== "done")
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);

  const gaps = (activeTarget?.requiredSkills ?? []).filter(
    (skill) => !(user?.skills ?? []).some((owned) => owned.toLowerCase() === skill.toLowerCase()),
  );
  const covered = (activeTarget?.requiredSkills ?? []).filter((skill) =>
    (user?.skills ?? []).some((owned) => owned.toLowerCase() === skill.toLowerCase()),
  );

  const resources = useMemo(() => {
    const seen = new Set<string>();
    const unique: Task[] = [];
    for (const task of tasks) {
      if (!task.resourceUrl || seen.has(task.resourceUrl)) continue;
      seen.add(task.resourceUrl);
      unique.push(task);
    }
    return unique.slice(0, 6);
  }, [tasks]);

  const openNewTask = (stage: Task["stage"] = "foundation", skill = "") => {
    setEditing(null);
    setDraft({ ...emptyDraft, stage, skill });
    setError(null);
    setTaskOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description,
      skill: task.skill,
      stage: task.stage,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      resourceLabel: task.resourceLabel ?? "",
      resourceUrl: task.resourceUrl ?? "",
    });
    setError(null);
    setTaskOpen(true);
  };

  const saveTask = async () => {
    if (draft.title.trim().length < 3) {
      setError("Give the task a clear title.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await updateTask({
          taskId: editing._id,
          title: draft.title.trim(),
          description: draft.description.trim(),
          skill: canonicalSkill(draft.skill || "General"),
          stage: draft.stage,
          priority: draft.priority,
          estimatedMinutes: draft.estimatedMinutes,
          resourceLabel: draft.resourceLabel.trim() || undefined,
          resourceUrl: draft.resourceUrl.trim() || undefined,
        });
        toast.success("Task updated.");
      } else {
        await addTask({
          targetId: activeTarget?._id,
          title: draft.title.trim(),
          description: draft.description.trim(),
          skill: canonicalSkill(draft.skill || "General"),
          stage: draft.stage,
          priority: draft.priority,
          estimatedMinutes: draft.estimatedMinutes,
          resourceLabel: draft.resourceLabel.trim() || undefined,
          resourceUrl: draft.resourceUrl.trim() || undefined,
        });
        toast.success("Task added to your roadmap.");
      }
      setTaskOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (task: Task, status: Task["status"]) => {
    try {
      await updateTask({ taskId: task._id, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the task.");
    }
  };

  const createTarget = async () => {
    setBusy(true);
    setError(null);
    try {
      let label = goalLabel.trim();
      let requiredSkills = goalSkills;
      let referenceId: string | undefined;

      if (targetMode === "opportunity") {
        const opportunity = (opportunities ?? []).find((item) => item._id === targetRef);
        if (!opportunity) {
          setError("Choose an opportunity from the demonstration catalogue.");
          setBusy(false);
          return;
        }
        label = opportunity.name;
        requiredSkills = opportunity.skillsRequired;
        referenceId = opportunity._id;
      }
      if (targetMode === "project") {
        const project = (projects ?? []).find(({ project }) => project._id === targetRef)?.project;
        if (!project) {
          setError("Choose one of your projects.");
          setBusy(false);
          return;
        }
        label = project.name;
        requiredSkills = project.technologies;
        referenceId = project._id;
      }
      if (!label || requiredSkills.length === 0) {
        setError("Add a target name and at least one required skill.");
        setBusy(false);
        return;
      }

      const targetId = await setTarget({
        label,
        type: targetMode,
        referenceId,
        requiredSkills,
      });
      const drafts = generateRoadmap(requiredSkills, user?.skills);
      await addTasks({ targetId, tasks: drafts });
      toast.success(`Roadmap generated: ${drafts.length} tasks from ${requiredSkills.length} required skills.`);
      setTargetOpen(false);
      setGoalLabel("");
      setGoalSkills([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the roadmap.");
    } finally {
      setBusy(false);
    }
  };

  if (state === undefined || opportunities === undefined || projects === undefined) {
    return <LoadingBlock label="Loading your roadmap" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Personalised Skill Roadmap"
        title={
          <>
            Turn a target into
            <br />
            <span className="italic text-forest/60">a next step.</span>
          </>
        }
        description="Choose an opportunity, project or career goal. BuildScope compares its required skills with yours, then stages the gap into a plan you can actually follow."
        actions={
          <>
            <Button type="button" size="sm" onClick={() => setTargetOpen(true)} className="rounded-full bg-forest">
              <Target className="size-3.5" aria-hidden /> {activeTarget ? "Change target" : "Choose a target"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => openNewTask()} className="rounded-full border-forest/20 bg-card text-forest">
              <Plus className="size-3.5" aria-hidden /> Add task
            </Button>
          </>
        }
        aside={<BookScene className="hidden h-[130px] w-[140px] lg:block" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Target summary */}
          <div className="paper rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label-caps text-forest/45">Active target</p>
                <h2 className="mt-1 font-display text-xl text-forest">
                  {activeTarget?.label ?? "No target selected yet"}
                </h2>
                <p className="mt-1 text-[0.72rem] text-muted-foreground">
                  {activeTarget
                    ? `${activeTarget.requiredSkills.length} required skills · ${covered.length} covered · ${gaps.length} gaps · ${formatHours(remainingMinutes)} remaining`
                    : "Pick an opportunity, project or career goal to generate a staged roadmap."}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {covered.map((skill) => (
                    <Tag key={skill} tone="sage">{skill}</Tag>
                  ))}
                  {gaps.map((skill) => (
                    <Tag key={skill} tone="peach">{skill}</Tag>
                  ))}
                  {activeTarget && activeTarget.requiredSkills.length === 0 && (
                    <Tag tone="cream">No required skills recorded</Tag>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing value={progress} size={92} label="learned" />
              </div>
            </div>

            {activeTarget && gaps.length > 0 && (
              <div className="mt-3 rounded-xl border border-peach-deep/40 bg-peach/25 px-3 py-2 text-[0.7rem] leading-5 text-[#7A4A32]">
                <span className="font-semibold">{gaps.length} skill gap{gaps.length === 1 ? "" : "s"}:</span>{" "}
                {gaps.join(", ")}. {tasks.length === 0 ? "Generate tasks to close them." : "Your roadmap below targets them in priority order."}
              </div>
            )}
          </div>

          {/* Timeline */}
          {tasks.length === 0 ? (
            <div className="paper rounded-2xl p-6">
              <EmptyState
                scene={<CubeScene className="h-24 w-28" />}
                icon={Compass}
                title="Your roadmap is a blank page"
                description="Choose a target and BuildScope will suggest staged tasks using curated resources and honest time estimates."
                action={
                  <Button type="button" size="sm" onClick={() => setTargetOpen(true)} className="rounded-full bg-forest">
                    Choose a target
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-cream/30 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="label-caps text-forest/45">Learning timeline</p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Foundation → Intermediate → Practical application → Project ready
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {STAGES.map((stage, stageIndex) => {
                  const stageTasks = tasks.filter((task) => task.stage === stage.key);
                  const stageDone = stageTasks.filter((task) => task.status === "done").length;
                  return (
                    <section key={stage.key} className="relative flex flex-col">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-forest text-[0.6rem] text-ivory">
                          {stageIndex + 1}
                        </span>
                        <div>
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-forest/70">
                            {stage.label}
                          </p>
                          <p className="text-[0.58rem] text-muted-foreground">
                            {stageDone}/{stageTasks.length} complete
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openNewTask(stage.key)}
                          aria-label={`Add task to ${stage.label}`}
                          className="ml-auto grid size-6 place-items-center rounded-full border border-forest/15 text-forest/50 hover:bg-card hover:text-forest"
                        >
                          <Plus className="size-3" aria-hidden />
                        </button>
                      </div>
                      <div className={cn("flex-1 space-y-2 rounded-xl border p-2", STAGE_TONE[stage.key])}>
                        {stageTasks.length === 0 && (
                          <p className="px-1 py-3 text-center text-[0.62rem] leading-4 text-forest/40">
                            No tasks in this stage yet.
                          </p>
                        )}
                        {stageTasks.map((task) => (
                          <article key={task._id} className="rounded-lg border border-card bg-card p-2.5 shadow-sm">
                            <div className="flex items-start justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => void setStatus(task, task.status === "done" ? "todo" : "done")}
                                aria-label={task.status === "done" ? `Mark ${task.title} not started` : `Complete ${task.title}`}
                                className="mt-0.5 shrink-0 text-forest/50 hover:text-forest"
                              >
                                {task.status === "done" ? (
                                  <CheckCircle2 className="size-4 text-forest" aria-hidden />
                                ) : task.status === "in-progress" ? (
                                  <Clock className="size-4 text-[#B0823A]" aria-hidden />
                                ) : (
                                  <Circle className="size-4" aria-hidden />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={cn("text-[0.72rem] font-medium leading-4 text-forest", task.status === "done" && "text-forest/45 line-through")}>
                                  {task.title}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-[0.6rem] leading-4 text-muted-foreground">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <Tag tone="lavender" className="px-1.5 py-0.5 text-[0.55rem]">{task.skill}</Tag>
                              <span className="inline-flex items-center gap-0.5 text-[0.55rem] text-muted-foreground">
                                <Clock className="size-2.5" aria-hidden /> {formatHours(task.estimatedMinutes)}
                              </span>
                              <span
                                className={cn(
                                  "ml-auto rounded-full px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.06em]",
                                  task.priority === "high"
                                    ? "bg-peach text-[#7A4A32]"
                                    : task.priority === "medium"
                                      ? "bg-[#F0E3C8] text-[#6B5424]"
                                      : "bg-cream text-muted-foreground",
                                )}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-border/50 pt-1.5">
                              <select
                                aria-label={`Status for ${task.title}`}
                                value={task.status}
                                onChange={(event) => void setStatus(task, event.target.value as Task["status"])}
                                className="rounded border border-border bg-cream/40 px-1 py-0.5 text-[0.55rem] text-forest/70"
                              >
                                <option value="todo">Not started</option>
                                <option value="in-progress">In progress</option>
                                <option value="done">Completed</option>
                              </select>
                              <div className="flex items-center gap-0.5">
                                {task.resourceUrl && (
                                  <a
                                    href={task.resourceUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    aria-label={`Open resource for ${task.title}`}
                                    className="grid size-5 place-items-center rounded text-forest/40 hover:bg-cream hover:text-forest"
                                  >
                                    <ExternalLink className="size-3" aria-hidden />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEdit(task)}
                                  aria-label={`Edit ${task.title}`}
                                  className="grid size-5 place-items-center rounded text-forest/40 hover:bg-cream hover:text-forest"
                                >
                                  <Pencil className="size-3" aria-hidden />
                                </button>
                                <ConfirmButton
                                  title="Delete this task?"
                                  description={`“${task.title}” will be removed from your roadmap. Completion history will no longer include it.`}
                                  onConfirm={() => void removeTask({ taskId: task._id })}
                                  variant="ghost"
                                  className="size-5 p-0 text-forest/40 hover:text-destructive"
                                >
                                  <Trash2 className="size-3" aria-hidden />
                                </ConfirmButton>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <SectionCard title="Skill comparison" icon={Target}>
            {activeTarget ? (
              <div className="space-y-2 text-[0.7rem]">
                <div>
                  <p className="label-caps mb-1 text-forest/45">You already have</p>
                  <div className="flex flex-wrap gap-1">
                    {covered.length > 0 ? covered.map((skill) => <Tag key={skill} tone="sage">{skill}</Tag>) : <span className="text-muted-foreground">None of the required skills yet.</span>}
                  </div>
                </div>
                <div>
                  <p className="label-caps mb-1 text-forest/45">Skills to improve / missing</p>
                  <div className="flex flex-wrap gap-1">
                    {gaps.length > 0 ? gaps.map((skill) => <Tag key={skill} tone="peach">{skill}</Tag>) : <Tag tone="sage">No gaps for this target</Tag>}
                  </div>
                </div>
                <p className="flex items-start gap-1.5 rounded-lg bg-cream/60 px-2 py-1.5 text-[0.6rem] leading-4 text-forest/55">
                  <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                  Skills are matched by name. Having a skill on your profile is not a claim of mastery.
                </p>
              </div>
            ) : (
              <p className="text-[0.72rem] leading-5 text-muted-foreground">
                Set a target to see the difference between what it asks for and what you already list.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Learning resources" icon={BookOpen}>
            {resources.length === 0 ? (
              <p className="text-[0.72rem] leading-5 text-muted-foreground">
                Resources appear here once tasks include a curated link.
              </p>
            ) : (
              <ul className="space-y-2">
                {resources.map((task) => (
                  <li key={task._id}>
                    <a
                      href={task.resourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-start gap-2 text-[0.7rem] leading-4 text-forest"
                    >
                      <BookOpen className="mt-0.5 size-3 shrink-0 text-forest/40" aria-hidden />
                      <span>
                        <span className="block group-hover:underline">{task.resourceLabel ?? task.resourceUrl}</span>
                        <span className="text-[0.58rem] text-muted-foreground">{task.skill}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Learning milestones" icon={Sparkles}>
            <ul className="space-y-2">
              {STAGES.map((stage) => {
                const stageTasks = tasks.filter((task) => task.stage === stage.key);
                const stageDone = stageTasks.filter((task) => task.status === "done").length;
                const pct = stageTasks.length === 0 ? 0 : Math.round((stageDone / stageTasks.length) * 100);
                return (
                  <li key={stage.key}>
                    <div className="flex items-center justify-between text-[0.68rem]">
                      <span className="text-forest/75">{stage.label}</span>
                      <span className="tnum text-forest/50">{stageTasks.length === 0 ? "—" : `${pct}%`}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-forest/10">
                      <div className="h-full rounded-full bg-forest/55 transition-[width]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 rounded-lg bg-sage/40 px-2 py-1.5 text-[0.62rem] text-forest/60">
              Estimated time remaining: <span className="tnum font-semibold text-forest">{formatHours(remainingMinutes)}</span>
            </div>
          </SectionCard>
        </aside>
      </div>

      {/* Target dialog */}
      <Dialog open={targetOpen} onOpenChange={setTargetOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-forest">Choose a roadmap target</DialogTitle>
            <DialogDescription>
              BuildScope will compare required skills with your profile and generate a staged plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "opportunity", label: "Hackathon" },
                { key: "project", label: "My project" },
                { key: "goal", label: "Career goal" },
              ].map((mode) => (
                <Chip
                  key={mode.key}
                  active={targetMode === mode.key}
                  onClick={() => setTargetMode(mode.key as typeof targetMode)}
                >
                  {mode.label}
                </Chip>
              ))}
            </div>

            {targetMode === "opportunity" && (
              <Field label="Opportunity" htmlFor="target-opp" hint="Demo catalogue records only.">
                <select
                  id="target-opp"
                  value={targetRef}
                  onChange={(event) => setTargetRef(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest"
                >
                  <option value="">Select an opportunity…</option>
                  {opportunities.map((opportunity) => (
                    <option key={opportunity._id} value={opportunity._id}>
                      {opportunity.name} · {opportunity.skillsRequired.length} skills
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {targetMode === "project" && (
              <Field label="Project" htmlFor="target-project" hint="Technology tags become required skills.">
                <select
                  id="target-project"
                  value={targetRef}
                  onChange={(event) => setTargetRef(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest"
                >
                  <option value="">Select a project…</option>
                  {projects.map(({ project }) => (
                    <option key={project._id} value={project._id}>
                      {project.name} · {project.technologies.join(", ") || "no technologies"}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {targetMode === "goal" && (
              <>
                <Field label="Goal name" htmlFor="goal-name">
                  <Input id="goal-name" value={goalLabel} onChange={(event) => setGoalLabel(event.target.value)} placeholder="Become internship-ready in backend engineering" className="bg-ivory/60" />
                </Field>
                <Field label="Required skills" htmlFor="goal-skills">
                  <Input
                    id="goal-skills"
                    value={goalSkills.join(", ")}
                    onChange={(event) => setGoalSkills(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
                    placeholder="Python, SQL, System Design"
                    className="bg-ivory/60"
                  />
                </Field>
              </>
            )}

            <InfoNote tone="sage">
              Existing tasks are kept. New tasks are appended, ordered by the gaps in the target's
              skill list.
            </InfoNote>
            {error && <ErrorNote>{error}</ErrorNote>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setTargetOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void createTarget()} disabled={busy} className="rounded-full bg-forest px-5">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {busy ? "Generating" : "Generate roadmap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-forest">
              {editing ? "Edit task" : "Add a task"}
            </DialogTitle>
            <DialogDescription>
              Tasks are yours — BuildScope never marks learning complete on your behalf.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Title" htmlFor="task-title">
              <Input id="task-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Learn React state management" className="bg-ivory/60" />
            </Field>
            <Field label="Description" htmlFor="task-description">
              <Textarea id="task-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={2} className="bg-ivory/60" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Skill" htmlFor="task-skill">
                <Input id="task-skill" value={draft.skill} onChange={(event) => setDraft({ ...draft, skill: event.target.value })} placeholder="React" className="bg-ivory/60" />
              </Field>
              <Field label="Stage" htmlFor="task-stage">
                <select id="task-stage" value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value as Task["stage"] })} className="h-9 w-full rounded-md border border-input bg-ivory/60 px-2 text-sm text-forest">
                  {STAGES.map((stage) => (
                    <option key={stage.key} value={stage.key}>{stage.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Priority" htmlFor="task-priority">
                <select id="task-priority" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Task["priority"] })} className="h-9 w-full rounded-md border border-input bg-ivory/60 px-2 text-sm capitalize text-forest">
                  {["high", "medium", "low"].map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estimated minutes" htmlFor="task-minutes">
                <Input id="task-minutes" type="number" min={15} step={15} value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })} className="bg-ivory/60" />
              </Field>
            </div>
            <Field label="Resource label" htmlFor="task-resource" hint="Optional. Use a source you trust; BuildScope does not invent links.">
              <Input id="task-resource" value={draft.resourceLabel} onChange={(event) => setDraft({ ...draft, resourceLabel: event.target.value })} placeholder="React — Learn" className="bg-ivory/60" />
            </Field>
            <Field label="Resource URL" htmlFor="task-resource-url">
              <Input id="task-resource-url" value={draft.resourceUrl} onChange={(event) => setDraft({ ...draft, resourceUrl: event.target.value })} placeholder="https://react.dev/learn" className="bg-ivory/60" />
            </Field>
            {error && <ErrorNote>{error}</ErrorNote>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void saveTask()} disabled={busy} className="rounded-full bg-forest px-5">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : editing ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {busy ? "Saving" : editing ? "Save task" : "Add task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
