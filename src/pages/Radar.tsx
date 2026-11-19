import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { matchOpportunity } from "@/lib/matching";
import { DOMAINS, SKILL_LIBRARY } from "@/lib/skills";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownWideNarrow,
  Bookmark,
  CalendarClock,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Radar as RadarIcon,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Chip,
  DataBadge,
  EmptyState,
  Field,
  InfoNote,
  LoadingBlock,
  PageHeader,
  Tag,
} from "@/components/common";
import { ArchScene } from "@/components/decor/Scenes";

const FORMATS = ["online", "offline", "hybrid"] as const;
const DEADLINE_WINDOWS = [
  { value: "any", label: "Any time" },
  { value: "14", label: "Next 14 days" },
  { value: "30", label: "Next 30 days" },
  { value: "90", label: "Next 90 days" },
] as const;

export default function Radar() {
  const { user } = useAuth();
  const opportunities = useQuery(api.opportunities.list);
  const savedRows = useQuery(api.opportunities.saved);
  const toggleSave = useMutation(api.opportunities.toggleSave);

  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [location, setLocation] = useState("all");
  const [deadlineWindow, setDeadlineWindow] = useState<string>("any");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [prizeOnly, setPrizeOnly] = useState(false);
  const [sort, setSort] = useState<"match" | "deadline" | "name">("match");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<string | null>(null);

  const savedIds = useMemo(
    () => new Set((savedRows ?? []).map((row) => row.opportunity._id)),
    [savedRows],
  );

  const profile = {
    skills: user?.skills,
    domains: user?.domains,
    interests: user?.interests,
    academicYear: user?.academicYear,
    weeklyHours: user?.weeklyHours,
  };

  const matches = useMemo(() => {
    return (opportunities ?? []).map((opportunity) => ({
      opportunity,
      match: matchOpportunity(opportunity, profile),
    }));
  }, [opportunities, user]);

  const locations = useMemo(() => {
    const set = new Set((opportunities ?? []).map((opportunity) => opportunity.location));
    return Array.from(set).sort();
  }, [opportunities]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return matches
      .filter(({ opportunity, match }) => {
        if (needle) {
          const haystack = `${opportunity.name} ${opportunity.organiser} ${opportunity.domain} ${opportunity.description} ${opportunity.skillsRequired.join(" ")}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        if (domains.length > 0 && !domains.includes(opportunity.domain)) return false;
        if (formats.length > 0 && !formats.includes(opportunity.format)) return false;
        if (location !== "all" && opportunity.location !== location) return false;
        if (technologies.length > 0) {
          const skills = opportunity.skillsRequired.map((skill) => skill.toLowerCase());
          if (!technologies.every((tech) => skills.includes(tech.toLowerCase()))) return false;
        }
        if (eligibleOnly && !match.eligible) return false;
        if (prizeOnly && !opportunity.prizeRange) return false;
        if (deadlineWindow !== "any") {
          const days = match.daysLeft;
          if (days < 0 || days > Number(deadlineWindow)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "match") return b.match.score - a.match.score;
        if (sort === "deadline") return a.opportunity.registrationDeadline - b.opportunity.registrationDeadline;
        return a.opportunity.name.localeCompare(b.opportunity.name);
      });
  }, [matches, query, domains, formats, location, technologies, eligibleOnly, prizeOnly, deadlineWindow, sort]);

  const activeFilterCount =
    domains.length +
    technologies.length +
    formats.length +
    (location !== "all" ? 1 : 0) +
    (deadlineWindow !== "any" ? 1 : 0) +
    (eligibleOnly ? 1 : 0) +
    (prizeOnly ? 1 : 0);

  const reset = () => {
    setDomains([]);
    setTechnologies([]);
    setFormats([]);
    setLocation("all");
    setDeadlineWindow("any");
    setEligibleOnly(false);
    setPrizeOnly(false);
    setQuery("");
  };

  const onToggleSave = async (id: string) => {
    setPendingSave(id);
    try {
      const result = await toggleSave({ opportunityId: id as never });
      toast.success(result.saved ? "Saved to your shortlist." : "Removed from saved opportunities.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update saved opportunities.");
    } finally {
      setPendingSave(null);
    }
  };

  if (opportunities === undefined || savedRows === undefined) {
    return <LoadingBlock label="Loading the demonstration catalogue" />;
  }

  const savedItems = savedRows.slice(0, 4);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Hackathon Radar"
        title={
          <>
            Opportunities worth
            <br />
            <span className="italic text-forest/60">your preparation time.</span>
          </>
        }
        description="Search the labelled demonstration catalogue, filter by what fits your life, and see exactly why each opportunity matches your profile."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
              <Trophy className="size-3.5 text-gold" aria-hidden />
              {filtered.length} of {matches.length} opportunities
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
              <Bookmark className="size-3.5 text-gold" aria-hidden />
              {savedIds.size} saved
            </span>
          </>
        }
        aside={<ArchScene className="hidden h-[150px] w-[230px] rounded-2xl lg:block" />}
      />

      <InfoNote tone="peach">
        <span>
          <strong className="font-semibold">Demonstration catalogue.</strong> Every record here is
          fabricated and labelled “Demo data”. BuildScope does not invent real hackathons, prizes or
          official links. Each detail page shows what could and could not be verified.
        </span>
      </InfoNote>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="paper rounded-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-forest">
                <SlidersHorizontal className="size-4" aria-hidden /> Filters
              </p>
              <div className="flex items-center gap-1">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-forest"
                  >
                    <RotateCcw className="size-3" aria-hidden /> Reset
                  </button>
                )}
                <button
                  type="button"
                  className="lg:hidden"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                >
                  <Filter className="size-4 text-forest/60" aria-hidden />
                  <span className="sr-only">Toggle filters</span>
                </button>
              </div>
            </div>

            <div className={cn("space-y-4 p-4", !filtersOpen && "hidden lg:block")}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the radar"
                  aria-label="Search opportunities"
                  className="h-9 bg-ivory/60 pl-8 text-xs"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-forest"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>

              <div>
                <p className="label-caps mb-1.5 text-forest/45">Domain</p>
                <div className="flex flex-wrap gap-1">
                  {DOMAINS.map((domain) => (
                    <Chip
                      key={domain}
                      active={domains.includes(domain)}
                      onClick={() =>
                        setDomains((current) =>
                          current.includes(domain) ? current.filter((d) => d !== domain) : [...current, domain],
                        )
                      }
                      className="text-[0.62rem]"
                    >
                      {domain}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="label-caps mb-1.5 text-forest/45">Technology</p>
                <div className="flex flex-wrap gap-1">
                  {SKILL_LIBRARY.slice(0, 12).map((skill) => (
                    <Chip
                      key={skill.name}
                      active={technologies.includes(skill.name)}
                      onClick={() =>
                        setTechnologies((current) =>
                          current.includes(skill.name)
                            ? current.filter((item) => item !== skill.name)
                            : [...current, skill.name],
                        )
                      }
                      className="text-[0.62rem]"
                    >
                      {skill.name}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="label-caps mb-1.5 text-forest/45">Format</p>
                <div className="flex flex-wrap gap-1">
                  {FORMATS.map((format) => (
                    <Chip
                      key={format}
                      active={formats.includes(format)}
                      onClick={() =>
                        setFormats((current) =>
                          current.includes(format) ? current.filter((f) => f !== format) : [...current, format],
                        )
                      }
                      className="text-[0.62rem] capitalize"
                    >
                      {format}
                    </Chip>
                  ))}
                </div>
              </div>

              <Field label="Location" htmlFor="location-filter">
                <select
                  id="location-filter"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-ivory/60 px-2 text-xs text-forest"
                >
                  <option value="all">Anywhere</option>
                  {locations.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>

              <Field label="Registration deadline" htmlFor="deadline-filter">
                <select
                  id="deadline-filter"
                  value={deadlineWindow}
                  onChange={(event) => setDeadlineWindow(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-ivory/60 px-2 text-xs text-forest"
                >
                  {DEADLINE_WINDOWS.map((window) => (
                    <option key={window.value} value={window.value}>{window.label}</option>
                  ))}
                </select>
              </Field>

              <div className="space-y-1.5">
                <p className="label-caps text-forest/45">Eligibility &amp; prize</p>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-[0.7rem] text-forest/75">
                  <input
                    type="checkbox"
                    checked={eligibleOnly}
                    onChange={(event) => setEligibleOnly(event.target.checked)}
                    className="accent-[#183B2E]"
                  />
                  Eligible for my academic year
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-[0.7rem] text-forest/75">
                  <input
                    type="checkbox"
                    checked={prizeOnly}
                    onChange={(event) => setPrizeOnly(event.target.checked)}
                    className="accent-[#183B2E]"
                  />
                  Prize information listed
                </label>
              </div>

              <div className="rounded-lg bg-cream/70 px-2.5 py-2 text-[0.62rem] leading-4 text-forest/55">
                Matching uses your profile: skills, domains, year and {user?.weeklyHours ?? 5}h/week
                of preparation time.
              </div>
            </div>
          </div>

          {savedItems.length > 0 && (
            <div className="paper mt-3 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-base text-forest">Saved shortlist</p>
                <Link to="/saved" className="text-[0.65rem] text-forest/60 hover:text-forest">View all</Link>
              </div>
              <ul className="mt-2 space-y-2">
                {savedItems.map(({ opportunity }) => (
                  <li key={opportunity._id} className="flex items-start gap-2">
                    <Bookmark className="mt-0.5 size-3 shrink-0 text-gold" aria-hidden />
                    <div className="min-w-0">
                      <Link to={`/radar/${opportunity._id}`} className="line-clamp-1 text-[0.7rem] text-forest hover:underline">
                        {opportunity.name}
                      </Link>
                      <p className="text-[0.58rem] text-muted-foreground">
                        closes {formatDay(opportunity.registrationDeadline)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Results */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ArrowDownWideNarrow className="size-3.5" aria-hidden />
                <label htmlFor="sort" className="sr-only">Sort by</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className="rounded-full border border-border bg-card px-2.5 py-1.5 text-[0.7rem] text-forest"
                >
                  <option value="match">Best match</option>
                  <option value="deadline">Closing soonest</option>
                  <option value="name">Name A–Z</option>
                </select>
              </span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-cream px-2 py-1 text-[0.65rem]">
                  {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
                </span>
              )}
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[0.68rem] lg:hidden"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <Filter className="size-3.5" aria-hidden /> Filters
              </button>
            </div>
            <div className="flex items-center rounded-full border border-border bg-card p-0.5">
              {[
                { value: "grid" as const, icon: LayoutGrid, label: "Grid view" },
                { value: "list" as const, icon: List, label: "List view" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={view === option.value}
                  onClick={() => setView(option.value)}
                  className={cn(
                    "grid size-7 place-items-center rounded-full transition-colors",
                    view === option.value ? "bg-forest text-ivory" : "text-forest/50 hover:text-forest",
                  )}
                >
                  <option.icon className="size-3.5" aria-hidden />
                </button>
              ))}
            </div>
          </div>

          {pendingSave && (
            <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" aria-hidden /> Updating saved opportunities…
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="paper rounded-2xl p-6">
              <EmptyState
                icon={RadarIcon}
                title="No opportunities match those filters"
                description="Try widening the deadline window, removing a technology, or clearing your search."
                action={
                  <Button variant="outline" size="sm" onClick={reset} className="rounded-full">
                    <RotateCcw className="size-3.5" aria-hidden /> Reset filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className={cn("grid gap-3", view === "grid" && "sm:grid-cols-2 2xl:grid-cols-3")}>
              {filtered.map(({ opportunity, match }) => (
                <OpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  match={match}
                  saved={savedIds.has(opportunity._id)}
                  onToggleSave={() => void onToggleSave(opportunity._id)}
                  view={view}
                />
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-cream/40 px-3 py-2 text-[0.65rem] text-forest/55">
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            Eligibility and deadlines here are unverified demonstration data.
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3" aria-hidden /> {formatDay(Date.now())} view
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" aria-hidden /> Location filters use record text
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
