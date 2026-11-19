import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const statusValidator = v.union(
  v.literal("todo"),
  v.literal("in-progress"),
  v.literal("done"),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // BuildScope student profile
      college: v.optional(v.string()),
      branch: v.optional(v.string()),
      academicYear: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      interests: v.optional(v.array(v.string())),
      domains: v.optional(v.array(v.string())),
      experienceLevel: v.optional(v.string()),
      goals: v.optional(v.array(v.string())),
      weeklyHours: v.optional(v.number()),
      onboardingComplete: v.optional(v.boolean()),
      theme: v.optional(v.string()),
      notificationPrefs: v.optional(
        v.object({
          deadlines: v.boolean(),
          roadmap: v.boolean(),
          weeklyDigest: v.boolean(),
        }),
      ),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    opportunities: defineTable({
      slug: v.string(),
      name: v.string(),
      organiser: v.string(),
      description: v.string(),
      domain: v.string(),
      format: v.union(
        v.literal("online"),
        v.literal("offline"),
        v.literal("hybrid"),
      ),
      location: v.string(),
      registrationDeadline: v.number(),
      startDate: v.number(),
      endDate: v.number(),
      skillsRequired: v.array(v.string()),
      eligibility: v.string(),
      minYear: v.optional(v.string()),
      prizeRange: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
      sourceLabel: v.string(),
      dataStatus: v.union(
        v.literal("demo"),
        v.literal("live"),
        v.literal("unavailable"),
      ),
      lastVerified: v.optional(v.number()),
      timeline: v.array(v.object({ date: v.number(), label: v.string() })),
      preparationChecklist: v.array(v.string()),
      notes: v.optional(v.string()),
    }).index("by_slug", ["slug"]),

    savedOpportunities: defineTable({
      userId: v.id("users"),
      opportunityId: v.id("opportunities"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_opportunity", ["userId", "opportunityId"]),

    projects: defineTable({
      userId: v.id("users"),
      name: v.string(),
      description: v.string(),
      domain: v.string(),
      technologies: v.array(v.string()),
      goals: v.optional(v.string()),
      status: v.union(
        v.literal("idea"),
        v.literal("building"),
        v.literal("testing"),
        v.literal("shipped"),
      ),
      repoUrl: v.optional(v.string()),
      demoUrl: v.optional(v.string()),
      docsUrl: v.optional(v.string()),
      startDate: v.optional(v.number()),
      repoCheckId: v.optional(v.id("repoChecks")),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    milestones: defineTable({
      userId: v.id("users"),
      projectId: v.id("projects"),
      title: v.string(),
      dueDate: v.optional(v.number()),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
      order: v.number(),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_project", ["projectId"]),

    roadmapTargets: defineTable({
      userId: v.id("users"),
      label: v.string(),
      type: v.union(
        v.literal("opportunity"),
        v.literal("project"),
        v.literal("goal"),
      ),
      referenceId: v.optional(v.string()),
      requiredSkills: v.array(v.string()),
      active: v.boolean(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    roadmapTasks: defineTable({
      userId: v.id("users"),
      targetId: v.optional(v.id("roadmapTargets")),
      title: v.string(),
      description: v.string(),
      skill: v.string(),
      stage: v.union(
        v.literal("foundation"),
        v.literal("intermediate"),
        v.literal("application"),
        v.literal("project-ready"),
      ),
      priority: v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low"),
      ),
      estimatedMinutes: v.number(),
      resourceLabel: v.optional(v.string()),
      resourceUrl: v.optional(v.string()),
      status: statusValidator,
      order: v.number(),
      completedAt: v.optional(v.number()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    repoChecks: defineTable({
      userId: v.id("users"),
      projectId: v.optional(v.id("projects")),
      repoUrl: v.string(),
      owner: v.string(),
      repoName: v.string(),
      status: v.union(v.literal("verified"), v.literal("unavailable")),
      report: v.any(),
      error: v.optional(v.string()),
      fetchedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_repo", ["userId", "repoUrl"]),

    evidenceChecks: defineTable({
      userId: v.id("users"),
      subjectType: v.union(
        v.literal("opportunity"),
        v.literal("project"),
        v.literal("repository"),
      ),
      subjectId: v.string(),
      subjectLabel: v.string(),
      summaryStatus: v.string(),
      findings: v.any(),
      checkedAt: v.number(),
    })
      .index("by_user", ["userId"]),

    activities: defineTable({
      userId: v.id("users"),
      kind: v.string(),
      title: v.string(),
      detail: v.optional(v.string()),
      href: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    libraryItems: defineTable({
      userId: v.id("users"),
      title: v.string(),
      description: v.optional(v.string()),
      kind: v.union(
        v.literal("resource"),
        v.literal("report"),
        v.literal("repo-report"),
        v.literal("research"),
        v.literal("saved"),
      ),
      url: v.optional(v.string()),
      payload: v.optional(v.any()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    scoreSnapshots: defineTable({
      userId: v.id("users"),
      day: v.string(),
      score: v.number(),
      breakdown: v.any(),
      createdAt: v.number(),
    }).index("by_user_day", ["userId", "day"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
