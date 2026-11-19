import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { matchOpportunity } from "@/lib/matching";
import { formatDate } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { Bookmark, CalendarClock, Clock, Radar, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  SectionCard,
  Tag,
} from "@/components/common";
import { CompassStar } from "@/components/decor/Scenes";

export default function Saved() {
  const { user } = useAuth();
  const savedRows = useQuery(api.opportunities.saved);
  const toggleSave = useMutation(api.opportunities.toggleSave);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"deadline" | "saved" | "match">("deadline");

  const items = useMemo(() => {
    const profile = {
      skills: user?.skills,
      domains: user?.domains,
      interests: user?.interests,
      academicYear: user?.academicYear,
      weeklyHours: user?.weeklyHours,
    };
    return (savedRows ?? [])
      .map((row) => ({
        ...row,
        match: matchOpportunity(row.opportunity, profile),
      }))
      .filter(({ opportunity }) => {
        if (!query.trim()) return true;
        const needle = query.trim().toLowerCase();
        return `${opportunity.name} ${opportunity.organiser} ${opportunity.domain} ${opportunity.skillsRequired.join(" ")}`
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        if (sort === "match") return b.match.score - a.match.score;
        if (sort === "saved") return b.saved.createdAt - a.saved.createdAt;
        return a.opportunity.registrationDeadline - b.opportunity.registrationDeadline;
      });
  }, [savedRows, query, sort, user]);

  if (savedRows === undefined) return <LoadingBlock label="Opening your shortlist" />;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Saved Opportunities"
        title={
          <>
            A shortlist with
            <br />
            <span className="italic text-forest/60">real deadlines.</span>
          </>
        }
        description="Opportunities you saved from the radar, ordered by the dates in their records. Remove anything that no longer fits."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
              <Bookmark className="size-3.5 text-gold" aria-hidden />
              {savedRows.length} saved
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-forest/70">
              <Clock className="size-3.5 text-gold" aria-hidden />
              Demo catalogue dates
            </span>
          </>
        }
        aside={<CompassStar className="hidden size-20 text-forest/15 lg:block" />}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved opportunities"
            aria-label="Search saved opportunities"
            className="h-9 bg-card pl-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-3.5 text-forest/40" aria-hidden />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            aria-label="Sort saved opportunities"
            className="rounded-full border border-border bg-card px-2.5 py-1.5 text-[0.7rem] text-forest"
          >
            <option value="deadline">Closing soonest</option>
            <option value="match">Best match</option>
            <option value="saved">Recently saved</option>
          </select>
        </div>
      </div>

      {savedRows.length === 0 ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            icon={Radar}
            title="Nothing saved yet"
            description="Save an opportunity from the radar to keep its deadline, skills and match reasoning together."
            action={
              <Button asChild size="sm" className="rounded-full bg-forest">
                <Link to="/radar">Browse the radar</Link>
              </Button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="paper rounded-2xl p-6">
          <EmptyState
            icon={Search}
            title="No saved opportunity matches"
            description="Try a different search phrase."
            action={<Button size="sm" variant="outline" onClick={() => setQuery("")}>Clear search</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ saved, opportunity, match }) => (
            <div key={saved._id} className="relative">
              <OpportunityCard
                opportunity={opportunity}
                match={match}
                saved
                onToggleSave={async () => {
                  try {
                    await toggleSave({ opportunityId: opportunity._id });
                    toast.success("Removed from saved opportunities.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not remove it.");
                  }
                }}
              />
              <p className="mt-1 px-1 text-[0.58rem] text-muted-foreground">
                Saved {formatDate(saved.createdAt)} · close {formatDate(opportunity.registrationDeadline)}
              </p>
            </div>
          ))}
        </div>
      )}

      <SectionCard title="Deadline discipline" icon={CalendarClock}>
        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-forest/65">
          <Tag tone="peach">7 days or less</Tag>
          <Tag tone="gold">8–21 days</Tag>
          <Tag tone="sage">More than 21 days</Tag>
          <span className="text-muted-foreground">
            Urgency comes from each record's registration deadline. Verify it before applying —
            these are labelled demonstration records.
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
