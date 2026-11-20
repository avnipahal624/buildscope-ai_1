import { api, type PriorArtResponse } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { formatDate } from "@/lib/format";
import {
  CalendarClock,
  ExternalLink,
  GitFork,
  Github,
  Loader2,
  Scale,
  Search,
  ShieldAlert,
  Star,
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
import { CubeScene } from "@/components/decor/Scenes";

const SUGGESTIONS = ["campus lost and found", "student productivity app", "event discovery platform", "peer tutoring marketplace"];

export default function PriorArt() {
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(searchParams.get("q") ?? "");
  const [query, setQuery] = useState<string | null>(searchParams.get("q"));
  const [limit, setLimit] = useState(10);

  const result = useResource<PriorArtResponse | null>(
    (signal) => (query ? api.searchPriorArt(query, limit, signal) : Promise.resolve(null)),
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

  const data = result.data;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Prior Art Lab"
        title={
          <>
            What already exists?
            <br />
            <span className="italic text-forest/60">Look before you name it original.</span>
          </>
        }
        description="Search live public GitHub repositories for names, descriptions, languages, topics, licences and timestamps. This is repository discovery — not patent database research, legal novelty analysis or a code-similarity verdict."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
            <Github className="size-3.5 text-gold" aria-hidden />
            GitHub REST metadata
          </span>
        }
        aside={<CubeScene className="hidden h-[130px] w-[150px] lg:block" />}
      />

      <InfoNote tone="peach">
        <span>
          <strong className="font-semibold">Scope of this check.</strong> Public repository metadata
          can show that similar work exists. It cannot prove that an idea is novel, that a name is
          free, or that you have freedom to operate. Patent and trademark searches are separate.
        </span>
      </InfoNote>

      <SectionCard title="Search public repositories" icon={Github}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
          className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end"
        >
          <Field label="Project name, problem or keywords" htmlFor="prior-art-query">
            <div className="relative">
              <Search className="absolute left-2.5 top-3 size-4 text-muted-foreground" aria-hidden />
              <Input
                ref={inputRef}
                id="prior-art-query"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="e.g. campus lost and found"
                className="h-10 bg-ivory/60 pl-9"
                minLength={2}
                maxLength={200}
                required
              />
            </div>
          </Field>
          <Field label="Results" htmlFor="prior-art-limit">
            <select
              id="prior-art-limit"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="h-10 w-full rounded-md border border-input bg-ivory/60 px-3 text-sm text-forest"
            >
              {[5, 10, 20, 25].map((value) => (
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
          <p className="text-[0.65rem] text-muted-foreground">
            GitHub search is rate-limited for unauthenticated requests. If the limit is reached, try
            again later.
          </p>
        </div>
      )}

      {result.loading && (
        <div className="paper flex items-center gap-3 rounded-2xl px-5 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-forest/50" aria-hidden />
          Reading live public repository metadata…
        </div>
      )}

      {!query && !result.loading && (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            icon={Github}
            title="Search the public landscape"
            description="Use the problem and feature language from your project. Results are live and may change as repositories are updated."
          />
        </div>
      )}

      {query && !result.loading && !result.error && data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-forest">
                Showing {data.items.length} of {data.totalCount.toLocaleString()} public repositories
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                “{data.query}” · {data.provider} · {formatDate(new Date(data.checkedAt).getTime(), true)}
              </p>
            </div>
            <Tag tone="sage">Retrieval: {data.retrieval}</Tag>
          </div>

          {data.items.length === 0 ? (
            <div className="paper rounded-2xl p-6">
              <EmptyState
                icon={Search}
                title="No repositories returned"
                description="Try broader wording, remove a product name, or search for a feature instead of a solution."
              />
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((repo) => (
                <li key={repo.id} className="paper flex flex-col rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
                        {repo.owner}
                      </p>
                      <h2 className="font-display text-lg leading-tight text-forest">
                        <a href={repo.url} target="_blank" rel="noreferrer noopener" className="hover:underline">
                          {repo.name}
                        </a>
                      </h2>
                    </div>
                    <Tag tone="lavender">{repo.language}</Tag>
                  </div>

                  <p className="mt-2 line-clamp-3 text-[0.74rem] leading-5 text-charcoal/65">
                    {repo.description || "No description provided."}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {repo.topics.slice(0, 4).map((topic) => (
                      <Tag key={topic} tone="cream">{topic}</Tag>
                    ))}
                    {repo.topics.length === 0 && <Tag tone="cream">No topics</Tag>}
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-1.5 text-[0.65rem]">
                    <div className="flex items-center gap-1.5 rounded-lg bg-cream/50 px-2 py-1.5">
                      <Star className="size-3 text-forest/40" aria-hidden />
                      <div>
                        <dt className="sr-only">Stars</dt>
                        <dd className="tnum text-forest">{repo.stars?.toLocaleString() ?? "—"}</dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-cream/50 px-2 py-1.5">
                      <GitFork className="size-3 text-forest/40" aria-hidden />
                      <div>
                        <dt className="sr-only">Forks</dt>
                        <dd className="tnum text-forest">{repo.forks?.toLocaleString() ?? "—"}</dd>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 rounded-lg bg-cream/50 px-2 py-1.5">
                      <Scale className="size-3 text-forest/40" aria-hidden />
                      <div>
                        <dt className="sr-only">Licence</dt>
                        <dd className="text-forest">Licence: {repo.licence}</dd>
                      </div>
                    </div>
                  </dl>

                  <p className="mt-2 flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
                    <CalendarClock className="size-3" aria-hidden />
                    Updated {repo.lastUpdated ? formatDate(new Date(repo.lastUpdated).getTime()) : "date unavailable"}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                    <span className="truncate text-[0.58rem] text-muted-foreground" title={repo.url}>
                      {repo.url.replace("https://github.com/", "github.com/")}
                    </span>
                    <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full text-[0.65rem]">
                      <a href={repo.url} target="_blank" rel="noreferrer noopener">
                        Open <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <SectionCard title="Source limitations" icon={ShieldAlert}>
            <ul className="space-y-1.5 text-[0.72rem] leading-5 text-charcoal/70">
              {data.limitations.map((limitation) => (
                <li key={limitation} className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-peach-deep" aria-hidden />
                  {limitation}
                </li>
              ))}
              <li className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-peach-deep" aria-hidden />
                Stars and forks are popularity signals, not quality or originality measures.
              </li>
              <li className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-peach-deep" aria-hidden />
                BuildScope does not run code similarity or licence compatibility analysis in this view.
              </li>
            </ul>
          </SectionCard>
        </>
      )}
    </div>
  );
}
