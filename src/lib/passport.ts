import type {
  Evidence,
  Opportunity,
  OpportunityChain,
  Project,
  ProjectComparison,
  ProjectReport,
  ProjectRequirement,
  SimilarProject,
  Stakeholder,
  StakeholderNeed,
  VerificationResult,
} from "@/lib/api";

export type ReadinessStatus = "complete" | "partial" | "missing" | "not_assessed";

export type ReadinessCheck = {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
};

export type PassportRequirement = {
  id: string;
  text: string;
  acceptanceTest: string;
  source: "project" | "proof_chain";
  opportunityId?: string;
  opportunityDescription?: string;
  verification: VerificationResult[];
};

export type PassportInputs = {
  project: Project;
  report: ProjectReport | null;
  similarProjects: SimilarProject[];
  comparisons: ProjectComparison[];
  evidence: Evidence[];
  stakeholders: Stakeholder[];
  needs: StakeholderNeed[];
  opportunities: Opportunity[];
  projectRequirements: ProjectRequirement[];
  chains: OpportunityChain[];
};

export type Passport = {
  generatedAt: string;
  project: Project;
  checks: ReadinessCheck[];
  counts: {
    similarProjects: number;
    evidence: number;
    verifiedExcerpts: number;
    confirmedStakeholders: number;
    needs: number;
    supportedNeeds: number;
    comparisons: number;
    requirements: number;
    verificationResults: number;
  };
  similarProjects: SimilarProject[];
  comparisons: ProjectComparison[];
  evidence: Evidence[];
  needs: StakeholderNeed[];
  stakeholders: Stakeholder[];
  requirements: PassportRequirement[];
  nextSteps: string[];
  limitations: string[];
};

const VERIFIED_NEED_STATES = new Set(["supported", "strongly_supported", "conflicting"]);

function present(value?: string | null) {
  return Boolean(value && value.trim());
}

export function buildPassport(inputs: PassportInputs): Passport {
  const {
    project,
    similarProjects,
    comparisons,
    evidence,
    stakeholders,
    needs,
    projectRequirements,
    chains,
  } = inputs;

  const generatedRequirements: PassportRequirement[] = chains.flatMap((chain) =>
    (chain.requirements ?? []).map((requirement) => ({
      id: requirement.id,
      text: requirement.text,
      acceptanceTest: requirement.acceptance_test,
      source: "proof_chain" as const,
      opportunityId: chain.opportunity.id,
      opportunityDescription: chain.opportunity.description,
      verification: requirement.verification ?? [],
    })),
  );

  const requirements: PassportRequirement[] = [
    ...projectRequirements.map((requirement) => ({
      id: requirement.id,
      text: requirement.title,
      acceptanceTest: requirement.description || "No acceptance test recorded.",
      source: "project" as const,
      verification: [],
    })),
    ...generatedRequirements,
  ];

  const verifiedExcerpts = evidence.filter((item) => item.excerpt_verified).length;
  const confirmedStakeholders = stakeholders.filter((item) => item.status === "confirmed").length;
  const supportedNeeds = needs.filter((need) => VERIFIED_NEED_STATES.has(need.evidence_status)).length;
  const verificationResults = requirements.flatMap((requirement) => requirement.verification);

  const checks: ReadinessCheck[] = [];

  const hasProblem = present(project.problem_statement) && project.problem_statement.trim().length >= 20;
  const hasUsers = project.target_users.some((user) => present(user));
  checks.push({
    key: "problem",
    label: "Problem clarity",
    status: hasProblem && hasUsers ? "complete" : hasProblem || hasUsers ? "partial" : "missing",
    detail:
      hasProblem && hasUsers
        ? "A problem statement and target users are recorded."
        : hasProblem
          ? "The problem is recorded, but target users are missing."
          : hasUsers
            ? "Target users are recorded, but the problem statement needs more detail."
            : "Add a problem statement and target users to the project.",
  });

  checks.push({
    key: "landscape",
    label: "Existing solution research",
    status: similarProjects.length >= 3 ? "complete" : similarProjects.length > 0 ? "partial" : "missing",
    detail:
      similarProjects.length > 0
        ? `${similarProjects.length} comparable public projects were retrieved. Relevance signals are prioritisation aids, not novelty proof.`
        : "No comparable projects have been retrieved. Start a research run.",
  });

  checks.push({
    key: "evidence",
    label: "Evidence coverage",
    status:
      verifiedExcerpts >= 3 ? "complete" : evidence.length > 0 && verifiedExcerpts > 0 ? "partial" : "missing",
    detail:
      evidence.length > 0
        ? `${evidence.length} evidence item(s) recorded; ${verifiedExcerpts} excerpt(s) were found in the retrieved page text.`
        : "No evidence excerpts have been recorded yet.",
  });

  checks.push({
    key: "validation",
    label: "User validation",
    status:
      supportedNeeds > 0
        ? "complete"
        : needs.length > 0
          ? "partial"
          : confirmedStakeholders > 0
            ? "partial"
            : "missing",
    detail:
      needs.length > 0
        ? `${needs.length} stakeholder need(s) recorded; ${supportedNeeds} have supporting, conflicting or strongly supported evidence.`
        : confirmedStakeholders > 0
          ? "Stakeholders are confirmed, but no evidence-backed needs have been analysed."
          : "No stakeholder groups or needs have been analysed.",
  });

  const differentiated = comparisons.filter(
    (comparison) => comparison.differences.length > 0 || comparison.possible_gaps.length > 0,
  ).length;
  checks.push({
    key: "differentiation",
    label: "Differentiation",
    status: differentiated >= 2 ? "complete" : comparisons.length > 0 ? "partial" : "missing",
    detail:
      comparisons.length > 0
        ? `${comparisons.length} comparison(s) recorded; ${differentiated} list differences or possible gaps. Gaps remain hypotheses.`
        : "No comparisons have been generated by a research run.",
  });

  checks.push({
    key: "requirements",
    label: "Requirements",
    status: requirements.length >= 3 ? "complete" : requirements.length > 0 ? "partial" : "missing",
    detail:
      requirements.length > 0
        ? `${requirements.length} requirement(s) recorded from the project and proof chains.`
        : "No project requirements or generated proof-chain requirements yet.",
  });

  checks.push({
    key: "verification",
    label: "Verification",
    status:
      verificationResults.length === 0
        ? "not_assessed"
        : verificationResults.some((result) => result.result === "fail")
          ? "partial"
          : "complete",
    detail:
      verificationResults.length === 0
        ? "No verification has been run. A requirement exists only as a claim until checked."
        : `${verificationResults.length} verification result(s): ${verificationResults.filter((result) => result.result === "pass").length} pass, ${verificationResults.filter((result) => result.result === "fail").length} fail, ${verificationResults.filter((result) => result.result === "error").length} error.`,
  });

  const nextSteps: string[] = [];
  if (!(hasProblem && hasUsers)) nextSteps.push("Clarify the problem statement and list the target users.");
  if (similarProjects.length === 0) nextSteps.push("Run research to discover comparable projects and public sources.");
  if (evidence.length === 0) nextSteps.push("Run stakeholder analysis to collect evidence excerpts, or start research for source-backed findings.");
  if (needs.length === 0) nextSteps.push("Identify and confirm stakeholder groups, then analyse their publicly evidenced needs.");
  if (comparisons.length === 0 && similarProjects.length > 0) nextSteps.push("Review the research comparisons and record which differences are actually supported.");
  if (requirements.length === 0) nextSteps.push("Generate a requirement from an opportunity and review its acceptance test.");
  if (verificationResults.length === 0 && requirements.length > 0) nextSteps.push("Run verification on at least one requirement and review the results.");
  if (verificationResults.some((result) => result.result === "fail")) nextSteps.push("Investigate failed verification checks before treating the requirement as proven.");
  if (nextSteps.length === 0) nextSteps.push("Re-run research when the source landscape changes, and record new evidence against each claim.");

  return {
    generatedAt: new Date().toISOString(),
    project,
    checks,
    counts: {
      similarProjects: similarProjects.length,
      evidence: evidence.length,
      verifiedExcerpts,
      confirmedStakeholders,
      needs: needs.length,
      supportedNeeds,
      comparisons: comparisons.length,
      requirements: requirements.length,
      verificationResults: verificationResults.length,
    },
    similarProjects,
    comparisons,
    evidence,
    needs,
    stakeholders,
    requirements,
    nextSteps,
    limitations: [
      "This passport is a research record, not a patentability, originality or legal certification.",
      "Similarity scores prioritise related projects; they are not proof that ideas are equivalent or that a project is novel.",
      "Retrieved excerpts are sourced from public pages, but an excerpt match does not independently prove the full claim.",
      "AI interpretations and possible gaps are hypotheses that require human review and further validation.",
      "Live provider coverage, rate limits and page availability limit what research can find.",
      "Verification checks test recorded evidence and requirement behaviour, not market demand or product success.",
    ],
  };
}

export function readinessSummary(checks: ReadinessCheck[]) {
  return {
    complete: checks.filter((check) => check.status === "complete").length,
    partial: checks.filter((check) => check.status === "partial").length,
    missing: checks.filter((check) => check.status === "missing").length,
    notAssessed: checks.filter((check) => check.status === "not_assessed").length,
    total: checks.length,
  };
}

function dateLabel(value?: string | null) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function passportMarkdown(passport: Passport) {
  const { project, counts } = passport;
  const lines: string[] = [
    `# Buildability Passport — ${project.name}`,
    "",
    `Generated: ${dateLabel(passport.generatedAt)}`,
    "Prepared with BuildScope AI. Evidence-backed research record — not a legal or originality certificate.",
    "",
    "## 1. Project identity",
    "",
    `**Name:** ${project.name}`,
    `**Status:** ${project.status}`,
    `**Problem statement:** ${project.problem_statement || "Not recorded"}`,
    `**Target users:** ${project.target_users.join(", ") || "Not recorded"}`,
    `**Description:** ${project.description}`,
    `**Planned features:** ${project.planned_features.join("; ") || "Not recorded"}`,
    "",
    "## 2. Build readiness checklist",
    "",
    ...passport.checks.map(
      (check) => `- **${check.label} — ${check.status.replace("_", " ")}:** ${check.detail}`,
    ),
    "",
    `Completed checks: ${counts.similarProjects} comparable projects, ${counts.evidence} evidence items, ${counts.requirements} requirements, ${counts.verificationResults} verification results.`,
    "",
    "## 3. Existing landscape",
    "",
    ...(passport.similarProjects.length === 0
      ? ["No comparable projects have been retrieved."]
      : passport.similarProjects.map(
          (project) =>
            `- **${project.name}** — ${project.source_url}\n  - ${project.description ?? "No description retrieved"}\n  - Relevance signal: ${Math.round(project.similarity_score * 100)}% (prioritisation only; not novelty proof)\n  - Technology: ${project.technology.join(", ") || "not recorded"}\n  - Limitations: ${project.limitations.join("; ") || "not recorded"}`,
        )),
    "",
    "### Recorded differences and possible gaps",
    "",
    ...(passport.comparisons.length === 0
      ? ["No comparisons recorded. Possible gaps are hypotheses, not proof of opportunity."]
      : passport.comparisons.map(
          (comparison) =>
            `- Shared: ${comparison.shared_features.join("; ") || "none recorded"}\n  - Differences: ${comparison.differences.join("; ") || "none recorded"}\n  - Possible gaps (hypotheses): ${comparison.possible_gaps.join("; ") || "none recorded"}\n  - Interpretation: ${comparison.explanation || "none recorded"}`,
        )),
    "",
    "## 4. Evidence ledger",
    "",
    ...(passport.evidence.length === 0
      ? ["No evidence excerpts recorded."]
      : passport.evidence.map(
          (item, index) =>
            `${index + 1}. **${item.source_title ?? "Untitled source"}** — ${item.source_url ?? "URL unavailable"}\n   - Relation: ${item.relation}\n   - Type: ${item.evidence_type}\n   - Excerpt: “${item.excerpt}”\n   - Verified in source text: ${item.excerpt_verified ? "yes" : "no"}\n   - Retrieved: ${dateLabel(item.retrieved_at)}`,
        )),
    "",
    "## 5. User needs and opportunities",
    "",
    ...(passport.stakeholders.length === 0
      ? ["No stakeholder groups recorded."]
      : passport.stakeholders.map(
          (stakeholder) =>
            `- **${stakeholder.name}** (${stakeholder.status}) — ${stakeholder.description || "No description"}`,
        )),
    "",
    ...(passport.needs.length === 0
      ? ["No needs analysed."]
      : passport.needs.map(
          (need) =>
            `- ${need.need_text} — evidence status: ${need.evidence_status}; ${need.supporting_count} supporting, ${need.contradicting_count} contradicting across ${need.independent_source_count} independent source(s). Validation question: ${need.validation_question ?? "not recorded"}.`,
        )),
    "",
    "## 6. Requirements and verification",
    "",
    ...(passport.requirements.length === 0
      ? ["No requirements recorded."]
      : passport.requirements.map(
          (requirement) =>
            `- **${requirement.text}**\n  - Acceptance test: ${requirement.acceptanceTest}\n  - Source: ${requirement.source === "project" ? "project requirement" : "proof chain"}\n  - Verification: ${
              requirement.verification.length === 0
                ? "Not assessed"
                : requirement.verification
                    .map((result) => `${result.test}: ${result.result} (${result.details})`)
                    .join("; ")
            }`,
        )),
    "",
    "## 7. Next steps",
    "",
    ...passport.nextSteps.map((step) => `- ${step}`),
    "",
    "## 8. Limitations",
    "",
    ...passport.limitations.map((limitation) => `- ${limitation}`),
    "",
    "---",
    "Generated by BuildScope AI from the recorded research. AI-generated interpretations are separated from sourced excerpts and remain subject to review.",
  ];
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
