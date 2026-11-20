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
          If the job fails or returns partial results, BuildScope does not fill the gaps with fabricated projects.
        </InfoNote>
      </SectionCard>

      <SectionCard
        title="Comparable public projects"
        icon={Github}
        action={<span className="text-[0.65rem] text-muted-foreground">{data.similar.length} retrieved</span>}
      >
        {data.similar.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No landscape yet"
            description="Start a research run. When it completes, comparable projects and their source pages appear here."
          />
        ) : (
          <ul className="space-y-2.5">
            {[...data.similar]
              .sort((a, b) => b.similarity_score - a.similarity_score)
              .map((project) => (
                <SimilarProjectCard
                  key={project.id}
                  project={project}
                  comparison={comparisons.get(project.id)}
                />
              ))}
          </ul>
        )}
        <InfoNote tone="cream" className="mt-3">
          The relevance signal is a ranking aid computed by the backend. It is not an originality
          score and does not prove that two ideas are the same.
        </InfoNote>
      </SectionCard>

      <SectionCard title="Opportunity hypotheses" icon={Lightbulb} eyebrow="Not validated needs">
        {data.opportunities.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No opportunities recorded"
            description="Opportunities come from research gaps and analysed stakeholder needs. They remain hypotheses."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.opportunities.map((opportunity) => (
              <li key={opportunity.id} className="rounded-xl border border-border/70 bg-cream/25 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-peach/60 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-forest">
                    {opportunity.origin.replace(/_/g, " ")}
                  </span>
                  <span className="text-[0.55rem] uppercase tracking-[0.08em] text-muted-foreground">
                    hypothesis
                  </span>
                </div>
                <p className="mt-2 text-[0.75rem] font-medium leading-5 text-forest">{opportunity.description}</p>
                {opportunity.rationale && (
                  <p className="mt-1 text-[0.64rem] leading-4 text-muted-foreground">{opportunity.rationale}</p>
                )}
                <p className="mt-2 text-[0.58rem] text-forest/45">
                  {opportunity.linked_need_ids.length} linked need(s) · {opportunity.linked_project_ids.length} comparable project(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function EvidenceTab({ data, onReload }: { data: Data; onReload: () => void }) {
  const [stakeholderJobId, rememberStakeholderJob] = useRememberedJob(data.project.id, "stakeholders");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needFilter, setNeedFilter] = useState<string | null>(null);

  const confirmed = data.stakeholders.filter((stakeholder) => stakeholder.status === "confirmed");
  const shownEvidence = needFilter ? data.evidence.filter((item) => item.need_id === needFilter) : data.evidence;

  const addStakeholder = async () => {
    if (name.trim().length < 2) return;
    setAdding(true);
    setError(null);
    try {
      await api.addStakeholder(data.project.id, { name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      toast.success("Stakeholder group added.");
      onReload();
    } catch (addError) {
      setError(errorMessage(addError));
    } finally {
      setAdding(false);
    }
  };

  const identify = async () => {
    setIdentifying(true);
    setError(null);
    try {
      const groups = await api.identifyStakeholders(data.project.id);
      toast.success(`${groups.length} stakeholder group(s) suggested. Review and confirm them before analysis.`);
      onReload();
    } catch (identifyError) {
      setError(errorMessage(identifyError));
    } finally {
      setIdentifying(false);
    }
  };

  const setStatus = async (stakeholder: Stakeholder, status: "confirmed" | "rejected") => {
    setError(null);
    try {
      await api.updateStakeholder(stakeholder.id, { status });
      onReload();
    } catch (statusError) {
      setError(errorMessage(statusError));
    }
  };

  const startAnalysis = async () => {
    setStarting(true);
    setError(null);
    try {
      const job = await api.startStakeholderAnalysis(data.project.id);
      rememberStakeholderJob(job.job_id);
      toast.success("Stakeholder analysis started.");
    } catch (startError) {
      setError(errorMessage(startError));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title="Stakeholder groups" icon={Users} eyebrow="Who has the problem?">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void identify()} disabled={identifying}>
              {identifying ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
              {identifying ? "Identifying" : "Suggest groups with AI"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-forest"
              onClick={() => void startAnalysis()}
              disabled={starting || confirmed.length === 0}
            >
              {starting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Search className="size-3.5" aria-hidden />}
              {starting ? "Starting" : "Analyse confirmed groups"}
            </Button>
          </div>
          <p className="mt-2 text-[0.65rem] leading-4 text-muted-foreground">
            AI suggestions are not confirmed stakeholders. Confirm the groups that matter before
            starting need analysis. {confirmed.length} confirmed.
          </p>

          <div className="mt-3">
            <ResearchJobMonitor jobId={stakeholderJobId} label="stakeholder analysis" onTerminal={() => onReload()} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <ul className="mt-3 space-y-2">
            {data.stakeholders.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[0.68rem] text-muted-foreground">
                No stakeholder groups yet. Add one manually or ask the backend to suggest groups.
              </li>
            ) : (
              data.stakeholders.map((stakeholder) => (
                <li key={stakeholder.id} className="rounded-xl border border-border/70 bg-cream/25 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[0.74rem] font-medium text-forest">{stakeholder.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-[0.62rem] leading-4 text-muted-foreground">
                        {stakeholder.description || "No description"}
                      </p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.06em]",
                      stakeholder.status === "confirmed" ? "bg-sage text-forest" : stakeholder.status === "rejected" ? "bg-cream text-muted-foreground" : "bg-gold/40 text-forest",
                    )}>
                      {stakeholder.status}
                    </span>
                  </div>
                  {stakeholder.status !== "confirmed" && (
                    <div className="mt-2 flex gap-1.5">
                      <Button type="button" size="sm" variant="outline" className="h-6 rounded-full px-2 text-[0.6rem]" onClick={() => void setStatus(stakeholder, "confirmed")}>
                        <CheckCircle2 className="size-3" aria-hidden /> Confirm
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="h-6 rounded-full px-2 text-[0.6rem] text-muted-foreground" onClick={() => void setStatus(stakeholder, "rejected")}>
                        <XCircle className="size-3" aria-hidden /> Reject
                      </Button>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>

          <div className="mt-3 rounded-xl border border-border/70 bg-card p-3">
            <p className="label-caps text-forest/45">Add a group manually</p>
            <div className="mt-2 space-y-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" className="h-9 bg-ivory/60 text-xs" />
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Who they are and what context matters" className="bg-ivory/60 text-xs" />
              <Button type="button" size="sm" className="rounded-full bg-forest" disabled={adding || name.trim().length < 2} onClick={() => void addStakeholder()}>
                {adding ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Plus className="size-3.5" aria-hidden />} Add stakeholder
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Evidence-backed needs" icon={ShieldCheck} eyebrow="Supporting and contradicting sources">
          {data.needs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No needs analysed"
              description="Confirm stakeholder groups and run stakeholder analysis. Needs only appear when the backend records supporting or contradicting evidence."
            />
          ) : (
            <ul className="space-y-2.5">
              {data.needs.map((need) => {
                const stakeholder = data.stakeholders.find((item) => item.id === need.stakeholder_id);
                const evidence = data.evidence.filter((item) => item.need_id === need.id);
                return (
                  <li key={need.id} className="rounded-xl border border-border/70 bg-cream/25 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="max-w-[75%] text-[0.75rem] font-medium leading-5 text-forest">{need.need_text}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.06em]",
                        ["supported", "strongly_supported"].includes(need.evidence_status)
                          ? "bg-sage text-forest"
                          : need.evidence_status === "conflicting"
                            ? "bg-peach text-forest"
                            : "bg-cream text-muted-foreground",
                      )}>
                        {need.evidence_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.6rem] text-muted-foreground">
                      {stakeholder?.name ?? "Stakeholder unavailable"} · {need.need_type} · {need.supporting_count} supporting · {need.contradicting_count} contradicting · {need.independent_source_count} independent source(s)
                    </p>
                    {need.ai_interpretation && (
                      <p className="mt-2 rounded-lg bg-lavender/25 px-2.5 py-1.5 text-[0.64rem] leading-4 text-forest/70">
                        <span className="font-semibold">AI interpretation:</span> {need.ai_interpretation}
                      </p>
                    )}
                    {need.validation_question && (
                      <p className="mt-1.5 text-[0.64rem] leading-4 text-forest/65">
                        <span className="font-medium text-forest">Validation question:</span> {need.validation_question}
                      </p>
                    )}
                    {need.missing_information.length > 0 && (
                      <p className="mt-1 text-[0.62rem] leading-4 text-muted-foreground">
                        Missing: {need.missing_information.join("; ")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Button type="button" size="sm" variant="ghost" className="h-6 rounded-full px-2 text-[0.6rem]" onClick={() => setNeedFilter(need.id)}>
                        <Search className="size-3" aria-hidden /> Show linked evidence ({evidence.length})
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <InfoNote tone="cream" className="mt-3">
            Evidence status describes the strength of retrieved evidence, not proof of demand or
            prevalence.
          </InfoNote>
        </SectionCard>
      </div>

      <SectionCard
        title="Evidence ledger"
        icon={GitBranch}
        action={
          needFilter ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 rounded-full text-[0.62rem]" onClick={() => setNeedFilter(null)}>
              Clear need filter
            </Button>
          ) : (
            <span className="text-[0.65rem] text-muted-foreground">{data.evidence.length} item(s)</span>
          )
        }
      >
        {shownEvidence.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No evidence items"
            description="Evidence appears after research or stakeholder analysis retrieves and extracts public sources."
          />
        ) : (
          <ul className="space-y-2">
            {shownEvidence.map((item) => <EvidenceRow key={item.id} item={item} />)}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function RequirementsTab({ data, onReload }: { data: Data; onReload: () => void }) {
  const opportunityIds = data.opportunities.map((opportunity) => opportunity.id).join("|");
  const chains = useResource(
    async (signal) => {
      const results = await Promise.all(
        data.opportunities.slice(0, 12).map(async (opportunity) => {
          try {
            return await api.getChain(opportunity.id, signal);
          } catch {
            return null;
          }
        }),
      );
      return results.filter((chain): chain is OpportunityChain => Boolean(chain));
    },
    [opportunityIds],
    { enabled: data.opportunities.length > 0 },
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("functional");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [busyOpportunity, setBusyOpportunity] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRequirement = async () => {
    if (title.trim().length < 3) return;
    setSaving(true);
    setError(null);
    try {
      await api.createProjectRequirement(data.project.id, {
        title: title.trim(),
        description: description.trim(),
        requirement_type: type,
        priority,
      });
      setTitle("");
      setDescription("");
      setDialogOpen(false);
      toast.success("Project requirement recorded.");
      onReload();
    } catch (addError) {
      setError(errorMessage(addError));
    } finally {
      setSaving(false);
    }
  };

  const generate = async (opportunity: Opportunity) => {
    setBusyOpportunity(opportunity.id);
    setError(null);
    try {
      const requirement = await api.generateRequirement(opportunity.id);
      toast.success("Requirement generated. Review it before treating it as final.");
      chains.reload();
      toast.info(requirement.text, { description: `Acceptance test: ${requirement.acceptance_test}` });
    } catch (generateError) {
      setError(errorMessage(generateError));
    } finally {
      setBusyOpportunity(null);
    }
  };

  const verify = async (requirementId: string) => {
    setVerifying(requirementId);
    setError(null);
    try {
      const results = await api.verifyRequirement(requirementId);
      const passed = results.filter((result) => result.result === "pass").length;
      toast.success(`Verification finished: ${passed}/${results.length} checks passed.`);
      chains.reload();
    } catch (verifyError) {
      setError(errorMessage(verifyError));
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Project requirements"
        icon={ClipboardCheck}
        action={
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setDialogOpen(true)}>
            <Plus className="size-3.5" aria-hidden /> Add requirement
          </Button>
        }
      >
        {data.requirements.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No project requirements"
            description="Record the requirements you intend to build. The proof chain can also generate requirements from validated opportunities."
            action={
              <Button type="button" size="sm" className="rounded-full bg-forest" onClick={() => setDialogOpen(true)}>
                Add the first requirement
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {data.requirements.map((requirement) => (
              <li key={requirement.id} className="rounded-xl border border-border/70 bg-cream/25 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[0.76rem] font-medium leading-5 text-forest">{requirement.title}</p>
                  <div className="flex gap-1">
                    <Tag tone="lavender">{requirement.requirement_type}</Tag>
                    <Tag tone={requirement.priority === "high" ? "peach" : "cream"}>{requirement.priority}</Tag>
                  </div>
                </div>
                <p className="mt-1 text-[0.66rem] leading-5 text-muted-foreground">
                  {requirement.description || "No acceptance test recorded."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Proof chain" icon={GitBranch} eyebrow="Opportunity → requirement → verification">
        {data.opportunities.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No opportunities to build from"
            description="Run research and stakeholder analysis first. The proof chain starts from a recorded opportunity hypothesis."
          />
        ) : (
          <>
            {error && <ErrorNote>{error}</ErrorNote>}
            <ul className="space-y-3">
              {data.opportunities.map((opportunity) => {
                const chain = chains.data?.find((item) => item.opportunity.id === opportunity.id);
                const requirements = chain?.requirements ?? [];
                return (
                  <li key={opportunity.id} className="rounded-xl border border-border/70 bg-cream/25 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.75rem] font-medium leading-5 text-forest">{opportunity.description}</p>
                        <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
                          {opportunity.origin.replace(/_/g, " ")} · {opportunity.status} · {opportunity.linked_need_ids.length} linked need(s)
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full text-[0.62rem]"
                        disabled={busyOpportunity === opportunity.id}
                        onClick={() => void generate(opportunity)}
                      >
                        {busyOpportunity === opportunity.id ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <Sparkles className="size-3" aria-hidden />}
                        Generate requirement
                      </Button>
                    </div>

                    {requirements.length === 0 ? (
                      <p className="mt-2 rounded-lg bg-card/60 px-2.5 py-2 text-[0.64rem] leading-4 text-muted-foreground">
                        No generated requirement yet. The backend will use this opportunity's linked
                        needs and evidence.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {requirements.map((requirement) => (
                          <li key={requirement.id} className="rounded-lg border border-border/60 bg-card/60 p-2.5">
                            <p className="text-[0.72rem] font-medium leading-5 text-forest">{requirement.text}</p>
                            <p className="mt-1 text-[0.64rem] leading-4 text-muted-foreground">
                              <span className="font-medium text-forest/70">Acceptance test:</span> {requirement.acceptance_test}
                            </p>
                            {requirement.verification.length === 0 ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-cream px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                                  verification not run
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-6 rounded-full bg-forest px-2 text-[0.6rem]"
                                  disabled={verifying === requirement.id}
                                  onClick={() => void verify(requirement.id)}
                                >
                                  {verifying === requirement.id ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <ShieldCheck className="size-3" aria-hidden />}
                                  Run verification
                                </Button>
                              </div>
                            ) : (
                              <ul className="mt-2 space-y-1">
                                {requirement.verification.map((result, index) => (
                                  <li key={`${result.test}-${index}`} className="flex items-start gap-1.5 text-[0.62rem] leading-4">
                                    <span className={cn(
                                      "mt-0.5 rounded-full px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase",
                                      result.result === "pass" ? "bg-sage text-forest" : result.result === "fail" ? "bg-peach text-forest" : "bg-cream text-muted-foreground",
                                    )}>
                                      {result.result}
                                    </span>
                                    <span className="text-muted-foreground">
                                      <span className="font-medium text-forest/70">{result.test}:</span> {result.details}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <InfoNote tone="cream" className="mt-3">
              Generated requirements remain reviewable. Verification checks the recorded evidence and
              requirement tests; it does not prove market demand.
            </InfoNote>
          </>
        )}
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-forest">Add project requirement</DialogTitle>
            <DialogDescription>
              Record what the system must do and how you would accept it. This is saved to the
              backend's project requirements endpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Requirement" htmlFor="requirement-title">
              <Input id="requirement-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The system shall…" className="bg-ivory/60" />
            </Field>
            <Field label="Acceptance test" htmlFor="requirement-description">
              <Textarea id="requirement-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="A concrete check that shows the requirement works." className="bg-ivory/60" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" htmlFor="requirement-type">
                <select id="requirement-type" value={type} onChange={(event) => setType(event.target.value)} className="h-9 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest">
                  <option value="functional">Functional</option>
                  <option value="non_functional">Non-functional</option>
                  <option value="constraint">Constraint</option>
                </select>
              </Field>
              <Field label="Priority" htmlFor="requirement-priority">
                <select id="requirement-priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="h-9 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>
            </div>
            {error && <ErrorNote>{error}</ErrorNote>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void addRequirement()} disabled={saving || title.trim().length < 3} className="rounded-full bg-forest px-5">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Save requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PassportTab({
  data,
  ready,
  summary,
}: {
  data: Data;
  ready: ReturnType<typeof buildPassport>;
  summary: ReturnType<typeof readinessSummary>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <SectionCard title="Build readiness" icon={BookOpenCheck} eyebrow="No invented percentage">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tag tone="sage">{summary.complete} complete</Tag>
          <Tag tone="gold">{summary.partial} partial</Tag>
          <Tag tone="peach">{summary.missing} missing</Tag>
          <Tag tone="cream">{summary.notAssessed} not assessed</Tag>
        </div>
        <ReadinessList checks={ready.checks} />
        <Button asChild className="mt-3 w-full rounded-full bg-forest">
          <Link to={`/projects/${data.project.id}/passport`}>
            <BookOpenCheck className="size-4" aria-hidden /> Open the full printable Passport
          </Link>
        </Button>
      </SectionCard>

      <SectionCard title="What the Passport will include" icon={ShieldCheck}>
        <ul className="space-y-2 text-[0.72rem] leading-5 text-charcoal/70">
          {[
            "Project identity and target users.",
            "Comparable projects and recorded differences.",
            "Evidence ledger with source URLs, excerpts and verification flags.",
            "Stakeholder needs and unresolved validation questions.",
            "Project requirements and generated proof-chain requirements.",
            "Verification results and next steps.",
            "A dated report with explicit limitations.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-forest/50" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-xl bg-cream/60 px-3 py-2.5 text-[0.65rem] leading-5 text-forest/65">
          <p className="flex items-center gap-1.5 font-semibold text-forest">
            <TriangleAlert className="size-3.5" aria-hidden /> Readiness is a checklist
          </p>
          <p className="mt-1">
            {summary.complete} of {summary.total} checks are complete. This is not an overall
            percentage and does not imply patentability or guaranteed success.
          </p>
        </div>
        <InfoNote tone="cream" className="mt-3">
          Generated proof-chain requirements and verification results are loaded on the full Passport page.
        </InfoNote>
      </SectionCard>
    </div>
  );
}
