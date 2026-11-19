import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { computePreparation, snapshotDelta } from "@/lib/preparation";
import { matchOpportunity } from "@/lib/matching";
import { formatDate, formatHours, greeting, initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  FolderKanban,
  GitBranch,
  Lightbulb,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { ArchScene, CompassStar, LaptopScene, Tilt } from "@/components/decor/Scenes";
import {
  DataBadge,
  EmptyState,
  LoadingBlock,
  MatchBadge,
  ScoreRing,
  SectionCard,
  SeeAll,
  Tag,
  ToneIcon,
} from "@/components/common";
import { Button } from "@/components/ui/button";

const ACTIVITY_ICON: Record<string, typeof CheckCircle2> = {
  roadmap: BookOpen,
  milestone: CheckCircle2,
  saved: Bookmark,
  repository: GitBranch,
  credibility: ShieldCheck,
  project: FolderKanban,
  profile: Sparkles,
  library: BookOpen,
  unsaved: Bookmark,
};

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const overview = useQuery(api.workspace.overview);
  const opportunities = useQuery(api.opportunities.list);
  const recordSnapshot = useMutation(api.workspace.recordSnapshot);
  const recorded = useRef(false);

  useEffect(() => {
    if (user && !user.onboardingComplete) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, navigate]);

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

  useEffect(() => {
    if (!user || !overview || recorded.current || prep.score === null) return;
    recorded.current = true;
    void recordSnapshot({ score: prep.score, breakdown: prep.breakdown });
  }, [user, overview, prep.score, prep.breakdown, recordSnapshot]);

  const delta = snapshotDelta(overview?.snapshots ?? []);

  const matches = useMemo(() => {
    const profile = {
      skills: user?.skills,
      domains: user?.domains,
      interests: user?.interests,
      academicYear: user?.academicYear,
      weeklyHours: user?.weeklyHours,
    };
    return (opportunities ?? [])
      .map((opportunity) => ({
        opportunity,
        match: matchOpportunity(opportunity, profile),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [opportunities, user]);

  const saved = overview?.saved ?? [];
  const activeProjects = (overview?.projects ?? []).filter(
    (project) => project.status !== "shipped",
  );

  const nextMoves = useMemo(() => {
    const moves: {
      title: string;
      detail: string;
      href: string;
      cta: string;
      icon: typeof BookOpen;
      tone: "sage" | "peach" | "lavender";
    }[] = [];

    const openTasks = (overview?.tasks ?? [])
      .filter((task) => task.status !== "done")
      .sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>;
        return rank[a.priority] - rank[b.priority];
      });
    if (openTasks[0]) {
      moves.push({
        title:
          openTasks[0].status === "in-progress"
            ? `Continue: ${openTasks[0].title}`
            : `Start: ${openTasks[0].title}`,
        detail: `${openTasks[0].skill} · ${formatHours(openTasks[0].estimatedMinutes)} · ${openTasks[0].priority} priority`,
        href: "/roadmap",
        cta: "Open roadmap",
        icon: BookOpen,
        tone: "sage",
      });
    }

    const nextDeadline = [...saved]
      .filter(({ opportunity }) => opportunity.registrationDeadline > Date.now())
      .sort((a, b) => a.opportunity.registrationDeadline - b.opportunity.registrationDeadline)[0];
    if (nextDeadline) {
      moves.push({
        title: `Prepare for ${nextDeadline.opportunity.name}`,
        detail: `Registration closes ${formatDate(nextDeadline.opportunity.registrationDeadline)}`,
        href: `/radar/${nextDeadline.opportunity._id}`,
        cta: "View details",
        icon: Trophy,
        tone: "peach",
      });
    }

    const needsRepo = activeProjects.find(
      (project) => project.repoUrl && !project.repoCheckId,
    );
    const noMilestones = activeProjects.find(
      (project) =>
        !overview?.milestones.some((milestone) => milestone.projectId === project._id),
    );
    if (needsRepo) {
      moves.push({
        title: `Check evidence for ${needsRepo.name}`,
        detail: "A repository is linked but has not been analysed yet.",
        href: `/projects/${needsRepo._id}?tab=repository`,
        cta: "Check now",
        icon: ShieldCheck,
        tone: "lavender",
      });
    } else if (noMilestones) {
      moves.push({
        title: `Add a milestone to ${noMilestones.name}`,
        detail: "Milestones drive project progress and your preparation score.",
        href: `/projects/${noMilestones._id}?tab=milestones`,
        cta: "Add milestone",
        icon: Target,
        tone: "lavender",
      });
    } else if (!overview?.targets.some((target) => target.active)) {
      moves.push({
        title: "Set your roadmap target",
        detail: "Choose an opportunity or project to turn skill gaps into tasks.",
        href: "/roadmap",
        cta: "Choose target",
        icon: Compass,
        tone: "lavender",
      });
    } else {
      moves.push({
        title: "Explore one more opportunity",
        detail: "Your radar ranks every record with a visible score breakdown.",
        href: "/radar",
        cta: "Open radar",
        icon: Radar,
        tone: "lavender",
      });
    }

    return moves.slice(0, 3);
  }, [overview, saved, activeProjects]);

  const nextTask = (overview?.tasks ?? []).find((task) => task.status !== "done");
  const doneTasks = (overview?.tasks ?? []).filter((task) => task.status === "done").length;
  const inProgressSkills = Array.from(
    new Set(
      (overview?.tasks ?? [])
        .filter((task) => task.status !== "done")
        .map((task) => task.skill),
    ),
  );
  const gaps = nextTask
    ? Array.from(new Set([nextTask.skill, ...((overview?.targets.find((t) => t.active)?.requiredSkills ?? []).filter((skill) => !(user?.skills ?? []).includes(skill)))])).slice(0, 3)
    : (overview?.targets.find((t) => t.active)?.requiredSkills ?? []).slice(0, 3);

  if (overview === undefined || overview === null || opportunities === undefined) {
    return <LoadingBlock label="Opening your workspace" />;
  }

  const deadlineItems = [...saved]
    .sort((a, b) => a.opportunity.registrationDeadline - b.opportunity.registrationDeadline)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Welcome + preparation */}
      <section className="grid gap-4 xl:grid-cols-[1.62fr_1fr]">
        <div className="relative overflow-hidden rounded-[26px] border border-border/70 bg-cream/60">
          <div className="absolute inset-0 grain opacity-60" aria-hidden />
          <div className="relative grid gap-2 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="relative z-10 p-5 sm:p-7">
              <p className="label-caps text-forest/45">
                {user?.branch || "Your workspace"} {user?.academicYear ? `· ${user.academicYear}` : ""}
              </p>
              <h1 className="mt-2 font-display text-[2.1rem] leading-[1.02] text-forest sm:text-[2.7rem]">
                {greeting()},
                <br />
                {user?.name?.split(" ")[0] ?? "student"}
                <span className="ml-1 text-gold">✦</span>
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-charcoal/65">
                Your next opportunity starts with knowing where you stand.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(user?.interests ?? []).slice(0, 2).map((interest) => (
                  <Tag key={interest} tone="sage">{interest}</Tag>
                ))}
                {(user?.goals ?? []).slice(0, 1).map((goal) => (
                  <Tag key={goal} tone="gold">{goal}</Tag>
                ))}
              </div>
              <Button asChild size="sm" variant="outline" className="mt-4 rounded-full border-forest/20 bg-ivory/70 text-forest">
                <Link to="/radar">
                  Find your next opportunity <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="relative hidden min-h-[220px] sm:block">
              <ArchScene className="absolute inset-0 h-full w-full rounded-none border-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-cream/70 via-transparent to-transparent" aria-hidden />
            </div>
          </div>
        </div>

        <div className="paper relative overflow-hidden rounded-[26px] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-sage/50 blur-2xl" aria-hidden />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="label-caps text-forest/45">Your preparation score</p>
              <p className="mt-1 text-[0.68rem] text-muted-foreground">
                Built from roadmap, milestones, skills and evidence
              </p>
            </div>
            <ScoreRing value={prep.score} size={92} label="ready" />
          </div>

          <div className="relative mt-2">
            {prep.score === null ? (
              <p className="rounded-xl bg-cream/70 px-3 py-2.5 text-[0.72rem] leading-5 text-forest/65">
                Not yet calculated. Complete a roadmap task or create a project milestone to
                establish your baseline — no score is invented.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {delta === null ? (
                    <span className="rounded-full bg-cream px-2 py-0.5 text-[0.62rem] font-semibold text-forest/60">
                      Baseline recorded today
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "tnum rounded-full px-2 py-0.5 text-[0.62rem] font-semibold",
                        delta >= 0 ? "bg-sage text-forest" : "bg-peach text-forest",
                      )}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta} pts since your last recorded day
                    </span>
                  )}
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {prep.breakdown.map((item) => (
                    <li key={item.key} className="text-[0.68rem]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-forest/70">{item.label}</span>
                        <span className="tnum text-forest/60">{Math.round(item.value * 100)}% · w{item.weight}</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-forest/10">
                        <div className="h-full rounded-full bg-forest/55" style={{ width: `${Math.round(item.value * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Button asChild size="sm" className="mt-3 w-full rounded-full bg-forest text-ivory">
              <Link to="/progress">
                Open progress hub <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Your metrics">
        {[
          {
            label: "Opportunities discovered",
            value: opportunities.length,
            detail: `${matches.filter((m) => m.match.score >= 60).length} strong matches · demo catalogue`,
            icon: Trophy,
            tone: "bg-sage",
            href: "/radar",
          },
          {
            label: "Skills in progress",
            value: inProgressSkills.length,
            detail: inProgressSkills.slice(0, 2).join(", ") || "Set a roadmap target",
            icon: Zap,
            tone: "bg-peach",
            href: "/roadmap",
          },
          {
            label: "Active projects",
            value: activeProjects.length,
            detail: `${overview.projects.length} total projects`,
            icon: FolderKanban,
            tone: "bg-lavender",
            href: "/projects",
          },
          {
            label: "Tasks completed",
            value: doneTasks,
            detail: `${overview.milestones.filter((m) => m.completed).length} milestones complete`,
            icon: CheckCircle2,
            tone: "bg-gold/45",
            href: "/roadmap",
          },
        ].map((metric) => (
          <Link
            key={metric.label}
            to={metric.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border border-forest/10 p-4 transition-transform hover:-translate-y-0.5",
              metric.tone,
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ivory/75 text-forest">
              <metric.icon className="size-[1.1rem]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="tnum font-display text-2xl leading-none text-forest">{metric.value}</p>
              <p className="mt-1 text-[0.7rem] font-medium leading-tight text-forest/80">{metric.label}</p>
              <p className="mt-0.5 truncate text-[0.6rem] text-forest/45">{metric.detail}</p>
            </div>
            <ArrowUpRight className="size-3.5 shrink-0 text-forest/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </section>

      {/* Middle row */}
      <section className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          title="Your next move"
          icon={Sparkles}
          action={<SeeAll to="/roadmap" />}
          className="lg:col-span-4"
        >
          <ul className="space-y-2">
            {nextMoves.map((move) => (
              <li key={move.title}>
                <Link
                  to={move.href}
                  className="flex items-start gap-2.5 rounded-xl p-2 transition-colors hover:bg-cream/60"
                >
                  <ToneIcon icon={move.icon} tone={move.tone} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.78rem] font-medium leading-5 text-forest">{move.title}</p>
                    <p className="mt-0.5 text-[0.65rem] leading-4 text-muted-foreground">{move.detail}</p>
                  </div>
                  <span className="mt-1 shrink-0 rounded-full bg-forest px-2.5 py-1 text-[0.6rem] font-medium text-ivory">
                    {move.cta}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Recommended hackathons"
          icon={Compass}
          action={<SeeAll to="/radar" />}
          className="lg:col-span-5"
          bodyClassName="pt-1"
        >
          {matches.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="No opportunities loaded"
              description="The demonstration catalogue is being prepared."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {matches.slice(0, 3).map(({ opportunity, match }) => (
                <li key={opportunity._id} className="py-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream">
                      <CompassStar className="size-4 text-forest/70" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          to={`/radar/${opportunity._id}`}
                          className="text-[0.8rem] font-medium text-forest hover:underline"
                        >
                          {opportunity.name}
                        </Link>
                        <DataBadge status={opportunity.dataStatus} />
                      </div>
                      <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
                        {opportunity.organiser} · <span className="capitalize">{opportunity.format}</span> · closes {formatDate(opportunity.registrationDeadline)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[0.63rem] leading-4 text-charcoal/60">
                        {match.reasons[0]} {match.reasons[1]}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <MatchBadge score={match.score} />
                      <Link
                        to={`/radar/${opportunity._id}`}
                        aria-label={`View ${opportunity.name}`}
                        className="grid size-6 place-items-center rounded-full bg-cream text-forest/60 hover:text-forest"
                      >
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Skill roadmap" icon={BookOpen} className="lg:col-span-3">
          <div className="flex flex-col items-center gap-2 py-1 text-center">
            <ScoreRing
              value={
                overview.tasks.length === 0
                  ? null
                  : Math.round((doneTasks / overview.tasks.length) * 100)
              }
              size={104}
              label="roadmap"
            />
            <p className="text-[0.72rem] leading-5 text-charcoal/65">
              {overview.tasks.length === 0
                ? "No roadmap yet. Choose a target to generate one."
                : nextTask
                  ? `Next up: ${nextTask.title}`
                  : "Every task is complete — set a new target."}
            </p>
            <Button asChild size="sm" className="w-full rounded-full bg-forest">
              <Link to="/roadmap">View roadmap</Link>
            </Button>
          </div>
          <div className="mt-3">
            <p className="label-caps mb-1.5 text-forest/45">Top skill gaps</p>
            <div className="flex flex-wrap gap-1">
              {gaps.length === 0 ? (
                <Tag tone="sage">No open gaps</Tag>
              ) : (
                gaps.map((gap) => <Tag key={gap} tone="peach">{gap}</Tag>)
              )}
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Bottom row */}
      <section className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          title="Recent activity"
          icon={Clock}
          action={<SeeAll to="/progress" />}
          className="lg:col-span-4"
        >
          {overview.activities.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No activity yet"
              description="Save an opportunity, complete a task or run a repository check and it will appear here."
            />
          ) : (
            <ol className="relative space-y-2.5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
              {overview.activities.slice(0, 5).map((activity) => {
                const Icon = ACTIVITY_ICON[activity.kind] ?? Sparkles;
                return (
                  <li key={activity._id} className="relative flex gap-2.5">
                    <span className="relative z-10 mt-0.5 grid size-[27px] shrink-0 place-items-center rounded-full border border-border bg-card text-forest/60">
                      <Icon className="size-3" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[0.73rem] text-forest">
                        {activity.href ? (
                          <Link to={activity.href} className="hover:underline">{activity.title}</Link>
                        ) : (
                          activity.title
                        )}
                      </p>
                      <p className="text-[0.6rem] text-muted-foreground">
                        {relativeTime(activity.createdAt)}
                        {activity.detail ? ` · ${activity.detail}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </SectionCard>

        <div className="relative overflow-hidden rounded-2xl bg-forest p-5 text-ivory lg:col-span-4">
          <div className="relative z-10 max-w-[230px]">
            <p className="label-caps text-gold/80">Build your next thing</p>
            <h2 className="mt-2 font-display text-[1.7rem] leading-tight">
              From idea to impact — with evidence.
            </h2>
            <p className="mt-2 text-[0.72rem] leading-5 text-ivory/60">
              Create a project, add milestones and connect a repository for a real evidence check.
            </p>
            <Button asChild size="sm" className="mt-3 rounded-full bg-ivory text-forest hover:bg-cream">
              <Link to="/projects?new=1">Start a project <ArrowRight className="size-3.5" aria-hidden /></Link>
            </Button>
          </div>
          <div className="pointer-events-none absolute -bottom-4 -right-2 opacity-95">
            <LaptopScene className="scale-[0.72]" />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle cx="170" cy="40" r="70" fill="none" stroke="#D5B77A" />
              <circle cx="170" cy="40" r="46" fill="none" stroke="#D5B77A" />
            </svg>
          </div>
        </div>

        <SectionCard
          title="Upcoming deadlines"
          icon={CalendarDays}
          action={<SeeAll to="/saved" />}
          className="lg:col-span-4"
        >
          {deadlineItems.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Save an opportunity from the radar and its registration deadline will appear here."
              action={
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/radar">Browse radar</Link>
                </Button>
              }
            />
          ) : (
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
              {deadlineItems.map(({ opportunity }) => {
                const days = Math.ceil(
                  (opportunity.registrationDeadline - Date.now()) / (1000 * 60 * 60 * 24),
                );
                const tone =
                  days < 0
                    ? "bg-cream text-muted-foreground"
                    : days <= 7
                      ? "bg-peach text-forest"
                      : days <= 21
                        ? "bg-gold/45 text-forest"
                        : "bg-sage text-forest";
                return (
                  <li key={opportunity._id} className="relative flex items-start gap-2.5">
                    <span
                      className="relative z-10 mt-1 size-[27px] shrink-0 rounded-full border-[5px] border-card"
                      style={{ backgroundColor: days <= 7 ? "#EEB99E" : days <= 21 ? "#D5B77A" : "#B9D0AD" }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <Link to={`/radar/${opportunity._id}`} className="line-clamp-1 text-[0.73rem] font-medium text-forest hover:underline">
                        {opportunity.name}
                      </Link>
                      <p className="text-[0.6rem] text-muted-foreground">
                        {formatDate(opportunity.registrationDeadline)}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-semibold", tone)}>
                      {days < 0 ? "Closed" : `${days}d left`}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-3 rounded-lg bg-cream/60 px-2.5 py-2 text-[0.62rem] leading-4 text-forest/55">
            Saved opportunities only · dates come from the labelled demo catalogue.
          </div>
        </SectionCard>
      </section>

      {/* Project preview */}
      <section className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          title="Your projects"
          icon={FolderKanban}
          action={<SeeAll to="/projects" />}
          className="lg:col-span-8"
        >
          {overview.projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="A project turns learning into evidence. Create one and add a first milestone."
              action={
                <Button asChild size="sm" className="rounded-full bg-forest">
                  <Link to="/projects?new=1">Create a project</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {overview.projects.slice(0, 4).map((project) => {
                const projectMilestones = overview.milestones.filter(
                  (milestone) => milestone.projectId === project._id,
                );
                const done = projectMilestones.filter((m) => m.completed).length;
                const progress =
                  projectMilestones.length === 0
                    ? 0
                    : Math.round((done / projectMilestones.length) * 100);
                const next = projectMilestones.find((m) => !m.completed);
                return (
                  <li key={project._id}>
                    <Link
                      to={`/projects/${project._id}`}
                      className="flex h-full flex-col rounded-xl border border-border/70 bg-cream/25 p-3 transition-colors hover:border-forest/25 hover:bg-cream/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-[0.8rem] font-medium text-forest">{project.name}</p>
                        <span className="rounded-full bg-card px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] text-forest/60">
                          {project.status}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[0.62rem] text-muted-foreground">
                        {project.technologies.slice(0, 3).join(" · ")}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest/10">
                          <div className="h-full rounded-full bg-forest/55" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="tnum text-[0.6rem] text-forest/60">{progress}%</span>
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-[0.6rem] text-forest/50">
                        {next ? `Next: ${next.title}` : projectMilestones.length === 0 ? "Add your first milestone" : "All milestones complete"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Preparation contributors" icon={Target} className="lg:col-span-4">
          <ul className="space-y-2 text-[0.72rem]">
            {[
              { label: "Roadmap tasks", value: `${doneTasks}/${overview.tasks.length}`, detail: "40% of the score when present" },
              { label: "Milestones", value: `${overview.milestones.filter((m) => m.completed).length}/${overview.milestones.length}`, detail: "25% of the score when present" },
              { label: "Target skills covered", value: prep.skillReadiness === null ? "No target" : `${prep.skillReadiness}%`, detail: "20% of the score when present" },
              { label: "Verified evidence", value: prep.verifiedEvidence, detail: "15% of the score, capped at four checks" },
            ].map((row) => (
              <li key={row.label} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-forest">{row.label}</p>
                  <p className="text-[0.6rem] text-muted-foreground">{row.detail}</p>
                </div>
                <span className="tnum shrink-0 font-display text-lg text-forest">{row.value}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-sage/40 px-2.5 py-2 text-[0.62rem] leading-4 text-forest/65">
            <Lightbulb className="size-3.5 shrink-0" aria-hidden />
            Components without data are excluded and the remaining weights are renormalised.
          </div>
        </SectionCard>
      </section>

      <div className="flex items-center justify-center gap-2 pb-2 text-[0.65rem] text-muted-foreground">
        <Loader2 className="hidden size-3" aria-hidden />
        Everything on this page is computed from your own records in Convex.
      </div>
    </div>
  );
}
