import { Bookmark, BookmarkCheck, CalendarDays, MapPin, MoveUpRight, Wifi } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { formatDay } from "@/lib/format";
import type { MatchResult } from "@/lib/matching";
import type { Doc } from "@/convex/_generated/dataModel";
import { DataBadge, MatchBadge, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";

type Props = {
  opportunity: Doc<"opportunities">;
  match: MatchResult;
  saved: boolean;
  onToggleSave: () => void;
  view?: "grid" | "list";
};

export function OpportunityCard({ opportunity, match, saved, onToggleSave, view = "grid" }: Props) {
  const urgent = match.daysLeft >= 0 && match.daysLeft <= 7;

  return (
    <article
      className={cn(
        "group paper relative flex rounded-2xl transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-38px_rgba(16,44,35,0.5)]",
        view === "grid" ? "flex-col" : "flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5",
      )}
    >
      <button
        type="button"
        onClick={onToggleSave}
        aria-label={saved ? `Remove ${opportunity.name} from saved` : `Save ${opportunity.name}`}
        aria-pressed={saved}
        className={cn(
          "absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full border transition-colors",
          saved
            ? "border-forest bg-forest text-ivory"
            : "border-border bg-card/90 text-forest/50 hover:border-forest/30 hover:text-forest",
        )}
      >
        {saved ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
      </button>

      <div className={cn("flex flex-1 flex-col", view === "grid" ? "p-4 sm:p-5" : "")}>
        <div className="flex flex-wrap items-center gap-1.5 pr-8">
          <DataBadge status={opportunity.dataStatus} />
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
            {opportunity.domain}
          </span>
        </div>

        <h3 className="mt-2 font-display text-lg leading-snug text-forest">
          <Link
            to={`/radar/${opportunity._id}`}
            className="transition-colors hover:text-forest-soft focus-visible:outline-none"
          >
            {opportunity.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{opportunity.organiser}</p>
        <p className="mt-2 line-clamp-2 text-[0.78rem] leading-6 text-charcoal/65">
          {opportunity.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {opportunity.skillsRequired.slice(0, 4).map((skill) => (
            <Tag key={skill} tone={match.covered.includes(skill) ? "sage" : "peach"}>
              {skill}
            </Tag>
          ))}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-forest/40" aria-hidden />
            <div>
              <dt className="sr-only">Registration deadline</dt>
              <dd className={cn("tnum", urgent && "font-semibold text-destructive")}>
                {match.daysLeft < 0 ? "Closed" : formatDay(opportunity.registrationDeadline)}
                {urgent && match.daysLeft >= 0 ? ` · ${match.daysLeft}d` : ""}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {opportunity.format === "online" ? (
              <Wifi className="size-3.5 shrink-0 text-forest/40" aria-hidden />
            ) : (
              <MapPin className="size-3.5 shrink-0 text-forest/40" aria-hidden />
            )}
            <div>
              <dt className="sr-only">Format</dt>
              <dd className="capitalize">{opportunity.format}</dd>
            </div>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
          <div className="flex items-center gap-2">
            <MatchBadge score={match.score} />
            <span className="hidden text-[0.62rem] text-muted-foreground sm:inline">
              {match.gaps.length > 0 ? `${match.gaps.length} skill gap${match.gaps.length === 1 ? "" : "s"}` : "all skills covered"}
            </span>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-forest">
            <Link to={`/radar/${opportunity._id}`} aria-label={`View ${opportunity.name}`}>
              View <MoveUpRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
