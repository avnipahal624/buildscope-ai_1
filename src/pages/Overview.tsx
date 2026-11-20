import { api, errorMessage, type Evidence, type Project, type ProjectReport, type ProjectRequirement } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { buildPassport, readinessSummary } from "@/lib/passport";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  FileSearch,
  FolderKanban,
  Github,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { useMemo } from "react";
import { CompassStar, LaptopScene } from "@/components/decor/Scenes";
import {
  EmptyState,
  ErrorNote,
  InfoNote,
  LoadingBlock,
  PageHeader,
  SectionCard,
  ToneIcon,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { InvestigationTrail } from "@/components/InvestigationTrail";

type Entry = {
  project: Project;
  report: ProjectReport | null;
  evidence: Evidence[];
  requirements: ProjectRequirement[];
  failures: string[];
};

async function loadWorkspace(signal: AbortSignal): Promise<Entry[]> {
  const projects = await api.listProjects(signal);
  return Promise.all(
    projects.map(async (project) => {
      const [report, evidence, requirements] = await Promise.allSettled([
        api.getReport(project.id, signal),
        api.listEvidence(project.id, undefined, signal),
        api.listProjectRequirements(project.id, signal),
      ]);
      const failures: string[] = [];
      if (report.status === "rejected") failures.push(`report: ${errorMessage(report.reason)}`);
      if (evidence.status === "rejected") failures.push(`evidence: ${errorMessage(evidence.reason)}`);
      if (requirements.status === "rejected")
        failures.push(`requirements: ${errorMessage(requirements.reason)}`);
      return {
        project,
        report: report.status === "fulfilled" ? report.value : null,
        evidence: evidence.status === "fulfilled" ? evidence.value : [],
        requirements: requirements.status === "fulfilled" ? requirements.value : [],
        failures,
      };
    }),
  );
}

export default function Overview() {
  const workspace = useResource((signal) => loadWorkspace(signal), []);

  const entries = workspace.data ?? [];
  const actions = useMemo(() => {
    if (entries.length === 0) {
      return [
        {
          title: "Create your first investigation",
          detail: "Add a project with a problem statement, target users and planned features.",
          href: "/projects?new=1",
          cta: "Create project",
          icon: Plus,
          tone: "sage" as const,
        },
      ];
    }
    const result: Array<{
      title: string;
      detail: string;
      href: string;
      cta: string;
      icon: typeof FileSearch;
      tone: "sage" | "peach" | "lavender" | "gold";
    }> = [];
    const needsResearch = entries.find(
      (entry) => (entry.report?.similar_projects.length ?? 0) === 0,
    );
    if (needsResearch) {
      result.push({
        title: `Investigate ${needsResearch.project.name}`,
        detail: "No comparable public projects have been retrieved yet. Start a research run.",
        href: `/projects/${needsResearch.project.id}?tab=research`,
        cta: "Run research",
        icon: FileSearch,
        tone: "sage",
      });
    }
    const needsStakeholders = entries.find(
      (entry) =>
        (entry.report?.similar_projects.length ?? 0) > 0 &&
        (entry.report?.stakeholders.length ?? 0) === 0,
    );
    if (needsStakeholders) {
      result.push({
        title: `Analyse users for ${needsStakeholders.project.name}`,
        detail: "Comparable projects exist, but no stakeholder groups or needs have been analysed.",
        href: `/projects/${needsStakeholders.project.id}?tab=evidence`,
        cta: "Analyse users",
        icon: Users,
        tone: "peach",
      });
    }
    const needsRequirement = entries.find(
      (entry) =>
        (entry.report?.opportunities.length ?? 0) > 0 && entry.requirements.length === 0,
    );
    if (needsRequirement) {
      result.push({
        title: `Write a testable requirement`,
        detail: `${needsRequirement.project.name} has opportunities but no recorded requirement.`,
        href: `/projects/${needsRequirement.project.id}?tab=requirements`,
        cta: "Open proof chain",
        icon: ClipboardCheck,
        tone: "lavender",
      });
    }
    const readyForPassport = entries.find(
      (entry) => (entry.report?.similar_projects.length ?? 0) > 0,
    );
    if (result.length < 3 && readyForPassport) {
      result.push({
        title: `Review the Passport for ${readyForPassport.project.name}`,
        detail: "See which readiness checks are complete, partial, missing or not assessed.",
        href: `/projects/${readyForPassport.project.id}/passport`,
        cta: "Open Passport",
        icon: BookOpenCheck,
        tone: "gold",
      });
    }
    return result.slice(0, 3);
  }, [entries]);

  const activity = useMemo(() => {
    const rows: Array<{
      id: string;
      title: string;
      detail: string;
      at: string;
      href: string;
      icon: typeof FileSearch;
    }> = [];
    for (const entry of entries) {
      rows.push({
        id: `project-${entry.project.id}`,
        title: `${entry.project.name} created`,
        detail: entry.project.status,
        at: entry.project.created_at,
        href: `/projects/${entry.project.id}`,
        icon: FolderKanban,
      });
      for (const similar of entry.report?.similar_projects.slice(0, 3) ?? []) {
        rows.push({
          id: `similar-${similar.id}`,
          title: `Comparable project retrieved: ${similar.name}`,
          detail: entry.project.name,
          at: similar.collected_at,
          href: similar.source_url,
          icon: Github,
        });
      }
      for (const item of entry.evidence.slice(0, 3)) {
        rows.push({
          id: `evidence-${item.id}`,
          title: item.excerpt_verified ? "Verified excerpt recorded" : "Evidence excerpt recorded",
          detail: item.source_title ?? entry.project.name,
          at: item.retrieved_at ?? entry.project.created_at,
          href: item.source_url ?? `/projects/${entry.project.id}?tab=evidence`,
          icon: ShieldCheck,
        });
      }
    }
    return rows
      .filter((row) => row.at && !Number.isNaN(new Date(row.at).getTime()))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [entries]);

  const passportRows = useMemo(
    () =>
      entries.map((entry) => {
        const passport = buildPassport({
          project: entry.project,
          report: entry.report,
          similarProjects: entry.report?.similar_projects ?? [],
          comparisons: entry.report?.comparisons ?? [],
          evidence: entry.evidence,
          stakeholders: entry.report?.stakeholders ?? [],
          needs: entry.report?.needs ?? [],
          opportunities: entry.report?.opportunities ?? [],
          projectRequirements: entry.requirements,
          chains: [],
        });
        return { entry, passport, summary: readinessSummary(passport.checks) };
      }),
    [entries],
  );

  if (workspace.loading) return <LoadingBlock label="Opening the research workspace" />;

  if (workspace.error) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Research overview"
          title={<>The research service is not reachable.</>}
          description="BuildScope does not substitute demo data when the FastAPI service is unavailable."
        />
        <ErrorNote>{workspace.error}</ErrorNote>
        <Button variant="outline" className="rounded-full" onClick={workspace.reload}>
          <RefreshCw className="size-4" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="paper overflow-hidden rounded-2xl border border-forest/15" aria-label="Investigation case file">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/15 bg-sage/45 px-5 py-3">
          <p className="label-caps text-forest/70">BuildScope / Investigation case file</p>
          <span className="text-xs text-forest/60">{entries.length} project{entries.length === 1 ? "" : "s"} in this workspace</span>
        </div>
        <div className="p-5 sm:p-7">
          <div>
            <p className="label-caps text-forest/50">Current investigation</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-forest sm:text-4xl">
              {entries[0]?.project.name ?? "Start an investigation"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/70">
              {entries[0]?.project.problem_statement || entries[0]?.project.description || "Record a problem, investigate existing work and review the evidence before deciding what to build."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="bg-forest text-ivory">
                <Link to={entries[0] ? `/projects/${entries[0].project.id}` : "/projects?new=1"}>
                  {entries[0] ? "Open case file" : "New investigation"} <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
              {entries[0] && <Button asChild size="sm" variant="outline"><Link to="/projects?new=1"><Plus className="size-3.5" aria-hidden /> New investigation</Link></Button>}
            </div>
          </div>
          {entries[0] && (
            <div className="mt-6 border-t border-forest/15 pt-5">
              <InvestigationTrail projectId={entries[0].project.id} report={entries[0].report} evidence={entries[0].evidence} requirements={entries[0].requirements} failures={entries[0].failures} />
              {entries[0].failures.length > 0 && <p className="mt-4 text-xs text-destructive">Some records could not be loaded. Open the case file for details.</p>}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          title="Items needing attention"
          icon={ClipboardCheck}
          action={<Link to="/projects" className="text-xs text-forest/60 hover:text-forest">All projects</Link>}
          className="lg:col-span-4"
        >
          {actions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No blocking next step"
              description="Every current project has research, stakeholders and a requirement. Re-run research as the landscape changes."
            />
          ) : (
            <ul className="space-y-2">
              {actions.map((move) => (
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
          )}
        </SectionCard>

        <SectionCard
          title="Active investigations"
          icon={FolderKanban}
          action={<Link to="/projects" className="text-xs text-forest/60 hover:text-forest">See all</Link>}
          className="lg:col-span-5"
        >
          {entries.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No investigations yet"
              description="Create a project to start with a problem statement and a real research question."
              action={
                <Button asChild size="sm" className="rounded-full bg-forest">
                  <Link to="/projects?new=1">Create a project</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {entries.slice(0, 4).map((entry) => {
                const landscape = entry.report?.similar_projects.length ?? 0;
                const needs = entry.report?.needs.length ?? 0;
                return (
                  <li key={entry.project.id} className="py-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream">
                        <CompassStar className="size-4 text-forest/70" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link to={`/projects/${entry.project.id}`} className="text-[0.8rem] font-medium text-forest hover:underline">
                            {entry.project.name}
                          </Link>
                          <span className="rounded-full bg-cream px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] text-forest/60">
                            {entry.project.status}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[0.62rem] text-muted-foreground">
                          {landscape} comparable · {entry.evidence.length} evidence · {needs} needs · {entry.requirements.length} requirements
                        </p>
                        {entry.failures.length > 0 && (
                          <p className="mt-1 line-clamp-1 text-[0.6rem] text-destructive">
                            Partial data: {entry.failures[0]}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/projects/${entry.project.id}`}
                        aria-label={`Open ${entry.project.name}`}
                        className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-forest/60 hover:text-forest"
                      >
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Buildability Passports" icon={BookOpenCheck} className="lg:col-span-3">
          {passportRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CompassStar className="size-8 text-forest/25" />
              <p className="text-[0.72rem] leading-5 text-charcoal/65">
                A Passport appears after you create an investigation.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {passportRows.slice(0, 3).map(({ entry, summary }) => (
                <li key={entry.project.id}>
                  <Link
                    to={`/projects/${entry.project.id}/passport`}
                    className="block rounded-xl border border-border/70 bg-cream/25 px-3 py-2.5 transition-colors hover:border-forest/25 hover:bg-cream/50"
                  >
                    <p className="line-clamp-1 text-[0.74rem] font-medium text-forest">{entry.project.name}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: summary.total }).map((_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            index < summary.complete
                              ? "bg-forest/70"
                              : index < summary.complete + summary.partial
                                ? "bg-gold/70"
                                : "bg-forest/10",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[0.6rem] text-muted-foreground">
                      {summary.complete} complete · {summary.partial} partial · {summary.missing + summary.notAssessed} open
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 rounded-lg bg-sage/35 px-2.5 py-2 text-[0.62rem] leading-4 text-forest/65">
            Counts are a checklist, not an overall readiness percentage.
          </div>
        </SectionCard>
      </section>

      <details className="group rounded-2xl border border-forest/15 bg-card/50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">Explore research activity, sources and methods <span className="ml-2 text-forest/50 group-open:hidden">↓</span></summary>
        <div className="mt-4 space-y-4">
      <section className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          title="Latest research activity"
          icon={Clock}
          action={<Link to="/progress" className="text-xs text-forest/60 hover:text-forest">Progress</Link>}
          className="lg:col-span-5"
        >
          {activity.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No research activity yet"
              description="Start a research run or stakeholder analysis and its retrieved records will appear here."
            />
          ) : (
            <ol className="relative space-y-2.5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
              {activity.map((item) => (
                <li key={item.id} className="relative flex gap-2.5">
                  <span className="relative z-10 mt-0.5 grid size-[27px] shrink-0 place-items-center rounded-full border border-border bg-card text-forest/60">
                    <item.icon className="size-3" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[0.73rem] text-forest">
                      {item.href.startsWith("http") ? (
                        <a href={item.href} target="_blank" rel="noreferrer noopener" className="hover:underline">
                          {item.title}
                        </a>
                      ) : (
                        <Link to={item.href} className="hover:underline">{item.title}</Link>
                      )}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      {relativeTime(new Date(item.at).getTime())} · {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <div className="relative overflow-hidden rounded-2xl bg-forest p-5 text-ivory lg:col-span-4">
          <div className="relative z-10 max-w-[230px]">
            <p className="label-caps text-gold/80">Discover live leads</p>
            <h2 className="mt-2 font-display text-[1.7rem] leading-tight">
              Search before you commit.
            </h2>
            <p className="mt-2 text-[0.72rem] leading-5 text-ivory/60">
              The radar queries TinyFish for currently open hackathons. It returns titles, snippets
              and original URLs — never invented deadlines.
            </p>
            <Button asChild size="sm" className="mt-3 rounded-full bg-ivory text-forest hover:bg-cream">
              <Link to="/radar">
                Open Hackathon Radar <ArrowRight className="size-3.5" aria-hidden />
              </Link>
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

        <SectionCard title="Prior art snapshot" icon={Github} className="lg:col-span-3">
          <div className="flex flex-col items-center gap-2 py-1 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-cream text-forest">
              <Github className="size-5" aria-hidden />
            </span>
            <p className="text-[0.72rem] leading-5 text-charcoal/65">
              Search public GitHub metadata for comparable repositories, languages, topics and
              licences.
            </p>
            <Button asChild size="sm" className="w-full rounded-full bg-forest">
              <Link to="/prior-art">Search repositories</Link>
            </Button>
          </div>
          <div className="mt-3">
            <p className="label-caps mb-1.5 text-forest/45">What it is not</p>
            <p className="rounded-lg bg-cream/60 px-2.5 py-2 text-[0.62rem] leading-4 text-forest/60">
              Not a patent database, legal novelty check or code-similarity verdict.
            </p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          title="Recent comparable projects"
          icon={FileSearch}
          action={<Link to="/projects" className="text-xs text-forest/60 hover:text-forest">Open projects</Link>}
          className="lg:col-span-8"
        >
          {entries.flatMap((entry) => entry.report?.similar_projects ?? []).length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No comparable projects yet"
              description="Run research on a project to retrieve public projects and their source pages."
              action={
                <Button asChild size="sm" className="rounded-full bg-forest">
                  <Link to="/projects">Choose a project</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {entries
                .flatMap((entry) => entry.report?.similar_projects ?? [])
                .slice(0, 5)
                .map((similar) => (
                  <li key={similar.id} className="flex items-start gap-2.5 py-2.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-cream text-forest/60">
                      <Github className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={similar.source_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="line-clamp-1 text-[0.78rem] font-medium text-forest hover:underline"
                      >
                        {similar.name}
                      </a>
                      <p className="line-clamp-1 text-[0.62rem] text-muted-foreground">
                        {similar.description ?? "No description retrieved"}
                      </p>
                      <p className="mt-0.5 text-[0.58rem] text-forest/45">
                        {formatDate(similar.collected_at)} · {similar.technology.slice(0, 3).join(", ") || "technology not recorded"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-[0.58rem] text-forest/55">
                      relevance signal
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <InfoNote tone="cream" className="mt-3">
            Similarity prioritises related projects. It is not proof of equivalence or lack of novelty.
          </InfoNote>
        </SectionCard>

        <SectionCard title="Data integrity" icon={ShieldCheck} className="lg:col-span-4">
          <ul className="space-y-2 text-[0.72rem]">
            {[
              { label: "Research jobs", value: "Real status polling", detail: "Pending, running, completed with errors, failed" },
              { label: "Evidence", value: "Provenance kept", detail: "Source URL, excerpt, relation, retrieval date" },
              { label: "Interpretation", value: "Separated", detail: "AI output is not stored as a source fact" },
              { label: "Missing data", value: "Disclosed", detail: "No invented metrics or readiness scores" },
            ].map((row) => (
              <li key={row.label} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-forest">{row.label}</p>
                  <p className="text-[0.6rem] text-muted-foreground">{row.detail}</p>
                </div>
                <span className="shrink-0 text-[0.62rem] font-medium text-forest/60">{row.value}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-sage/40 px-2.5 py-2 text-[0.62rem] leading-4 text-forest/65">
            <FileCheck2 className="size-3.5 shrink-0" aria-hidden />
            Unsupported modules are not simulated. Accounts, profiles and skill roadmaps await backend endpoints.
          </div>
        </SectionCard>
      </section>

      <div className="flex items-center justify-center gap-2 pb-2 text-[0.65rem] text-muted-foreground">
        <Loader2 className="hidden size-3" aria-hidden />
        Every figure on this page is computed from the FastAPI research service.
      </div>
        </div>
      </details>
    </div>
  );
}
