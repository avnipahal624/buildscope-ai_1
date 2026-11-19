import { daysUntil } from "./matching";
import { formatDate } from "./format";
import type { RepoReport } from "./github-types";

type Task = {
  _id: string;
  title: string;
  status: string;
  skill: string;
  completedAt?: number;
  estimatedMinutes: number;
};
type Milestone = {
  _id: string;
  title: string;
  completed: boolean;
  completedAt?: number;
  projectId: string;
};
type Project = {
  _id: string;
  name: string;
  status: string;
  technologies: string[];
  repoUrl?: string;
};
type Saved = {
  opportunity: {
    _id: string;
    name: string;
    registrationDeadline: number;
    dataStatus: string;
  };
};
type RepoCheck = { status: string; repoUrl: string; fetchedAt: number; report?: unknown };
type Evidence = { summaryStatus: string; subjectLabel: string; checkedAt: number };

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  evidence: string;
};

export function computeAchievements(input: {
  tasks: Task[];
  milestones: Milestone[];
  projects: Project[];
  repoChecks: RepoCheck[];
  saved: Saved[];
  evidence: Evidence[];
}): Achievement[] {
  const doneTasks = input.tasks.filter((t) => t.status === "done");
  const roadmapPct =
    input.tasks.length === 0 ? 0 : (doneTasks.length / input.tasks.length) * 100;
  const doneMilestones = input.milestones.filter((m) => m.completed);
  const verifiedRepos = input.repoChecks.filter((c) => c.status === "verified");

  return [
    {
      id: "roadmap-started",
      title: "Roadmap started",
      description: "Set a target and generated a first learning plan.",
      unlocked: input.tasks.length > 0,
      evidence: `${input.tasks.length} roadmap task${input.tasks.length === 1 ? "" : "s"} created`,
    },
    {
      id: "first-task",
      title: "First task completed",
      description: "Finished a roadmap task you marked yourself.",
      unlocked: doneTasks.length > 0,
      evidence: `${doneTasks.length} completed task${doneTasks.length === 1 ? "" : "s"}`,
    },
    {
      id: "halfway",
      title: "Halfway there",
      description: "Crossed 50% roadmap completion.",
      unlocked: roadmapPct >= 50,
      evidence: `${Math.round(roadmapPct)}% roadmap completion`,
    },
    {
      id: "first-project",
      title: "Project in motion",
      description: "Created a project with at least one milestone.",
      unlocked: input.projects.length > 0 && input.milestones.length > 0,
      evidence: `${input.projects.length} project${input.projects.length === 1 ? "" : "s"}, ${input.milestones.length} milestone${input.milestones.length === 1 ? "" : "s"}`,
    },
    {
      id: "milestones",
      title: "Milestone maker",
      description: "Completed three project milestones.",
      unlocked: doneMilestones.length >= 3,
      evidence: `${doneMilestones.length} milestones completed`,
    },
    {
      id: "repo-verified",
      title: "Repository verified",
      description: "Ran a real GitHub evidence check on a linked repository.",
      unlocked: verifiedRepos.length > 0,
      evidence: `${verifiedRepos.length} verified repository check${verifiedRepos.length === 1 ? "" : "s"}`,
    },
    {
      id: "explorer",
      title: "Opportunity explorer",
      description: "Saved three or more opportunities to review.",
      unlocked: input.saved.length >= 3,
      evidence: `${input.saved.length} saved opportunities`,
    },
    {
      id: "evidence-pack",
      title: "Evidence pack",
      description: "Recorded a credibility check with evidence.",
      unlocked: input.evidence.length > 0,
      evidence: `${input.evidence.length} credibility check${input.evidence.length === 1 ? "" : "s"}`,
    },
  ];
}

export function monthlySummary(input: {
  activities: { createdAt: number; kind: string }[];
  tasks: Task[];
  milestones: Milestone[];
}) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const inMonth = (time?: number) => Boolean(time && time >= start);
  return {
    label: new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(now),
    tasksCompleted: input.tasks.filter((t) => t.status === "done" && inMonth(t.completedAt))
      .length,
    milestonesCompleted: input.milestones.filter((m) => m.completed && inMonth(m.completedAt))
      .length,
    activities: input.activities.filter((a) => inMonth(a.createdAt)).length,
    opportunitySaves: input.activities.filter(
      (a) => a.kind === "saved" && inMonth(a.createdAt),
    ).length,
  };
}

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "urgent" | "info" | "success";
};

export function deriveNotifications(input: {
  saved: Saved[];
  tasks: Task[];
  projects: Project[];
  repoChecks: RepoCheck[];
  onboardingComplete?: boolean;
}): NotificationItem[] {
  const items: NotificationItem[] = [];
  if (!input.onboardingComplete) {
    items.push({
      id: "onboarding",
      title: "Finish your profile",
      detail: "Recommendations improve once your skills and goals are set.",
      href: "/onboarding",
      tone: "info",
    });
  }
  for (const { opportunity } of input.saved) {
    const days = daysUntil(opportunity.registrationDeadline);
    if (days >= 0 && days <= 21) {
      items.push({
        id: `deadline-${opportunity._id}`,
        title: `${opportunity.name} closes soon`,
        detail:
          days === 0
            ? "Registration closes today."
            : `${days} day${days === 1 ? "" : "s"} left to register.`,
        href: `/radar/${opportunity._id}`,
        tone: days <= 7 ? "urgent" : "info",
      });
    }
  }
  for (const task of input.tasks.filter((t) => t.status === "in-progress").slice(0, 3)) {
    items.push({
      id: `task-${task._id}`,
      title: "Task in progress",
      detail: task.title,
      href: "/roadmap",
      tone: "info",
    });
  }
  const unchecked = input.projects.filter(
    (p) =>
      p.repoUrl &&
      !input.repoChecks.some((c) => c.repoUrl === p.repoUrl && c.status === "verified"),
  );
  if (unchecked.length > 0) {
    items.push({
      id: "repo-unchecked",
      title: "Repository evidence missing",
      detail: `${unchecked[0].name} has a repository link that has not been analysed.`,
      href: `/projects/${unchecked[0]._id}`,
      tone: "info",
    });
  }
  if (items.length === 0) {
    items.push({
      id: "quiet",
      title: "Nothing needs attention",
      detail: "Your deadlines, roadmap and projects are clear.",
      href: "/dashboard",
      tone: "success",
    });
  }
  return items.slice(0, 6);
}

export type ReportInput = {
  name: string;
  college?: string;
  branch?: string;
  academicYear?: string;
  goals?: string[];
  tasks: Task[];
  milestones: Milestone[];
  projects: Project[];
  saved: Saved[];
  repoChecks: { status: string; repoUrl: string; fetchedAt: number; report?: unknown }[];
  achievements: Achievement[];
};

export function buildProgressReport(input: ReportInput) {
  const generatedAt = new Date();
  const doneTasks = input.tasks.filter((t) => t.status === "done");
  const skills = Array.from(new Set(doneTasks.map((t) => t.skill)));
  const doneMilestones = input.milestones.filter((m) => m.completed);
  const verifiedRepos = input.repoChecks.filter((c) => c.status === "verified");
  const unlocked = input.achievements.filter((a) => a.unlocked);

  const lines: string[] = [];
  lines.push(`# BuildScope progress report — ${input.name}`);
  lines.push("");
  lines.push(`Generated ${formatDate(generatedAt.getTime(), true)}`);
  if (input.college) {
    lines.push(
      `${input.college}${input.branch ? ` · ${input.branch}` : ""}${input.academicYear ? ` · ${input.academicYear}` : ""}`,
    );
  }
  lines.push("");
  lines.push("## Skills developed");
  lines.push(
    skills.length > 0
      ? skills.map((skill) => `- ${skill} — practised in completed roadmap tasks`).join("\n")
      : "- No completed roadmap tasks yet. No skill mastery is claimed.",
  );
  lines.push("");
  lines.push("## Projects");
  if (input.projects.length === 0) {
    lines.push("- No projects created yet.");
  } else {
    for (const project of input.projects) {
      const projectMilestones = input.milestones.filter(
        (m) => m.projectId === project._id,
      );
      lines.push(
        `- **${project.name}** (${project.status}) — ${project.technologies.join(", ") || "no technologies listed"} · ${projectMilestones.filter((m) => m.completed).length}/${projectMilestones.length} milestones complete`,
      );
    }
  }
  lines.push("");
  lines.push("## Milestones completed");
  lines.push(
    doneMilestones.length > 0
      ? doneMilestones
          .map((m) => `- ${m.title}${m.completedAt ? ` (${formatDate(m.completedAt)})` : ""}`)
          .join("\n")
      : "- None recorded.",
  );
  lines.push("");
  lines.push("## Opportunities explored");
  lines.push(
    input.saved.length > 0
      ? input.saved
          .map(
            ({ opportunity }) =>
              `- ${opportunity.name}${opportunity.dataStatus === "demo" ? " (demonstration record)" : ""}`,
          )
          .join("\n")
      : "- No opportunities saved.",
  );
  lines.push("");
  lines.push("## Verified evidence links");
  if (verifiedRepos.length === 0) {
    lines.push("- No verified repository evidence yet.");
  } else {
    for (const check of verifiedRepos) {
      const report = check.report as RepoReport | undefined;
      lines.push(
        `- ${check.repoUrl} — read ${formatDate(check.fetchedAt, true)}${report ? ` · ${report.commitSampleSize} commits sampled · ${report.fileCount} files fingerprinted` : ""}`,
      );
    }
  }
  lines.push("");
  lines.push("## Achievements supported by evidence");
  lines.push(
    unlocked.length > 0
      ? unlocked.map((a) => `- ${a.title} — ${a.evidence}`).join("\n")
      : "- No evidence-backed achievements yet.",
  );
  lines.push("");
  lines.push(
    "_This report is generated from your own BuildScope records. It does not claim skill mastery, employment outcomes or third-party verification beyond the listed checks._",
  );

  return {
    title: `BuildScope progress report — ${input.name}`,
    generatedAt: generatedAt.getTime(),
    markdown: lines.join("\n"),
    skills,
    projectCount: input.projects.length,
    milestoneCount: doneMilestones.length,
    opportunityCount: input.saved.length,
    verifiedEvidenceCount: verifiedRepos.length,
  };
}
