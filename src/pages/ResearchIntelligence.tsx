import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, ExternalLink, RefreshCw, Search, XCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useProjectData } from "@/hooks/use-project-data";
import { useResource } from "@/hooks/use-resource";
import { ErrorNote, LoadingBlock, SectionCard } from "@/components/common";
import { ResearchFunnel, ResearchStack } from "@/components/ResearchVisuals";

function RunStatus({ status }: { status: string }) {
  const Icon = status === "completed" ? CheckCircle2 : status === "failed" ? XCircle : status === "completed_with_errors" ? CircleAlert : Activity;
  return <span className="inline-flex items-center gap-1 text-xs capitalize"><Icon className="size-3.5" aria-hidden />{status.replace(/_/g, " ")}</span>;
}

export default function ResearchIntelligence() {
  const project = useProjectData();
  const [selectedRun, setSelectedRun] = useState<string>();
  const runs = useResource(async (signal) => {
    const p = project.data?.project;
    return p ? api.listResearchRuns(p.id, signal) : [];
  }, [project.data?.project?.id]);
  const provider = useResource((signal) => api.researchProviderStatus(signal), []);
  const active = useMemo(() => (runs.data || []).find((run) => run.id === selectedRun) || runs.data?.[0], [runs.data, selectedRun]);
  const activeId = active?.id;
  const activeStatus = active?.status;
  const reloadRuns = runs.reload;

  useEffect(() => {
    if (!activeId || !activeStatus || !["pending", "running"].includes(activeStatus)) return;
    const timer = window.setInterval(() => reloadRuns(), 5000);
    return () => window.clearInterval(timer);
  }, [activeId, activeStatus, reloadRuns]);

  if (project.loading || runs.loading) return <LoadingBlock label="Loading research intelligence" />;
  if (project.error || runs.error) return <ErrorNote>{errorMessage(project.error || runs.error)}</ErrorNote>;
  if (!project.data?.project) return <div className="paper rounded-2xl p-8 text-center"><h1 className="font-display text-2xl text-forest">Create an investigation first</h1><Link to="/projects?new=1" className="mt-3 inline-block text-sm text-forest underline">New investigation</Link></div>;

  const currentProject = project.data.project;
  const warnings = active?.log.filter((entry) => typeof entry !== "string" && (entry.level === "error" || entry.level === "warning")) ?? [];

  return (
    <div className="space-y-5">
      <header className="paper flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-forest/10 p-5 sm:p-7">
        <div className="min-w-0 max-w-xl">
          <p className="label-caps text-forest/50">Discover · {currentProject.name}</p>
          <h1 className="mt-2 font-display text-3xl text-forest sm:text-4xl">Research Intelligence</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Follow real search runs from queries to retrieved pages and extracted projects. Open a run to inspect what succeeded and what failed.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${provider.error ? "bg-peach/40 text-peach-deep" : provider.data?.configured ? "bg-sage/40 text-forest" : "bg-cream text-forest/70"}`}>
              <span className="size-2 rounded-full bg-current" />
              TinyFish {provider.loading ? "checking…" : provider.error ? "status unavailable" : provider.data?.configured ? "configured" : "not configured"}
            </span>
            <Link to={`/projects/${currentProject.id}?tab=research`} className="inline-flex items-center gap-1 text-xs font-medium text-forest underline underline-offset-4">Start or repeat research <ArrowRight className="size-3.5" aria-hidden /></Link>
          </div>
        </div>
        <ResearchStack run={active} />
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.25fr)]">
        <SectionCard title={`Research runs · ${runs.data?.length || 0}`} icon={RefreshCw} action={<button type="button" onClick={runs.reload} className="text-xs text-forest underline underline-offset-4">Refresh</button>}>
          {(runs.data || []).length === 0 ? <p className="text-sm text-muted-foreground">No run is recorded for this investigation. Start research to see its actual queries and retrieval progress.</p> : (
            <ol className="space-y-2">
              {(runs.data || []).map((run) => (
                <li key={run.id}>
                  <button type="button" onClick={() => setSelectedRun(run.id)} aria-pressed={active?.id === run.id} className={`w-full rounded-xl border p-3 text-left transition-colors hover:border-forest/40 focus-visible:outline-2 focus-visible:outline-forest ${active?.id === run.id ? "border-forest bg-sage/30" : "border-border bg-card"}`}>
                    <span className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-forest">{run.kind} run</span><RunStatus status={run.status} /></span>
                    <span className="mt-1 block text-xs text-muted-foreground">{run.created_at ? new Date(run.created_at).toLocaleString() : "Date not recorded"}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <SectionCard title={active ? "Research coverage" : "Run details"} icon={Activity}>
          {active ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest/10 pb-3">
                <RunStatus status={active.status} />
                <span className="text-xs text-muted-foreground">Stage: {String(active.scope.stage ?? "not recorded")}</span>
              </div>
              <ResearchFunnel scope={active.scope} />
              {warnings.length > 0 && <p className="rounded-lg bg-peach/35 px-3 py-2 text-xs text-peach-deep">{warnings.length} recorded warning{warnings.length === 1 ? "" : "s"} or error{warnings.length === 1 ? "" : "s"}. Inspect the run log below.</p>}
              {active.error && <ErrorNote>{active.error}</ErrorNote>}
            </div>
          ) : <p className="text-sm text-muted-foreground">Select a persisted run to inspect its coverage.</p>}
        </SectionCard>
      </div>

      {active && <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={`Search queries · ${active.queries.length}`} icon={Search}>
          {active.queries.length ? <ol className="space-y-2">{active.queries.map((query, index) => <li key={`${index}-${query}`} className="flex gap-3 rounded-lg bg-cream/40 px-3 py-2 text-sm text-forest"><span className="tabular-nums text-forest/45">{String(index + 1).padStart(2, "0")}</span>{query}</li>)}</ol> : <p className="text-sm text-muted-foreground">No queries recorded for this run.</p>}
        </SectionCard>
        <SectionCard title="Sources and run log" icon={ExternalLink}>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Open original URLs and excerpts in <Link to="/evidence" className="font-medium text-forest underline">Evidence Ledger</Link> or inspect comparable projects in <Link to="/similarity" className="font-medium text-forest underline">Similarity Intelligence</Link>.</p>
            <p>Failed searches and inaccessible pages remain in the run log; they do not become findings.</p>
            {active.log.length > 0 ? <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer font-medium text-forest">Inspect {active.log.length} log entries</summary><ul className="mt-3 space-y-2 text-xs">{active.log.map((entry, index) => <li key={index} className="border-b border-border/50 pb-2 last:border-0">{typeof entry === "string" ? entry : entry.message || JSON.stringify(entry)}</li>)}</ul></details> : <p>No log entries recorded.</p>}
          </div>
        </SectionCard>
      </div>}
    </div>
  );
}
