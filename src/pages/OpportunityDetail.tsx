import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { matchOpportunity } from "@/lib/matching";
import { checkOpportunity } from "@/lib/credibility";
import { generateRoadmap } from "@/lib/roadmap";
import { formatDate, formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  CircleAlert,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wifi,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArchScene, CompassStar, Tilt } from "@/components/decor/Scenes";
import { MatchBreakdown } from "@/components/MatchBreakdown";
import {
  DataBadge,
  InfoNote,
  LoadingBlock,
  SectionCard,
  StatusPill,
  Tag,
  ToneIcon,
} from "@/components/common";
import { Button } from "@/components/ui/button";

export default function OpportunityDetail() {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const opportunities = useQuery(api.opportunities.list);
  const savedRows = useQuery(api.opportunities.saved);
  const roadmap = useQuery(api.roadmap.state);
  const toggleSave = useMutation(api.opportunities.toggleSave);
  const setTarget = useMutation(api.roadmap.setTarget);
  const addTasks = useMutation(api.roadmap.addTasks);

  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    setChecked([]);
  }, [opportunityId]);

  const opportunity = (opportunities ?? []).find((item) => item._id === opportunityId);
  const saved = (savedRows ?? []).some((row) => row.opportunity._id === opportunityId);

  const match = useMemo(
    () =>
      opportunity
        ? matchOpportunity(opportunity, {
            skills: user?.skills,
            domains: user?.domains,
            interests: user?.interests,
            academicYear: user?.academicYear,
            weeklyHours: user?.weeklyHours,
          })
        : null,
    [opportunity, user],
  );

  if (opportunities === undefined || savedRows === undefined) {
    return <LoadingBlock label="Opening opportunity" />;
  }

  if (!opportunity || !match) {
    return (
      <div className="paper rounded-2xl p-8 text-center">
        <p className="font-display text-2xl text-forest">Opportunity not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been removed from the demonstration catalogue.
        </p>
        <Button asChild className="mt-4 rounded-full bg-forest">
          <Link to="/radar">Back to the radar</Link>
        </Button>
      </div>
    );
  }

  const credibility = checkOpportunity(opportunity, []);
  const isActiveTarget = roadmap?.activeTarget?.referenceId === opportunity._id;

  const onToggleSave = async () => {
    setSaving(true);
    try {
      const result = await toggleSave({ opportunityId: opportunity._id });
      toast.success(result.saved ? "Saved to your shortlist." : "Removed from saved opportunities.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update saved opportunities.");
    } finally {
      setSaving(false);
    }
  };

  const buildRoadmap = async () => {
    if (isActiveTarget) {
      navigate("/roadmap");
      return;
    }
    setBuilding(true);
    try {
      const targetId = await setTarget({
        label: opportunity.name,
        type: "opportunity",
        referenceId: opportunity._id,
        requiredSkills: opportunity.skillsRequired,
      });
      const drafts = generateRoadmap(opportunity.skillsRequired, user?.skills);
      await addTasks({ targetId, tasks: drafts });
      toast.success(`${drafts.length} roadmap tasks created from this opportunity's skill gaps.`);
      navigate("/roadmap");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the roadmap.");
    } finally {
      setBuilding(false);
    }
  };

  const deadlinePassed = match.daysLeft < 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/radar" className="inline-flex items-center gap-1.5 text-xs text-forest/60 hover:text-forest">
          <ArrowLeft className="size-3.5" aria-hidden /> Back to radar
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onToggleSave()}
            disabled={saving}
            className="rounded-full border-forest/20 bg-card text-forest"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : saved ? (
              <BookmarkCheck className="size-3.5" aria-hidden />
            ) : (
              <Bookmark className="size-3.5" aria-hidden />
            )}
            {saved ? "Saved" : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void buildRoadmap()}
            disabled={building}
            className="rounded-full bg-forest"
          >
            {building ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Compass className="size-3.5" aria-hidden />}
            {isActiveTarget ? "Open roadmap" : "Build my roadmap"}
          </Button>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[26px] border border-border/70 bg-cream/55">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <DataBadge status={opportunity.dataStatus} />
              <span className="label-caps text-forest/45">{opportunity.domain}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl leading-tight text-forest sm:text-[2.6rem]">
              {opportunity.name}
            </h1>
            <p className="mt-1 text-sm text-forest/60">{opportunity.organiser}</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-charcoal/65">{opportunity.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag tone="sage"><Wifi className="mr-1 size-3" aria-hidden /> <span className="capitalize">{opportunity.format}</span></Tag>
              <Tag tone="cream"><MapPin className="mr-1 size-3" aria-hidden /> {opportunity.location}</Tag>
              {opportunity.prizeRange && <Tag tone="gold"><Trophy className="mr-1 size-3" aria-hidden /> {opportunity.prizeRange}</Tag>}
              <Tag tone="lavender"><Users className="mr-1 size-3" aria-hidden /> {opportunity.eligibility}</Tag>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-forest/65">
              <span className={cn("flex items-center gap-1.5", deadlinePassed && "text-destructive")}>
                <CalendarDays className="size-3.5" aria-hidden />
                Registration {deadlinePassed ? "closed" : "closes"} {formatDate(opportunity.registrationDeadline)}
                {!deadlinePassed && ` · ${match.daysLeft}d left`}
              </span>
              <span className="h-3 w-px bg-forest/15" aria-hidden />
              <span>Event {formatDay(opportunity.startDate)} – {formatDate(opportunity.endDate)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-full border-forest/20 bg-ivory/70 text-forest">
                <Link to={`/credibility?subject=opportunity&id=${opportunity._id}`}>
                  <ShieldCheck className="size-3.5" aria-hidden /> Run credibility check
                </Link>
              </Button>
              {opportunity.sourceUrl ? (
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer noopener">
                    Official source <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-[0.68rem] text-muted-foreground">
                  <CircleAlert className="size-3.5" aria-hidden /> Source unavailable
                </span>
              )}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <ArchScene className="absolute inset-0 h-full w-full rounded-none border-0" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <SectionCard title="Why this matches you" icon={Sparkles} eyebrow="Personalised matching">
            <MatchBreakdown match={match} />
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Eligibility" icon={Users}>
              <p className="text-sm leading-6 text-charcoal/70">{opportunity.eligibility}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag tone={match.eligible ? "sage" : "peach"}>
                  {match.eligible ? "Your year meets the minimum" : `Requires ${opportunity.minYear}`}
                </Tag>
                <Tag tone="cream">Your year: {user?.academicYear ?? "not set"}</Tag>
              </div>
              <p className="mt-2 text-[0.65rem] text-muted-foreground">
                Eligibility text comes from the demonstration record and is not independently verified.
              </p>
            </SectionCard>

            <SectionCard title="Required technologies" icon={Target}>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.skillsRequired.map((skill) => (
                  <Tag key={skill} tone={match.covered.includes(skill) ? "sage" : "peach"}>
                    {match.covered.includes(skill) && <Check className="mr-1 size-3" aria-hidden />}
                    {skill}
                  </Tag>
                ))}
              </div>
              <p className="mt-2 text-[0.65rem] leading-5 text-muted-foreground">
                Green means it is already on your profile. Peach skills become roadmap tasks when
                you build your plan.
              </p>
            </SectionCard>
          </div>

          <SectionCard title="Timeline" icon={CalendarDays}>
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
              {opportunity.timeline.map((item) => (
                <li key={`${item.date}-${item.label}`} className="relative flex items-start gap-3">
                  <span className="relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-[4px] border-card bg-forest/40" aria-hidden />
                  <div>
                    <p className="text-[0.78rem] text-forest">{item.label}</p>
                    <p className="tnum text-[0.65rem] text-muted-foreground">{formatDate(item.date)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[0.6rem] text-muted-foreground">
              Timeline generated from the demonstration record. Confirm every date on an official
              source before committing.
            </p>
          </SectionCard>

          <SectionCard title="Preparation checklist" icon={Check} eyebrow="Personal scratchpad">
            <ul className="space-y-1.5">
              {opportunity.preparationChecklist.map((item) => {
                const done = checked.includes(item);
                return (
                  <li key={item}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-[0.75rem] leading-5 transition-colors hover:bg-cream/50">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() =>
                          setChecked((current) =>
                            current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
                          )
                        }
                        className="mt-0.5 accent-[#183B2E]"
                      />
                      <span className={cn("text-charcoal/70", done && "text-muted-foreground line-through")}>{item}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 rounded-lg bg-cream/60 px-2.5 py-1.5 text-[0.62rem] leading-4 text-forest/55">
              {checked.length}/{opportunity.preparationChecklist.length} ticked. This checklist stays
              in this browser session; roadmap tasks are the durable version.
            </p>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <Tilt>
            <div className="paper rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="label-caps text-forest/45">Match</p>
              </div>
              <p className="tnum mt-1 font-display text-5xl leading-none text-forest">
                {match.score}%
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {match.covered.length} of {opportunity.skillsRequired.length} skills covered ·{" "}
                {match.gaps.length} gap{match.gaps.length === 1 ? "" : "s"}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest/10">
                <div className="h-full rounded-full bg-forest/60 transition-[width]" style={{ width: `${match.score}%` }} />
              </div>
              <Button
                type="button"
                onClick={() => void buildRoadmap()}
                disabled={building}
                className="mt-3 w-full rounded-full bg-forest"
              >
                {building ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Compass className="size-4" aria-hidden />}
                {isActiveTarget ? "Open my roadmap" : "Turn gaps into tasks"}
              </Button>
              <p className="mt-1.5 text-center text-[0.6rem] text-muted-foreground">
                Creates a roadmap target and prioritised tasks.
              </p>
            </div>
          </Tilt>

          <SectionCard title="Source & integrity" icon={ShieldCheck}>
            <div className="space-y-2 text-[0.72rem]">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Data status</span>
                <DataBadge status={opportunity.dataStatus} />
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Official source</span>
                <span className="text-right text-forest">
                  {opportunity.sourceUrl ? (
                    <a className="underline underline-offset-4" href={opportunity.sourceUrl} target="_blank" rel="noreferrer noopener">
                      Open
                    </a>
                  ) : (
                    "Not available"
                  )}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Last verified</span>
                <span className="tnum text-right text-forest">
                  {opportunity.lastVerified ? formatDate(opportunity.lastVerified) : "Never"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Overall evidence</span>
                <StatusPill status={credibility.overall} />
              </div>
            </div>
            <InfoNote tone="cream">
              {opportunity.notes ?? opportunity.sourceLabel}
            </InfoNote>
            <Button asChild variant="outline" size="sm" className="mt-2 w-full rounded-full text-xs">
              <Link to={`/credibility?subject=opportunity&id=${opportunity._id}`}>
                See all {credibility.findings.length} evidence checks
              </Link>
            </Button>
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl bg-forest p-5 text-ivory">
            <CompassStar className="size-7 text-gold" aria-hidden />
            <p className="mt-2 font-display text-xl leading-tight">Prepare, then apply.</p>
            <p className="mt-1 text-[0.7rem] leading-5 text-ivory/60">
              Use the roadmap to close the {match.gaps.length} skill gap{match.gaps.length === 1 ? "" : "s"},
              then run an evidence check on the project you build.
            </p>
            <Link to="/roadmap" className="mt-3 inline-flex items-center gap-1 text-[0.68rem] text-gold">
              Open skill roadmap <ArrowRight className="size-3" aria-hidden />
            </Link>
            <div className="pointer-events-none absolute -bottom-4 -right-4 size-24 rounded-full border border-gold/20" aria-hidden />
          </div>
        </aside>
      </div>
    </div>
  );
}
