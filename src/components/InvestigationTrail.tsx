import { Link } from "react-router";
import type { Evidence, ProjectReport, ProjectRequirement } from "@/lib/api";

type Stage = { label: string; count: number | null; href: string };

export function InvestigationTrail({
  projectId,
  report,
  evidence,
  requirements,
  failures,
}: {
  projectId: string;
  report: ProjectReport | null;
  evidence: Evidence[];
  requirements: ProjectRequirement[];
  failures: string[];
}) {
  const reportAvailable = report !== null;
  const stages: Stage[] = [
    { label: "Landscape", count: reportAvailable ? report.similar_projects.length : null, href: `/projects/${projectId}?tab=research` },
    { label: "Evidence", count: failures.some((item) => item.startsWith("evidence:")) ? null : evidence.length, href: `/projects/${projectId}?tab=evidence` },
    { label: "Stakeholders", count: reportAvailable ? report.stakeholders.length : null, href: `/projects/${projectId}?tab=evidence` },
    { label: "Opportunities", count: reportAvailable ? report.opportunities.length : null, href: `/projects/${projectId}?tab=overview` },
    { label: "Requirements", count: failures.some((item) => item.startsWith("requirements:")) ? null : requirements.length, href: `/projects/${projectId}?tab=requirements` },
  ];

  return (
    <div aria-label="Recorded investigation path">
      <p className="label-caps text-forest/60">Investigation path</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Dots show stored records, not validation or a readiness score.</p>
      <ol className="mt-5 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-5 sm:gap-x-0">
        {stages.map((stage, index) => (
          <li key={stage.label} className="relative min-w-0 sm:pr-2">
            {index < stages.length - 1 && <span aria-hidden className="absolute left-5 right-0 top-[10px] hidden h-px bg-forest/20 sm:block" />}
            <Link to={stage.href} className="group relative block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-forest">
              <span className={`relative z-10 grid size-5 place-items-center rounded-full border-2 border-forest/45 ${stage.count && stage.count > 0 ? "bg-forest" : stage.count === null ? "bg-lavender" : "bg-ivory"}`} aria-hidden>
                {stage.count && stage.count > 0 ? <span className="size-1.5 rounded-full bg-ivory" /> : null}
              </span>
              <span className="mt-2 block text-xs font-medium text-forest group-hover:underline">{stage.label}</span>
              <span className="mt-0.5 block text-[0.68rem] text-charcoal/65">{stage.count === null ? "Unavailable" : `${stage.count} recorded`}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
