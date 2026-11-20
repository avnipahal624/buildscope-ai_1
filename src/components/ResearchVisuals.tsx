import type { ResearchJob } from "@/lib/api";
import { Tilt } from "@/components/decor/Scenes";

type Count = { label: string; value: number };

function recordedCount(scope: ResearchJob["scope"], key: string): number | null {
  const value = (scope.counts ?? scope)[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function ResearchFunnel({ scope }: { scope: ResearchJob["scope"] }) {
  const stages: Count[] = [
    ["Queries run", "queries_run"],
    ["Pages selected", "selected"],
    ["Pages retrieved or cached", "pages_fetched_or_cached"],
    ["Projects extracted", "projects_extracted"],
  ].flatMap(([label, key]) => {
    const value = recordedCount(scope, key);
    return value === null ? [] : [{ label, value }];
  });
  const failures = [
    ["Failed searches", "failed_searches"],
    ["Failed page retrievals", "failed"],
    ["Duplicate pages", "duplicates"],
  ].flatMap(([label, key]) => {
    const value = recordedCount(scope, key);
    return value === null ? [] : [{ label, value }];
  });
  const maximum = Math.max(1, ...stages.map((stage) => stage.value));

  return (
    <div className="space-y-4">
      {stages.length === 0 ? (
        <p className="text-sm text-muted-foreground">The backend has not recorded coverage counts for this run yet.</p>
      ) : (
        <div role="img" aria-label={stages.map(({ label, value }) => `${label}: ${value}`).join("; ")} className="space-y-3">
          {stages.map(({ label, value }, index) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1 sm:grid-cols-[10rem_minmax(0,1fr)_2.5rem]">
              <span className="text-xs text-forest/80">{label}</span>
              <div className="col-start-1 h-3 overflow-hidden rounded-full bg-forest/10 sm:col-start-2" aria-hidden>
                <div className={`h-full rounded-full ${["bg-sage-deep", "bg-peach-deep", "bg-lavender-deep", "bg-forest"][index]}`} style={{ width: `${(value / maximum) * 100}%` }} />
              </div>
              <span className="col-start-2 row-start-2 text-right text-xs font-semibold tabular-nums text-forest sm:col-start-3 sm:row-start-1">{value}</span>
            </div>
          ))}
          <p className="text-[0.65rem] leading-4 text-muted-foreground">Bar lengths are relative to the largest recorded count in this run. These are different units, not a conversion rate or quality score.</p>
        </div>
      )}
      {failures.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-forest/10 pt-3">
          {failures.map(({ label, value }) => <span key={label} className={`rounded-full px-2.5 py-1 text-xs ${value > 0 && label !== "Duplicate pages" ? "bg-peach/60 text-peach-deep" : "bg-cream text-forest/70"}`}>{value} {label.toLowerCase()}</span>)}
        </div>
      )}
      {typeof scope.coverage_note === "string" && <p className="text-xs leading-5 text-muted-foreground">{scope.coverage_note}</p>}
    </div>
  );
}

export function ResearchStack({ run }: { run: ResearchJob | undefined }) {
  const sheets = [
    { label: "Search queries", value: run?.queries.length, tone: "bg-lavender", position: "translate3d(-30px, -24px, -42px) rotateZ(-8deg)" },
    { label: "Retrieved pages", value: run ? recordedCount(run.scope, "pages_fetched_or_cached") : null, tone: "bg-peach", position: "translate3d(5px, 0px, 0px) rotateZ(5deg)" },
    { label: "Extracted projects", value: run ? recordedCount(run.scope, "projects_extracted") : null, tone: "bg-sage", position: "translate3d(30px, 26px, 48px) rotateZ(-2deg)" },
  ];
  return (
    <Tilt strength={5} className="stage hidden h-52 w-64 shrink-0 sm:block" >
      <div className="preserve relative h-full w-full" aria-hidden="true">
        {sheets.map((sheet) => (
          <div key={sheet.label} className={`absolute left-9 top-8 flex h-28 w-40 flex-col justify-between rounded-xl border border-forest/20 p-3 shadow-lg ${sheet.tone}`} style={{ transform: sheet.position }}>
            <span className="text-[0.6rem] uppercase tracking-widest text-forest/65">{sheet.label}</span>
            <span className="font-display text-2xl text-forest">{sheet.value == null ? "—" : sheet.value}</span>
            <span className="h-1 w-16 rounded-full bg-forest/20" />
          </div>
        ))}
      </div>
    </Tilt>
  );
}
