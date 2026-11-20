import {
  api,
  errorMessage,
  type Evidence,
  type Opportunity,
  type OpportunityChain,
  type Project,
  type ProjectComparison,
  type ProjectReport,
  type ProjectRequirement,
  type SimilarProject,
  type Stakeholder,
  type StakeholderNeed,
} from "@/lib/api";
import { useRememberedJob, useResource } from "@/hooks/use-resource";
import { buildPassport, readinessSummary } from "@/lib/passport";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FolderKanban,
  GitBranch,
  Github,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  ErrorNote,
  Field,
  InfoNote,
  LoadingBlock,
  PageHeader,
  SectionCard,
  Tag,
  ToneIcon,
} from "@/components/common";
import { EvidenceRow, ReadinessList, ResearchJobMonitor, SimilarProjectCard } from "@/components/research";

const TABS = ["overview", "research", "evidence", "requirements", "passport"] as const;
type Tab = (typeof TABS)[number];

type Data = {
  project: Project;
  report: ProjectReport | null;
  similar: SimilarProject[];
  comparisons: ProjectComparison[];
  evidence: Evidence[];
  stakeholders: Stakeholder[];
  needs: StakeholderNeed[];
  opportunities: Opportunity[];
  requirements: ProjectRequirement[];
  failures: string[];
};

async function loadProject(projectId: string, signal: AbortSignal): Promise<Data> {
  const project = await api.getProject(projectId, signal);
  // Optional panels must not prevent the core investigation from opening.
  // A slow provider or one failed endpoint becomes a visible partial-result
  // warning instead of an indefinite loading screen.
  const optional = <T,>(request: Promise<T>): Promise<T> =>
    Promise.race([
      request,
      new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("optional investigation data timed out")), 12_000)),
    ]);
  const [report, similar, comparisons, evidence, stakeholders, needs, opportunities, requirements] =
    await Promise.allSettled([
      optional(api.getReport(projectId, signal)),
      optional(api.listSimilarProjects(projectId, signal)),
      optional(api.listComparisons(projectId, signal)),
      optional(api.listEvidence(projectId, undefined, signal)),
      optional(api.listStakeholders(projectId, signal)),
      optional(api.listNeeds(projectId, undefined, signal)),
      optional(api.listOpportunities(projectId, signal)),
      optional(api.listProjectRequirements(projectId, signal)),
    ]);

  const failures: string[] = [];
  const collect = (label: string, result: PromiseSettledResult<unknown>) => {
    if (result.status === "rejected") failures.push(`${label}: ${errorMessage(result.reason)}`);
  };
  collect("report", report);
  collect("comparable projects", similar);
  collect("comparisons", comparisons);
  collect("evidence", evidence);
  collect("stakeholders", stakeholders);
  collect("needs", needs);
  collect("opportunities", opportunities);
  collect("requirements", requirements);

  return {
    project,
    report: report.status === "fulfilled" ? report.value : null,
    similar: similar.status === "fulfilled" ? similar.value : [],
    comparisons: comparisons.status === "fulfilled" ? comparisons.value : [],
    evidence: evidence.status === "fulfilled" ? evidence.value : [],
    stakeholders: stakeholders.status === "fulfilled" ? stakeholders.value : [],
    needs: needs.status === "fulfilled" ? needs.value : [],
    opportunities: opportunities.status === "fulfilled" ? opportunities.value : [],
    requirements: requirements.status === "fulfilled" ? requirements.value : [],
    failures,
  };
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const data = useResource(
    (signal) => (projectId ? loadProject(projectId, signal) : Promise.reject(new Error("Project missing"))),
    [projectId],
  );

  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "overview";
  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  if (data.loading) return <LoadingBlock label="Opening the investigation" />;

  if (data.error || !data.data) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-forest/60 hover:text-forest">
          <ArrowLeft className="size-3.5" aria-hidden /> All projects
        </Link>
        <div className="paper rounded-2xl p-8 text-center">
          <p className="font-display text-2xl text-forest">Project not available</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            {data.error ?? "The research service did not return this project."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" className="rounded-full" onClick={data.reload}>
              <RefreshCw className="size-4" aria-hidden /> Try again
            </Button>
            <Button asChild className="rounded-full bg-forest">
              <Link to="/projects">Back to projects</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { project } = data.data;
  const ready = buildPassport({
    project,
    report: data.data.report,
    similarProjects: data.data.similar,
    comparisons: data.data.comparisons,
    evidence: data.data.evidence,
    stakeholders: data.data.stakeholders,
    needs: data.data.needs,
    opportunities: data.data.opportunities,
    projectRequirements: data.data.requirements,
    chains: [],
  });
  const summary = readinessSummary(ready.checks);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-forest/60 hover:text-forest">
          <ArrowLeft className="size-3.5" aria-hidden /> All projects
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[0.65rem] text-forest/60">
            <span className="size-1.5 rounded-full bg-gold" aria-hidden />
            {summary.complete} of {summary.total} readiness checks complete
          </span>
          <Button asChild variant="outline" size="sm" className="rounded-full border-forest/20 bg-card text-forest">
            <Link to={`/projects/${project.id}/passport`}>
              <BookOpenCheck className="size-3.5" aria-hidden /> Open Passport
            </Link>
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow={`Investigation · ${project.status}`}
        title={project.name}
        description={project.description}
        actions={
          <>
            <Tag tone="sage">
              <FolderKanban className="mr-1 size-3" aria-hidden /> Created {formatDate(project.created_at)}
            </Tag>
            {project.keywords.slice(0, 4).map((keyword) => (
              <Tag key={keyword} tone="lavender">{keyword}</Tag>
            ))}
          </>
        }
        aside={
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
            <div className="grid size-10 place-items-center rounded-full bg-cream text-forest">
              <FileSearch className="size-5" aria-hidden />
            </div>
            <div className="text-[0.68rem]">
              <p className="font-medium text-forest">{data.data.similar.length} comparable projects</p>
              <p className="mt-0.5 text-muted-foreground">{data.data.evidence.length} evidence items</p>
              <p className="mt-0.5 text-muted-foreground">{data.data.needs.length} stakeholder needs</p>
            </div>
          </div>
        }
      />

      {data.data.failures.length > 0 && (
        <div className="space-y-1">
          <ErrorNote>
            Some research results could not be loaded. The available sections are still shown.
          </ErrorNote>
          <ul className="space-y-0.5 pl-1 text-[0.62rem] text-destructive/80">
            {data.data.failures.map((failure) => <li key={failure}>· {failure}</li>)}
          </ul>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border bg-cream/50 p-1">
          {TABS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="rounded-lg px-3 py-1.5 text-[0.72rem] capitalize data-[state=active]:bg-forest data-[state=active]:text-ivory"
            >
              {key}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab data={data.data} ready={ready} summary={summary} setTab={setTab} />
        </TabsContent>
        <TabsContent value="research" className="mt-4">
          <ResearchTab data={data.data} onReload={data.reload} />
        </TabsContent>
        <TabsContent value="evidence" className="mt-4">
          <EvidenceTab data={data.data} onReload={data.reload} />
        </TabsContent>
        <TabsContent value="requirements" className="mt-4">
          <RequirementsTab data={data.data} onReload={data.reload} />
        </TabsContent>
        <TabsContent value="passport" className="mt-4">
          <PassportTab data={data.data} ready={ready} summary={summary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  data,
  ready,
  summary,
  setTab,
}: {
  data: Data;
  ready: ReturnType<typeof buildPassport>;
  summary: ReturnType<typeof readinessSummary>;
  setTab: (tab: string) => void;
}) {
  const next: Array<{ label: string; detail: string; tab: Tab; cta: string; icon: typeof Search }> = [];
  if (data.similar.length === 0) {
    next.push({
      label: "Run the first research pass",
      detail: "No comparable projects have been retrieved for this problem.",
      tab: "research",
      cta: "Open research",
      icon: FileSearch,
    });
  }
  if (data.stakeholders.length === 0) {
    next.push({
      label: "Identify stakeholder groups",
      detail: "Evidence about user needs starts with knowing whose problems to look for.",
      tab: "evidence",
      cta: "Open evidence",
      icon: Users,
    });
  }
  if (data.requirements.length === 0) {
    next.push({
      label: "Record a testable requirement",
      detail: "Turn an opportunity into a requirement with an acceptance test.",
      tab: "requirements",
      cta: "Open proof chain",
      icon: ClipboardCheck,
    });
  }
  if (next.length === 0) {
    next.push({
      label: "Review the Buildability Passport",
      detail: "See which checks are complete and which evidence is still missing.",
      tab: "passport",
      cta: "Open Passport",
      icon: BookOpenCheck,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <SectionCard title="Project identity" icon={FolderKanban}>
            <div className="space-y-3 text-sm leading-6 text-charcoal/70">
              <div>
                <p className="label-caps text-forest/45">Problem statement</p>
                <p className="mt-1 whitespace-pre-line">{data.project.problem_statement || "Not recorded."}</p>
              </div>
              <div>
                <p className="label-caps text-forest/45">Description</p>
                <p className="mt-1 whitespace-pre-line">{data.project.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="label-caps text-forest/45">Target users</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {data.project.target_users.length === 0 ? <Tag tone="peach">Not recorded</Tag> : data.project.target_users.map((user) => <Tag key={user} tone="sage">{user}</Tag>)}
                  </div>
                </div>
                <div>
                  <p className="label-caps text-forest/45">Planned features</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {data.project.planned_features.length === 0 ? <Tag tone="cream">Not recorded</Tag> : data.project.planned_features.map((feature) => <Tag key={feature} tone="lavender">{feature}</Tag>)}
                  </div>
                </div>
              </div>
              {data.report?.research_scope && (
                <div className="rounded-xl bg-cream/50 px-3 py-2 text-[0.68rem] leading-5">
                  <p className="font-medium text-forest">Recorded research scope</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {typeof data.report.research_scope.coverage_note === "string"
                      ? data.report.research_scope.coverage_note
                      : `Stage: ${String(data.report.research_scope.stage ?? "not recorded")}`}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="What the research found" icon={FileSearch}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: "Comparable projects", value: data.similar.length, detail: "Retrieved from public sources", icon: Github, tab: "research" as Tab },
                { label: "Evidence items", value: data.evidence.length, detail: `${data.evidence.filter((item) => item.excerpt_verified).length} verified in source`, icon: ShieldCheck, tab: "evidence" as Tab },
                { label: "Stakeholder needs", value: data.needs.length, detail: `${data.needs.filter((need) => ["supported", "strongly_supported", "conflicting"].includes(need.evidence_status)).length} with supporting/conflicting evidence`, icon: Users, tab: "evidence" as Tab },
                { label: "Opportunities", value: data.opportunities.length, detail: "Research gap or unmet need hypotheses", icon: Lightbulb, tab: "requirements" as Tab },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setTab(item.tab)}
                  className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-cream/25 p-3 text-left transition-colors hover:border-forest/25 hover:bg-cream/50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-forest/60">
                    <item.icon className="size-3.5" aria-hidden />
                  </span>
                  <span>
                    <span className="block tnum font-display text-xl leading-none text-forest">{item.value}</span>
                    <span className="mt-1 block text-[0.68rem] font-medium text-forest">{item.label}</span>
                    <span className="mt-0.5 block text-[0.6rem] leading-4 text-muted-foreground">{item.detail}</span>
                  </span>
                </button>
              ))}
            </div>
            <InfoNote tone="cream" className="mt-3">
              Relevance signals and possible gaps are prioritisation aids. They are not proof of novelty or demand.
            </InfoNote>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Next actions" icon={Sparkles}>
            <ul className="space-y-2">
              {next.slice(0, 3).map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => setTab(item.tab)}
                    className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-cream/60"
                  >
                    <ToneIcon icon={item.icon} tone="sage" className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.74rem] font-medium leading-5 text-forest">{item.label}</span>
                      <span className="mt-0.5 block text-[0.62rem] leading-4 text-muted-foreground">{item.detail}</span>
                    </span>
                    <ArrowRight className="mt-1 size-3 shrink-0 text-forest/30" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Readiness checklist" icon={ShieldCheck}>
            <div className="mb-2 flex items-center gap-1">
              {Array.from({ length: summary.total }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    index < summary.complete
                      ? "bg-forest/70"
                      : index < summary.complete + summary.partial
                        ? "bg-gold/70"
                        : "bg-forest/10",
                  )}
                />
              ))}
            </div>
            <p className="text-[0.65rem] text-muted-foreground">
              {summary.complete} complete · {summary.partial} partial · {summary.missing} missing ·{" "}
              {summary.notAssessed} not assessed
            </p>
            <ReadinessList checks={ready.checks} />
            <Button asChild size="sm" className="mt-3 w-full rounded-full bg-forest">
              <Link to={`/projects/${data.project.id}/passport`}>Open full Passport</Link>
            </Button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function ResearchTab({ data, onReload }: { data: Data; onReload: () => void }) {
  const [jobId, rememberJob] = useRememberedJob(data.project.id, "research");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comparisons = useMemo(
    () => new Map(data.comparisons.map((comparison) => [comparison.similar_project_id, comparison])),
    [data.comparisons],
  );

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const job = await api.startResearch(data.project.id);
      rememberJob(job.job_id);
      toast.success("Research run started. You can leave this page; the status is remembered in this session.");
    } catch (startError) {
      setError(errorMessage(startError));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Research run" icon={FileSearch} eyebrow="Background job">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[0.78rem] leading-6 text-charcoal/70">
              Research generates queries, retrieves public pages, extracts comparable projects and
              records evidence. Jobs can finish with partial errors; those warnings stay visible.
            </p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              Live provider limits apply. A run can take several minutes.
            </p>
          </div>
          <Button type="button" onClick={() => void start()} disabled={starting} className="rounded-full bg-forest">
            {starting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
            {starting ? "Starting" : data.similar.length > 0 ? "Run research again" : "Start research"}
          </Button>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="mt-3">
          <ResearchJobMonitor jobId={jobId} label="research" onTerminal={() => onReload()} />
        </div>
        <InfoNote tone="peach" className="mt-3">
