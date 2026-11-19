import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, sanitize } from "./lib";

async function requireUser(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in to use the workspace.");
  return userId;
}

/** One aggregate read for the Overview dashboard. */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const tasks = await ctx.db
      .query("roadmapTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const targets = await ctx.db
      .query("roadmapTargets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const savedRows = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const repoChecks = await ctx.db
      .query("repoChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const evidence = await ctx.db
      .query("evidenceChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(14);
    const snapshots = await ctx.db
      .query("scoreSnapshots")
      .withIndex("by_user_day", (q) => q.eq("userId", userId))
      .order("desc")
      .take(40);

    const saved = [];
    for (const row of savedRows.sort((a, b) => b.createdAt - a.createdAt)) {
      const opportunity = await ctx.db.get(row.opportunityId);
      if (opportunity) saved.push({ saved: row, opportunity });
    }

    return {
      projects: projects.sort((a, b) => b.updatedAt - a.updatedAt),
      milestones,
      tasks: tasks.sort((a, b) => a.order - b.order),
      targets: targets.sort((a, b) => b.createdAt - a.createdAt),
      saved,
      repoChecks: repoChecks.sort((a, b) => b.fetchedAt - a.fetchedAt),
      evidence: evidence.sort((a, b) => b.checkedAt - a.checkedAt),
      activities,
      snapshots: snapshots.reverse(),
    };
  },
});

export const activityList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(60);
  },
});

export const library = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("libraryItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const addLibraryItem = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const id = await ctx.db.insert(
      "libraryItems",
      sanitize({
        userId,
        ...args,
        createdAt: Date.now(),
      }),
    );
    await logActivity(ctx, userId, {
      kind: "library",
      title: `Saved to library: ${args.title}`,
      detail: args.kind,
      href: "/library",
    });
    return id;
  },
});

export const removeLibraryItem = mutation({
  args: { itemId: v.id("libraryItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found.");
    await ctx.db.delete(itemId);
    return { ok: true };
  },
});

export const snapshots = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("scoreSnapshots")
      .withIndex("by_user_day", (q) => q.eq("userId", userId))
      .order("desc")
      .take(60);
    return rows.reverse();
  },
});

/** Records at most one preparation-score snapshot per day. */
export const recordSnapshot = mutation({
  args: { score: v.number(), breakdown: v.any() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const day = new Date().toISOString().slice(0, 10);
    const existing = await ctx.db
      .query("scoreSnapshots")
      .withIndex("by_user_day", (q) =>
        q.eq("userId", userId).eq("day", day),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        breakdown: args.breakdown,
      });
      return existing._id;
    }
    return await ctx.db.insert("scoreSnapshots", {
      userId,
      day,
      score: args.score,
      breakdown: args.breakdown,
      createdAt: Date.now(),
    });
  },
});

/** Everything a student has created, for the Settings data export. */
export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const tasks = await ctx.db
      .query("roadmapTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const targets = await ctx.db
      .query("roadmapTargets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const savedRows = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const saved = [];
    for (const row of savedRows) {
      const opportunity = await ctx.db.get(row.opportunityId);
      if (opportunity)
        saved.push({ savedAt: row.createdAt, opportunity: opportunity.name });
    }
    const repoChecks = await ctx.db
      .query("repoChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const evidence = await ctx.db
      .query("evidenceChecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const libraryItems = await ctx.db
      .query("libraryItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
    return {
      exportedAt: new Date().toISOString(),
      profile: user
        ? {
            name: user.name,
            email: user.email,
            college: user.college,
            branch: user.branch,
            academicYear: user.academicYear,
            skills: user.skills,
            interests: user.interests,
            domains: user.domains,
            goals: user.goals,
            experienceLevel: user.experienceLevel,
          }
        : null,
      projects,
      milestones,
      roadmap: { targets, tasks },
      savedOpportunities: saved,
      repoChecks: repoChecks.map((check) => ({
        repoUrl: check.repoUrl,
        status: check.status,
        fetchedAt: check.fetchedAt,
        report: check.report,
      })),
      evidenceChecks: evidence,
      libraryItems,
      activities,
    };
  },
});
