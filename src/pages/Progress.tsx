import {
  api,
  errorMessage,
  type Evidence,
  type Project,
  type ProjectReport,
  type ProjectRequirement,
  type VerificationResult,
} from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { buildPassport, readinessSummary } from "@/lib/passport";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  Clock,
  FileSearch,
  FolderKanban,
  Github,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorNote,
  InfoNote,
  LoadingBlock,
  PageHeader,
  SectionCard,
  Tag,
} from "@/components/common";
import { BookScene, CompassStar } from "@/components/decor/Scenes";

type Entry = {
  project: Project;
  report: ProjectReport | null;
  evidence: Evidence[];
  requirements: ProjectRequirement[];
  failures: string[];
};

async function loadProgress(signal: AbortSignal): Promise<Entry[]> {
  const projects = await api.listProjects(signal);
  return Promise.all(
    projects.map(async (project) => {
      const [report, evidence, requirements] = await Promise.allSettled([
        api.getReport(project.id, signal),
        api.listEvidence(project.id, undefined, signal),
        api.listProjectRequirements(project.id, signal),
      ]);
      const failures: string[] = [];
      if (report.status === "rejected") failures.push(errorMessage(report.reason));
      if (evidence.status === "rejected") failures.push(errorMessage(evidence.reason));
      if (requirements.status === "rejected") failures.push(errorMessage(requirements.reason));
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

type VerificationRow = {
  requirementId: string;
  project: string;
  projectId: string;
  text: string;
  results: VerificationResult[];
};

export default function Progress() {
  const progress = useResource((signal) => loadProgress(signal), []);
  const [verification, setVerification] = useState<VerificationRow[] | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const entries = progress.data ?? [];
  const rows = useMemo(
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

  const totals = useMemo(
    () => ({
      projects: entries.length,
      investigated: entries.filter((entry) => (entry.report?.similar_projects.length ?? 0) > 0).length,
      evidence: entries.reduce((sum, entry) => sum + entry.evidence.length, 0),
      verified: entries.reduce(
        (sum, entry) => sum + entry.evidence.filter((item) => item.excerpt_verified).length,
        0,
      ),
      needs: entries.reduce((sum, entry) => sum + (entry.report?.needs.length ?? 0), 0),
      requirements: entries.reduce((sum, entry) => sum + entry.requirements.length, 0),
    }),
    [entries],
  );

  const timeline = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      at: string;
      href: string;
      icon: typeof Activity;
    }> = [];
    for (const entry of entries) {
      items.push({
        id: `project-${entry.project.id}`,
        title: `${entry.project.name} created`,
        detail: "Project record",
        at: entry.project.created_at,
        href: `/projects/${entry.project.id}`,
        icon: FolderKanban,
      });
      for (const similar of entry.report?.similar_projects ?? []) {
        items.push({
          id: `similar-${similar.id}`,
          title: `Landscape retrieved: ${similar.name}`,
          detail: entry.project.name,
          at: similar.collected_at,
          href: similar.source_url,
          icon: Github,
        });
      }
      for (const item of entry.evidence) {
        if (!item.retrieved_at) continue;
        items.push({
          id: `evidence-${item.id}`,
          title: item.excerpt_verified ? "Verified excerpt recorded" : "Evidence excerpt recorded",
          detail: `${entry.project.name} · ${item.relation}`,
          at: item.retrieved_at,
          href: item.source_url ?? `/projects/${entry.project.id}?tab=evidence`,
          icon: ShieldCheck,
        });
      }
    }
    return items
      .filter((item) => item.at && !Number.isNaN(new Date(item.at).getTime()))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);
  }, [entries]);

  const loadVerification = async () => {
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      const rows: VerificationRow[] = [];
      for (const entry of entries) {
        const opportunities = entry.report?.opportunities.slice(0, 8) ?? [];
        for (const opportunity of opportunities) {
          try {
            const chain = await api.getChain(opportunity.id);
            for (const requirement of chain.requirements) {
              rows.push({
                requirementId: requirement.id,
                project: entry.project.name,
                projectId: entry.project.id,
                text: requirement.text,
                results: requirement.verification,
              });
            }
          } catch {
            // Partial proof chains are reported below rather than invented.
          }
        }
      }
      setVerification(rows);
      toast.success(`Read ${rows.length} proof-chain requirement(s).`);
    } catch (error) {
      setVerificationError(errorMessage(error));
    } finally {
      setVerificationLoading(false);
    }
  };

  if (progress.loading) return <LoadingBlock label="Assembling research progress" />;

  if (progress.error) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Research Progress"
          title={<>Progress needs real records.</>}
          description="The FastAPI service is not reachable, so BuildScope is not showing substitute metrics."
        />
        <ErrorNote>{progress.error}</ErrorNote>
        <Button variant="outline" className="rounded-full" onClick={progress.reload}>
          <RefreshCw className="size-4" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Research Progress"
        title={
          <>
            A record of what
            <br />
            <span className="italic text-forest/60">the research actually found.</span>
          </>
        }
        description="Counts on this page come from project records, retrieved landscape sources, evidence excerpts and requirements. There is no invented completion score. Verification is shown only after it is read from a project's proof chain."
        actions={
          <>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {totals.projects} project{totals.projects === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {totals.verified} verified excerpt{totals.verified === 1 ? "" : "s"}
            </span>
          </>
        }
        aside={<BookScene className="hidden h-[130px] w-[150px] lg:block" />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Projects investigated", value: totals.projects, detail: `${totals.investigated} with a retrieved landscape`, icon: FolderKanban },
          { label: "Evidence items", value: totals.evidence, detail: `${totals.verified} verified in source text`, icon: ShieldCheck },
          { label: "Stakeholder needs", value: totals.needs, detail: "recorded by stakeholder analysis", icon: Users },
          { label: "Requirements", value: totals.requirements, detail: "project requirements recorded", icon: ClipboardCheck },
        ].map((metric) => (
          <div key={metric.label} className="paper rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps text-forest/45">{metric.label}</p>
              <metric.icon className="size-4 text-forest/35" aria-hidden />
            </div>
            <p className="tnum mt-2 font-display text-3xl leading-none text-forest">{metric.value}</p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Research coverage by project" icon={Activity} eyebrow="Checklist, not a percentage">
          {rows.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No projects to measure"
              description="Create an investigation first. Progress only exists when there are real records."
              action={
                <Button asChild size="sm" className="rounded-full bg-forest">
                  <Link to="/projects?new=1">Create a project</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {rows.map(({ entry, summary, passport }) => (
                <li key={entry.project.id} className="rounded-xl border border-border/70 bg-cream/25 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link to={`/projects/${entry.project.id}`} className="text-[0.76rem] font-medium text-forest hover:underline">
                        {entry.project.name}
                      </Link>
                      <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
                        {entry.report?.similar_projects.length ?? 0} comparable · {entry.evidence.length} evidence · {entry.report?.needs.length ?? 0} needs · {entry.requirements.length} requirements
                      </p>
                    </div>
                    <Tag tone={summary.complete >= 4 ? "sage" : summary.complete > 0 ? "gold" : "peach"}>
                      {summary.complete}/{summary.total} checks
                    </Tag>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {passport.checks.map((check) => (
                      <span
                        key={check.key}
                        title={`${check.label}: ${check.status.replace("_", " ")}`}
                        className={cn(
                          "h-2 flex-1 rounded-full",
                          check.status === "complete"
                            ? "bg-forest/65"
                            : check.status === "partial"
                              ? "bg-gold/70"
                              : check.status === "not_assessed"
                                ? "bg-forest/10"
                                : "bg-peach/80",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[0.58rem] text-muted-foreground">
                    {entry.failures.length > 0 ? (
                      <span className="text-destructive">Partial data: {entry.failures[0]}</span>
                    ) : (
                      <span>All requested project endpoints answered.</span>
                    )}
                    <Link to={`/projects/${entry.project.id}/passport`} className="ml-auto inline-flex items-center gap-1 text-forest/60 hover:text-forest">
                      Passport <ArrowRight className="size-2.5" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <InfoNote tone="cream" className="mt-3">
            The bar shows complete, partial, missing and not-assessed checks. It is not an overall
            readiness percentage.
          </InfoNote>
        </SectionCard>

        <SectionCard title="Verification history" icon={ShieldCheck} eyebrow="Read on demand">
          <p className="text-[0.72rem] leading-5 text-charcoal/65">
            The backend has no aggregate verification endpoint. BuildScope reads each opportunity's
            proof chain when you request it and shows only the results it receives.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3 rounded-full bg-forest"
            onClick={() => void loadVerification()}
            disabled={verificationLoading || entries.length === 0}
          >
            {verificationLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ShieldCheck className="size-3.5" aria-hidden />}
            {verificationLoading ? "Reading proof chains" : "Load verification history"}
          </Button>
          {verificationError && <ErrorNote>{verificationError}</ErrorNote>}
          {verification && (
            <div className="mt-3 max-h-[340px] overflow-y-auto">
              {verification.length === 0 ? (
                <p className="rounded-lg bg-cream/60 px-3 py-2 text-[0.68rem] leading-4 text-muted-foreground">
                  No proof-chain requirements were returned. Generate a requirement from an
                  opportunity first.
                </p>
              ) : (
                <ul className="space-y-2">
                  {verification.map((row, index) => (
                    <li key={`${row.requirementId}-${index}`} className="rounded-lg border border-border/60 bg-cream/25 px-2.5 py-2">
                      <p className="text-[0.68rem] leading-4 text-forest">{row.text}</p>
                      <p className="mt-0.5 text-[0.58rem] text-muted-foreground">{row.project}</p>
                      {row.results.length === 0 ? (
                        <p className="mt-1 text-[0.58rem] text-muted-foreground">Verification not assessed.</p>
                      ) : (
                        <ul className="mt-1 space-y-0.5">
                          {row.results.map((result, resultIndex) => (
                            <li key={`${result.test}-${resultIndex}`} className="flex items-start gap-1 text-[0.58rem] leading-4">
                              <span className={cn(
                                "mt-0.5 rounded-full px-1 py-0.5 text-[0.48rem] font-semibold uppercase",
                                result.result === "pass" ? "bg-sage text-forest" : result.result === "fail" ? "bg-peach text-forest" : "bg-cream text-muted-foreground",
                              )}>
                                {result.result}
                              </span>
                              <span className="text-muted-foreground">{result.test}: {result.details}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Research timeline" icon={Clock} eyebrow="Recorded events only">
          {timeline.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No dated research activity"
              description="Create a project or run research. Landscape and evidence records carry their retrieval date."
            />
          ) : (
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
              {timeline.map((item) => (
                <li key={item.id} className="relative flex items-start gap-3">
                  <span className="relative z-10 mt-1 grid size-[15px] shrink-0 place-items-center rounded-full border-[4px] border-card bg-forest/40" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[0.72rem] leading-5 text-forest">
                      {item.href.startsWith("http") ? (
                        <a href={item.href} target="_blank" rel="noreferrer noopener" className="hover:underline">
                          {item.title}
                        </a>
                      ) : (
                        <Link to={item.href} className="hover:underline">{item.title}</Link>
                      )}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      {formatDate(new Date(item.at).getTime(), true)} · {relativeTime(new Date(item.at).getTime())} · {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <SectionCard title="What this page does not claim" icon={ShieldCheck}>
          <ul className="space-y-2 text-[0.72rem] leading-5 text-charcoal/70">
            {[
              "No overall percentage or grade. Coverage is a checklist of records that exist.",
              "No completed milestones: this backend version has no project milestone model.",
              "No skill mastery: skill profiles and learning roadmaps require backend endpoints that are not deployed.",
              "No achievements: badges are not awarded without a verified rule and persisted record.",
              "No verification count until the proof chain is explicitly read.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-peach/30 px-3 py-2 text-[0.64rem] leading-4 text-forest/65">
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            Unsupported modules stay absent rather than simulated.
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pb-2 text-[0.65rem] text-muted-foreground">
        <CompassStar className="size-3 text-forest/30" />
        Every count above is derived from FastAPI records.
        <BookOpenCheck className="ml-2 size-3.5" aria-hidden />
        <Link to="/method" className="hover:text-forest">Read the method and limits</Link>
      </div>
    </div>
  );
}

