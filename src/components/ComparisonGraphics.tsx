import type { ProjectComparison, SimilarProject } from "@/lib/api";
import { Tilt } from "@/components/decor/Scenes";

const COLORS = ["bg-sage-deep", "bg-peach-deep", "bg-lavender-deep", "bg-gold"];

function percent(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

/** A ranking signal from the backend, never a measure of originality or market value. */
export function SimilarityLandscape({
  projects,
  selected = [],
  onToggle,
}: {
  projects: SimilarProject[];
  selected?: string[];
  onToggle?: (id: string) => void;
}) {
  const ranked = [...projects].sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 8);
  if (!ranked.length) return <p className="text-sm text-muted-foreground">No comparable projects have been extracted yet.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ranked.slice(0, 4).map((project, index) => (
          <Tilt key={project.id} strength={4} className="min-w-0">
            {onToggle ? (
              <button type="button" onClick={() => onToggle(project.id)} aria-pressed={selected.includes(project.id)}
                className={`preserve relative flex min-h-28 w-full flex-col justify-between rounded-xl border p-3 text-left shadow-[0_10px_20px_rgba(16,44,35,0.08)] transition-shadow hover:shadow-[0_18px_28px_rgba(16,44,35,0.16)] focus-visible:outline-2 focus-visible:outline-forest ${selected.includes(project.id) ? "border-forest bg-sage/45" : "border-forest/15 bg-cream/65"}`}>
                <span aria-hidden className={`absolute -right-3 -top-3 size-16 rotate-12 rounded-2xl opacity-30 ${COLORS[index]}`} style={{ transform: "translateZ(-16px)" }} />
                <span className="relative z-10 truncate text-sm font-medium text-forest" style={{ transform: "translateZ(14px)" }}>{project.name}</span>
                <span className="relative z-10 flex items-end justify-between gap-2" style={{ transform: "translateZ(20px)" }}><span className="text-[0.65rem] text-forest/60">Compare</span><span className="font-display text-2xl text-forest">{percent(project.similarity_score)}%</span></span>
              </button>
            ) : (
              <div className="relative flex min-h-28 flex-col justify-between overflow-hidden rounded-xl border border-forest/15 bg-cream/65 p-3 shadow-[0_10px_20px_rgba(16,44,35,0.08)]">
                <span aria-hidden className={`absolute -right-5 -top-5 size-20 rotate-12 rounded-2xl opacity-35 ${COLORS[index]}`} />
                <span className="relative z-10 truncate text-sm font-medium text-forest">{project.name}</span>
                <span className="relative z-10 self-end font-display text-2xl text-forest">{percent(project.similarity_score)}%</span>
              </div>
            )}
          </Tilt>
        ))}
      </div>
      <div className="space-y-2" aria-label="Similarity ranking">
        {ranked.map((project, index) => (
          <div key={project.id} className="grid grid-cols-[minmax(6rem,11rem)_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
            <span className="truncate text-forest/80" title={project.name}>{index + 1}. {project.name}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-forest/10" role="img" aria-label={`${project.name}: ${percent(project.similarity_score)} percent similarity signal`}>
              <div className={`h-full rounded-full ${COLORS[index % COLORS.length]}`} style={{ width: `${percent(project.similarity_score)}%` }} />
            </div>
            <span className="text-right tabular-nums text-forest">{percent(project.similarity_score)}%</span>
          </div>
        ))}
      </div>
      <p className="text-[0.68rem] leading-5 text-muted-foreground">The backend ranks related projects. This signal does not establish equivalence, originality or market demand. Select cards to compare their extracted details.</p>
    </div>
  );
}

/** Counts of stored comparison statements, without converting them into a gap score. */
export function ComparisonSignalChart({ comparisons, projects }: { comparisons: ProjectComparison[]; projects: SimilarProject[] }) {
  if (!comparisons.length) return <p className="text-sm text-muted-foreground">Select projects with recorded comparisons to see their shared features, differences and possible gaps.</p>;
  const categories = [
    { label: "Shared", key: "shared_features" as const, color: "bg-sage-deep" },
    { label: "Differences", key: "differences" as const, color: "bg-lavender-deep" },
    { label: "Possible gaps", key: "possible_gaps" as const, color: "bg-peach-deep" },
  ];
  const max = Math.max(1, ...comparisons.flatMap((row) => categories.map((category) => row[category.key].length)));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-forest/70">{categories.map((category) => <span key={category.key} className="inline-flex items-center gap-1.5"><span className={`size-2.5 rounded-full ${category.color}`} />{category.label}</span>)}</div>
      {comparisons.map((row) => (
        <div key={row.id} className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-[10rem_1fr]">
          <p className="truncate text-xs font-medium text-forest">{projects.find((project) => project.id === row.similar_project_id)?.name ?? "Project unavailable"}</p>
          <div className="space-y-1.5">{categories.map((category) => {
            const count = row[category.key].length;
            return <div key={category.key} className="grid grid-cols-[5.5rem_1fr_1.5rem] items-center gap-2 text-[0.65rem]">
              <span className="text-forest/60">{category.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-forest/10" role="img" aria-label={`${count} recorded ${category.label.toLowerCase()} statements`}><div className={`h-full rounded-full ${category.color}`} style={{ width: `${(count / max) * 100}%` }} /></div>
              <span className="text-right tabular-nums text-forest">{count}</span>
            </div>;
          })}</div>
        </div>
      ))}
      <p className="text-[0.68rem] leading-5 text-muted-foreground">Bars count recorded comparison statements. Possible gaps are hypotheses; missing documentation is not proof a feature is absent.</p>
    </div>
  );
}
