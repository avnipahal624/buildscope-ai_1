import { useMemo, useState } from "react";
import { ExternalLink, GitCompareArrows, SlidersHorizontal } from "lucide-react";
import { useProjectData } from "@/hooks/use-project-data";
import { ErrorNote, LoadingBlock, SectionCard, Tag } from "@/components/common";
import { SimilarityLandscape } from "@/components/ComparisonGraphics";
import type { SimilarProject } from "@/lib/api";

function Items({ values, empty = "Not extracted" }: { values: string[]; empty?: string }) {
  return values.length ? <ul className="space-y-1">{values.map((value, index) => <li key={`${value}-${index}`} className="rounded-md bg-cream/55 px-2 py-1 text-xs text-forest/80">{value}</li>)}</ul>
    : <span className="text-xs text-muted-foreground">{empty}</span>;
}

export default function SimilarityIntelligence() {
  const resource = useProjectData();
  const [selected, setSelected] = useState<string[]>([]);
  const [minimum, setMinimum] = useState(0);
  const projects = useMemo(() => [...(resource.data?.similar || [])].filter((p) => p.similarity_score >= minimum).sort((a, b) => b.similarity_score - a.similarity_score), [resource.data, minimum]);
  const chosen = useMemo(() => projects.filter((p) => selected.includes(p.id)), [projects, selected]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(-4));
  if (resource.loading) return <LoadingBlock label="Ranking comparable projects" />;
  if (resource.error) return <ErrorNote>{String(resource.error)}</ErrorNote>;
  if (!resource.data?.project) return <div className="paper rounded-2xl p-8 text-sm text-muted-foreground">Create an investigation to compare discovered projects.</div>;

  const own = resource.data.project;
  const fields: Array<{ label: string; own: string[]; from: (project: SimilarProject) => string[]; empty?: string }> = [
    { label: "Problem", own: [own.problem_statement].filter(Boolean), from: (p) => [p.problem_solved || ""].filter(Boolean) },
    { label: "Target users", own: own.target_users, from: (p) => p.target_users },
    { label: "Features", own: own.planned_features, from: (p) => p.features },
    { label: "Technology", own: [], from: (p) => p.technology },
    { label: "Limitations", own: [], from: (p) => p.limitations, empty: "No limitations documented in the available source" },
  ];

  return <div className="space-y-5">
    <header><p className="label-caps text-forest/50">Discover · {own.name}</p><h1 className="mt-2 font-display text-4xl text-forest">Project Similarity Intelligence</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Explore backend-ranked projects visually, then compare extracted problems, users and capabilities with your planned idea. A score is a ranking signal, not proof of equivalence.</p></header>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3"><SlidersHorizontal className="size-4 text-forest" aria-hidden /><label className="text-xs text-forest">Minimum similarity <input type="range" min="0" max="1" step="0.05" value={minimum} onChange={(e) => setMinimum(Number(e.target.value))} className="mx-2 align-middle" />{Math.round(minimum * 100)}%</label><span className="ml-auto text-xs text-muted-foreground">{chosen.length} selected · up to 4</span></div>
    <SectionCard title="Graphical similarity landscape" icon={GitCompareArrows}><SimilarityLandscape projects={projects} selected={selected} onToggle={toggle} /></SectionCard>
    <SectionCard title={`${projects.length} ranked projects`} icon={GitCompareArrows}>
      {!projects.length ? <p className="text-sm text-muted-foreground">No projects match this filter. Lower the threshold or run research on this investigation.</p> :
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="p-3">Compare</th><th className="p-3">Project</th><th className="p-3">Signal</th><th className="p-3">Source excerpt and features</th><th className="p-3">Extraction</th><th className="p-3">Source</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="border-b border-border/60 align-top"><td className="p-3"><input type="checkbox" checked={selected.includes(project.id)} onChange={() => toggle(project.id)} aria-label={`Select ${project.name}`} /></td><td className="p-3 font-medium text-forest">{project.name}<p className="mt-1 max-w-xs text-xs font-normal text-muted-foreground">{project.description || "Description not extracted."}</p></td><td className="p-3"><span className="font-display text-xl text-forest">{Math.round(project.similarity_score * 100)}%</span><div className="mt-1 flex flex-wrap gap-1">{Object.entries(project.score_components || {}).map(([key, value]) => <Tag key={key} tone="cream">{key}: {typeof value === "number" ? `${Math.round(value * 100)}%` : "unavailable"}</Tag>)}</div></td><td className="max-w-sm p-3 text-xs leading-5 text-charcoal/70">{project.supporting_excerpt || "No supporting excerpt recorded."}<div className="mt-2 flex flex-wrap gap-1">{project.features.slice(0, 4).map((feature) => <Tag key={feature} tone="sage">{feature}</Tag>)}</div></td><td className="p-3 text-xs">{project.extraction_confidence || "Not recorded"}</td><td className="p-3">{project.source_url && <a href={project.source_url} target="_blank" rel="noreferrer noopener" aria-label={`Open original source for ${project.name}`} className="text-forest underline"><ExternalLink className="size-4" /></a>}</td></tr>)}</tbody></table></div>}
    </SectionCard>
    {chosen.length > 0 && <SectionCard title="Side-by-side comparison" icon={GitCompareArrows}>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-separate border-spacing-1 text-left"><caption className="sr-only">Your planned project compared with selected source projects</caption><thead><tr><th scope="col" className="w-32 p-2 text-xs text-forest/60">Attribute</th><th scope="col" className="min-w-44 rounded-lg bg-sage/40 p-3 text-sm text-forest">{own.name}<span className="block text-[0.65rem] font-normal">Your planned project</span></th>{chosen.map((p) => <th scope="col" key={p.id} className="min-w-44 rounded-lg bg-lavender/35 p-3 text-sm text-forest">{p.name}{p.source_url && <a href={p.source_url} target="_blank" rel="noreferrer noopener" className="mt-1 block text-[0.65rem] font-normal underline">Original source ↗</a>}</th>)}</tr></thead><tbody>{fields.map((field) => <tr key={field.label}><th scope="row" className="p-2 align-top text-xs font-medium text-forest">{field.label}</th><td className="rounded-lg bg-sage/20 p-2 align-top"><Items values={field.own} empty={field.label === "Technology" || field.label === "Limitations" ? "Not specified in your project" : "Not planned"} /></td>{chosen.map((p) => <td key={p.id} className="rounded-lg bg-cream/45 p-2 align-top"><Items values={field.from(p)} empty={field.empty} /></td>)}</tr>)}</tbody></table></div>
      <p className="mt-3 text-xs text-muted-foreground">Your features are plans. Other columns reflect extracted source information. “Not extracted” never means a feature does not exist.</p>
    </SectionCard>}
  </div>;
}
