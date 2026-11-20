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
import { useResource } from "@/hooks/use-resource";
import {
  buildPassport,
  downloadMarkdown,
  passportMarkdown,
  readinessSummary,
  type Passport as PassportModel,
} from "@/lib/passport";
import { formatDate } from "@/lib/format";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Github,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ErrorNote,
  LoadingBlock,
  Tag,
} from "@/components/common";
import { EvidenceRow, ReadinessList, SimilarProjectCard } from "@/components/research";
import { CompassStar } from "@/components/decor/Scenes";

type PassportData = {
  project: Project;
  report: ProjectReport | null;
  similar: SimilarProject[];
  comparisons: ProjectComparison[];
  evidence: Evidence[];
  stakeholders: Stakeholder[];
  needs: StakeholderNeed[];
  opportunities: Opportunity[];
  requirements: ProjectRequirement[];
  chains: OpportunityChain[];
  failures: string[];
};

async function loadPassport(projectId: string, signal: AbortSignal): Promise<PassportData> {
  const project = await api.getProject(projectId, signal);
  const [report, similar, comparisons, evidence, stakeholders, needs, opportunities, requirements] =
    await Promise.allSettled([
      api.getReport(projectId, signal),
      api.listSimilarProjects(projectId, signal),
      api.listComparisons(projectId, signal),
      api.listEvidence(projectId, undefined, signal),
      api.listStakeholders(projectId, signal),
      api.listNeeds(projectId, undefined, signal),
      api.listOpportunities(projectId, signal),
      api.listProjectRequirements(projectId, signal),
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
  collect("project requirements", requirements);

  const opportunityList = opportunities.status === "fulfilled" ? opportunities.value : [];
  const chainResults = await Promise.all(
    opportunityList.slice(0, 12).map(async (opportunity) => {
      try {
        return await api.getChain(opportunity.id, signal);
      } catch {
        return null;
      }
    }),
  );

  return {
    project,
    report: report.status === "fulfilled" ? report.value : null,
    similar: similar.status === "fulfilled" ? similar.value : [],
    comparisons: comparisons.status === "fulfilled" ? comparisons.value : [],
    evidence: evidence.status === "fulfilled" ? evidence.value : [],
    stakeholders: stakeholders.status === "fulfilled" ? stakeholders.value : [],
    needs: needs.status === "fulfilled" ? needs.value : [],
    opportunities: opportunityList,
    requirements: requirements.status === "fulfilled" ? requirements.value : [],
    chains: chainResults.filter((chain): chain is OpportunityChain => Boolean(chain)),
    failures,
  };
}

export default function PassportPage() {
  const { projectId } = useParams();
  const resource = useResource(
    (signal) => (projectId ? loadPassport(projectId, signal) : Promise.reject(new Error("Project missing"))),
    [projectId],
  );

  const model = useMemo<PassportModel | null>(() => {
    if (!resource.data) return null;
    const data = resource.data;
    return buildPassport({
      project: data.project,
      report: data.report,
      similarProjects: data.similar,
      comparisons: data.comparisons,
      evidence: data.evidence,
      stakeholders: data.stakeholders,
      needs: data.needs,
      opportunities: data.opportunities,
      projectRequirements: data.requirements,
      chains: data.chains,
    });
  }, [resource.data]);

  const summary = model ? readinessSummary(model.checks) : null;

  if (resource.loading) return <LoadingBlock label="Assembling the Buildability Passport" />;

  if (resource.error || !resource.data || !model) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-forest/60 hover:text-forest">
          <ArrowLeft className="size-3.5" aria-hidden /> All projects
        </Link>
        <div className="paper rounded-2xl p-8 text-center">
          <p className="font-display text-2xl text-forest">Passport unavailable</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            {resource.error ?? "The project could not be loaded from the research service."}
          </p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={resource.reload}>
            <RefreshCw className="size-4" aria-hidden /> Try again
          </Button>
        </div>
      </div>
    );
  }

  const data = resource.data;
  const comparisons = new Map(data.comparisons.map((comparison) => [comparison.similar_project_id, comparison]));
  const stakeholderNames = new Map(data.stakeholders.map((stakeholder) => [stakeholder.id, stakeholder.name]));

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(passportMarkdown(model));
      toast.success("Passport copied as Markdown.");
    } catch {
      toast.error("Clipboard access was blocked. Use Download Markdown instead.");
    }
  };

  const download = () => {
    const slug = data.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
    downloadMarkdown(`buildability-passport-${slug}.md`, passportMarkdown(model));
    toast.success("Passport downloaded as Markdown.");
  };

  return (
    <div className="space-y-4">
      <div className="print-hide flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/projects/${data.project.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-forest/60 hover:text-forest"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to investigation
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void copyMarkdown()}>
            <FileText className="size-3.5" aria-hidden /> Copy Markdown
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={download}>
            <Download className="size-3.5" aria-hidden /> Download
          </Button>
          <Button type="button" size="sm" className="rounded-full bg-forest" onClick={() => window.print()}>
            <Printer className="size-3.5" aria-hidden /> Print / Save PDF
          </Button>
        </div>
      </div>

      <article id="passport-document" className="space-y-4">
        <header className="relative overflow-hidden rounded-[26px] border border-border/70 bg-cream/60 px-5 py-7 sm:px-8 sm:py-9">
          <div className="absolute inset-0 grain opacity-60" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="label-caps flex items-center gap-2 text-forest/50">
                <CompassStar className="size-3.5 text-gold" /> BuildScope AI · Buildability Passport
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.02] text-forest sm:text-5xl">
                {data.project.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/65">
                {data.project.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Tag tone="sage">Generated {formatDate(new Date(model.generatedAt).getTime(), true)}</Tag>
                <Tag tone="cream">Status: {data.project.status}</Tag>
                <Tag tone="peach">Research record — not a certificate</Tag>
              </div>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-card px-4 py-3">
              <p className="label-caps text-forest/45">Readiness checklist</p>
              <p className="mt-1 font-display text-2xl leading-none text-forest">
                {summary?.complete}/{summary?.total} complete
              </p>
              <p className="mt-1 text-[0.62rem] text-muted-foreground">
                {summary?.partial} partial · {summary?.missing} missing · {summary?.notAssessed} not assessed
              </p>
            </div>
          </div>
        </header>

        {data.failures.length > 0 && (
          <div>
            <ErrorNote>
              Some sections loaded partially. The Passport records what was available and does not
              fill missing results.
            </ErrorNote>
            <ul className="mt-1 pl-1 text-[0.62rem] text-muted-foreground">
              {data.failures.map((failure) => <li key={failure}>· {failure}</li>)}
            </ul>
          </div>
        )}

        <PassportSection number="01" title="Project identity" icon={BookOpenCheck}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="label-caps text-forest/45">Problem statement</dt>
              <dd className="mt-1 text-sm leading-6 text-charcoal/70">
                {data.project.problem_statement || "Not recorded."}
              </dd>
            </div>
            <div>
              <dt className="label-caps text-forest/45">Description</dt>
              <dd className="mt-1 text-sm leading-6 text-charcoal/70">{data.project.description}</dd>
            </div>
            <div>
              <dt className="label-caps text-forest/45">Target users</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {data.project.target_users.length === 0 ? <Tag tone="peach">Not recorded</Tag> : data.project.target_users.map((user) => <Tag key={user} tone="sage">{user}</Tag>)}
              </dd>
            </div>
            <div>
              <dt className="label-caps text-forest/45">Planned features</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {data.project.planned_features.length === 0 ? <Tag tone="cream">Not recorded</Tag> : data.project.planned_features.map((feature) => <Tag key={feature} tone="lavender">{feature}</Tag>)}
              </dd>
            </div>
          </dl>
        </PassportSection>

        <PassportSection number="02" title="Build readiness" icon={ShieldCheck}>
          <ReadinessList checks={model.checks} />
          <p className="mt-3 rounded-lg bg-cream/60 px-3 py-2 text-[0.65rem] leading-5 text-forest/60">
            This checklist is derived only from records that exist. It is not an overall readiness
            percentage, patentability assessment or guarantee of success.
          </p>
        </PassportSection>

        <PassportSection number="03" title="Existing landscape" icon={Github}>
          {data.similar.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No comparable projects have been retrieved.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {[...data.similar]
                .sort((a, b) => b.similarity_score - a.similarity_score)
                .map((similar) => (
                  <SimilarProjectCard key={similar.id} project={similar} comparison={comparisons.get(similar.id)} />
                ))}
            </ul>
          )}
          <p className="mt-3 rounded-lg bg-peach/30 px-3 py-2 text-[0.65rem] leading-5 text-forest/65">
            Shared features and possible gaps are recorded interpretations. A gap is a hypothesis for
            further research, not proof of an unmet need.
          </p>
        </PassportSection>

        <PassportSection number="04" title="Evidence ledger" icon={ShieldCheck}>
          {model.evidence.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No evidence excerpts have been recorded.
            </p>
          ) : (
            <>
              <p className="mb-2 text-[0.7rem] text-muted-foreground">
                {model.evidence.length} item(s) · {model.counts.verifiedExcerpts} excerpt(s) found in
                the retrieved source text. Source excerpts are kept separate from AI interpretation.
              </p>
              <ul className="space-y-2">
                {model.evidence.map((item) => <EvidenceRow key={item.id} item={item} />)}
              </ul>
            </>
          )}
        </PassportSection>

        <PassportSection number="05" title="User needs & opportunities" icon={Users}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="label-caps text-forest/45">Stakeholder groups</p>
              {data.stakeholders.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">No groups recorded.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {data.stakeholders.map((stakeholder) => (
                    <li key={stakeholder.id} className="rounded-lg bg-cream/40 px-3 py-2">
                      <p className="text-[0.72rem] font-medium text-forest">{stakeholder.name}</p>
                      <p className="text-[0.62rem] text-muted-foreground">
                        {stakeholder.status} · {stakeholder.description || "No description"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="label-caps text-forest/45">Recorded needs</p>
              {model.needs.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">No needs analysed.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {model.needs.map((need) => (
                    <li key={need.id} className="rounded-lg bg-cream/40 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[0.72rem] leading-5 text-forest">{need.need_text}</p>
                        <Tag tone={["supported", "strongly_supported", "conflicting"].includes(need.evidence_status) ? "sage" : "cream"}>
                          {need.evidence_status.replace(/_/g, " ")}
                        </Tag>
                      </div>
                      <p className="mt-1 text-[0.6rem] text-muted-foreground">
                        {stakeholderNames.get(need.stakeholder_id) ?? "Stakeholder unavailable"} ·{" "}
                        {need.supporting_count} supporting · {need.contradicting_count} contradicting
                      </p>
                      {need.validation_question && (
                        <p className="mt-1 text-[0.62rem] leading-4 text-forest/65">
                          Open question: {need.validation_question}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="label-caps text-forest/45">Opportunity hypotheses</p>
            {data.opportunities.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">No opportunities recorded.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {data.opportunities.map((opportunity) => (
                  <li key={opportunity.id} className="rounded-lg bg-peach/25 px-3 py-2">
                    <p className="text-[0.72rem] leading-5 text-forest">{opportunity.description}</p>
                    <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
                      {opportunity.origin.replace(/_/g, " ")} · {opportunity.status} ·{" "}
                      {opportunity.linked_need_ids.length} linked need(s)
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PassportSection>

        <PassportSection number="06" title="Requirements & verification" icon={FileText}>
          {model.requirements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No project or proof-chain requirements recorded.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {model.requirements.map((requirement) => (
                <li key={requirement.id} className="rounded-xl border border-border/70 bg-cream/25 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="max-w-[80%] text-[0.76rem] font-medium leading-5 text-forest">{requirement.text}</p>
                    <Tag tone={requirement.source === "proof_chain" ? "lavender" : "cream"}>
                      {requirement.source === "proof_chain" ? "proof chain" : "project requirement"}
                    </Tag>
                  </div>
                  <p className="mt-1 text-[0.65rem] leading-4 text-muted-foreground">
                    <span className="font-medium text-forest/70">Acceptance test:</span> {requirement.acceptanceTest}
                  </p>
                  {requirement.verification.length === 0 ? (
                    <p className="mt-1.5 inline-flex rounded-full bg-cream px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Verification not assessed
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1">
                      {requirement.verification.map((result, index) => (
                        <li key={`${result.test}-${index}`} className="flex items-start gap-1.5 text-[0.62rem] leading-4">
                          <span className={
                            result.result === "pass"
                              ? "mt-0.5 rounded-full bg-sage px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase text-forest"
                              : "mt-0.5 rounded-full bg-peach px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase text-forest"
                          }>
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
        </PassportSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <PassportSection number="07" title="Next steps" icon={CheckCircle2}>
            <ul className="space-y-2">
              {model.nextSteps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-[0.74rem] leading-5 text-charcoal/70">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  {step}
                </li>
              ))}
            </ul>
          </PassportSection>

          <PassportSection number="08" title="Limitations & outstanding questions" icon={TriangleAlert}>
            <ul className="space-y-2">
              {model.limitations.map((limitation) => (
                <li key={limitation} className="flex items-start gap-2 text-[0.72rem] leading-5 text-charcoal/70">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-peach-deep" aria-hidden />
                  {limitation}
                </li>
              ))}
            </ul>
            {data.needs.filter((need) => need.validation_question).length > 0 && (
              <div className="mt-3 rounded-lg bg-cream/60 px-3 py-2">
                <p className="label-caps text-forest/45">Open validation questions</p>
                <ul className="mt-1 space-y-1 text-[0.68rem] leading-5 text-forest/70">
                  {data.needs
                    .filter((need) => need.validation_question)
                    .map((need) => <li key={need.id}>· {need.validation_question}</li>)}
                </ul>
              </div>
            )}
          </PassportSection>
        </div>

        <footer className="rounded-2xl border border-border/70 bg-forest px-5 py-4 text-ivory sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg">BuildScope AI · Buildability Passport</p>
              <p className="mt-0.5 text-[0.65rem] text-ivory/60">
                Generated from recorded research on {formatDate(new Date(model.generatedAt).getTime(), true)}.
              </p>
            </div>
            <p className="max-w-lg text-[0.62rem] leading-4 text-ivory/50">
              This document is an investigation record, not a legal opinion, patentability
              certificate or guarantee of product success. Verify every source before relying on it.
            </p>
          </div>
        </footer>
      </article>

      <div className="print-hide flex flex-wrap justify-center gap-2 pb-2 text-[0.65rem] text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden /> Evidence provenance preserved.
        <ExternalLink className="ml-2 size-3.5" aria-hidden /> Source links open in a new tab.
        <Loader2 className="ml-2 hidden size-3" aria-hidden />
      </div>
    </div>
  );
}

function PassportSection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: typeof ShieldCheck;
  children: ReactNode;
}) {
  return (
    <section className="paper print-clean rounded-2xl px-5 py-5 sm:px-6">
      <header className="mb-3 flex items-start gap-3 border-b border-border/60 pb-3">
        <span className="tnum font-display text-2xl leading-none text-forest/25">{number}</span>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-forest/50" aria-hidden />
          <h2 className="font-display text-xl leading-tight text-forest">{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}
