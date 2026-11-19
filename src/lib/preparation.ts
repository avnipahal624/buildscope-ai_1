import { hasSkill } from "./skills";

/**
 * DOCUMENTED PREPARATION SCORE
 *
 *   Roadmap completion   40%  completed roadmap tasks ÷ all tasks
 *   Milestone completion 25%  completed project milestones ÷ all milestones
 *   Skill readiness      20%  target skills already on the student's profile
 *   Verified evidence    15%  (verified repo checks + verified credibility
 *                             checks), capped at four checks
 *
 * A component only counts when it has underlying data, and the weights are
 * renormalised across the components that do. With no roadmap tasks and no
 * milestones the score is not calculated at all ("Not yet calculated").
 */

type TaskLike = { status: string; skill: string };
type MilestoneLike = { completed: boolean };
type TargetLike = { active: boolean; requiredSkills: string[] };
type RepoCheckLike = { status: string };
type EvidenceLike = { summaryStatus: string };

export type PreparationBreakdown = {
  key: string;
  label: string;
  weight: number;
  value: number;
  detail: string;
};

export type PreparationResult = {
  score: number | null;
  breakdown: PreparationBreakdown[];
  hasData: boolean;
  roadmapCompletion: number;
  milestoneCompletion: number;
  skillReadiness: number | null;
  verifiedEvidence: number;
};

export function computePreparation(input: {
  tasks: TaskLike[];
  milestones: MilestoneLike[];
  targets: TargetLike[];
  userSkills?: string[];
  repoChecks: RepoCheckLike[];
  evidence: EvidenceLike[];
}): PreparationResult {
  const tasks = input.tasks ?? [];
  const milestones = input.milestones ?? [];
  const repoChecks = input.repoChecks ?? [];
  const evidence = input.evidence ?? [];

  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const roadmapCompletion = tasks.length === 0 ? 0 : doneTasks / tasks.length;
  const doneMilestones = milestones.filter((m) => m.completed).length;
  const milestoneCompletion =
    milestones.length === 0 ? 0 : doneMilestones / milestones.length;

  const activeTarget = (input.targets ?? []).find((target) => target.active);
  const requiredSkills = activeTarget?.requiredSkills ?? [];
  const covered = requiredSkills.filter((skill) =>
    hasSkill(input.userSkills, skill),
  );
  const skillReadiness =
    requiredSkills.length === 0 ? null : covered.length / requiredSkills.length;

  const verifiedRepos = repoChecks.filter((c) => c.status === "verified").length;
  const verifiedChecks = evidence.filter(
    (c) => c.summaryStatus === "Verified" || c.summaryStatus === "Evidence found",
  ).length;
  const verifiedEvidence = verifiedRepos + verifiedChecks;
  const evidenceValue = Math.min(1, verifiedEvidence / 4);

  const components: PreparationBreakdown[] = [];
  if (tasks.length > 0) {
    components.push({
      key: "roadmap",
      label: "Roadmap completion",
      weight: 40,
      value: roadmapCompletion,
      detail: `${doneTasks}/${tasks.length} tasks completed`,
    });
  }
  if (milestones.length > 0) {
    components.push({
      key: "milestones",
      label: "Milestone completion",
      weight: 25,
      value: milestoneCompletion,
      detail: `${doneMilestones}/${milestones.length} milestones completed`,
    });
  }
  if (skillReadiness !== null) {
    components.push({
      key: "skills",
      label: "Skill readiness",
      weight: 20,
      value: skillReadiness,
      detail: `${covered.length}/${requiredSkills.length} target skills on profile`,
    });
  }
  if (repoChecks.length + evidence.length > 0) {
    components.push({
      key: "evidence",
      label: "Verified evidence",
      weight: 15,
      value: evidenceValue,
      detail: `${verifiedEvidence} verified evidence item${verifiedEvidence === 1 ? "" : "s"}`,
    });
  }

  const hasData = components.length > 0;
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const score = hasData
    ? Math.round(
        components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight,
      )
    : null;

  return {
    score,
    breakdown: components,
    hasData,
    roadmapCompletion: Math.round(roadmapCompletion * 100),
    milestoneCompletion: Math.round(milestoneCompletion * 100),
    skillReadiness:
      skillReadiness === null ? null : Math.round(skillReadiness * 100),
    verifiedEvidence,
  };
}

export function snapshotDelta(
  snapshots: { day: string; score: number }[],
): number | null {
  if (snapshots.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const latest = snapshots[snapshots.length - 1];
  const previous = [...snapshots].reverse().find((s) => s.day !== today);
  if (!previous || latest.day !== today) {
    return null;
  }
  return latest.score - previous.score;
}
