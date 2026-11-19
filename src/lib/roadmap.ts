import { hasSkill, normaliseSkills, skillDefinition } from "./skills";

export type RoadmapDraft = {
  title: string;
  description: string;
  skill: string;
  stage: "foundation" | "intermediate" | "application" | "project-ready";
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  resourceLabel?: string;
  resourceUrl?: string;
};

/**
 * Builds a prioritised roadmap from the gap between required and current
 * skills. Priorities follow required-skill order (first gaps are high), and
 * every task points at a curated, real learning resource when one exists.
 */
export function generateRoadmap(
  requiredSkills: string[],
  currentSkills: string[] | undefined,
): RoadmapDraft[] {
  const required = normaliseSkills(requiredSkills);
  const gaps = required.filter((skill) => !hasSkill(currentSkills, skill));
  const drafts: RoadmapDraft[] = [];

  gaps.slice(0, 6).forEach((skill, index) => {
    const definition = skillDefinition(skill);
    const hours = definition?.hours ?? 6;
    const priority = index < 2 ? "high" : index < 4 ? "medium" : "low";
    const resource = definition?.resourceUrl
      ? {
          resourceLabel: definition.resourceLabel,
          resourceUrl: definition.resourceUrl,
        }
      : {};

    drafts.push({
      title: `Learn ${skill} fundamentals`,
      description: `Work through the core concepts of ${skill} and write a short set of notes you can reuse during a build.`,
      skill,
      stage: "foundation",
      priority,
      estimatedMinutes: Math.round(hours * 40),
      ...resource,
    });
    drafts.push({
      title: `Apply ${skill} in a small build`,
      description: `Ship one scoped exercise that uses ${skill}, then record what you built and what you would change.`,
      skill,
      stage: "application",
      priority,
      estimatedMinutes: Math.round(hours * 30),
      ...resource,
    });
  });

  if (gaps.length === 0) {
    drafts.push({
      title: "Prove your strongest skill with a scoped deliverable",
      description:
        "Your profile already covers the required skills. Pick the skill you most want to demonstrate and ship a small, reviewable artefact.",
      skill: required[0] ?? "Technical Writing",
      stage: "application",
      priority: "medium",
      estimatedMinutes: 180,
    });
  }

  drafts.push({
    title: "Assemble your project-ready evidence pack",
    description:
      "Write a README, record a short demo and list the exact features you implemented so a reviewer can verify the work.",
    skill: "Technical Writing",
    stage: "project-ready",
    priority: "high",
    estimatedMinutes: 120,
    resourceLabel: "Google Technical Writing courses",
    resourceUrl: "https://developers.google.com/tech-writing",
  });

  return drafts;
}

export const STAGES = [
  {
    key: "foundation",
    label: "Foundation",
    description: "Close the conceptual gaps first.",
  },
  {
    key: "intermediate",
    label: "Intermediate",
    description: "Connect concepts and practise deliberately.",
  },
  {
    key: "application",
    label: "Practical application",
    description: "Build something small with each skill.",
  },
  {
    key: "project-ready",
    label: "Project ready",
    description: "Package the evidence a reviewer needs.",
  },
] as const;
