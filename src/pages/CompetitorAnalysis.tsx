import { useMemo, useState } from "react";
import { Check, ExternalLink, GitCompareArrows, HelpCircle, Save, X } from "lucide-react";
import { useProjectData } from "@/hooks/use-project-data";
import { ErrorNote, LoadingBlock, SectionCard, Tag } from "@/components/common";
import { ComparisonSignalChart } from "@/components/ComparisonGraphics";
import { Tilt } from "@/components/decor/Scenes";

export default function CompetitorAnalysis() {
  const resource = useProjectData();
  const [chosen, setChosen] = useState<string[]>([]);
  const [review, setReview] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const projects = resource.data?.similar || [];
  const comparisons = resource.data?.comparisons || [];
  const toggle = (id: string) => setChosen((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(-3));
  const rows = useMemo(() => comparisons.filter((row) => chosen.includes(row.similar_project_id)), [comparisons, chosen]);
  if (resource.loading) return <LoadingBlock label="Loading competitive comparisons" />;
  if (resource.error) return <ErrorNote>{String(resource.error)}</ErrorNote>;

  return <div className="space-y-5">
    <header><p className="label-caps text-forest/50">Discover · comparison workspace</p><h1 className="mt-2 font-display text-4xl text-forest">Competitor Gap Analysis</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Compare recorded relationships visually. Possible gaps are hypotheses derived from available documents; an undocumented feature is not proof it does not exist.</p></header>
    <SectionCard title="Choose projects to compare" icon={GitCompareArrows}>
      {projects.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => (
        <Tilt key={project.id} strength={4}>
          <button type="button" onClick={() => toggle(project.id)} aria-pressed={chosen.includes(project.id)} className={`preserve relative flex min-h-28 w-full flex-col justify-between rounded-xl border p-3 text-left shadow-[0_10px_20px_rgba(16,44,35,0.09)] transition-shadow hover:shadow-[0_18px_28px_rgba(16,44,35,0.16)] focus-visible:outline-2 focus-visible:outline-forest ${chosen.includes(project.id) ? "border-forest bg-sage/50" : "border-forest/15 bg-cream/50"}`}>
            <span aria-hidden className="absolute -right-5 -top-5 size-20 rotate-12 rounded-2xl bg-lavender/55" style={{ transform: "translateZ(-16px)" }} />
            <span className="relative z-10 line-clamp-2 text-sm font-medium text-forest" style={{ transform: "translateZ(14px)" }}>{project.name}</span>
            <span className="relative z-10 flex items-end justify-between gap-2 text-[0.65rem] text-forest/70" style={{ transform: "translateZ(20px)" }}><span>{chosen.includes(project.id) ? "Selected" : "Select to compare"}</span><span className="font-display text-xl text-forest">{Math.round(project.similarity_score * 100)}%</span></span>
          </button>
        </Tilt>
      ))}</div> : <p className="text-sm text-muted-foreground">No comparable projects recorded. Run research on an investigation first.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Choose up to three. Cards use subtle 3D depth; the score is a backend relevance signal, not a novelty verdict.</p>
    </SectionCard>
    <SectionCard title="Graphical comparison" icon={GitCompareArrows}><ComparisonSignalChart comparisons={rows} projects={projects} /></SectionCard>
    <SectionCard title={`Comparison findings · ${rows.length}`} icon={HelpCircle}>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Select a discovered project with a recorded comparison to inspect its explanations and original source.</p> : <div className="space-y-4">{rows.map((row) => {
        const project = projects.find((p) => p.id === row.similar_project_id);
        return <article key={row.id} className="rounded-2xl border border-border/70 bg-cream/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-display text-xl text-forest">{project?.name || row.similar_project_id}</h3>{project?.source_url && <a href={project.source_url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs text-forest underline">Original source <ExternalLink className="size-3" aria-hidden /></a>}</div>
            <div className="flex gap-1"><button type="button" onClick={() => setReview({ ...review, [row.id]: "relevant" })} className="rounded-full border border-sage-deep/30 p-2 focus-visible:outline-2 focus-visible:outline-forest" aria-label={`Mark ${project?.name || "project"} relevant`}><Check className="size-4" /></button><button type="button" onClick={() => setReview({ ...review, [row.id]: "irrelevant" })} className="rounded-full border border-peach-deep/30 p-2 focus-visible:outline-2 focus-visible:outline-forest" aria-label={`Mark ${project?.name || "project"} irrelevant`}><X className="size-4" /></button><button type="button" onClick={() => setReview({ ...review, [row.id]: "investigate" })} className="rounded-full border border-gold/40 p-2 focus-visible:outline-2 focus-visible:outline-forest" aria-label={`Mark ${project?.name || "project"} for investigation`}><HelpCircle className="size-4" /></button></div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div><Tag tone="sage">Shared capabilities</Tag><ul className="mt-2 list-disc pl-4 text-xs leading-5">{row.shared_features.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>{!row.shared_features.length && <p className="mt-2 text-xs text-muted-foreground">None recorded.</p>}</div>
            <div><Tag tone="cream">Documented differences</Tag><ul className="mt-2 list-disc pl-4 text-xs leading-5">{row.differences.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>{!row.differences.length && <p className="mt-2 text-xs text-muted-foreground">None recorded.</p>}</div>
            <div><Tag tone="peach">Possible gaps · hypothesis</Tag><ul className="mt-2 list-disc pl-4 text-xs leading-5">{row.possible_gaps.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>{!row.possible_gaps.length && <p className="mt-2 text-xs text-muted-foreground">None recorded.</p>}</div>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{row.explanation}</p>
          {review[row.id] && <p className="mt-2 text-xs text-forest">Review state: {review[row.id]} (session only).</p>}
        </article>;
      })}</div>}
    </SectionCard>
    <SectionCard title="Analyst observation" icon={Save}><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record your own observation without changing sourced findings…" className="min-h-24 w-full rounded-xl border border-border bg-card p-3 text-sm" /><p className="mt-2 text-xs text-muted-foreground">Review labels and notes are held in this session because no backend comparison-review endpoint exists.</p></SectionCard>
  </div>;
}
