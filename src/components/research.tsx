import type { Evidence, ProjectComparison, ResearchJob, SimilarProject } from "@/lib/api";
import { useJobPolling } from "@/hooks/use-resource";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  Github,
  Loader2,
  Quote,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { Tag } from "@/components/common";

const TERMINAL = new Set(["completed", "completed_with_errors", "failed"]);

export function JobStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    pending: { label: "Pending", className: "bg-cream text-forest/70", icon: Clock },
    running: { label: "Running", className: "bg-lavender/70 text-forest", icon: Loader2 },
    completed: { label: "Completed", className: "bg-sage/80 text-forest", icon: CheckCircle2 },
    completed_with_errors: { label: "Completed with errors", className: "bg-peach/70 text-forest", icon: AlertTriangle },
    failed: { label: "Failed", className: "bg-destructive/10 text-destructive", icon: XCircle },
  };
  const item = config[status] ?? config.pending;
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em]", item.className)}>
      <Icon className={cn("size-3", status === "running" && "animate-spin")} aria-hidden />
      {item.label}
    </span>
  );
}

export function ResearchJobMonitor({
  jobId,
  label,
  onTerminal,
}: {
  jobId: string | null;
  label: string;
  onTerminal?: (job: ResearchJob) => void;
}) {
  const { job, error, loading } = useJobPolling(jobId);

  useEffect(() => {
    if (job && TERMINAL.has(job.status)) onTerminal?.(job);
    // Only notify when the terminal job identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.status]);

  if (!jobId) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-cream/30 px-3 py-3 text-[0.7rem] leading-5 text-muted-foreground">
        No {label} job started in this session.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-3 text-[0.7rem] leading-5 text-destructive">
        Could not read job status: {error}
      </div>
    );
  }

  if (loading && !job) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-cream/30 px-3 py-3 text-[0.7rem] text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Reading job status…
      </div>
    );
  }

  if (!job) return null;

  const scope = job.scope ?? {};
  const counts = scope.counts ?? {};

  return (
    <div className="rounded-xl border border-border/70 bg-cream/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <JobStatusBadge status={job.status} />
          <span className="text-[0.62rem] text-muted-foreground">
            {job.kind} · started {job.started_at ? formatDate(new Date(job.started_at).getTime(), true) : "—"}
          </span>
        </div>
        <span className="text-[0.58rem] text-muted-foreground">Job {job.id.slice(0, 8)}</span>
      </div>

      {job.status === "running" && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-forest/70">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          {scope.stage ? `Stage: ${scope.stage}` : "The backend is working. Polling every few seconds."}
        </p>
      )}

      {job.error && (
        <p className="mt-2 rounded-lg bg-destructive/5 px-2.5 py-2 text-[0.68rem] leading-5 text-destructive">
          {job.error}
        </p>
      )}

      {job.log.length > 0 && (
        <div className="mt-2">
          <p className="label-caps text-forest/45">Warnings &amp; log</p>
          <ul className="mt-1 space-y-1 text-[0.64rem] leading-4 text-forest/65">
            {job.log.slice(-6).map((entry, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <TriangleAlert className="mt-0.5 size-3 shrink-0 text-peach-deep" aria-hidden />
                {typeof entry === "string" ? entry : (entry.message ?? JSON.stringify(entry))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(counts).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(counts).map(([key, value]) => (
            <Tag key={key} tone="cream">
              {key.replace(/_/g, " ")}: {String(value)}
            </Tag>
          ))}
        </div>
      )}

      {typeof scope.coverage_note === "string" && scope.coverage_note && (
        <p className="mt-2 text-[0.64rem] leading-4 text-forest/60">{scope.coverage_note}</p>
      )}

      {job.queries.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[0.64rem] text-forest/60">
            {job.queries.length} generated search quer{job.queries.length === 1 ? "y" : "ies"}
          </summary>
          <ul className="mt-1 space-y-0.5 text-[0.62rem] leading-4 text-muted-foreground">
            {job.queries.map((query) => (
              <li key={query}>· {query}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function EvidenceRow({ item }: { item: Evidence }) {
  return (
    <li className="rounded-xl border border-border/70 bg-cream/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-1 text-[0.72rem] font-medium text-forest">
            {item.source_title ?? "Untitled source"}
          </p>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-0.5 inline-flex items-center gap-1 text-[0.6rem] text-forest/55 hover:text-forest"
            >
              <ExternalLink className="size-2.5" aria-hidden /> {item.source_url}
            </a>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.06em]",
            item.relation === "contradicts" ? "bg-peach text-forest" : "bg-sage text-forest",
          )}>
            {item.relation}
          </span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.06em]",
            item.excerpt_verified ? "bg-sage/70 text-forest" : "bg-cream text-muted-foreground",
          )}>
            {item.excerpt_verified ? "excerpt verified" : "not verified"}
          </span>
        </div>
      </div>
      <blockquote className="mt-2 flex gap-1.5 border-l-2 border-gold/60 pl-2.5 text-[0.72rem] italic leading-5 text-charcoal/75">
        <Quote className="mt-0.5 size-3 shrink-0 text-gold" aria-hidden />
        {item.excerpt}
      </blockquote>
      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.58rem] text-muted-foreground">
        <span>Type: {item.evidence_type}</span>
        <span>Retrieved: {item.retrieved_at ? formatDate(new Date(item.retrieved_at).getTime(), true) : "date unavailable"}</span>
        {item.need_id && <span>Linked need: {item.need_id.slice(0, 8)}</span>}
      </p>
    </li>
  );
}

export function SimilarProjectCard({
  project,
  comparison,
}: {
  project: SimilarProject;
  comparison?: ProjectComparison;
}) {
  return (
    <li className="rounded-xl border border-border/70 bg-cream/25 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={project.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-forest hover:underline"
          >
            <Github className="size-3.5 shrink-0 text-forest/50" aria-hidden />
            {project.name}
          </a>
          <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-5 text-charcoal/65">
            {project.description ?? "No description retrieved."}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-[0.58rem] text-forest/55">
          relevance signal {Math.round(project.similarity_score * 100)}%
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {project.technology.slice(0, 5).map((tech) => (
          <Tag key={tech} tone="lavender">{tech}</Tag>
        ))}
        {project.target_users.slice(0, 3).map((user) => (
          <Tag key={user} tone="sage">{user}</Tag>
        ))}
      </div>

      {project.features.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[0.64rem] text-forest/60">
            {project.features.length} documented feature{project.features.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1 space-y-0.5 text-[0.64rem] leading-4 text-muted-foreground">
            {project.features.slice(0, 8).map((feature) => (
              <li key={feature}>· {feature}</li>
            ))}
          </ul>
        </details>
      )}

      {project.limitations.length > 0 && (
        <div className="mt-2 rounded-lg bg-peach/30 px-2.5 py-1.5">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-forest/60">Documented limitations</p>
          <ul className="mt-0.5 space-y-0.5 text-[0.64rem] leading-4 text-forest/70">
            {project.limitations.slice(0, 4).map((limitation) => (
              <li key={limitation}>· {limitation}</li>
            ))}
          </ul>
        </div>
      )}

      {project.supporting_excerpt && (
        <blockquote className="mt-2 border-l-2 border-gold/60 pl-2.5 text-[0.66rem] italic leading-4 text-charcoal/65">
          “{project.supporting_excerpt}”
          <span className="mt-0.5 block text-[0.55rem] not-italic text-muted-foreground">
            Excerpt {project.excerpt_verified ? "found in the retrieved source text" : "not verified in the source"}.
          </span>
        </blockquote>
      )}

      {comparison && (
        <div className="mt-3 rounded-lg border border-border/60 bg-card/60 p-2.5">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-forest/55">
            Recorded comparison
          </p>
          {comparison.shared_features.length > 0 && (
            <p className="mt-1 text-[0.64rem] leading-4 text-forest/70">
              <span className="font-medium text-forest">Shared:</span> {comparison.shared_features.join("; ")}
            </p>
          )}
          {comparison.differences.length > 0 && (
            <p className="mt-1 text-[0.64rem] leading-4 text-forest/70">
              <span className="font-medium text-forest">Differences:</span> {comparison.differences.join("; ")}
            </p>
          )}
          {comparison.possible_gaps.length > 0 && (
            <p className="mt-1 text-[0.64rem] leading-4 text-forest/70">
              <span className="font-medium text-forest">Possible gaps (hypotheses):</span> {comparison.possible_gaps.join("; ")}
            </p>
          )}
          {comparison.explanation && (
            <p className="mt-1 text-[0.64rem] leading-4 text-muted-foreground">{comparison.explanation}</p>
          )}
        </div>
      )}
    </li>
  );
}

export function ReadinessList({
  checks,
}: {
  checks: Array<{ key: string; label: string; status: string; detail: string }>;
}) {
  return (
    <ul className="space-y-2">
      {checks.map((check) => {
        const tone =
          check.status === "complete"
            ? "bg-sage/50"
            : check.status === "partial"
              ? "bg-gold/30"
              : check.status === "not_assessed"
                ? "bg-cream/70"
                : "bg-peach/40";
        return (
          <li key={check.key} className={cn("rounded-xl px-3 py-2.5", tone)}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.72rem] font-medium text-forest">{check.label}</p>
              <span className="flex shrink-0 items-center gap-1 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-forest/60">
                {check.status === "complete" ? (
                  <CheckCircle2 className="size-3" aria-hidden />
                ) : check.status === "partial" ? (
                  <CircleDot className="size-3" aria-hidden />
                ) : check.status === "not_assessed" ? (
                  <ShieldCheck className="size-3" aria-hidden />
                ) : (
                  <AlertTriangle className="size-3" aria-hidden />
                )}
                {check.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-[0.64rem] leading-4 text-forest/65">{check.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
