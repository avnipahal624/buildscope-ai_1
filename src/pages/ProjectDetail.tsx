import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { RepoAnalysis } from "@/components/RepoAnalysis";
import { CredibilityFindings } from "@/components/CredibilityFindings";
import { checkProject, projectStage } from "@/lib/credibility";
import { readRepoReport } from "@/lib/github-types";
import { formatDate, fromDateInput, toDateInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  ClipboardCopy,
  Circle,
  ExternalLink,
  FileText,
  FolderKanban,
  GitBranch,
  Github,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ConfirmButton,
  EmptyState,
  Field,
  InfoNote,
  LoadingBlock,
  PageHeader,
  ScoreRing,
  SectionCard,
  StatusPill,
  Tag,
  ToneIcon,
} from "@/components/common";

const TABS = ["overview", "requirements", "repository", "milestones", "credibility", "reports"] as const;
type TabKey = (typeof TABS)[number];

type Milestone = Doc<"milestones">;

function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  onSave,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Milestone | null;
  onSave: (title: string, dueDate?: number) => Promise<void>;
  busy: boolean;
}) {
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [date, setDate] = useState(toDateInput(milestone?.dueDate));

  useEffect(() => {
    if (!open) return;
    setTitle(milestone?.title ?? "");
    setDate(toDateInput(milestone?.dueDate));
  }, [open, milestone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-forest">
            {milestone ? "Edit milestone" : "Add milestone"}
          </DialogTitle>
          <DialogDescription>
            Milestones are the unit of project progress. Only you can mark one complete.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Milestone" htmlFor="milestone-title">
            <Input id="milestone-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ship the authentication flow" className="bg-ivory/60" />
          </Field>
          <Field label="Due date" htmlFor="milestone-date" hint="Optional — used for ordering and deadlines.">
            <Input id="milestone-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="bg-ivory/60" />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => void onSave(title, fromDateInput(date))}
            disabled={busy || title.trim().length < 3}
            className="rounded-full bg-forest px-5"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {milestone ? "Save milestone" : "Add milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const data = useQuery(
    api.projects.get,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );
  const addMilestone = useMutation(api.projects.addMilestone);
  const updateMilestone = useMutation(api.projects.updateMilestone);
  const removeMilestone = useMutation(api.projects.removeMilestone);
  const removeProject = useMutation(api.projects.remove);
  const recordEvidence = useMutation(api.projects.recordEvidence);
  const addLibraryItem = useMutation(api.workspace.addLibraryItem);

  const tabParam = searchParams.get("tab");
  const tab: TabKey = TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "overview";
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneBusy, setMilestoneBusy] = useState(false);
  const [savingCheck, setSavingCheck] = useState(false);

  useEffect(() => {
    if (searchParams.get("edit") === "1") setEditOpen(true);
  }, [searchParams]);

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    params.delete("edit");
    setSearchParams(params, { replace: true });
  };

  const report = useMemo(
    () => (data?.repoCheck ? readRepoReport(data.repoCheck.report) : null),
    [data?.repoCheck],
  );

  const credibility = useMemo(() => {
    if (!data) return null;
    return checkProject({
      _id: data.project._id,
      name: data.project.name,
      description: data.project.description,
      technologies: data.project.technologies,
      repoUrl: data.project.repoUrl,
      demoUrl: data.project.demoUrl,
      docsUrl: data.project.docsUrl,
      status: data.project.status,
      milestones: data.milestones.map((milestone) => ({
        completed: milestone.completed,
        title: milestone.title,
      })),
      repoReport: report,
      verifiedEvidenceCount: data.evidence.length,
    });
  }, [data, report]);

  const projectReport = useMemo(() => {
    if (!data || !credibility) return "";
    const milestones = data.milestones;
    const done = milestones.filter((m) => m.completed);
    return [
      `# ${data.project.name}`,
      "",
      `${data.project.domain} · ${projectStage({
        _id: data.project._id,
        name: data.project.name,
        description: data.project.description,
        technologies: data.project.technologies,
        repoUrl: data.project.repoUrl,
        demoUrl: data.project.demoUrl,
        docsUrl: data.project.docsUrl,
        status: data.project.status,
        milestones: milestones.map((m) => ({ completed: m.completed, title: m.title })),
        repoReport: report,
        verifiedEvidenceCount: data.evidence.length,
      })} · ${data.project.status}`,
      "",
      data.project.description,
      "",
      "## Technologies",
      data.project.technologies.map((tech) => `- ${tech}`).join("\n") || "- None listed",
      "",
      "## Goals",
      data.project.goals || "No goals recorded.",
      "",
      "## Milestones",
      `${done.length}/${milestones.length} complete`,
      ...milestones.map((m) => `- [${m.completed ? "x" : " "}] ${m.title}${m.dueDate ? ` (due ${formatDate(m.dueDate)})` : ""}`),
      "",
      "## Repository evidence",
      report
        ? [
            `- Repository: ${report.repoUrl}`,
            `- Last read: ${formatDate(report.checkedAt, true)}`,
            `- Commits sampled: ${report.commitSampleSize}`,
            `- Files fingerprinted: ${report.fileCount}`,
            `- Licence: ${report.license ?? "not detected"}`,
            `- Related repositories assessed: ${report.related.length}`,
            `- Shared exact file fingerprints: ${report.related.reduce((sum, item) => sum + item.sharedBlobFiles, 0)}`,
          ].join("\n")
        : "- No verified repository check recorded.",
      "",
      "## Credibility findings",
      ...credibility.findings.map((finding) => `- ${finding.claim}: ${finding.status} — ${finding.explanation}`),
      "",
      "## Limitations",
      "Code similarity and AST structural similarity are Not assessed. Similarity is not a verdict. This report is generated from the student's own records and public GitHub metadata.",
    ].join("\n");
  }, [data, credibility, report]);

  if (data === undefined) return <LoadingBlock label="Opening project" />;
  if (data === null || !credibility) {
    return (
      <div className="paper rounded-2xl p-8 text-center">
        <p className="font-display text-2xl text-forest">Project not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted, or it belongs to another account.
        </p>
        <Button asChild className="mt-4 rounded-full bg-forest">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  const { project, milestones, repoCheck, evidence } = data;
  const done = milestones.filter((milestone) => milestone.completed).length;
  const progress = milestones.length === 0 ? 0 : Math.round((done / milestones.length) * 100);
  const nextMilestone = milestones.find((milestone) => !milestone.completed);

  const saveMilestone = async (title: string, dueDate?: number) => {
    setMilestoneBusy(true);
    try {
      if (editingMilestone) {
        await updateMilestone({ milestoneId: editingMilestone._id, title, dueDate });
        toast.success("Milestone updated.");
      } else {
        await addMilestone({ projectId: project._id, title, dueDate });
        toast.success("Milestone added.");
      }
      setMilestoneOpen(false);
      setEditingMilestone(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the milestone.");
    } finally {
      setMilestoneBusy(false);
    }
  };

  const saveCredibilityCheck = async () => {
    setSavingCheck(true);
    try {
      await recordEvidence({
        subjectType: "project",
        subjectId: project._id,
        subjectLabel: project.name,
        summaryStatus: credibility.overall,
        findings: credibility.findings,
      });
      toast.success("Credibility check recorded with its evidence.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the check.");
    } finally {
      setSavingCheck(false);
    }
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(projectReport);
      toast.success("Project report copied to clipboard.");
    } catch {
      toast.error("Clipboard access was blocked. Select the text and copy manually.");
    }
  };

  const saveReport = async () => {
    try {
      await addLibraryItem({
        title: `Project report — ${project.name}`,
        description: `${projectStage({
          _id: project._id,
          name: project.name,
          description: project.description,
          technologies: project.technologies,
          repoUrl: project.repoUrl,
          demoUrl: project.demoUrl,
          docsUrl: project.docsUrl,
          status: project.status,
          milestones: milestones.map((m) => ({ completed: m.completed, title: m.title })),
          repoReport: report,
          verifiedEvidenceCount: evidence.length,
        })} · ${done}/${milestones.length} milestones`,
        kind: "report",
        payload: { markdown: projectReport, projectId: project._id },
      });
      toast.success("Project report saved to your library.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the report.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-forest/60 hover:text-forest">
          <ArrowLeft className="size-3.5" aria-hidden /> All projects
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="rounded-full border-forest/20 bg-card text-forest">
            <Pencil className="size-3.5" aria-hidden /> Edit
          </Button>
          <ConfirmButton
            title="Delete this project?"
            description={`“${project.name}”, its milestones and repository checks will be permanently removed.`}
            onConfirm={async () => {
              try {
                await removeProject({ projectId: project._id });
                toast.success("Project deleted.");
                navigate("/projects");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not delete the project.");
              }
            }}
            variant="outline"
            className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="size-3.5" aria-hidden /> Delete
          </ConfirmButton>
        </div>
      </div>

      <PageHeader
        eyebrow={`${project.domain} · ${project.status}`}
        title={project.name}
        description={project.description}
        actions={
          <>
            <Tag tone="sage">{projectStage({
              _id: project._id,
              name: project.name,
              description: project.description,
              technologies: project.technologies,
              repoUrl: project.repoUrl,
              demoUrl: project.demoUrl,
              docsUrl: project.docsUrl,
              status: project.status,
              milestones: milestones.map((m) => ({ completed: m.completed, title: m.title })),
              repoReport: report,
              verifiedEvidenceCount: evidence.length,
            })}</Tag>
            {project.technologies.slice(0, 5).map((tech) => (
              <Tag key={tech} tone="lavender">{tech}</Tag>
            ))}
          </>
        }
        aside={
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
            <ScoreRing value={progress} size={78} label="built" />
            <div className="text-[0.68rem]">
              <p className="font-medium text-forest">{done}/{milestones.length} milestones</p>
              <p className="mt-0.5 text-muted-foreground">{evidence.length} saved check{evidence.length === 1 ? "" : "s"}</p>
              <p className="mt-0.5 text-muted-foreground">{repoCheck ? "repository read" : "no repository read"}</p>
            </div>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border bg-cream/50 p-1">
          {TABS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="rounded-lg px-3 py-1.5 text-[0.72rem] capitalize data-[state=active]:bg-forest data-[state=active]:text-ivory"
            >
              {key === "requirements" ? "Requirements" : key}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <SectionCard title="What this project is" icon={FileText}>
                <p className="whitespace-pre-line text-sm leading-7 text-charcoal/70">{project.description}</p>
                {project.goals && (
                  <>
                    <p className="label-caps mt-3 text-forest/45">Goals</p>
                    <p className="mt-1 text-sm leading-6 text-charcoal/70">{project.goals}</p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-full bg-sage/60 px-2.5 py-1 text-[0.65rem] text-forest">
                      Demo <ExternalLink className="size-3" aria-hidden />
                    </a>
                  )}
                  {project.docsUrl && (
                    <a href={project.docsUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-full bg-lavender/70 px-2.5 py-1 text-[0.65rem] text-forest">
                      Docs <ExternalLink className="size-3" aria-hidden />
                    </a>
                  )}
                  {project.repoUrl && (
                    <a href={project.repoUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[0.65rem] text-forest">
                      <Github className="size-3" aria-hidden /> Repository <ExternalLink className="size-3" aria-hidden />
                    </a>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Milestone timeline" icon={CalendarDays} action={<button type="button" onClick={() => { setEditingMilestone(null); setMilestoneOpen(true); }} className="text-[0.68rem] text-forest/60 hover:text-forest">Add milestone</button>}>
                {milestones.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="No milestones yet"
                    description="Add a first milestone so progress can be measured rather than described."
                    action={<Button size="sm" className="rounded-full bg-forest" onClick={() => { setEditingMilestone(null); setMilestoneOpen(true); }}>Add milestone</Button>}
                  />
                ) : (
                  <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
                    {milestones.map((milestone) => (
                      <li key={milestone._id} className="relative flex items-start gap-3">
                        <span className={cn("relative z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-[4px] border-card", milestone.completed ? "bg-forest" : "bg-forest/25")} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-[0.78rem] text-forest", milestone.completed && "text-forest/50 line-through")}>{milestone.title}</p>
                          <p className="text-[0.62rem] text-muted-foreground">
                            {milestone.dueDate ? `Due ${formatDate(milestone.dueDate)}` : "No due date"}
                            {milestone.completedAt ? ` · completed ${formatDate(milestone.completedAt)}` : ""}
                          </p>
                        </div>
                        <span className={cn("rounded-full px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.08em]", milestone.completed ? "bg-sage text-forest" : "bg-cream text-muted-foreground")}>
                          {milestone.completed ? "Complete" : "Open"}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </SectionCard>
            </div>

            <div className="space-y-4">
              <SectionCard title="Evidence snapshot" icon={ShieldCheck}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] text-muted-foreground">Overall</p>
                    <StatusPill status={credibility.overall} className="mt-1" />
                    <p className="mt-2 text-[0.65rem] leading-5 text-muted-foreground">
                      {credibility.findings.filter((f) => f.status === "Verified").length} verified ·{" "}
                      {credibility.findings.filter((f) => f.status === "Not assessed").length} not assessed
                    </p>
                  </div>
                  <ToneIcon icon={ShieldCheck} tone={credibility.overall === "Verified" ? "sage" : "peach"} className="size-12" />
                </div>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full text-[0.68rem]">
                  <Link to={`/projects/${project._id}?tab=credibility`}>Review findings</Link>
                </Button>
              </SectionCard>

              <SectionCard title="Next milestone" icon={Target}>
                {nextMilestone ? (
                  <>
                    <p className="text-sm font-medium text-forest">{nextMilestone.title}</p>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">
                      {nextMilestone.dueDate ? `Due ${formatDate(nextMilestone.dueDate)}` : "No due date set"}
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 w-full rounded-full bg-forest"
                      onClick={async () => {
                        await updateMilestone({ milestoneId: nextMilestone._id, completed: true });
                        toast.success("Milestone completed. Your preparation score has been recalculated.");
                      }}
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden /> Mark complete
                    </Button>
                  </>
                ) : (
                  <p className="text-[0.72rem] leading-5 text-muted-foreground">
                    {milestones.length === 0 ? "Add a milestone to define the next step." : "Every milestone is complete."}
                  </p>
                )}
              </SectionCard>

              <SectionCard title="Project record" icon={FolderKanban}>
                <dl className="space-y-1.5 text-[0.7rem]">
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Created</dt><dd className="tnum text-forest">{formatDate(project.createdAt)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Updated</dt><dd className="tnum text-forest">{formatDate(project.updatedAt)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Repository</dt><dd className="text-forest">{project.repoUrl ? "Linked" : "Not linked"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Demo</dt><dd className="text-forest">{project.demoUrl ? "Linked" : "Not linked"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Evidence checks</dt><dd className="tnum text-forest">{evidence.length}</dd></div>
                </dl>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Required technologies" icon={Target} eyebrow="Claimed vs discovered">
              <ul className="divide-y divide-border/60">
                {project.technologies.map((tech) => {
                  const detected = (report?.languages ?? []).some(
                    (language) => language.language.toLowerCase() === tech.toLowerCase(),
                  );
                  return (
                    <li key={tech} className="flex items-center justify-between gap-2 py-2">
                      <span className="text-[0.78rem] text-forest">{tech}</span>
                      <StatusPill status={report ? (detected ? "Verified" : "Needs review") : "Not assessed"} />
                    </li>
                  );
                })}
              </ul>
              {!report && (
                <InfoNote tone="cream">
                  Analyse the repository to compare these claims with detected languages.
                </InfoNote>
              )}
            </SectionCard>

            <SectionCard title="Capability checklist" icon={CheckCircle2}>
              <ul className="space-y-2">
                {[
                  { label: "Description explains what exists", done: project.description.trim().length > 40 },
                  { label: "Repository linked", done: Boolean(project.repoUrl) },
                  { label: "Documentation available", done: Boolean(project.docsUrl || report?.readmePresent) },
                  { label: "Working demo linked", done: Boolean(project.demoUrl) },
                  { label: "At least three milestones", done: milestones.length >= 3 },
                  { label: "Repository analysed", done: Boolean(report) },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-[0.75rem]">
                    {item.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-forest/70" aria-hidden />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
                    )}
                    <span className={item.done ? "text-forest" : "text-muted-foreground"}>{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[0.62rem] leading-4 text-muted-foreground">
                These are evidence prompts, not a score. Missing items are not failures.
              </p>
            </SectionCard>
          </div>

          <SectionCard title="Goals & scope" icon={FileText} action={<Button size="sm" variant="outline" className="rounded-full text-[0.68rem]" onClick={() => setEditOpen(true)}>Edit requirements</Button>}>
            <p className="whitespace-pre-line text-sm leading-7 text-charcoal/70">
              {project.goals || "No goals recorded yet. Add them from the edit dialog so reviewers can judge the project against its own scope."}
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="repository" className="mt-4 space-y-4">
          {repoCheck && (
            <div className="paper rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ToneIcon icon={repoCheck.status === "verified" ? Github : TriangleAlert} tone={repoCheck.status === "verified" ? "forest" : "peach"} className="size-10" />
                  <div>
                    <p className="font-display text-lg text-forest">
                      {repoCheck.owner}/{repoCheck.repoName}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Last check {formatDate(repoCheck.fetchedAt, true)} ·{" "}
                      {repoCheck.status === "verified" ? "GitHub metadata read" : repoCheck.error ?? "Unable to verify"}
                    </p>
                    {report && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <Tag tone="sage">{report.commitSampleSize} commits sampled</Tag>
                        <Tag tone="cream">{report.license ?? "No licence detected"}</Tag>
                        <Tag tone="lavender">{report.related.length} related repos</Tag>
                      </div>
                    )}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <a href={repoCheck.repoUrl} target="_blank" rel="noreferrer noopener">
                    Open GitHub <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </Button>
              </div>
            </div>
          )}
          <SectionCard title="Repository evidence" icon={GitBranch} eyebrow="Live GitHub REST API">
            <RepoAnalysis projectId={project._id} initialUrl={project.repoUrl ?? ""} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <SectionCard
              title="Milestones"
              icon={Target}
              action={
                <Button size="sm" variant="outline" className="rounded-full text-[0.68rem]" onClick={() => { setEditingMilestone(null); setMilestoneOpen(true); }}>
                  <Plus className="size-3" aria-hidden /> Add
                </Button>
              }
            >
              {milestones.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="Define the first milestone"
                  description="A small, verifiable step is better than a large vague one."
                  action={<Button size="sm" className="rounded-full bg-forest" onClick={() => { setEditingMilestone(null); setMilestoneOpen(true); }}>Add milestone</Button>}
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {milestones.map((milestone) => (
                    <li key={milestone._id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <button
                        type="button"
                        aria-label={milestone.completed ? `Reopen ${milestone.title}` : `Complete ${milestone.title}`}
                        onClick={async () => {
                          await updateMilestone({ milestoneId: milestone._id, completed: !milestone.completed });
                          toast.success(milestone.completed ? "Milestone reopened." : "Milestone completed.");
                        }}
                        className="shrink-0 text-forest/60 hover:text-forest"
                      >
                        {milestone.completed ? <CheckCircle2 className="size-5 text-forest" aria-hidden /> : <Circle className="size-5" aria-hidden />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[0.8rem] text-forest", milestone.completed && "text-forest/50 line-through")}>{milestone.title}</p>
                        <p className="text-[0.62rem] text-muted-foreground">
                          {milestone.dueDate ? `Due ${formatDate(milestone.dueDate)}` : "No due date"}
                          {milestone.completedAt ? ` · completed ${formatDate(milestone.completedAt)}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${milestone.title}`}
                          onClick={() => { setEditingMilestone(milestone); setMilestoneOpen(true); }}
                          className="text-forest/40 hover:text-forest"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                        <ConfirmButton
                          title="Delete this milestone?"
                          description={`“${milestone.title}” will be removed from the project and progress will be recalculated.`}
                          onConfirm={async () => {
                            await removeMilestone({ milestoneId: milestone._id });
                            toast.success("Milestone deleted.");
                          }}
                          variant="ghost"
                          className="size-8 p-0 text-forest/40 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </ConfirmButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="Progress" icon={CalendarDays}>
              <div className="flex flex-col items-center gap-2">
                <ScoreRing value={progress} size={120} label="complete" />
                <p className="text-center text-[0.72rem] leading-5 text-muted-foreground">
                  {done} of {milestones.length} milestones complete. Project progress is the share of
                  your own milestones you marked complete.
                </p>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="credibility" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="label-caps text-forest/45">Project credibility</p>
              <p className="text-sm text-forest/70">Distinguishing an idea, a repository, a working application and a deployed product.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full text-[0.68rem]" onClick={() => void saveCredibilityCheck()} disabled={savingCheck}>
                {savingCheck ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ShieldCheck className="size-3.5" aria-hidden />}
                Record check
              </Button>
              <Button size="sm" variant="secondary" className="rounded-full text-[0.68rem]" onClick={() => void saveReport()}>
                <BookMarked className="size-3.5" aria-hidden /> Save report
              </Button>
            </div>
          </div>
          <CredibilityFindings result={credibility} />
          {evidence.length > 0 && (
            <SectionCard title="Saved checks" icon={ClipboardCopy}>
              <ul className="divide-y divide-border/60">
                {evidence.map((check) => (
                  <li key={check._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-[0.75rem] text-forest">{check.summaryStatus}</p>
                      <p className="text-[0.62rem] text-muted-foreground">{formatDate(check.checkedAt, true)}</p>
                    </div>
                    <StatusPill status={check.summaryStatus} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-4">
          <SectionCard title="Project report" icon={FileText} eyebrow="Generated from your records">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full text-[0.68rem]" onClick={() => void copyReport()}>
                <ClipboardCopy className="size-3.5" aria-hidden /> Copy markdown
              </Button>
              <Button size="sm" className="rounded-full bg-forest text-[0.68rem]" onClick={() => void saveReport()}>
                <BookMarked className="size-3.5" aria-hidden /> Save to library
              </Button>
            </div>
            <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-cream/30 p-3 font-mono text-[0.68rem] leading-5 text-forest/80">
              {projectReport}
            </pre>
            <p className="mt-2 text-[0.62rem] text-muted-foreground">
              This report contains only measured values and labelled findings. It does not claim
              skill mastery, impact or third-party endorsement.
            </p>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { const params = new URLSearchParams(searchParams); params.delete("edit"); setSearchParams(params, { replace: true }); } }} project={project} />
      <MilestoneDialog
        open={milestoneOpen}
        onOpenChange={(open) => { setMilestoneOpen(open); if (!open) setEditingMilestone(null); }}
        milestone={editingMilestone}
        onSave={saveMilestone}
        busy={milestoneBusy}
      />
    </div>
  );
}
