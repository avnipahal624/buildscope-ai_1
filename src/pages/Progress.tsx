import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { computePreparation } from "@/lib/preparation";
import { buildProgressReport, computeAchievements, monthlySummary } from "@/lib/insights";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  Award,
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  FileText,
  FolderKanban,
  Loader2,
  Lock,
  Radar,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import {
  EmptyState,
  InfoNote,
  LoadingBlock,
  PageHeader,
  ScoreRing,
  SectionCard,
  Tag,
} from "@/components/common";
import { BookScene, CompassStar } from "@/components/decor/Scenes";

export default function Progress() {
  const { user } = useAuth();
  const overview = useQuery(api.workspace.overview);
  const activityFeed = useQuery(api.workspace.activityList);
  const addLibraryItem = useMutation(api.workspace.addLibraryItem);
  const [searchParams, setSearchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const reportOpen = searchParams.get("report") === "1";
  const setReportOpen = (open: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (open) next.set("report", "1");
    else next.delete("report");
    setSearchParams(next, { replace: true });
  };

  const achievements = useMemo(
    () =>
      overview
        ? computeAchievements({
            tasks: overview.tasks,
            milestones: overview.milestones,
            projects: overview.projects,
            repoChecks: overview.repoChecks,
            saved: overview.saved,
            evidence: overview.evidence,
          })
        : [],
    [overview],
  );

  const monthly = useMemo(
    () =>
      overview
        ? monthlySummary({
            activities: activityFeed ?? overview.activities,
            tasks: overview.tasks,
            milestones: overview.milestones,
          })
        : null,
    [overview, activityFeed],
  );

  const prep = useMemo(
    () =>
      computePreparation({
        tasks: overview?.tasks ?? [],
        milestones: overview?.milestones ?? [],
        targets: overview?.targets ?? [],
        userSkills: user?.skills,
        repoChecks: overview?.repoChecks ?? [],
        evidence: overview?.evidence ?? [],
      }),
    [overview, user?.skills],
  );

  const report = useMemo(
    () =>
      overview
        ? buildProgressReport({
            name: user?.name ?? "BuildScope student",
            college: user?.college,
            branch: user?.branch,
            academicYear: user?.academicYear,
            goals: user?.goals,
            tasks: overview.tasks,
            milestones: overview.milestones,
            projects: overview.projects,
            saved: overview.saved,
            repoChecks: overview.repoChecks,
            achievements,
          })
        : null,
    [overview, user, achievements],
  );

  const scoreSeries = useMemo(
    () =>
      (overview?.snapshots ?? []).map((snapshot) => ({
        day: snapshot.day.slice(5),
        score: snapshot.score,
      })),
    [overview?.snapshots],
  );

  const weeklySeries = useMemo(() => {
    const weeks: { label: string; activities: number; completed: number }[] = [];
    for (let index = 7; index >= 0; index -= 1) {
      const end = Date.now() - index * 7 * 24 * 60 * 60 * 1000;
      const start = end - 7 * 24 * 60 * 60 * 1000;
      const activities = (overview?.activities ?? []).filter(
        (activity) => activity.createdAt >= start && activity.createdAt < end,
      ).length;
      const completed = (overview?.tasks ?? []).filter(
        (task) => task.completedAt && task.completedAt >= start && task.completedAt < end,
      ).length;
      weeks.push({ label: `${8 - index}w`, activities, completed });
    }
    return weeks;
  }, [overview]);

  const skillSeries = useMemo(() => {
    const counts = new Map<string, { done: number; total: number }>();
    for (const task of overview?.tasks ?? []) {
      const entry = counts.get(task.skill) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (task.status === "done") entry.done += 1;
      counts.set(task.skill, entry);
    }
    return Array.from(counts.entries())
      .map(([skill, value]) => ({ skill, ...value }))
      .sort((a, b) => b.done - a.done || b.total - a.total)
      .slice(0, 6);
  }, [overview?.tasks]);

  if (overview === undefined || overview === null) return <LoadingBlock label="Assembling your progress" />;

  const doneTasks = overview.tasks.filter((task) => task.status === "done");
  const activeProjects = overview.projects.filter((project) => project.status !== "shipped");

  const saveReport = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await addLibraryItem({
        title: report.title,
        description: `${report.skills.length} skills practised · ${report.projectCount} projects · ${report.milestoneCount} milestones · ${report.verifiedEvidenceCount} verified repositories`,
        kind: "report",
        payload: { markdown: report.markdown, generatedAt: report.generatedAt },
      });
      toast.success("Progress report saved to your library.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the report.");
    } finally {
      setSaving(false);
    }
  };

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.markdown);
      toast.success("Report copied as markdown.");
    } catch {
      toast.error("Clipboard access was blocked.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Progress Hub"
        title={
          <>
            A record of what
            <br />
            <span className="italic text-forest/60">you actually did.</span>
          </>
        }
        description="Every number here traces back to a task you completed, a milestone you marked, an opportunity you saved or a repository check that ran. Nothing is auto-awarded."
        actions={
          <>
            <Button size="sm" onClick={() => setReportOpen(true)} className="rounded-full bg-forest">
              <FileText className="size-3.5" aria-hidden /> Generate progress report
            </Button>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {monthly?.label}
            </span>
          </>
        }
        aside={<BookScene className="hidden h-[130px] w-[150px] lg:block" />}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Roadmap completion", value: prep.roadmapCompletion, suffix: "%", detail: `${doneTasks.length} of ${overview.tasks.length} tasks`, icon: BookOpen },
          { label: "Milestones complete", value: overview.milestones.filter((m) => m.completed).length, suffix: `/${overview.milestones.length}`, detail: `${activeProjects.length} active projects`, icon: CheckCircle2 },
          { label: "Opportunities explored", value: overview.saved.length, suffix: "", detail: "saved from the radar", icon: Radar },
          { label: "Verified evidence", value: prep.verifiedEvidence, suffix: "", detail: `${overview.repoChecks.length} repository checks run`, icon: Award },
        ].map((metric) => (
          <div key={metric.label} className="paper rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps text-forest/45">{metric.label}</p>
              <metric.icon className="size-4 text-forest/35" aria-hidden />
            </div>
            <p className="tnum mt-2 font-display text-3xl leading-none text-forest">
              {metric.value}
              <span className="text-lg text-forest/40">{metric.suffix}</span>
            </p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Preparation trend" icon={Activity} eyebrow="One snapshot per day">
          {scoreSeries.length < 2 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CompassStar className="size-8 text-forest/30" />
              <p className="text-sm font-medium text-forest">Not enough history yet</p>
              <p className="max-w-sm text-[0.72rem] leading-5 text-muted-foreground">
                Your score is recorded once per day when you visit the overview. A trend appears
                after a second day of data — BuildScope will not invent one.
              </p>
            </div>
          ) : (
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreSeries} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#183B2E" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#183B2E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DCCD" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7063" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6B7063" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E4DCCD", background: "#FFFDF8", fontSize: 12 }}
                    formatter={(value: number) => [`${value}%`, "Preparation"]}
                  />
                  <Area type="monotone" dataKey="score" stroke="#183B2E" strokeWidth={2} fill="url(#scoreFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ScoreRing value={prep.score} size={68} label="now" />
              <p className="text-[0.68rem] leading-5 text-muted-foreground">
                {prep.hasData
                  ? `Weighted over ${prep.breakdown.length} component${prep.breakdown.length === 1 ? "" : "s"} with data.`
                  : "Not yet calculated — complete a task or milestone."}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full text-[0.68rem]">
              <Link to="/dashboard">See the breakdown</Link>
            </Button>
          </div>
        </SectionCard>

        <SectionCard title={monthly?.label ?? "This month"} icon={CalendarDays} eyebrow="Monthly summary">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Tasks completed", value: monthly?.tasksCompleted ?? 0 },
              { label: "Milestones", value: monthly?.milestonesCompleted ?? 0 },
              { label: "Activities", value: monthly?.activities ?? 0 },
              { label: "Opportunities saved", value: monthly?.opportunitySaves ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-cream/50 px-3 py-2">
                <p className="tnum font-display text-2xl leading-none text-forest">{item.value}</p>
                <p className="mt-1 text-[0.6rem] uppercase tracking-[0.06em] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySeries} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#6B7063" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#6B7063" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4DCCD", background: "#FFFDF8", fontSize: 11 }} />
                <Bar dataKey="activities" radius={[3, 3, 0, 0]} fill="#B9A5D3" name="Activity" />
                <Bar dataKey="completed" radius={[3, 3, 0, 0]} fill="#183B2E" name="Tasks done" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[0.6rem] text-muted-foreground">Last eight weeks, from your activity log.</p>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Skill development" icon={Sparkles} eyebrow="Practised vs planned">
          {skillSeries.length === 0 ? (
            <EmptyState icon={BookOpen} title="No roadmap skills yet" description="Generate a roadmap to start tracking learning by skill." action={<Button asChild size="sm" className="rounded-full bg-forest"><Link to="/roadmap">Open roadmap</Link></Button>} />
          ) : (
            <ul className="space-y-2.5">
              {skillSeries.map((skill, index) => (
                <li key={skill.skill}>
                  <div className="flex items-center justify-between gap-2 text-[0.72rem]">
                    <span className="text-forest">{skill.skill}</span>
                    <span className="tnum text-muted-foreground">{skill.done}/{skill.total} tasks</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, Math.round((skill.done / skill.total) * 100))}%`,
                        backgroundColor: ["#183B2E", "#8FAC7E", "#D5B77A", "#B9A5D3", "#EEB99E", "#23503F"][index % 6],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <InfoNote tone="cream">
            “Practised” means a task you completed, not demonstrated mastery. BuildScope makes no
            proficiency claim.
          </InfoNote>
        </SectionCard>

        <SectionCard title="Achievements" icon={Trophy} eyebrow="Evidence required">
          <ul className="space-y-2">
            {achievements.map((achievement) => (
              <li
                key={achievement.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-2.5 py-2",
                  achievement.unlocked ? "border-sage-deep/50 bg-sage/30" : "border-border/70 bg-cream/25",
                )}
              >
                <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", achievement.unlocked ? "bg-forest text-gold" : "bg-card text-muted-foreground/40")}>
                  {achievement.unlocked ? <Trophy className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-[0.72rem] font-medium", achievement.unlocked ? "text-forest" : "text-muted-foreground")}>
                    {achievement.title}
                  </p>
                  <p className="text-[0.58rem] leading-4 text-muted-foreground">{achievement.evidence}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Project completion" icon={FolderKanban} eyebrow="Build history">
          {overview.projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to build a completion history." action={<Button asChild size="sm" className="rounded-full bg-forest"><Link to="/projects?new=1">New project</Link></Button>} />
          ) : (
            <ul className="space-y-2">
              {overview.projects.map((project) => {
                const projectMilestones = overview.milestones.filter(
                  (milestone) => milestone.projectId === project._id,
                );
                const done = projectMilestones.filter((milestone) => milestone.completed).length;
                const progress = projectMilestones.length === 0 ? 0 : Math.round((done / projectMilestones.length) * 100);
                return (
                  <li key={project._id}>
                    <Link to={`/projects/${project._id}`} className="block rounded-xl border border-border/70 bg-cream/25 px-2.5 py-2 hover:border-forest/25">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[0.72rem] text-forest">{project.name}</p>
                        <span className="tnum text-[0.6rem] text-muted-foreground">{progress}%</span>
                      </div>
                      <p className="text-[0.58rem] text-muted-foreground">
                        {project.status} · {done}/{projectMilestones.length} milestones · updated {relativeTime(project.updatedAt)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Progress timeline" icon={Clock}>
          {(activityFeed ?? overview.activities).length === 0 ? (
            <EmptyState icon={Activity} title="Your timeline is empty" description="Complete a task, save an opportunity or run a check to start the record." />
          ) : (
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
              {(activityFeed ?? overview.activities).slice(0, 10).map((activity) => (
                <li key={activity._id} className="relative flex items-start gap-3">
                  <span className="relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-[4px] border-card bg-forest/40" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[0.75rem] text-forest">
                      {activity.href ? <Link to={activity.href} className="hover:underline">{activity.title}</Link> : activity.title}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      {formatDate(activity.createdAt, true)} · {relativeTime(activity.createdAt)}
                      {activity.detail ? ` · ${activity.detail}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <SectionCard title="Repository activity" icon={BarChart3} eyebrow="Read-only checks">
          {overview.repoChecks.length === 0 ? (
            <EmptyState icon={BarChart3} title="No repository reads" description="Run a GitHub check from a project or the credibility workspace." action={<Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/credibility">Open credibility</Link></Button>} />
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                {overview.repoChecks.slice(0, 6).reverse().map((check) => {
                  const sample = (check.report as { commitSampleSize?: number } | null)
                    ?.commitSampleSize;
                  return (
                    <div
                      key={check._id}
                      className="flex-1"
                      title={`${check.owner}/${check.repoName}${sample === undefined ? " · not assessed" : ` · ${sample} commits sampled`}`}
                    >
                      <div
                        className={cn("rounded-t", sample === undefined ? "bg-forest/20" : "bg-forest/60")}
                        style={{
                          height:
                            sample === undefined
                              ? 6
                              : Math.max(8, Math.min(56, sample * 1.6)),
                        }}
                      />
                      <p className="mt-1 truncate text-center text-[0.5rem] text-muted-foreground">{check.repoName}</p>
                    </div>
                  );
                })}
              </div>
              <ul className="divide-y divide-border/60">
                {overview.repoChecks.slice(0, 4).map((check) => (
                  <li key={check._id} className="flex items-center justify-between gap-2 py-1.5 text-[0.68rem]">
                    <span className="truncate text-forest">{check.owner}/{check.repoName}</span>
                    <span className="shrink-0 text-[0.58rem] text-muted-foreground">{formatDate(check.fetchedAt)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-forest">Student progress report</DialogTitle>
            <DialogDescription>
              Generated from your own records. Save it to your library or copy the markdown to share.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full text-[0.68rem]" onClick={() => void copyReport()}>
              <ClipboardCopy className="size-3.5" aria-hidden /> Copy markdown
            </Button>
            <Button size="sm" className="rounded-full bg-forest text-[0.68rem]" onClick={() => void saveReport()} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <BookMarked className="size-3.5" aria-hidden />}
              Save to library
            </Button>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-cream/30 p-3 font-mono text-[0.68rem] leading-5 text-forest/80">
            {report?.markdown}
          </pre>
          <DialogFooter>
            <p className="text-[0.6rem] leading-4 text-muted-foreground">
              The report lists only completed tasks, recorded milestones, saved opportunities and
              verified repository links. It makes no mastery or outcome claims.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
