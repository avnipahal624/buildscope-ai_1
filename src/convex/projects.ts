import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, sanitize } from "./lib";

async function requireUser(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in to manage projects.");
  return userId;
}

const projectStatus = v.union(
  v.literal("idea"),
  v.literal("building"),
  v.literal("testing"),
  v.literal("shipped"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const out = [];
    for (const project of projects) {
      const milestones = await ctx.db
        .query("milestones")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      milestones.sort((a, b) => a.order - b.order);
      out.push({
        project,
        milestones,
        doneCount: milestones.filter((m) => m.completed).length,
      });
    }
    return out.sort((a, b) => b.project.updatedAt - a.project.updatedAt);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    milestones.sort((a, b) => a.order - b.order);
    const checks = await ctx.db
      .query("repoChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const repoCheck = checks
      .filter((check) => check.projectId === projectId)
      .sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
    const evidence = await ctx.db
      .query("evidenceChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return {
      project,
      milestones,
      repoCheck: repoCheck ?? null,
      evidence: evidence
        .filter(
          (check) =>
            check.subjectType === "project" && check.subjectId === projectId,
        )
        .sort((a, b) => b.checkedAt - a.checkedAt),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    domain: v.string(),
    technologies: v.array(v.string()),
    goals: v.optional(v.string()),
    status: projectStatus,
    repoUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    docsUrl: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const projectId = await ctx.db.insert(
      "projects",
      sanitize({
        userId,
        ...args,
        createdAt: now,
        updatedAt: now,
      }),
    );
    await logActivity(ctx, userId, {
      kind: "project",
      title: `Created project: ${args.name}`,
      detail: "Add milestones to start tracking progress.",
      href: `/projects/${projectId}`,
    });
    return projectId;
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    domain: v.optional(v.string()),
    technologies: v.optional(v.array(v.string())),
    goals: v.optional(v.string()),
    status: v.optional(projectStatus),
    repoUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    docsUrl: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found.");
    const { projectId, ...rest } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(projectId, patch);
    await logActivity(ctx, userId, {
      kind: "project",
      title: `Updated project: ${args.name ?? project.name}`,
      href: `/projects/${projectId}`,
    });
    return { ok: true };
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found.");
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const milestone of milestones) await ctx.db.delete(milestone._id);
    const checks = await ctx.db
      .query("repoChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const check of checks) {
      if (check.projectId === projectId) await ctx.db.delete(check._id);
    }
    await ctx.db.delete(projectId);
    await logActivity(ctx, userId, {
      kind: "project",
      title: `Deleted project: ${project.name}`,
      href: "/projects",
    });
    return { ok: true };
  },
});

export const addMilestone = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found.");
    const existing = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const id = await ctx.db.insert(
      "milestones",
      sanitize({
        userId,
        projectId: args.projectId,
        title: args.title,
        dueDate: args.dueDate,
        completed: false,
        order: existing.length,
        createdAt: Date.now(),
      }),
    );
    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });
    return id;
  },
});

export const updateMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone || milestone.userId !== userId)
      throw new Error("Milestone not found.");
    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
    if (args.completed !== undefined) {
      patch.completed = args.completed;
      patch.completedAt = args.completed ? Date.now() : 0;
    }
    await ctx.db.patch(args.milestoneId, patch);
    await ctx.db.patch(milestone.projectId, { updatedAt: Date.now() });
    if (args.completed === true) {
      const project = await ctx.db.get(milestone.projectId);
      await logActivity(ctx, userId, {
        kind: "milestone",
        title: `Completed milestone: ${args.title ?? milestone.title}`,
        detail: project ? project.name : undefined,
        href: `/projects/${milestone.projectId}`,
      });
    }
    return { ok: true };
  },
});

export const removeMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, { milestoneId }) => {
    const userId = await requireUser(ctx);
    const milestone = await ctx.db.get(milestoneId);
    if (!milestone || milestone.userId !== userId)
      throw new Error("Milestone not found.");
    await ctx.db.delete(milestoneId);
    await ctx.db.patch(milestone.projectId, { updatedAt: Date.now() });
    return { ok: true };
  },
});

export const repoCheckList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const checks = await ctx.db
      .query("repoChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return checks
      .sort((a, b) => b.fetchedAt - a.fetchedAt)
      .map((check) => ({
        _id: check._id,
        projectId: check.projectId,
        owner: check.owner,
        repoName: check.repoName,
        repoUrl: check.repoUrl,
        status: check.status,
        fetchedAt: check.fetchedAt,
      }));
  },
});

export const saveRepoCheck = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    repoUrl: v.string(),
    owner: v.string(),
    repoName: v.string(),
    status: v.union(v.literal("verified"), v.literal("unavailable")),
    report: v.any(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const checkId = await ctx.db.insert(
      "repoChecks",
      sanitize({
        userId,
        projectId: args.projectId,
        repoUrl: args.repoUrl,
        owner: args.owner,
        repoName: args.repoName,
        status: args.status,
        report: sanitize(args.report),
        error: args.error,
        fetchedAt: Date.now(),
      }),
    );
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project && project.userId === userId) {
        await ctx.db.patch(args.projectId, {
          repoCheckId: checkId,
          repoUrl: args.repoUrl,
          updatedAt: Date.now(),
        });
      }
    }
    await logActivity(ctx, userId, {
      kind: "repository",
      title: `Repository checked: ${args.owner}/${args.repoName}`,
      detail:
        args.status === "verified"
          ? "Evidence collected from the GitHub REST API."
          : "Repository could not be verified.",
      href: args.projectId ? `/projects/${args.projectId}` : "/credibility",
    });
    return checkId;
  },
});

export const recordEvidence = mutation({
  args: {
    subjectType: v.union(
      v.literal("opportunity"),
      v.literal("project"),
      v.literal("repository"),
    ),
    subjectId: v.string(),
    subjectLabel: v.string(),
    summaryStatus: v.string(),
    findings: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const id = await ctx.db.insert(
      "evidenceChecks",
      sanitize({
        userId,
        ...args,
        findings: sanitize(args.findings),
        checkedAt: Date.now(),
      }),
    );
    await logActivity(ctx, userId, {
      kind: "credibility",
      title: `Ran credibility check: ${args.subjectLabel}`,
      detail: `Overall: ${args.summaryStatus}`,
      href: "/credibility",
    });
    return id;
  },
});
