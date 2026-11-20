import { api, type HackathonSearchResult } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { formatDate } from "@/lib/format";
import {
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  Loader2,
  Radar as RadarIcon,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ErrorNote,
  Field,
  InfoNote,
  PageHeader,
  SectionCard,
  Tag,
} from "@/components/common";
import { ArchScene } from "@/components/decor/Scenes";

const SUGGESTIONS = [
  "student AI hackathon",
  "climate hackathon 2026",
  "campus health hackathon",
  "fintech student challenge",
  "design systems hackathon",
  "open source student sprint",
];

export default function Radar() {
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [limit, setLimit] = useState(12);

  const result = useResource<HackathonSearchResult | null>(
    (signal) => (query ? api.searchHackathons(query, limit, signal) : Promise.resolve(null)),
    [query, limit],
    { enabled: Boolean(query) },
  );

  useEffect(() => {
    if (searchParams.get("search") === "1") inputRef.current?.focus();
  }, [searchParams]);

  const submit = (value: string) => {
    const clean = value.trim();
    if (clean.length < 2) return;
    setDraft(clean);
    if (clean === query) result.reload();
    else setQuery(clean);
  };

  const reset = () => {
    setDraft("");
    setQuery(null);
    inputRef.current?.focus();
  };

  const data = result.data;
  const searchedAt = data?.searched_at ? formatDate(new Date(data.searched_at).getTime(), true) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Hackathon Radar"
        title={
          <>
            Find a lead.
            <br />
            <span className="italic text-forest/60">Verify it at the source.</span>
          </>
        }
        description="The radar calls the backend's live TinyFish web search. It returns titles, snippets and original URLs. Deadlines, eligibility, prizes and registration status are not invented or inferred."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
              <Search className="size-3.5 text-gold" aria-hidden />
              Live web search
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
              <TriangleAlert className="size-3.5 text-peach-deep" aria-hidden />
              Unverified results
            </span>
          </>
        }
        aside={<ArchScene className="hidden h-[150px] w-[230px] rounded-2xl lg:block" />}
      />

      <InfoNote tone="peach">
        <span>
          <strong className="font-semibold">Search hits are leads, not confirmed opportunities.</strong>{" "}
          A result can be stale or may not be accepting registrations. Open the organiser's page and
          confirm the deadline, eligibility and status yourself.
        </span>
      </InfoNote>

      <SectionCard title="Search the live web" icon={RadarIcon}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
          className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end"
        >
          <Field label="Theme, domain or technology" htmlFor="radar-query">
            <div className="relative">
              <Search className="absolute left-2.5 top-3 size-4 text-muted-foreground" aria-hidden />
              <Input
                ref={inputRef}
                id="radar-query"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="e.g. climate hackathon for university students"
                className="h-10 bg-ivory/60 pl-9"
                minLength={2}
                maxLength={140}
                required
              />
            </div>
          </Field>
          <Field label="Results" htmlFor="radar-limit">
            <select
              id="radar-limit"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="h-10 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest"
            >
              {[6, 12, 20].map((value) => (
                <option key={value} value={value}>{value} results</option>
              ))}
            </select>
          </Field>
          <Button type="submit" disabled={result.loading} className="h-10 rounded-full bg-forest px-5">
            {result.loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
            {result.loading ? "Searching" : "Search"}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground">Try</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-[0.65rem] text-forest/60 transition-colors hover:border-forest/30 hover:text-forest"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </SectionCard>

      {result.error && (
        <div className="space-y-2">
          <ErrorNote>{result.error}</ErrorNote>
          <Button variant="outline" size="sm" className="rounded-full" onClick={result.reload}>
            <RotateCcw className="size-3.5" aria-hidden /> Try this search again
          </Button>
        </div>
      )}

      {result.loading && (
        <div className="paper flex items-center gap-3 rounded-2xl px-5 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-forest/50" aria-hidden />
          The backend is searching the live web. This can take a little longer while the service wakes up.
        </div>
      )}

      {!query && !result.loading && (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            icon={RadarIcon}
            title="Start with a specific search"
            description="Narrow by theme, audience or technology. The backend adds current-date context to prioritise open events, but every hit remains a lead."
          />
        </div>
      )}

      {query && !result.loading && !result.error && data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-forest">
                {data.results.length} result{data.results.length === 1 ? "" : "s"} for “{data.query}”
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                Searched {searchedAt ?? "recently"} · TinyFish live web search
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={reset}>
              <RotateCcw className="size-3.5" aria-hidden /> Clear
            </Button>
          </div>

          {data.results.length === 0 ? (
            <div className="paper rounded-2xl p-6">
              <EmptyState
                icon={Search}
                title="No usable results were returned"
                description="Try a broader theme, remove an audience constraint, or search again. BuildScope will not fabricate a listing to fill the gap."
                action={
                  <Button variant="outline" size="sm" className="rounded-full" onClick={result.reload}>
                    Search again
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.results.map((hit) => (
                <li key={hit.id} className="paper flex flex-col rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-peach/60 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-forest">
                      <TriangleAlert className="size-3" aria-hidden /> Unverified lead
                    </span>
                    <span className="text-[0.58rem] text-muted-foreground">{hit.source}</span>
                  </div>
                  <h2 className="mt-2 font-display text-lg leading-snug text-forest">{hit.name}</h2>
                  <p className="mt-1 line-clamp-3 text-[0.75rem] leading-5 text-charcoal/65">
                    {hit.snippet || "No snippet returned. Open the original page for context."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Tag tone="cream">
                      <CalendarClock className="mr-1 size-3" aria-hidden /> Date not verified
                    </Tag>
                    <Tag tone="cream">Eligibility not verified</Tag>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <span className="truncate text-[0.6rem] text-muted-foreground" title={hit.url}>
                      {hit.url}
                    </span>
                    <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full text-[0.65rem]">
                      <a href={hit.url} target="_blank" rel="noreferrer noopener">
                        Open source <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <SectionCard title="Retrieval notes" icon={Sparkles}>
            <p className="text-[0.75rem] leading-6 text-charcoal/70">{data.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag tone="sage">Provider: TinyFish</Tag>
              <Tag tone="lavender">Retrieved: {searchedAt ?? "time unavailable"}</Tag>
              <Tag tone="peach">Status: unverified</Tag>
            </div>
            <p className="mt-3 rounded-lg bg-cream/60 px-3 py-2 text-[0.65rem] leading-5 text-forest/60">
              BuildScope does not rank opportunities by an invented match score. Filter and compare
              the source pages yourself before committing preparation time.
            </p>
          </SectionCard>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-cream/40 px-3 py-2 text-[0.65rem] text-forest/55">
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
        Always confirm registration status on the organiser's original page.
        <span className="ml-auto flex items-center gap-1">
          <CalendarClock className="size-3" aria-hidden /> Retrieval time is shown above
        </span>
      </div>
    </div>
  );
}

