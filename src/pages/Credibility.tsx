import { api } from "@/convex/_generated/api";
import { RepoAnalysis } from "@/components/RepoAnalysis";
import { CredibilityFindings } from "@/components/CredibilityFindings";
import { checkOpportunity, checkProject, checkRepository } from "@/lib/credibility";
import { readRepoReport } from "@/lib/github-types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderKanban,
  Github,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataBadge,
  EmptyState,
  Field,
  InfoNote,
  LoadingBlock,
  PageHeader,
  SectionCard,
  StatusPill,
  Tag,
} from "@/components/common";
import { CubeScene } from "@/components/decor/Scenes";

const STATUS_LEGEND = [
  { status: "Verified", body: "Supported by a primary source we could read." },
  { status: "Evidence found", body: "Some supporting evidence, not a full verification." },
  { status: "Needs review", body: "A human should look at this claim." },
  { status: "Not assessed", body: "The check is not implemented or has no data." },
  { status: "Unable to verify", body: "No accessible source exists for this claim." },
];

export default function Credibility() {
  const [searchParams] = useSearchParams();
  const overview = useQuery(api.workspace.overview);
  const opportunities = useQuery(api.opportunities.list);
  const savedRows = useQuery(api.opportunities.saved);
  const recordEvidence = useMutation(api.projects.recordEvidence);

  const initialSubject = searchParams.get("subject");
  const initialId = searchParams.get("id");
  const [tab, setTab] = useState(
    initialSubject === "project" ? "projects" : initialSubject === "repository" ? "repository" : "opportunities",
  );
  const [opportunityId, setOpportunityId] = useState(initialId ?? "");
  const [projectId, setProjectId] = useState(initialId ?? "");
  const [recording, setRecording] = useState(false);

  const opportunity = (opportunities ?? []).find((item) => item._id === opportunityId) ?? null;
  const projectEntry = (overview?.projects ?? []).find((project) => project._id === projectId) ?? null;
  const projectMilestones = (overview?.milestones ?? []).filter(
    (milestone) => milestone.projectId === projectId,
  );
  const projectRepoCheck = (overview?.repoChecks ?? []).find(
    (check) => check.projectId === projectId,
  );
  const projectReport = projectRepoCheck ? readRepoReport(projectRepoCheck.report) : null;

  const opportunityResult = useMemo(
    () =>
      opportunity
        ? checkOpportunity(
            opportunity,
            (overview?.evidence ?? []).filter(
              (check) => check.subjectType === "opportunity" && check.subjectId === opportunity._id,
            ),
          )
        : null,
    [opportunity, overview?.evidence],
  );

  const projectResult = useMemo(
    () =>
      projectEntry
        ? checkProject({
            _id: projectEntry._id,
            name: projectEntry.name,
            description: projectEntry.description,
            technologies: projectEntry.technologies,
            repoUrl: projectEntry.repoUrl,
            demoUrl: projectEntry.demoUrl,
            docsUrl: projectEntry.docsUrl,
            status: projectEntry.status,
            milestones: projectMilestones.map((milestone) => ({
              completed: milestone.completed,
              title: milestone.title,
            })),
            repoReport: projectReport,
            verifiedEvidenceCount: (overview?.evidence ?? []).filter(
              (check) => check.subjectType === "project" && check.subjectId === projectEntry._id,
            ).length,
          })
        : null,
    [projectEntry, projectMilestones, projectReport, overview?.evidence],
  );

  const latestRepoCheck = overview?.repoChecks?.[0];
  const latestReport = latestRepoCheck ? readRepoReport(latestRepoCheck.report) : null;
  const repositoryResult = latestReport ? checkRepository(latestReport) : null;

  const saveCheck = async (
    subjectType: "opportunity" | "project",
    subject: { _id: string; name: string },
    result: ReturnType<typeof checkOpportunity> | ReturnType<typeof checkProject>,
  ) => {
    setRecording(true);
    try {
      await recordEvidence({
        subjectType,
        subjectId: subject._id,
        subjectLabel: subject.name,
        summaryStatus: result.overall,
        findings: result.findings,
      });
      toast.success("Credibility check recorded. Its findings and timestamp are now saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the check.");
    } finally {
      setRecording(false);
    }
  };

  if (overview === undefined || overview === null || opportunities === undefined) {
    return <LoadingBlock label="Preparing evidence workspace" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Credibility Checks"
        title={
          <>
            Investigate the claim,
            <br />
            <span className="italic text-forest/60">not the person.</span>
          </>
        }
        description="Check an opportunity, your own project, or a public GitHub repository. Every finding carries its source, its timestamp and its limitation. Where a check cannot run, the status is Not assessed."
        actions={
          <>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {overview.evidence.length} saved check{overview.evidence.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-card px-3 py-1.5 text-xs text-forest/60">
              {overview.repoChecks.filter((check) => check.status === "verified").length} verified repositories
            </span>
          </>
        }
        aside={<CubeScene className="hidden h-[130px] w-[150px] lg:block" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_LEGEND.map((item) => (
          <div key={item.status} className="rounded-xl border border-border/70 bg-card p-2.5">
            <StatusPill status={item.status} />
            <p className="mt-1.5 text-[0.62rem] leading-4 text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border bg-cream/50 p-1">
          <TabsTrigger value="opportunities" className="rounded-lg px-3 py-1.5 text-[0.72rem] data-[state=active]:bg-forest data-[state=active]:text-ivory">
            <Radar className="mr-1.5 size-3.5" aria-hidden /> Opportunities
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg px-3 py-1.5 text-[0.72rem] data-[state=active]:bg-forest data-[state=active]:text-ivory">
            <FolderKanban className="mr-1.5 size-3.5" aria-hidden /> Projects
          </TabsTrigger>
          <TabsTrigger value="repository" className="rounded-lg px-3 py-1.5 text-[0.72rem] data-[state=active]:bg-forest data-[state=active]:text-ivory">
            <Github className="mr-1.5 size-3.5" aria-hidden /> GitHub repository
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              <SectionCard title="Choose a listing" icon={Radar}>
                <Field label="Opportunity" htmlFor="check-opportunity">
                  <select
                    id="check-opportunity"
                    value={opportunityId}
                    onChange={(event) => setOpportunityId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest"
                  >
                    <option value="">Select an opportunity…</option>
                    {opportunities.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {(savedRows ?? []).length > 0 && (
                  <div className="mt-3">
                    <p className="label-caps mb-1.5 text-forest/45">From your saved shortlist</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(savedRows ?? []).slice(0, 4).map(({ opportunity: savedOpportunity }) => (
                        <button
                          key={savedOpportunity._id}
                          type="button"
                          onClick={() => setOpportunityId(savedOpportunity._id)}
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.65rem] text-forest/70 hover:border-forest/30"
                        >
                          {savedOpportunity.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <InfoNote tone="cream">
                  Opportunity checks evaluate the record's own claims: source, organiser, dates,
                  eligibility, registration link and last verification.
                </InfoNote>
              </SectionCard>

              {opportunity && (
                <SectionCard title="Record" icon={CheckCircle2}>
                  <dl className="space-y-2 text-[0.72rem]">
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Data status</dt><dd><DataBadge status={opportunity.dataStatus} /></dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Organiser</dt><dd className="text-right text-forest">{opportunity.organiser}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Registration</dt><dd className="tnum text-forest">{formatDate(opportunity.registrationDeadline)}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Last verified</dt><dd className="tnum text-forest">{opportunity.lastVerified ? formatDate(opportunity.lastVerified) : "Never"}</dd></div>
                  </dl>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full text-[0.68rem]">
                    <Link to={`/radar/${opportunity._id}`}>Open opportunity page</Link>
                  </Button>
                </SectionCard>
              )}
            </div>

            <SectionCard
              title={opportunity ? opportunity.name : "No opportunity selected"}
              icon={ShieldCheck}
              action={
                opportunityResult && opportunity ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-[0.68rem]"
                    onClick={() => void saveCheck("opportunity", { _id: opportunity._id, name: opportunity.name }, opportunityResult)}
                    disabled={recording}
                  >
                    {recording ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ShieldCheck className="size-3.5" aria-hidden />}
                    Record check
                  </Button>
                ) : null
              }
            >
              {opportunityResult ? (
                <CredibilityFindings result={opportunityResult} />
              ) : (
                <EmptyState
                  icon={Radar}
                  title="Pick a listing to investigate"
                  description="BuildScope will check the source, organiser, dates, eligibility, registration link and last verification of the record."
                />
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              <SectionCard title="Choose a project" icon={FolderKanban}>
                {overview.projects.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="No projects yet"
                    description="Create a project to evaluate its claims against its repository and milestones."
                    action={<Button asChild size="sm" className="rounded-full bg-forest"><Link to="/projects?new=1">Create project</Link></Button>}
                  />
                ) : (
                  <div className="space-y-1.5">
                    {overview.projects.map((project) => (
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => setProjectId(project._id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-[0.72rem] transition-colors",
                          projectId === project._id
                            ? "border-forest/30 bg-sage/40 text-forest"
                            : "border-border bg-card text-forest/70 hover:border-forest/20",
                        )}
                      >
                        <span className="truncate">{project.name}</span>
                        <span className="text-[0.6rem] text-muted-foreground">{project.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </SectionCard>

              {projectEntry && (
                <SectionCard title="Evidence inventory" icon={CheckCircle2}>
                  <ul className="space-y-1.5 text-[0.7rem]">
                    <li className="flex justify-between gap-2"><span className="text-muted-foreground">Repository</span><span className="text-forest">{projectEntry.repoUrl ? "Linked" : "Not linked"}</span></li>
                    <li className="flex justify-between gap-2"><span className="text-muted-foreground">Repository read</span><span className="text-forest">{projectReport ? "Yes" : "No"}</span></li>
                    <li className="flex justify-between gap-2"><span className="text-muted-foreground">Documentation</span><span className="text-forest">{projectEntry.docsUrl || projectReport?.readmePresent ? "Present" : "None"}</span></li>
                    <li className="flex justify-between gap-2"><span className="text-muted-foreground">Demo</span><span className="text-forest">{projectEntry.demoUrl ? "Linked" : "None"}</span></li>
                    <li className="flex justify-between gap-2"><span className="text-muted-foreground">Milestones</span><span className="tnum text-forest">{projectMilestones.filter((m) => m.completed).length}/{projectMilestones.length}</span></li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full text-[0.68rem]">
                    <Link to={`/projects/${projectEntry._id}?tab=repository`}>Analyse repository</Link>
                  </Button>
                </SectionCard>
              )}
            </div>

            <SectionCard
              title={projectEntry ? projectEntry.name : "No project selected"}
              icon={ShieldCheck}
              eyebrow="Project credibility"
              action={
                projectResult && projectEntry ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-[0.68rem]"
                    onClick={() => void saveCheck("project", { _id: projectEntry._id, name: projectEntry.name }, projectResult)}
                    disabled={recording}
                  >
                    {recording ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ShieldCheck className="size-3.5" aria-hidden />}
                    Record check
                  </Button>
                ) : null
              }
            >
              {projectResult ? (
                <CredibilityFindings result={projectResult} />
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="Select a project"
                  description="Claims are compared with available evidence. A project idea, a repository, a working application and a deployed product are distinct states."
                />
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="repository" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <SectionCard title="Investigate a public repository" icon={Github} eyebrow="Read-only GitHub analysis">
              <RepoAnalysis />
            </SectionCard>
            <div className="space-y-4">
              {repositoryResult && (
                <SectionCard title="Latest repository findings" icon={ShieldCheck}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[0.72rem] font-medium text-forest">{repositoryResult.subject}</p>
                      <p className="text-[0.6rem] text-muted-foreground">
                        Checked {latestRepoCheck ? formatDate(latestRepoCheck.fetchedAt, true) : "—"}
                      </p>
                    </div>
                    <StatusPill status={repositoryResult.overall} />
                  </div>
                  <ul className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                    {repositoryResult.findings.map((finding) => (
                      <li key={finding.id} className="rounded-lg border border-border/60 bg-cream/30 px-2 py-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[0.66rem] text-forest">{finding.claim}</span>
                          <StatusPill status={finding.status} className="scale-90 px-1.5 py-0.5 text-[0.5rem]" />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {latestReport && (
                    <Button asChild variant="outline" size="sm" className="mt-2 w-full rounded-full text-[0.68rem]">
                      <a href={latestReport.repoUrl} target="_blank" rel="noreferrer noopener">
                        Open source <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </Button>
                  )}
                </SectionCard>
              )}

              <SectionCard title="Check history" icon={Clock}>
                {overview.repoChecks.length === 0 ? (
                  <p className="text-[0.72rem] leading-5 text-muted-foreground">
                    No repository checks yet. Paste a public GitHub URL to start.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {overview.repoChecks.slice(0, 6).map((check) => (
                      <li key={check._id} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[0.7rem] text-forest">{check.owner}/{check.repoName}</p>
                          <p className="text-[0.58rem] text-muted-foreground">{formatDate(check.fetchedAt, true)}</p>
                        </div>
                        <StatusPill status={check.status === "verified" ? "Verified" : "Unable to verify"} className="scale-90" />
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <div className="rounded-xl border border-border/70 bg-cream/40 p-3">
                <p className="flex items-center gap-1.5 text-[0.72rem] font-medium text-forest">
                  <TriangleAlert className="size-3.5" aria-hidden /> What this cannot tell you
                </p>
                <p className="mt-1 text-[0.66rem] leading-5 text-muted-foreground">
                  BuildScope cannot see private work, deleted history, or code re-uploaded without a
                  fork link. Similarity is never treated as proof of misconduct.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-lavender/30 p-3">
                <p className="flex items-center gap-1.5 text-[0.72rem] font-medium text-forest">
                  <Sparkles className="size-3.5" aria-hidden /> Method separation
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Tag tone="sage">Concept similarity</Tag>
                  <Tag tone="cream">Repository similarity</Tag>
                  <Tag tone="lavender">Code similarity</Tag>
                  <Tag tone="peach">Ancestry</Tag>
                  <Tag tone="gold">Licence</Tag>
                </div>
                <p className="mt-1.5 text-[0.62rem] leading-4 text-muted-foreground">
                  These are reported separately. Only exact git blob fingerprints are computed;
                  normalised code similarity and AST analysis remain Not assessed.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
