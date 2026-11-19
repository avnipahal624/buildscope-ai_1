import type { CredibilityResult } from "@/lib/credibility";
import { averageRank } from "@/lib/credibility";
import { formatDate } from "@/lib/format";
import { ExternalLink, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScoreRing, StatusPill } from "@/components/common";

export function CredibilityFindings({ result }: { result: CredibilityResult }) {
  const evidenceScore = averageRank(result.findings);
  const counts = result.findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.status] = (acc[finding.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-border/70 bg-cream/40 p-4">
        <ScoreRing value={evidenceScore} size={98} label="evidence" sublabel="not a verdict" />
        <div className="min-w-0 flex-1">
          <StatusPill status={result.overall} />
          <p className="mt-2 text-[0.8rem] leading-6 text-charcoal/70">{result.summary}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            <Info className="size-3" aria-hidden />
            {result.findings.length} checks · {counts.Verified ?? 0} verified · {counts["Not assessed"] ?? 0} not assessed
          </p>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={result.findings.slice(0, 3).map((f) => f.id)} className="space-y-2">
        {result.findings.map((finding) => (
          <AccordionItem
            key={finding.id}
            value={finding.id}
            className="rounded-xl border border-border/70 bg-card px-3"
          >
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-2 text-left">
                <span className="text-[0.8rem] font-medium text-forest">{finding.claim}</span>
                <StatusPill status={finding.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <p className="text-[0.75rem] leading-6 text-charcoal/70">{finding.explanation}</p>
              {finding.evidence && finding.evidence.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {finding.evidence.map((evidence) => (
                    <li key={evidence.label}>
                      {evidence.url ? (
                        <a
                          href={evidence.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-[0.7rem] text-forest underline decoration-forest/25 underline-offset-4 hover:decoration-forest"
                        >
                          {evidence.label}
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-[0.7rem] text-muted-foreground">{evidence.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {finding.limitations && (
                <p className="mt-2 rounded-lg bg-cream/70 px-2.5 py-1.5 text-[0.65rem] leading-5 text-forest/55">
                  Limitation: {finding.limitations}
                </p>
              )}
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground/70">
                Last checked {finding.checkedAt ? formatDate(finding.checkedAt, true) : "when this page was generated"}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
