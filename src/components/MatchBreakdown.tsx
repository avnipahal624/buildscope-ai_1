import type { MatchResult } from "@/lib/matching";
import { Check, Info, TriangleAlert } from "lucide-react";
import { ScoreRing, Tag } from "@/components/common";

export function MatchBreakdown({ match, compact = false }: { match: MatchResult; compact?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5">
        <ScoreRing
          value={match.score}
          size={compact ? 96 : 116}
          label="match"
          sublabel={match.eligible ? "eligible" : "check eligibility"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-forest">
            {match.score >= 75 ? "Strong match" : match.score >= 50 ? "Reasonable match" : "Stretch opportunity"}
          </p>
          <p className="mt-1 text-[0.72rem] leading-5 text-muted-foreground">
            {match.covered.length} of {match.covered.length + match.gaps.length} required skills on your profile.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {match.covered.map((skill) => (
              <Tag key={skill} tone="sage">
                <Check className="mr-1 size-3" aria-hidden /> {skill}
              </Tag>
            ))}
            {match.gaps.map((skill) => (
              <Tag key={skill} tone="peach">
                {skill}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {match.reasons.map((reason) => (
          <li key={reason} className="flex gap-2 text-[0.75rem] leading-5 text-charcoal/70">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-forest/40" aria-hidden />
            {reason}
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-border/70 bg-cream/40 p-3">
        <p className="label-caps mb-2 flex items-center gap-1.5 text-forest/50">
          <Info className="size-3" aria-hidden /> Score breakdown
        </p>
        <ul className="space-y-2">
          {match.breakdown.map((item) => (
            <li key={item.label} className="text-[0.7rem]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-forest/75">{item.label}</span>
                <span className="tnum text-forest">
                  {item.points}/{item.max}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-forest/10">
                <div
                  className="h-full rounded-full bg-forest/60"
                  style={{ width: `${Math.round((item.points / item.max) * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[0.62rem] text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-[0.62rem] leading-4 text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
          Fixed formula: skills 60 · domain 20 · eligibility 15 · preparation time 5. Only the factors above are used.
        </p>
      </div>
    </div>
  );
}
