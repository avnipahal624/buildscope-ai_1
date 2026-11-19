import { formatDate } from "./format";
import type { RepoReport } from "./github-types";

export type EvidenceStatus =
  | "Verified"
  | "Evidence found"
  | "Needs review"
  | "Not assessed"
  | "Unable to verify";

export type Finding = {
  id: string;
  claim: string;
  status: EvidenceStatus;
  explanation: string;
  evidence?: { label: string; url?: string }[];
  limitations?: string;
  checkedAt?: number;
};

export type CredibilityResult = {
  subject: string;
  subjectType: "opportunity" | "project" | "repository";
  subjectId: string;
  overall: EvidenceStatus;
  findings: Finding[];
  summary: string;
};

const RANK: Record<EvidenceStatus, number> = {
  Verified: 3,
  "Evidence found": 2,
  "Needs review": 1,
  "Not assessed": 0,
  "Unable to verify": -1,
};

export function summariseFindings(findings: Finding[]): EvidenceStatus {
  const scored = findings.filter((finding) => finding.status !== "Not assessed");
  if (scored.length === 0) return "Not assessed";
  if (scored.some((finding) => finding.status === "Unable to verify")) {
    return "Needs review";
  }
  const verified = scored.filter((f) => f.status === "Verified").length;
  if (verified >= Math.ceil(scored.length * 0.6)) return "Verified";
  if (verified > 0) return "Evidence found";
  return "Needs review";
}

export type OpportunityForCheck = {
  _id: string;
  slug: string;
  name: string;
  organiser: string;
  dataStatus: "demo" | "live" | "unavailable";
  sourceUrl?: string;
  sourceLabel: string;
  eligibility: string;
  registrationDeadline: number;
  startDate: number;
  lastVerified?: number;
  notes?: string;
};

export function checkOpportunity(
  opportunity: OpportunityForCheck,
  savedChecks: { checkedAt: number }[] = [],
): CredibilityResult {
  const lastChecked = savedChecks[0]?.checkedAt;
  const isDemo = opportunity.dataStatus === "demo";
  const findings: Finding[] = [
    {
      id: "official-source",
      claim: "Official source",
      status: isDemo ? "Unable to verify" : opportunity.sourceUrl ? "Verified" : "Needs review",
      explanation: isDemo
        ? "This is a demonstration record with no official listing to link to."
        : opportunity.sourceUrl
          ? "A source URL is stored with this record."
          : "No source URL is stored with this record.",
      evidence: opportunity.sourceUrl
        ? [{ label: opportunity.sourceLabel, url: opportunity.sourceUrl }]
        : [{ label: opportunity.sourceLabel }],
      limitations: isDemo ? opportunity.notes : undefined,
    },
    {
      id: "organiser",
      claim: "Organiser identity",
      status: isDemo ? "Needs review" : "Evidence found",
      explanation: isDemo
        ? `“${opportunity.organiser}” comes from the demonstration record and cannot be matched to an organiser registry.`
        : `Organiser recorded as “${opportunity.organiser}”. No independent registry lookup is implemented.`,
    },
    {
      id: "deadline",
      claim: "Deadline consistency",
      status:
        opportunity.registrationDeadline < opportunity.startDate
          ? "Evidence found"
          : "Needs review",
      explanation:
        opportunity.registrationDeadline < opportunity.startDate
          ? `Registration closes ${formatDate(opportunity.registrationDeadline)}, before the event starts ${formatDate(opportunity.startDate)}. Internal dates are consistent.`
          : "Registration closes on or after the event start date, which needs a human check.",
      limitations: isDemo
        ? "Internal consistency of a demonstration record — not a verified event listing."
        : undefined,
    },
    {
      id: "eligibility",
      claim: "Eligibility information",
      status: "Evidence found",
      explanation: `Record states: ${opportunity.eligibility}.`,
      limitations: isDemo
        ? "Demonstration data. The rule text has no official source behind it."
        : "Not cross-checked against an official rulebook.",
    },
    {
      id: "registration",
      claim: "Registration link",
      status: isDemo ? "Unable to verify" : "Needs review",
      explanation: isDemo
        ? "No registration link exists for a demonstration record."
        : "The stored source is not monitored automatically; open it before registering.",
    },
    {
      id: "accessibility",
      claim: "Source accessibility",
      status: isDemo ? "Unable to verify" : "Not assessed",
      explanation: isDemo
        ? "There is no source to fetch, so accessibility cannot be assessed."
        : "Live link monitoring is not implemented in this MVP.",
      limitations: "Source availability is checked manually only.",
    },
    {
      id: "last-updated",
      claim: "Last updated information",
      status: opportunity.lastVerified ? "Verified" : "Unable to verify",
      explanation: opportunity.lastVerified
        ? `Last verified ${formatDate(opportunity.lastVerified, true)}.`
        : "This record has never been verified against an official source.",
    },
    {
      id: "conflicts",
      claim: "Conflicting claims",
      status: "Not assessed",
      explanation:
        "Cross-source claim comparison is not implemented, so no conflict conclusion is drawn.",
    },
  ];

  const withTimestamp = findings.map((finding) => ({
    ...finding,
    checkedAt: lastChecked,
  }));
  const overall = summariseFindings(withTimestamp);
  return {
    subject: opportunity.name,
    subjectType: "opportunity",
    subjectId: opportunity._id,
    overall,
    findings: withTimestamp,
    summary: isDemo
      ? "Demonstration record: nothing here should be treated as a live opportunity until an official source is added."
      : overall === "Verified"
        ? "Most available evidence supports this listing."
        : "Some evidence supports this listing, but at least one claim needs a human check.",
  };
}

export type ProjectForCheck = {
  _id: string;
  name: string;
  description: string;
  technologies: string[];
  repoUrl?: string;
  demoUrl?: string;
  docsUrl?: string;
  status: string;
  milestones: { completed: boolean; title: string }[];
  repoReport: RepoReport | null;
  verifiedEvidenceCount: number;
};

export function projectStage(project: ProjectForCheck) {
  if (project.demoUrl) return "Deployed product";
  if (project.repoUrl && project.milestones.some((m) => m.completed))
    return "Working application";
  if (project.repoUrl) return "Repository";
  return "Project idea";
}

export function checkProject(project: ProjectForCheck): CredibilityResult {
  const hasDescription = project.description.trim().length > 40;
  const report = project.repoReport;
  const languageNames = (report?.languages ?? []).map((entry) =>
    entry.language.toLowerCase(),
  );
  const technologyMatch = project.technologies.filter((tech) =>
    languageNames.includes(tech.toLowerCase()),
  );
  const doneMilestones = project.milestones.filter((m) => m.completed).length;

  const findings: Finding[] = [
    {
      id: "description",
      claim: "Project description",
      status: hasDescription ? "Evidence found" : "Needs review",
      explanation: hasDescription
        ? `The description is ${project.description.trim().split(/\s+/).length} words and explains what the project does.`
        : "The description is very short, so a reviewer cannot tell what was built.",
      evidence: [{ label: "Project overview (this record)" }],
    },
    {
      id: "technologies",
      claim: "Technology claims",
      status: report
        ? technologyMatch.length > 0
          ? "Verified"
          : "Needs review"
        : "Not assessed",
      explanation: report
        ? technologyMatch.length > 0
          ? `GitHub reports ${technologyMatch.join(", ")} in this repository, matching your listed stack.`
          : `Your stack lists ${project.technologies.join(", ") || "no technologies"}, but the repository's detected languages are ${(report.languages ?? []).map((l) => l.language).join(", ") || "unavailable"}.`
        : "A repository analysis is required before technology claims can be compared.",
      evidence: report
        ? [{ label: `${report.owner}/${report.name} language data`, url: report.repoUrl }]
        : undefined,
    },
    {
      id: "repository",
      claim: "Linked repository",
      status: report ? "Verified" : project.repoUrl ? "Evidence found" : "Not assessed",
      explanation: report
        ? `Repository resolved on GitHub and last read ${formatDate(report.checkedAt, true)}.`
        : project.repoUrl
          ? "A repository URL is linked but has not been analysed yet."
          : "No repository is linked to this project.",
      evidence: project.repoUrl ? [{ label: project.repoUrl, url: project.repoUrl }] : undefined,
    },
    {
      id: "documentation",
      claim: "Documentation",
      status: report?.readmePresent || project.docsUrl ? "Verified" : "Not assessed",
      explanation: report?.readmePresent
        ? `README detected at ${report.readmePath}.`
        : project.docsUrl
          ? "A documentation link is provided."
          : "No README or documentation link was found.",
      evidence: report?.readmePresent
        ? [{ label: `${report.repoUrl}#readme`, url: `${report.repoUrl}#readme` }]
        : project.docsUrl
          ? [{ label: project.docsUrl, url: project.docsUrl }]
          : undefined,
    },
    {
      id: "implementation",
      claim: "Evidence of implementation",
      status: report && (report.commitSampleSize > 0 || doneMilestones > 0)
        ? "Verified"
        : doneMilestones > 0
          ? "Evidence found"
          : "Not assessed",
      explanation: report
        ? `${report.commitSampleSize} recent commits sampled from the default branch; ${doneMilestones}/${project.milestones.length} milestones marked complete.`
        : `${doneMilestones}/${project.milestones.length} milestones marked complete. No repository evidence.`,
      limitations: report
        ? "Commit presence shows activity, not the quality or authorship of the code."
        : undefined,
    },
    {
      id: "demo",
      claim: "Available demonstration",
      status: project.demoUrl ? "Evidence found" : "Not assessed",
      explanation: project.demoUrl
        ? "A demo link is provided. It is not automatically tested."
        : "No deployed demo is linked. This does not mean the project is not working.",
      evidence: project.demoUrl ? [{ label: project.demoUrl, url: project.demoUrl }] : undefined,
    },
    {
      id: "stage",
      claim: "Project maturity",
      status: "Evidence found",
      explanation: `Based on the fields you provided, this is best described as a ${projectStage(project).toLowerCase()}. BuildScope does not infer usage or impact.`,
      limitations:
        "Maturity is a self-reported classification, not an audit of the product.",
    },
  ];

  return {
    subject: project.name,
    subjectType: "project",
    subjectId: project._id,
    overall: summariseFindings(findings),
    findings,
    summary: `${projectStage(project)} — ${doneMilestones} of ${project.milestones.length} milestones complete${project.verifiedEvidenceCount ? `, ${project.verifiedEvidenceCount} verified evidence item(s)` : ""}.`,
  };
}

export function checkRepository(report: RepoReport): CredibilityResult {
  const findings: Finding[] = [
    {
      id: "metadata",
      claim: "Repository identity",
      status: "Verified",
      explanation: `Resolved ${report.owner}/${report.name} via the GitHub REST API. Created ${report.createdAt ? formatDate(new Date(report.createdAt).getTime()) : "unknown"}; default branch ${report.defaultBranch}.`,
      evidence: [{ label: "GitHub repository", url: report.repoUrl }],
      checkedAt: report.checkedAt,
    },
    {
      id: "activity",
      claim: "Commit activity",
      status: report.commitSampleSize > 0 ? "Verified" : "Needs review",
      explanation: `${report.commitSampleSize} commits sampled, about ${report.commitsPerWeek}/week over the last eight weeks. Last commit ${report.lastCommitAt ? formatDate(new Date(report.lastCommitAt).getTime()) : "unknown"}.`,
      limitations: "Sampled from the latest 30 commits only.",
      checkedAt: report.checkedAt,
    },
    {
      id: "readme",
      claim: "README availability",
      status: !report.treeAvailable
        ? "Not assessed"
        : report.readmePresent
          ? "Verified"
          : "Needs review",
      explanation: !report.treeAvailable
        ? "The repository file tree could not be read, so README availability is not assessed."
        : report.readmePresent
          ? `README found at ${report.readmePath}.`
          : "No README file was found in the default branch.",
      evidence: report.readmePresent
        ? [{ label: `${report.repoUrl}#readme`, url: `${report.repoUrl}#readme` }]
        : undefined,
    },
    {
      id: "licence",
      claim: "Licence",
      status: report.license ? "Verified" : "Needs review",
      explanation: report.license
        ? `GitHub identifies the licence as ${report.licenseName ?? report.license}.`
        : "No licence detected. Reuse and attribution terms are unclear.",
      limitations: "Not legal advice; read the licence text before reuse.",
    },
    {
      id: "releases",
      claim: "Releases",
      status: report.releases > 0 ? "Evidence found" : "Needs review",
      explanation:
        report.releases > 0
          ? `${report.releases} release(s) found${report.latestRelease ? `, latest ${report.latestRelease}` : ""}.`
          : "No published releases were returned by GitHub.",
    },
    {
      id: "workflows",
      claim: "CI workflow files",
      status: report.hasWorkflows ? "Verified" : "Not assessed",
      explanation: !report.treeAvailable
        ? "The file tree could not be read, so workflow files are not assessed."
        : report.hasWorkflows
          ? `${report.workflowFiles.length} workflow file(s) detected under .github/workflows.`
          : "No workflow files detected in the default branch tree.",
      evidence: report.hasWorkflows
        ? [{ label: "Workflow files", url: `${report.repoUrl}/tree/${report.defaultBranch}/.github/workflows` }]
        : undefined,
    },
    {
      id: "dependencies",
      claim: "Dependencies",
      status: report.dependencies.length > 0 ? "Verified" : "Not assessed",
      explanation:
        report.dependencies.length > 0
          ? `${report.dependencies.length} npm dependencies read from package.json.`
          : "No package.json dependencies were available.",
    },
    {
      id: "ancestry",
      claim: "Repository ancestry",
      status: "Verified",
      explanation: report.isFork
        ? `GitHub reports this repository as a fork${report.parent ? ` of ${report.parent}` : ""}${report.ancestors.length > 1 ? `, with ancestry ${report.ancestors.join(" → ")}` : ""}.`
        : "GitHub reports no fork relationship for this repository.",
      limitations:
        "A fork relationship is not misconduct. Re-uploaded code without a fork link is invisible to this check.",
    },
    {
      id: "concept-similarity",
      claim: "Concept similarity",
      status: report.related.length > 0 ? "Evidence found" : "Not assessed",
      explanation:
        report.related.length > 0
          ? `Description and topic token overlap with ${report.related.length} related public repositories. Highest: ${report.related[0].fullName} at ${report.related[0].conceptSimilarity}%.`
          : "No related repositories were returned for this description, so concept similarity is not assessed.",
      limitations:
        "Concept similarity is wording overlap, not proof of shared code or intent.",
    },
    {
      id: "file-matching",
      claim: "File-level exact matching",
      status: !report.treeAvailable
        ? "Not assessed"
        : report.related.some((item) => item.sharedBlobFiles > 0)
          ? "Verified"
          : "Not assessed",
      explanation: !report.treeAvailable
        ? "No file fingerprints could be computed, so file-level matching is not assessed."
        : report.related.some((item) => item.sharedBlobFiles > 0)
          ? `Git blob fingerprints matched ${report.related.filter((item) => item.sharedBlobFiles > 0).length} candidate repositories.`
          : "No identical git blob fingerprints were found among the candidates checked (up to three).",
      limitations:
        "Only exact blob matches count. Reformatting a file changes its fingerprint.",
    },
    {
      id: "code-similarity",
      claim: "Normalised code similarity",
      status: "Not assessed",
      explanation: "Not implemented in this MVP. No score is shown rather than an invented one.",
    },
    {
      id: "ast-similarity",
      claim: "AST structural similarity",
      status: "Not assessed",
      explanation: "Not implemented in this MVP. No structural comparison is claimed.",
    },
    {
      id: "licence-comparison",
      claim: "Licence and attribution comparison",
      status:
        report.related.length === 0
          ? "Not assessed"
          : report.license
            ? "Evidence found"
            : "Needs review",
      explanation:
        report.related.length === 0
          ? "No related repositories to compare."
          : `This repository: ${report.license ?? "no detected licence"}. ${report.related
              .map((item) => `${item.fullName}: ${item.license ?? "no detected licence"} (${item.licenceComparison})`)
              .join("; ")}.`,
      limitations:
        "Comparing licence identifiers is not a legal review of attribution requirements.",
    },
  ];

  const overall = summariseFindings(findings);
  return {
    subject: `${report.owner}/${report.name}`,
    subjectType: "repository",
    subjectId: report.repoUrl,
    overall,
    findings,
    summary: `Evidence collected from GitHub on ${formatDate(report.checkedAt, true)}. Similarity is not a verdict: shared fingerprints require human review.`,
  };
}

export function statusTone(status: EvidenceStatus) {
  switch (status) {
    case "Verified":
      return "sage";
    case "Evidence found":
      return "gold";
    case "Needs review":
      return "peach";
    case "Unable to verify":
      return "peach";
    default:
      return "muted";
  }
}

export function averageRank(findings: Finding[]) {
  const scored = findings.filter((f) => f.status !== "Not assessed");
  if (scored.length === 0) return null;
  return Math.round(
    (scored.reduce((sum, f) => sum + RANK[f.status], 0) / (scored.length * 3)) * 100,
  );
}
