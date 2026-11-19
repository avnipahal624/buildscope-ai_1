import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { RepoReport } from "@/lib/github-types";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import {
  BookMarked,
  Boxes,
  Check,
  CircleDot,
  ExternalLink,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  Github,
  Info,
  Loader2,
  Lock,
  Package,
  ScanSearch,
  Scale,
  ShieldQuestion,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNote, Field, InfoNote, SectionCard, StatusPill, Tag, ToneIcon } from "@/components/common";

const GITHUB_URL = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Github }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
        <Icon className="size-3" aria-hidden />
        {label}
      </div>
      <p className="tnum mt-1 font-display text-lg leading-none text-forest">{value}</p>
    </div>
  );
}

function NotAssessed({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-cream/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.78rem] font-medium text-forest">{title}</p>
        <StatusPill status="Not assessed" />
      </div>
      <p className="mt-1.5 text-[0.68rem] leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}

function Provenance({ report }: { report: RepoReport }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg bg-lavender/40 px-3 py-2">
        <Info className="mt-0.5 size-3.5 shrink-0 text-forest/60" aria-hidden />
        <p className="text-[0.68rem] leading-5 text-forest/70">
          Similarity is context, not a verdict. BuildScope never calls a project stolen based on
          similarity, and never displays a score for a method it has not implemented.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="label-caps text-forest/50">Concept similarity</p>
          <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">
            Description &amp; topic token overlap with related public repositories.
          </p>
          <p className="tnum mt-2 font-display text-xl text-forest">
            {report.related.length > 0 ? `${report.related[0].conceptSimilarity}%` : "—"}
          </p>
          <p className="text-[0.6rem] text-muted-foreground">highest candidate · wording only</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="label-caps text-forest/50">File-level exact matches</p>
          <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">
            Identical git blob SHA-1 fingerprints among up to three candidates.
          </p>
          <p className="tnum mt-2 font-display text-xl text-forest">
            {report.treeAvailable
              ? report.related.reduce((sum, item) => sum + item.sharedBlobFiles, 0)
              : "—"}
          </p>
          <p className="text-[0.6rem] text-muted-foreground">
            {report.treeAvailable ? "shared files detected" : "not assessed"}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="label-caps text-forest/50">Repository ancestry</p>
          <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">
            Fork relationships reported by GitHub, including visible parent chain.
          </p>
          <p className="mt-2 text-[0.78rem] font-medium text-forest">
            {report.isFork ? "Fork detected" : "No fork relationship"}
          </p>
          <p className="truncate text-[0.6rem] text-muted-foreground">
            {report.parent ?? "GitHub reports no parent"}
          </p>
        </div>
      </div>

      {report.related.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[620px] text-left text-[0.72rem]">
            <thead className="bg-cream/60 text-[0.6rem] uppercase tracking-[0.08em] text-forest/50">
              <tr>
                <th className="px-3 py-2 font-semibold">Related repository</th>
                <th className="px-3 py-2 font-semibold">Concept</th>
                <th className="px-3 py-2 font-semibold">Exact files</th>
                <th className="px-3 py-2 font-semibold">Licence</th>
                <th className="px-3 py-2 font-semibold">Fork</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {report.related.map((item) => (
                <tr key={item.fullName} className="align-top">
                  <td className="px-3 py-2.5">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-forest underline decoration-forest/20 underline-offset-4 hover:decoration-forest"
                    >
                      {item.fullName}
                    </a>
                    <p className="mt-0.5 line-clamp-1 max-w-[230px] text-[0.62rem] text-muted-foreground">
                      {item.description ?? "No description"}
                    </p>
                    {item.sharedFilePaths.length > 0 && (
                      <p className="mt-1 text-[0.6rem] text-muted-foreground">
                        e.g. {item.sharedFilePaths.slice(0, 3).join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="tnum px-3 py-2.5">{item.conceptSimilarity}%</td>
                  <td className="tnum px-3 py-2.5">
                    {item.candidateTreeRead ? item.sharedBlobFiles : "n/a"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block">{item.license ?? "Not detected"}</span>
                    <span className="text-[0.6rem] text-muted-foreground">
                      {item.licenceComparison === "unknown"
                        ? "needs review"
                        : item.licenceComparison === "same"
                          ? "same identifier"
                          : "different identifier"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[0.65rem]">{item.candidateIsFork ? "Fork" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[0.72rem] text-muted-foreground">
          No related public repositories were returned for this description, so concept and
          file-level matching are not assessed.
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <NotAssessed
          title="Normalised code similarity"
          body="Not implemented in this MVP. Formatting-insensitive comparison is not claimed."
        />
        <NotAssessed
          title="AST structural similarity"
          body="Not implemented in this MVP. No structural similarity score is displayed."
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-3">
        <p className="flex items-center gap-1.5 text-[0.78rem] font-medium text-forest">
          <Scale className="size-3.5" aria-hidden /> Licence &amp; attribution checks
        </p>
        <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">
          This repository: <span className="text-forest">{report.license ?? "no detected licence"}</span>.
          Compare identifiers per candidate above. A different licence is not a violation on its
          own; a human must read both licence texts and the attribution requirements.
        </p>
      </div>
    </div>
  );
}

export function RepoAnalysis({
  projectId,
  initialUrl = "",
  onSaved,
}: {
  projectId?: Id<"projects">;
  initialUrl?: string;
  onSaved?: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<RepoReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analyze = useAction(api.github.analyzeRepo);
  const saveCheck = useMutation(api.projects.saveRepoCheck);
  const addLibraryItem = useMutation(api.workspace.addLibraryItem);

  const run = async () => {
    const trimmed = url.trim();
    if (!GITHUB_URL.test(trimmed)) {
      setError("Use a public repository URL like https://github.com/owner/repo.");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const result = await analyze({ repoUrl: trimmed });
      if (result.status === "verified") {
        setReport(result.report);
        await saveCheck({
          projectId,
          repoUrl: result.repoUrl,
          owner: result.owner,
          repoName: result.repoName,
          status: "verified",
          report: result.report,
        });
        toast.success("Repository evidence collected from GitHub.");
      } else {
        setReport(null);
        setError(result.error);
        await saveCheck({
          projectId,
          repoUrl: result.repoUrl,
          owner: result.owner || "unknown",
          repoName: result.repoName || "unknown",
          status: "unavailable",
          report: null,
          error: result.error,
        });
        toast.error("Repository could not be verified. The attempt was recorded.");
      }
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Repository analysis failed.");
    } finally {
      setRunning(false);
    }
  };

  const saveToLibrary = async () => {
    if (!report) return;
    const markdown = [
      `# Repository report — ${report.owner}/${report.name}`,
      "",
      report.repoUrl,
      `Checked ${formatDate(report.checkedAt, true)} via the GitHub REST API.`,
      "",
      "## Repository signals",
      `- Description: ${report.description ?? "none"}`,
      `- Stars: ${report.stars} · forks: ${report.forks} · open issues: ${report.openIssues}`,
      `- Commits sampled: ${report.commitSampleSize} (about ${report.commitsPerWeek}/week over eight weeks)`,
      `- Branches: ${report.branchCount} · releases: ${report.releases}`,
      `- Licence: ${report.license ?? "not detected"}`,
      `- README: ${report.treeAvailable ? (report.readmePresent ? report.readmePath : "not found") : "not assessed"}`,
      `- Files fingerprinted: ${report.treeAvailable ? report.fileCount : "not assessed"}`,
      `- Workflow files: ${report.treeAvailable ? (report.hasWorkflows ? report.workflowFiles.length : 0) : "not assessed"}`,
      "",
      "## Provenance (separate concepts)",
      `- Fork relationship: ${report.isFork ? `fork of ${report.parent ?? "unknown"}` : "none reported"}`,
      `- Related public repositories assessed: ${report.related.length}`,
      ...report.related.map(
        (item) =>
          `- ${item.fullName}: concept overlap ${item.conceptSimilarity}%, exact file fingerprints ${item.candidateTreeRead ? item.sharedBlobFiles : "not assessed"}, licence ${item.license ?? "not detected"} (${item.licenceComparison})`,
      ),
      "- Normalised code similarity: Not assessed (not implemented)",
      "- AST structural similarity: Not assessed (not implemented)",
      "",
      "## Limitations",
      ...report.limitations.map((limitation) => `- ${limitation}`),
      "",
      "_Similarity is context, not a verdict. BuildScope does not call a repository stolen._",
    ].join("\n");
    try {
      await addLibraryItem({
        title: `Repository report — ${report.owner}/${report.name}`,
        description: `${report.commitSampleSize} commits sampled · ${report.treeAvailable ? `${report.fileCount} files fingerprinted` : "file tree not read"} · ${report.related.length} related repositories`,
        kind: "repo-report",
        url: report.repoUrl,
        payload: {
          markdown,
          owner: report.owner,
          name: report.name,
          stars: report.stars,
          license: report.license,
          checkedAt: report.checkedAt,
          relatedCount: report.related.length,
        },
      });
      toast.success("Repository report saved to your library.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the report.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-cream/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToneIcon icon={Github} tone="forest" className="size-9" />
          <div>
            <p className="text-sm font-semibold text-forest">GitHub repository check</p>
            <p className="text-[0.68rem] text-muted-foreground">
              Read-only. Public repositories only. Live GitHub REST API calls.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Field label="Public repository URL" htmlFor="repo-url">
              <Input
                id="repo-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void run();
                  }
                }}
                className="bg-card"
              />
            </Field>
          </div>
          <Button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="mt-auto h-9 shrink-0 rounded-full bg-forest px-4"
          >
            {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ScanSearch className="size-4" aria-hidden />}
            {running ? "Reading GitHub" : "Analyse repository"}
          </Button>
        </div>
        {error && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
        {running && (
          <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Reading metadata, commits, tree fingerprints and related repositories…
          </p>
        )}
        {!report && !running && (
          <p className="mt-2 flex items-start gap-1.5 text-[0.65rem] leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
            Unauthenticated GitHub allows roughly 60 requests/hour per IP. If the limit is hit,
            BuildScope reports it instead of showing cached or invented data.
          </p>
        )}
      </div>

      {report && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-sage-deep/60 bg-sage/30 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-display text-xl text-forest">
                  {report.owner}/{report.name}
                </p>
                <Tag tone="sage">
                  <Check className="mr-1 size-3" aria-hidden /> Verified on GitHub
                </Tag>
                {report.isFork && <Tag tone="lavender">Fork</Tag>}
              </div>
              <p className="mt-1 max-w-xl text-[0.75rem] leading-5 text-charcoal/65">
                {report.description ?? "No repository description."}
              </p>
              <p className="mt-1 text-[0.62rem] text-muted-foreground">
                Checked {formatDate(report.checkedAt, true)} · {report.visibility} · default branch{" "}
                {report.defaultBranch}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href={report.repoUrl} target="_blank" rel="noreferrer noopener">
                  Open on GitHub <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
              <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void saveToLibrary()}>
                <BookMarked className="size-3.5" aria-hidden /> Save report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Metric label="Stars" value={report.stars} icon={Sparkles} />
            <Metric label="Forks" value={report.forks} icon={GitBranch} />
            <Metric label="Commits sampled" value={report.commitSampleSize} icon={GitCommitHorizontal} />
            <Metric label="Commits / week" value={report.commitsPerWeek} icon={GitCommitHorizontal} />
            <Metric label="Files fingerprinted" value={report.treeAvailable ? report.fileCount : "—"} icon={FileCode2} />
            <Metric label="Branches" value={report.branchCount} icon={GitBranch} />
            <Metric label="Releases" value={report.releases} icon={Package} />
            <Metric label="Open issues" value={report.openIssues} icon={CircleDot} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard title="Recent commits" icon={GitCommitHorizontal} bodyClassName="pt-0">
              {report.recentCommits.length === 0 ? (
                <p className="text-[0.72rem] text-muted-foreground">No commits returned.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {report.recentCommits.slice(0, 6).map((commit) => (
                    <li key={commit.sha} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[0.75rem] text-forest">{commit.message || "No message"}</p>
                        <p className="text-[0.62rem] text-muted-foreground">
                          {commit.sha} · {commit.author ?? "unknown"} · {relativeTime(new Date(commit.date).getTime())}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[0.6rem] text-muted-foreground">
                Latest {report.commitSampleSize} commits on {report.defaultBranch}. Commit presence
                shows activity, not authorship or quality.
              </p>
            </SectionCard>

            <SectionCard title="Languages & dependencies" icon={Boxes} bodyClassName="pt-0">
              <div className="space-y-1.5">
                {report.languages.length === 0 && (
                  <p className="text-[0.72rem] text-muted-foreground">No language data returned.</p>
                )}
                {report.languages.slice(0, 4).map((language) => {
                  const total = report.languages.reduce((sum, item) => sum + item.bytes, 0) || 1;
                  return (
                    <div key={language.language}>
                      <div className="flex justify-between text-[0.68rem] text-forest/80">
                        <span>{language.language}</span>
                        <span className="tnum">{Math.round((language.bytes / total) * 100)}%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-forest/10">
                        <div
                          className="h-full rounded-full bg-forest/50"
                          style={{ width: `${Math.max(2, Math.round((language.bytes / total) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 label-caps text-forest/45">Dependencies read from package.json</p>
              {report.dependencies.length === 0 ? (
                <p className="mt-1 text-[0.7rem] text-muted-foreground">Not available or no package.json.</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {report.dependencies.slice(0, 12).map((dependency) => (
                    <Tag key={dependency.name}>
                      {dependency.name} <span className="ml-1 text-muted-foreground">{dependency.version}</span>
                    </Tag>
                  ))}
                  {report.dependencies.length > 12 && (
                    <Tag>+{report.dependencies.length - 12} more</Tag>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Repository structure & signals" icon={FileCode2} bodyClassName="pt-0">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "README", value: !report.treeAvailable ? "Not assessed" : report.readmePresent ? report.readmePath ?? "Present" : "Not found", ok: report.readmePresent },
                { label: "Licence", value: report.license ?? "Not detected", ok: Boolean(report.license) },
                { label: "Workflows", value: !report.treeAvailable ? "Not assessed" : report.hasWorkflows ? `${report.workflowFiles.length} file(s)` : "None found", ok: report.hasWorkflows },
                { label: "Latest release", value: report.latestRelease ?? "None", ok: Boolean(report.latestRelease) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border/70 bg-cream/30 px-3 py-2">
                  <p className="label-caps text-forest/45">{item.label}</p>
                  <p className={cn("mt-1 truncate text-[0.72rem]", item.ok ? "text-forest" : "text-muted-foreground")}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="label-caps mb-1 text-forest/45">Root structure (first 20 entries)</p>
                {!report.treeAvailable ? (
                  <p className="rounded-lg bg-cream/30 p-2 text-[0.68rem] text-muted-foreground">
                    File tree not read — structure is not assessed.
                  </p>
                ) : (
                  <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg bg-cream/30 p-2 font-mono text-[0.65rem] text-forest/70">
                    {report.structure.slice(0, 20).map((entry) => (
                      <li key={entry.path}>{entry.type === "tree" ? "▸ " : "· "}{entry.path}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="label-caps mb-1 text-forest/45">Workflow files</p>
                {report.workflowFiles.length === 0 ? (
                  <p className="rounded-lg bg-cream/30 p-2 text-[0.68rem] text-muted-foreground">
                    No .github/workflows files found. CI status is not assessed.
                  </p>
                ) : (
                  <ul className="space-y-1 rounded-lg bg-cream/30 p-2 text-[0.65rem] text-forest/70">
                    {report.workflowFiles.map((file) => (
                      <li key={file} className="flex items-center gap-1.5">
                        <Workflow className="size-3" aria-hidden /> {file}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 flex items-start gap-1.5 text-[0.62rem] leading-4 text-muted-foreground">
                  <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
                  BuildScope never writes to GitHub and cannot see private activity.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Repository provenance" icon={ShieldQuestion} eyebrow="Similarity and ancestry">
            <Provenance report={report} />
          </SectionCard>

          <div className="rounded-xl border border-border/70 bg-cream/40 p-3">
            <p className="label-caps mb-1.5 flex items-center gap-1.5 text-forest/50">
              <Info className="size-3" aria-hidden /> Limitations of this check
            </p>
            <ul className="space-y-1">
              {report.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-1.5 text-[0.68rem] leading-5 text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-forest/30" aria-hidden />
                  {limitation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
